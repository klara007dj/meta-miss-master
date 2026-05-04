"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";

export default function VoteListPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    api.get("/candidates/top?limit=20")
      .then(r => setCandidates(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-content fade-up">
      <div className="top-bar">
        <div style={{ width: 32 }} />
        <span className="top-bar-title">Voter</span>
        <div style={{ width: 32 }} />
      </div>
      <div style={{ padding: "0 16px 20px" }}>
        <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
          Choisissez un candidat et votez. <strong style={{ color: "var(--text)" }}>1 vote = 100 FCFA</strong>
        </p>

        {loading ? (
          [1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 10, marginBottom: 8 }} />)
        ) : candidates.length === 0 ? (
          /* Empty state */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "60px 24px", textAlign: "center",
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "var(--blue-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Pas encore de candidats
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 260, marginBottom: 24 }}>
              Les candidatures approuvées apparaîtront ici. Revenez bientôt !
            </div>
            <Link href="/candidates/register" style={{ textDecoration: "none" }}>
              <button style={{
                padding: "12px 28px", borderRadius: 50, border: "none",
                background: "#2563EB", color: "#fff",
                fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
              }}>
                Déposer ma candidature
              </button>
            </Link>
          </div>
        ) : (
          <>
            {candidates.map((c) => {
              const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
              return (
                <Link key={c.id} href={`/vote/${c.id}`} style={{
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", background: "var(--bg-white)",
                  border: "1px solid var(--border)", borderRadius: 12, marginBottom: 8,
                  transition: "border-color 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#2563EB")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <img src={photo} alt={c.name} className="avatar" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "50%" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>{c.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.type === "MISS" ? "Miss" : "Master"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2563EB" }}>{c.totalVotes ?? 0} votes</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              );
            })}
            <Link href="/candidates" className="btn-outline" style={{ marginTop: 12, display: "block", textAlign: "center" }}>
              Voir tous les candidats
            </Link>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
