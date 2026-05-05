"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import CandidacyButton from "@/components/CandidacyButton";
import { useT } from "@/store/langStore";

export default function HomeDashboardPage() {
  const t = useT();
  const [stats, setStats] = useState<any>(null);
  const [topMiss, setTopMiss] = useState<any[]>([]);
  const [topMaster, setTopMaster] = useState<any[]>([]);
  const [contest, setContest] = useState<any>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

  useEffect(() => {
    api.get("/ranking/stats").then((r) => setStats(r.data.data)).catch(() => {});
    api.get("/contest/active").then((r) => setContest(r.data.data)).catch(() => {});
    Promise.all([
      api.get("/candidates/top?type=MISS&limit=6").then((r) => setTopMiss(r.data.data || [])).catch(() => {}),
      api.get("/candidates/top?type=MASTER&limit=6").then((r) => setTopMaster(r.data.data || [])).catch(() => {}),
    ]).finally(() => setLoadingCandidates(false));
  }, []);

  // Calcul des jours restants / avant début
  const contestInfo = (() => {
    if (!contest) return { label: "—", sub: "Aucun concours", color: "#2563EB" };
    const now = new Date();
    const start = new Date(contest.startDate);
    const end = contest.endDate ? new Date(contest.endDate) : null;
    if (now < start) {
      const diff = Math.ceil((start.getTime() - now.getTime()) / 86400000);
      return { label: diff, sub: `Début dans ${diff}j`, color: "#F59E0B" };
    }
    if (end) {
      const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      if (diff <= 0) return { label: "Terminé", sub: "Concours clôturé", color: "#94A3B8" };
      return { label: diff, sub: "Jours restants", color: "#2563EB" };
    }
    return { label: "∞", sub: "Sans date de fin", color: "#10B981" };
  })();

  const topAll = [...topMiss, ...topMaster].slice(0, 8);

  return (
    <div className="page-content fade-up">
      {/* Top bar */}
      <div style={{ padding: "20px 20px 12px", background: "var(--bg-white)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{t.greeting}</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>
              {t.homeTitle}
            </div>
          </div>
          <button style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--bg-white)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Blue hero card */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <div className="card-blue" style={{ padding: "20px 20px", position: "relative", overflow: "hidden", minHeight: 110 }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -30, right: 30, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", top: 10, right: 16, fontSize: "2.5rem", opacity: 0.25 }}>👑</div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.7)", marginBottom: 4, textTransform: "uppercase" }}>META</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 2 }}>MISS MASTER</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>2025</div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)" }}>Votez maintenant · Résultats en direct</div>
        </div>
      </div>

      {/* Aperçu stats */}
      <div className="section-header">
        <span className="section-title">{t.overview}</span>
        <Link href="/ranking" className="see-all">{t.seeAll}</Link>
      </div>
      <div className="stat-grid">
        <div className="stat-box">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>{t.candidates_label}</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
            {stats?.totalCandidates ?? "—"}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{t.inCompetition}</div>
        </div>
        <div className="stat-box">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M9 12l2 2 4-4" /><rect x="3" y="4" width="18" height="16" rx="2" />
            </svg>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>{t.activeVotes}</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
            {stats?.totalVotesCount ? stats.totalVotesCount.toLocaleString("fr-FR") : "—"}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{t.today}</div>
        </div>
        <div className="stat-box">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>{t.daysLeft}</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: contestInfo.color, lineHeight: 1 }}>{contestInfo.label}</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{contestInfo.sub}</div>
        </div>
        <div className="stat-box">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>{t.participation}</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>78%</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{t.globalRate}</div>
        </div>
      </div>

      {/* Categories */}
      <div className="section-header">
        <span className="section-title">{t.categories}</span>
        <Link href="/candidates" className="see-all">{t.seeAll}</Link>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 20 }}>
        <Link href="/candidates?type=MISS" style={{ textDecoration: "none" }}>
          <span className="chip active">Miss</span>
        </Link>
        <Link href="/candidates?type=MASTER" style={{ textDecoration: "none" }}>
          <span className="chip">Master</span>
        </Link>
      </div>

      {/* Top candidats */}
      <div className="section-header">
        <span className="section-title">{t.topCandidates}</span>
        <Link href="/candidates" className="see-all">{t.seeAll}</Link>
      </div>

      {/* Skeletons pendant le chargement */}
      {loadingCandidates && (
        <div style={{ padding: "0 16px", display: "flex", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer" style={{ height: 160, width: 120, borderRadius: 16, flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* Aucun candidat après chargement */}
      {!loadingCandidates && topAll.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", padding: "32px 24px", textAlign: "center", margin: "0 16px", background: "var(--bg)", borderRadius: 16, border: "1.5px dashed var(--border)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🎭</div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", marginBottom: 6 }}>{t.noCandidatesYet}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>{t.noCandidatesDesc}</div>
          <CandidacyButton variant="compact" style={{ margin: "0 auto" }} />
        </div>
      )}

      {/* Liste horizontale des candidats */}
      {!loadingCandidates && topAll.length > 0 && (
        <div style={{ overflowX: "auto", padding: "0 16px 8px", display: "flex", gap: 10, scrollSnapType: "x mandatory" }}>
          {topAll.map((c, i) => {
            const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
            return (
              <Link key={c.id} href={`/candidates/${c.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                <div style={{ width: 120, borderRadius: 16, overflow: "hidden", position: "relative", height: 160, boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
                  <img src={photo} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: 8, left: 8, background: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#B45309" : "#2563EB", color: "#fff", borderRadius: 99, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>{i + 1}</div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.75))", padding: "20px 8px 8px", color: "#fff" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, lineHeight: 1.2 }}>{c.name.split(" ")[0]}</div>
                    <div style={{ fontSize: "0.62rem", opacity: 0.8 }}>{c.type === "MISS" ? "Miss" : "Master"}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}
