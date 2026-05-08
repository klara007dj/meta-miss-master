"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/store/langStore";
import CandidacyButton from "@/components/CandidacyButton";

export default function CandidatesPage() {
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "MISS" | "MASTER">("ALL");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
  const likesKey = user ? `mmm-likes-${user.id}` : "mmm-likes-guest";

  useEffect(() => {
    api.get("/candidates?limit=100")
      .then(r => setCandidates(r.data.data?.candidates || []))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(likesKey) || "[]") as string[];
      setLiked(new Set(saved));
    } catch { setLiked(new Set()); }
  }, [likesKey]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setLiked((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      localStorage.setItem(likesKey, JSON.stringify(Array.from(s)));
      return s;
    });
  };

  const filtered = candidates
    .filter(c => filter === "ALL" || c.type === filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content fade-up">
      <style>{`
        /* ─── CANDIDATES PAGE REDESIGN ─── */
        .cand-page-header {
          padding: 20px 16px 12px;
          text-align: center;
        }
        .cand-page-header .crown-icon {
          color: var(--blue);
          margin-bottom: 6px;
        }
        .cand-page-header h1 {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--blue);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .cand-page-header p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .cand-search-wrap {
          padding: 0 16px 12px;
        }
        .cand-search-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-white);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 10px 14px;
          box-shadow: var(--shadow);
        }
        .cand-search-inner input {
          flex: 1;
          border: none;
          background: none;
          font-size: 0.88rem;
          color: var(--text);
          font-family: var(--font);
          outline: none;
        }
        .cand-search-inner input::placeholder { color: var(--text-faint); }
        .cand-filter-row {
          display: flex;
          gap: 8px;
          padding: 0 16px 16px;
        }
        .cand-chip {
          padding: 7px 18px;
          border-radius: 100px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid var(--border);
          background: var(--bg-white);
          color: var(--text-muted);
          transition: all 0.18s;
          font-family: var(--font);
        }
        .cand-chip.active {
          background: var(--blue);
          color: #fff;
          border-color: var(--blue);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }

        /* Grid layout for tablet/desktop */
        .cand-grid {
          padding: 0 16px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 540px) {
          .cand-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 900px) {
          .cand-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            padding: 0 24px;
          }
        }

        /* Card style */
        .cand-card {
          background: var(--bg-white);
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          text-decoration: none;
          display: block;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        .cand-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }
        .cand-card-img-wrap {
          position: relative;
          aspect-ratio: 3/4;
          background: var(--bg);
          overflow: hidden;
        }
        .cand-card-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s;
        }
        .cand-card:hover .cand-card-img-wrap img {
          transform: scale(1.04);
        }
        .cand-card-rank {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(37,99,235,0.92);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 5px 10px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.03em;
        }
        .cand-card-rank.gold { background: rgba(245,158,11,0.92); }
        .cand-card-rank.silver { background: rgba(156,163,175,0.92); }
        .cand-card-rank.bronze { background: rgba(217,119,6,0.92); }
        .cand-card-votes {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(6px);
          color: var(--blue);
          font-size: 0.72rem;
          font-weight: 800;
          padding: 5px 10px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cand-card-body {
          padding: 12px 14px 14px;
        }
        .cand-card-name {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cand-card-cat {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--blue-light);
          color: var(--blue);
          font-size: 0.68rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .cand-card-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .cand-card-vote-btn {
          flex: 1;
          background: var(--blue);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 9px 12px;
          cursor: pointer;
          font-family: var(--font);
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: background 0.15s;
        }
        .cand-card-vote-btn:hover { background: var(--blue-hover); }
        .cand-card-heart {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--bg-white);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
          flex-shrink: 0;
        }
        .cand-card-heart:hover { border-color: #EF4444; }
        .cand-card-heart.liked { border-color: #EF4444; background: #FEF2F2; }

        /* Skeleton */
        .cand-skel {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .cand-skel-img {
          aspect-ratio: 3/4;
        }
        .cand-skel-body {
          padding: 12px 14px 14px;
        }

        /* List style for mobile (optional override) */
        @media (max-width: 539px) {
          .cand-grid {
            padding: 0 12px;
            gap: 8px;
          }
          .cand-card-img-wrap {
            aspect-ratio: 3/4;
          }
          .cand-card-votes {
            font-size: 0.68rem;
            padding: 4px 8px;
          }
          .cand-card-rank {
            font-size: 0.68rem;
            padding: 4px 8px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="cand-page-header">
        <div className="crown-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 19h20v2H2v-2zm18-9l-3 9H7L4 10l4 3 4-6 4 6 4-3z"/>
          </svg>
        </div>
        <h1>Nos Candidats</h1>
        <p>Découvrez, soutenez et faites briller vos favoris</p>
      </div>

      {/* Search */}
      <div className="cand-search-wrap">
        <div className="cand-search-inner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder || "Rechercher un candidat..."} />
        </div>
      </div>

      {/* Filter chips */}
      <div className="cand-filter-row">
        {(["ALL", "MISS", "MASTER"] as const).map(filterOpt => (
          <button key={filterOpt} onClick={() => setFilter(filterOpt)} className={`cand-chip${filter === filterOpt ? " active" : ""}`}>
            {filterOpt === "ALL" ? (t.all || "Tous") : filterOpt === "MISS" ? "Miss" : "Master"}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="cand-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="cand-skel">
              <div className="cand-skel-img shimmer" />
              <div className="cand-skel-body">
                <div className="shimmer" style={{ height: 16, borderRadius: 8, marginBottom: 8 }} />
                <div className="shimmer" style={{ height: 12, borderRadius: 8, width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state - no candidates */}
      {!loading && candidates.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎭</div>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)", marginBottom: 8 }}>{t.noCandidatesYet}</div>
          <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>{t.noCandidatesDesc}</div>
          <CandidacyButton variant="full" />
        </div>
      )}

      {/* No search results */}
      {!loading && candidates.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: "0.88rem" }}>
          {t.noCandidateFound}
        </div>
      )}

      {/* Candidate Grid */}
      {!loading && filtered.length > 0 && (
        <div className="cand-grid">
          {filtered.map((c, i) => {
            const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
            const isLiked = liked.has(c.id);
            const rank = candidates.filter(x => x.type === c.type).findIndex(x => x.id === c.id) + 1;
            const rankClass = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";
            return (
              <Link key={c.id} href={`/candidates/${c.id}`} className="cand-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="cand-card-img-wrap">
                  <img src={photo} alt={c.name}
                    onError={(e: any) => { e.target.src = "/placeholder-avatar.png"; e.target.onerror = null; }} />
                  <div className={`cand-card-rank ${rankClass}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 19h20v2H2v-2zm18-9l-3 9H7L4 10l4 3 4-6 4 6 4-3z"/>
                    </svg>
                    #{rank}
                  </div>
                  {c.totalVotes >= 0 && (
                    <div className="cand-card-votes">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--blue)" stroke="none">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      {c.totalVotes >= 1000 ? `${(c.totalVotes / 1000).toFixed(1)}K` : c.totalVotes}
                    </div>
                  )}
                </div>
                <div className="cand-card-body">
                  <div className="cand-card-name">{c.name}</div>
                  <div className="cand-card-cat">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 19h20v2H2v-2zm18-9l-3 9H7L4 10l4 3 4-6 4 6 4-3z"/>
                    </svg>
                    {c.category || c.type || "Élégance"}
                  </div>
                  <div className="cand-card-actions">
                    <Link href={`/vote/${c.id}`} onClick={e => e.stopPropagation()} className="cand-card-vote-btn">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      {t.vote || "Voter"}
                    </Link>
                    <button className={`cand-card-heart${isLiked ? " liked" : ""}`} onClick={e => toggleLike(c.id, e)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "#EF4444" : "none"} stroke={isLiked ? "#EF4444" : "#9CA3AF"} strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </button>
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
