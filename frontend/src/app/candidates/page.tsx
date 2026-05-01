"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";
import { useT } from "@/store/langStore";

export default function CandidatesPage() {
  const t = useT();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL"|"MISS"|"MASTER">("ALL");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api","") || "http://localhost:5000";

  useEffect(() => {
    api.get("/candidates?limit=100")
      .then(r => setCandidates(r.data.data?.candidates || []))
      .finally(() => setLoading(false));
  }, []);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setLiked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const filtered = candidates
    .filter(c => filter === "ALL" || c.type === filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content fade-up">
      <div className="top-bar">
        <div style={{ width: 32 }} />
        <span className="top-bar-title">{t.categories}</span>
        <button style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/>
            <line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/>
            <circle cx="12" cy="4" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="14" cy="20" r="2"/>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder} />
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 8 }}>
        {(["ALL","MISS","MASTER"] as const).map(filterOpt => (
          <button key={filterOpt} onClick={() => setFilter(filterOpt)} className={`chip${filter===filterOpt?" active":""}`}>
            {filterOpt === "ALL" ? t.all : filterOpt === "MISS" ? "Miss" : "Master"}
          </button>
        ))}
      </div>

      {/* List */}
      {loading
        ? [1,2,3,4,5].map(i => <div key={i} className="shimmer" style={{ height: 72, margin: "0 16px 8px", borderRadius: 10 }} />)
        : filtered.map((c, i) => {
            const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
            const isLiked = liked.has(c.id);
            const rank = candidates.filter(x => x.type === c.type).findIndex(x => x.id === c.id) + 1;
            return (
              <Link key={c.id} href={`/candidates/${c.id}`} style={{ textDecoration: "none" }}>
                <div className="candidate-row fade-up" style={{ animationDelay: `${i*0.04}s` }}>
                  <div className={`rank-badge ${rank===1?"gold":rank===2?"silver":rank===3?"bronze":""}`}>{rank}</div>
                  <img src={photo} alt={c.name} className="avatar" style={{ width: 48, height: 48, objectFit: "cover" }} onError={(e: any) => { e.target.src = "/placeholder-avatar.png"; e.target.onerror = null; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{t.region} {c.city}</div>
                  </div>
                  <Link href={`/vote/${c.id}`} onClick={e => e.stopPropagation()} className="btn-blue" style={{ width: "auto", padding: "8px 16px", fontSize: "0.75rem", flexShrink: 0 }}>
                    {t.vote}
                  </Link>
                  <button className={`heart-btn${isLiked?" liked":""}`} onClick={e => toggleLike(c.id, e)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "#EF4444" : "none"} stroke={isLiked ? "#EF4444" : "#9CA3AF"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </button>
                </div>
              </Link>
            );
          })
      }
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: "0.88rem" }}>
          {t.noCandidateFound}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
