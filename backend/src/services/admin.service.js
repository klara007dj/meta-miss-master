const { PrismaClient } = require("@prisma/client");
const { AppError } = require("../utils/errors");
const { emitRankingUpdate } = require("../socket/socket");

const prisma = new PrismaClient();
const VALID_CANDIDATE_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const VALID_PAYMENT_STATUSES = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];
const VALID_TYPES = ["MISS", "MASTER"];

function normalizePagination(page, limit, defaultPage = 1, defaultLimit = 20) {
  const normalizedPage = Number.isInteger(+page) && +page > 0 ? +page : defaultPage;
  const normalizedLimit = Number.isInteger(+limit) && +limit > 0 ? +limit : defaultLimit;
  return { page: normalizedPage, limit: normalizedLimit };
}

async function getAllCandidates({ status, page, limit }) {
  const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
  const skip = (safePage - 1) * safeLimit;
  const where = {};

  if (status) {
    const normalizedStatus = String(status).toUpperCase();
    if (normalizedStatus !== "ALL") {
      if (!VALID_CANDIDATE_STATUSES.includes(normalizedStatus)) {
        throw new AppError("Status de candidat invalide", 400);
      }
      where.status = normalizedStatus;
    }
  }

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit
    }),
    prisma.candidate.count({ where })
  ]);
  return { candidates, total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
}

async function approveCandidate(id) {
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) throw new AppError("Candidat introuvable", 404);
  return prisma.candidate.update({ where: { id }, data: { status: "APPROVED" } });
}

async function rejectCandidate(id) {
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) throw new AppError("Candidat introuvable", 404);
  return prisma.candidate.update({ where: { id }, data: { status: "REJECTED" } });
}

async function deleteCandidate(id) {
  await prisma.vote.deleteMany({ where: { candidateId: id } });
  await prisma.candidate.delete({ where: { id } });
  await emitRankingUpdate();
}

async function getAllPayments({ status, page, limit }) {
  const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
  const skip = (safePage - 1) * safeLimit;
  const where = {};

  if (status) {
    const normalizedStatus = String(status).toUpperCase();
    if (normalizedStatus !== "ALL") {
      if (!VALID_PAYMENT_STATUSES.includes(normalizedStatus)) {
        throw new AppError("Status de paiement invalide", 400);
      }
      where.status = normalizedStatus;
    }
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit
    }),
    prisma.payment.count({ where })
  ]);
  return { payments, total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
}

async function refundPayment(id) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw new AppError("Paiement introuvable", 404);
  if (payment.status !== "COMPLETED") throw new AppError("Paiement non complété", 400);

  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany({ where: { paymentId: id } });
    await tx.candidate.update({
      where: { id: payment.candidateId },
      data: { totalVotes: { decrement: payment.votesCount } }
    });
    await tx.payment.update({ where: { id }, data: { status: "REFUNDED" } });
  });

  await emitRankingUpdate();
  return { id, status: "REFUNDED" };
}

async function deleteVote(id) {
  const vote = await prisma.vote.findUnique({ where: { id } });
  if (!vote) throw new AppError("Vote introuvable", 404);

  await prisma.$transaction(async (tx) => {
    await tx.candidate.update({
      where: { id: vote.candidateId },
      data: { totalVotes: { decrement: vote.count } }
    });
    await tx.vote.delete({ where: { id } });
  });

  await emitRankingUpdate();
}

// ── updateCandidate — supporte maintenant photoUrl ─────────────────────────────
async function updateCandidate(id, { name, city, age, bio, type, status, photoUrl, instagram, tiktok, snap, whatsappFan, phone }) {
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) throw new AppError("Candidat introuvable", 404);

  const updateData = {};
  if (name !== undefined) updateData.name = String(name).trim();
  if (city !== undefined) updateData.city = String(city).trim();
  if (age !== undefined) {
    const parsedAge = +age;
    if (!Number.isInteger(parsedAge) || parsedAge < 16 || parsedAge > 35) {
      throw new AppError("L'âge doit être un entier entre 16 et 35 ans", 400);
    }
    updateData.age = parsedAge;
  }
  if (bio !== undefined) updateData.bio = bio;
  if (type !== undefined) {
    if (!VALID_TYPES.includes(type)) {
      throw new AppError("Type de candidat invalide", 400);
    }
    updateData.type = type;
  }
  if (status !== undefined) {
    if (!VALID_CANDIDATE_STATUSES.includes(status)) {
      throw new AppError("Status de candidat invalide", 400);
    }
    updateData.status = status;
  }
  // Mise à jour de la photo si fournie (URL Cloudinary)
  if (photoUrl !== undefined && photoUrl !== "") {
    updateData.photoUrl = photoUrl;
  }
  // Réseaux sociaux
  if (instagram !== undefined) updateData.instagram = instagram || null;
  if (tiktok !== undefined) updateData.tiktok = tiktok || null;
  if (snap !== undefined) updateData.snap = snap || null;
  if (whatsappFan !== undefined) updateData.whatsappFan = whatsappFan || null;
  if (phone !== undefined) updateData.phone = phone || null;

  return prisma.candidate.update({
    where: { id },
    data: updateData
  });
}

async function getDashboardStats() {
  const [
    totalUsers, totalCandidates, pendingCandidates,
    completedPayments, pendingPayments, totalVotes, revenue
  ] = await Promise.all([
    prisma.user.count(),
    prisma.candidate.count({ where: { status: "APPROVED" } }),
    prisma.candidate.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "COMPLETED" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.vote.aggregate({ _sum: { count: true } }),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } })
  ]);

  return {
    totalUsers,
    totalCandidates,
    pendingCandidates,
    completedPayments,
    pendingPayments,
    totalVotes: totalVotes._sum.count || 0,
    revenue: revenue._sum.amount || 0
  };
}

async function getAllUsers({ page, limit }) {
  const { page: safePage, limit: safeLimit } = normalizePagination(page, limit);
  const skip = (safePage - 1) * safeLimit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit
    }),
    prisma.user.count()
  ]);
  return { users, total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
}

module.exports = {
  getAllCandidates, approveCandidate, rejectCandidate, updateCandidate, deleteCandidate,
  getAllPayments, refundPayment, deleteVote, getDashboardStats, getAllUsers
};
