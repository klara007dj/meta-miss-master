"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api","") || "http://localhost:5000";

  useEffect(() => {
    if (!id) return;
    api.get(`/candidates/${id}`)
      .then(r => setCandidate(r.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#fff" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #DBEAFE", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );
  if (!candidate) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
      Candidat introuvable
    </div>
  );

  const photo = candidate.photoUrl?.startsWith("http") ? candidate.photoUrl : `${apiBase}${candidate.photoUrl}`;

  return (
    <div className="page-content fade-up">
      {/* Top bar */}
      <div className="top-bar">
        <button onClick={() => router.back()} style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <span className="top-bar-title">Candidate</span>
        <button style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      {/* Photo */}
      <div style={{ position: "relative", margin: "0 16px 16px", borderRadius: 16, overflow: "hidden", height: 280 }}>
        <img src={photo} alt={candidate.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e:any) => { e.target.style.background="#EFF6FF"; }} />
        <div style={{ position: "absolute", top: 12, left: 12, background: "#2563EB", color: "#fff", padding: "4px 10px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 700 }}>
          #1
        </div>
        <button
          onClick={() => setLiked(!liked)}
          style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked?"#EF4444":"none"} stroke={liked?"#EF4444":"#6B7280"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "0 16px 24px" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{candidate.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: 14 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          Région {candidate.city}
        </div>

        {candidate.bio && (
          <p style={{ fontSize: "0.84rem", color: "var(--text-2)", lineHeight: 1.7, marginBottom: 20 }}>
            {candidate.bio}
          </p>
        )}

        {/* Social links placeholder */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Réseaux sociaux</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "IG", color: "#E1306C", icon: "📷" },
              { label: "FB", color: "#1877F2", icon: "f" },
              { label: "TK", color: "#000", icon: "♪" },
            ].map(s => (
              <div key={s.label} style={{ width: 36, height: 36, borderRadius: 10, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                {s.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: "var(--blue-light)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>Total votes</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2563EB" }}>{candidate.totalVotes?.toLocaleString("fr-FR") || "0"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 2 }}>1 vote</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>= 100 FCFA</div>
          </div>
        </div>

        <Link href={`/vote/${candidate.id}`} className="btn-blue">
          Voter pour {candidate.name.split(" ")[0]}
        </Link>

        <div className="security-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Vote sécurisé et confidentiel
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
