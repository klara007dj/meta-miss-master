const prisma = require("../utils/prismaClient");
const cache = require("./cache");


const RANKING_TTL   = 5;   // classement : cache 5 secondes (live updates)
const STATS_TTL     = 30;  // stats admin : cache 30 secondes
const TOP_TTL       = 10;  // top candidats home : cache 10 secondes

async function getGlobalRanking(type) {
  const key = `ranking:${type || "ALL"}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const where = { status: "APPROVED" };
  if (type && ["MISS", "MASTER"].includes(type)) where.type = type;

  const candidates = await prisma.candidate.findMany({
    where,
    orderBy: { totalVotes: "desc" },
    select: { id: true, name: true, type: true, city: true, photoUrl: true, totalVotes: true }
  });

  const result = candidates.map((c, i) => ({ ...c, rank: i + 1 }));
  cache.set(key, result, RANKING_TTL);
  return result;
}

async function getTopN(n, type) {
  const key = `top:${n}:${type || "ALL"}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const where = { status: "APPROVED" };
  if (type && ["MISS", "MASTER"].includes(type)) where.type = type;

  const candidates = await prisma.candidate.findMany({
    where,
    orderBy: { totalVotes: "desc" },
    take: n,
    select: { id: true, name: true, type: true, city: true, photoUrl: true, totalVotes: true }
  });

  const result = candidates.map((c, i) => ({ ...c, rank: i + 1 }));
  cache.set(key, result, TOP_TTL);
  return result;
}

async function getStats() {
  const key = "stats:admin";
  const cached = cache.get(key);
  if (cached) return cached;

  const [totalCandidates, totalVotes, totalPayments, recentVotes] = await Promise.all([
    prisma.candidate.count({ where: { status: "APPROVED" } }),
    prisma.vote.aggregate({ _sum: { count: true } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: true
    }),
    prisma.vote.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { candidate: { select: { name: true, type: true } } }
    })
  ]);

  const result = {
    totalCandidates,
    totalVotesCount: totalVotes._sum.count || 0,
    totalRevenue: totalPayments._sum.amount || 0,
    totalTransactions: totalPayments._count,
    recentVotes
  };

  cache.set(key, result, STATS_TTL);
  return result;
}

/** Invalide tout le cache ranking — appelé après chaque vote crédité */
function invalidateRankingCache() {
  cache.delPattern("ranking:");
  cache.delPattern("top:");
  cache.delPattern("stats:");
}

module.exports = { getGlobalRanking, getTopN, getStats, invalidateRankingCache };
