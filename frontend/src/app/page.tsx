"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);
  const [topMiss, setTopMiss] = useState<any[]>([]);
  const [topMaster, setTopMaster] = useState<any[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api","") || "http://localhost:5000";

  useEffect(() => {
    api.get("/ranking/stats").then(r => setStats(r.data.data)).catch(()=>{});
    api.get("/candidates/top?type=MISS&limit=3").then(r => setTopMiss(r.data.data || [])).catch(()=>{});
    api.get("/candidates/top?type=MASTER&limit=3").then(r => setTopMaster(r.data.data || [])).catch(()=>{});
  }, []);

  const topAll = [...topMiss, ...topMaster].slice(0, 4);

  return (
    <div className="page-content fade-up">
      {/* Top bar */}
      <div style={{ padding: "20px 20px 12px", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Bonjour 👋</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>
              Qui allez-vous soutenir<br />aujourd'hui ?
            </div>
          </div>
          <button style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Blue hero card */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <div className="card-blue" style={{ padding: "20px 20px", position: "relative", overflow: "hidden", minHeight: 110 }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -30, right: 30, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", top: 10, right: 16, fontSize: "2.5rem", opacity: 0.25 }}>👑</div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.7)", marginBottom: 4, textTransform: "uppercase" }}>
            META
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 2 }}>
            MISS MASTER
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
            2025
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)" }}>
            Votez maintenant · Résultats en direct
          </div>
        </div>
      </div>

      {/* Aperçu stats */}
      <div className="section-header">
        <span className="section-title">Aperçu</span>
        <Link href="/ranking" className="see-all">Voir tout</Link>
      </div>
      <div className="stat-grid">
        <div className="stat-box">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>Candidats</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
            {stats?.totalCandidates ?? "—"}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>En compétition</div>
        </div>
        <div className="stat-box">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="16" rx="2"/>
            </svg>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>Votes actifs</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
            {stats?.totalVotesCount ? stats.totalVotesCount.toLocaleString("fr-FR") : "—"}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>Aujourd'hui</div>
        </div>
        <div className="stat-box">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>Jours restants</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>5</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>Avant la finale</div>
        </div>
        <div className="stat-box">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>Participation</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>78%</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>Taux global</div>
        </div>
      </div>

      {/* Categories */}
      <div className="section-header">
        <span className="section-title">Catégories</span>
        <Link href="/candidates" className="see-all">Voir tout</Link>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 20 }}>
        <Link href="/candidates?type=MISS" style={{ textDecoration: "none" }}>
          <span className="chip active">Miss Master</span>
        </Link>
        <Link href="/candidates?type=MASTER" style={{ textDecoration: "none" }}>
          <span className="chip">Mister Master</span>
        </Link>
      </div>

      {/* Top candidates */}
      <div className="section-header">
        <span className="section-title">Top candidats</span>
        <Link href="/candidates" className="see-all">Voir tout</Link>
      </div>
      {topAll.length === 0
        ? <div style={{ padding: "0 16px" }}>{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 10, marginBottom: 8 }} />)}</div>
        : topAll.map((c, i) => {
            const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
            return (
              <Link key={c.id} href={`/candidates/${c.id}`} style={{ textDecoration: "none" }}>
                <div className="candidate-row" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className={`rank-badge ${i===0?"gold":i===1?"silver":i===2?"bronze":""}`}>{i+1}</div>
                  <img src={photo} alt={c.name} className="avatar" style={{ width: 44, height: 44 }} onError={(e:any)=>{e.target.style.display="none"}} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>{c.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.type === "MISS" ? "Miss Master" : "Mister Master"}</div>
                  </div>
                  <Link href={`/vote/${c.id}`} onClick={e => e.stopPropagation()} className="btn-blue" style={{ width: "auto", padding: "7px 16px", fontSize: "0.75rem" }}>
                    Voter
                  </Link>
                </div>
              </Link>
            );
          })
      }
      <BottomNav />
    </div>
  );
}
