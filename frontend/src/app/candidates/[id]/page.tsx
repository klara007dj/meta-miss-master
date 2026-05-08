"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/store/langStore";

export default function CandidateDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [candidate, setCandidate] = useState<any>(null);
  const [categoryCandidates, setCategoryCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
  const likesKey = user ? `mmm-likes-${user.id}` : "mmm-likes-guest";

  const getStoredLikes = () => {
    try { return JSON.parse(localStorage.getItem(likesKey) || "[]") as string[]; }
    catch { return []; }
  };
  const saveStoredLikes = (ids: string[]) => { localStorage.setItem(likesKey, JSON.stringify(ids)); };

  const loadCandidate = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get(`/candidates/${id}`);
      setCandidate(response.data.data);
    } catch {
      toast.error("Candidat introuvable");
      setCandidate(null);
    } finally { setLoading(false); }
  };

  const loadCategoryCandidates = async (type: string) => {
    try {
      const response = await api.get(`/candidates?type=${type}&limit=100`);
      setCategoryCandidates(response.data.data?.candidates || []);
    } catch { setCategoryCandidates([]); }
  };

  useEffect(() => { loadCandidate(); }, [id]);
  useEffect(() => {
    if (!candidate) return;
    setLiked(getStoredLikes().includes(candidate.id));
    loadCategoryCandidates(candidate.type);
  }, [candidate, likesKey]);

  const goToCandidate = (candidateId: string) => { router.push(`/candidates/${candidateId}`); };
  const currentIndex = candidate ? categoryCandidates.findIndex((c) => c.id === candidate.id) : -1;
  const previousCandidate = currentIndex > 0 ? categoryCandidates[currentIndex - 1] : null;
  const nextCandidate = currentIndex >= 0 && currentIndex < categoryCandidates.length - 1 ? categoryCandidates[currentIndex + 1] : null;
  const handlePrev = () => { if (previousCandidate) goToCandidate(previousCandidate.id); };
  const handleNext = () => { if (nextCandidate) goToCandidate(nextCandidate.id); };
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => { setTouchStartX(event.touches[0].clientX); };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (delta > 80) handlePrev();
    else if (delta < -80) handleNext();
  };

  const toggleLike = async () => {
    if (!candidate) return;
    const storedLikes = getStoredLikes();
    const isCurrentlyLiked = storedLikes.includes(candidate.id);
    try {
      if (isCurrentlyLiked) {
        const response = await api.delete(`/candidates/${candidate.id}/like`);
        setCandidate((prev: any) => ({ ...prev, totalLikes: response.data.data.totalLikes }));
        saveStoredLikes(storedLikes.filter((likeId) => likeId !== candidate.id));
        setLiked(false);
        toast("Retiré des favoris");
      } else {
        const response = await api.post(`/candidates/${candidate.id}/like`);
        setCandidate((prev: any) => ({ ...prev, totalLikes: response.data.data.totalLikes }));
        saveStoredLikes([...storedLikes, candidate.id]);
        setLiked(true);
        toast.success("Ajouté aux favoris ❤️");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Impossible de mettre à jour le like";
      toast.error(message);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-white)" }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--blue-mid)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!candidate) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>Candidat introuvable</div>
  );

  const photo = candidate.photoUrl?.startsWith("http") ? candidate.photoUrl : `${apiBase}${candidate.photoUrl}`;
  const rank = categoryCandidates.findIndex(c => c.id === candidate.id) + 1;
  const isTop10 = rank > 0 && rank <= 10;
  const votes = candidate.totalVotes || 0;
  const votesDisplay = votes >= 1000 ? `${(votes / 1000).toFixed(1)}K` : String(votes);

  // Sidebar neighbors
  const prevPhoto = previousCandidate?.photoUrl?.startsWith("http") ? previousCandidate.photoUrl : previousCandidate ? `${apiBase}${previousCandidate.photoUrl}` : null;
  const nextPhoto = nextCandidate?.photoUrl?.startsWith("http") ? nextCandidate.photoUrl : nextCandidate ? `${apiBase}${nextCandidate.photoUrl}` : null;

  return (
    <div className="page-content fade-up" style={{ paddingBottom: 80 }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <style>{`
        /* ═══════════════════════════════════════
           CANDIDATE DETAIL — REDESIGN
        ═══════════════════════════════════════ */

        /* Top bar */
        .cd-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 8px;
        }
        .cd-topbar-btn {
          width: 36px; height: 36px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          background: var(--bg-white);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cd-topbar-btn:hover { background: var(--bg); }
        .cd-topbar-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--blue);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ─── CAROUSEL AREA ─── */
        .cd-carousel-section {
          padding: 0 12px 8px;
        }

        /* Three-card carousel row */
        .cd-carousel-row {
          display: flex;
          align-items: stretch;
          gap: 8px;
          position: relative;
        }

        /* Side cards */
        .cd-side-card {
          flex: 0 0 80px;
          border-radius: 16px;
          overflow: hidden;
          background: var(--bg);
          position: relative;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
          min-height: 200px;
        }
        .cd-side-card:hover { opacity: 0.8; }
        .cd-side-card img {
          width: 100%; height: 100%;
          object-fit: cover;
          filter: blur(1px);
        }
        .cd-side-card-label {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: rgba(0,0,0,0.3);
          color: #fff;
        }
        .cd-side-card-rank {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }
        .cd-side-card-name {
          font-size: 0.72rem;
          font-weight: 700;
          text-align: center;
          padding: 0 4px;
        }
        .cd-side-card-cat {
          font-size: 0.6rem;
          opacity: 0.8;
          text-align: center;
          padding: 0 4px;
        }
        .cd-side-card-empty {
          flex: 0 0 80px;
          min-height: 200px;
          border-radius: 16px;
          background: transparent;
        }

        /* Main card */
        .cd-main-card {
          flex: 1;
          border-radius: 20px;
          overflow: hidden;
          background: var(--bg-card);
          position: relative;
          box-shadow: 0 8px 32px rgba(37,99,235,0.18);
          border: 1.5px solid var(--blue-mid);
        }
        .cd-main-img-wrap {
          position: relative;
        }
        .cd-main-img-wrap img {
          width: 100%;
          aspect-ratio: 3/4;
          object-fit: cover;
          display: block;
        }
        .cd-main-rank-badge {
          position: absolute;
          top: 12px; left: 12px;
          background: rgba(37,99,235,0.92);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 10px;
          display: flex; align-items: center; gap: 5px;
        }
        .cd-main-votes-badge {
          position: absolute;
          top: 12px; right: 12px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          color: var(--blue);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 10px;
          display: flex; align-items: center; gap: 5px;
        }

        /* Name + category overlay */
        .cd-main-overlay {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.72));
          padding: 40px 14px 14px;
        }
        .cd-main-name {
          font-size: 1.4rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 6px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .cd-main-cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(37,99,235,0.85);
          backdrop-filter: blur(4px);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 10px;
        }

        /* Social + share row */
        .cd-social-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cd-social-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s;
        }
        .cd-social-btn:hover { transform: scale(1.1); }
        .cd-share-btn {
          margin-left: auto;
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 10px;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          font-family: var(--font);
          transition: background 0.15s;
        }
        .cd-share-btn:hover { background: rgba(255,255,255,0.25); }

        /* Dots pagination */
        .cd-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 0 4px;
        }
        .cd-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--border);
          transition: all 0.2s;
        }
        .cd-dot.active {
          background: var(--blue);
          width: 20px;
          border-radius: 4px;
        }

        /* Swipe hint */
        .cd-swipe-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.75rem;
          padding: 4px 0 12px;
        }

        /* Nav arrow buttons (shown on carousel) */
        .cd-nav-arrow {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--bg-white);
          border: 1.5px solid var(--border);
          box-shadow: var(--shadow-md);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          z-index: 5;
          transition: all 0.15s;
        }
        .cd-nav-arrow:hover { background: var(--blue); border-color: var(--blue); }
        .cd-nav-arrow:hover svg { stroke: #fff; }
        .cd-nav-arrow:disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
        .cd-nav-arrow.left { left: -16px; }
        .cd-nav-arrow.right { right: -16px; }

        /* ─── INFO SECTION ─── */
        .cd-info-section {
          padding: 0 16px 16px;
        }
        .cd-about-card {
          background: var(--bg-white);
          border: 1.5px solid var(--border);
          border-radius: 18px;
          padding: 18px 18px 16px;
          margin-bottom: 14px;
          box-shadow: var(--shadow);
        }
        .cd-about-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--blue);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .cd-about-text {
          font-size: 0.85rem;
          color: var(--text-2);
          line-height: 1.75;
          position: relative;
          padding: 0 8px;
        }
        .cd-about-text::before {
          content: "\\201C";
          font-size: 2.5rem;
          color: var(--blue-mid);
          line-height: 1;
          position: absolute;
          left: -6px;
          top: -8px;
          font-family: Georgia, serif;
        }

        /* Stats row */
        .cd-stats-row {
          display: flex;
          align-items: stretch;
          background: var(--bg-white);
          border: 1.5px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 14px;
          box-shadow: var(--shadow);
        }
        .cd-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px 8px;
          gap: 4px;
          position: relative;
        }
        .cd-stat + .cd-stat::before {
          content: "";
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 1px;
          background: var(--border);
        }
        .cd-stat-icon { color: var(--blue); margin-bottom: 2px; }
        .cd-stat-val {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text);
        }
        .cd-stat-lbl {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Vote CTA */
        .cd-vote-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: var(--blue);
          border-radius: 18px;
          padding: 18px 20px;
          text-decoration: none;
          color: #fff;
          box-shadow: 0 6px 24px rgba(37,99,235,0.35);
          transition: background 0.15s, transform 0.15s;
          margin-bottom: 10px;
        }
        .cd-vote-cta:hover { background: var(--blue-hover); transform: translateY(-1px); }
        .cd-vote-cta-icon {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cd-vote-cta-text h3 {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .cd-vote-cta-text p {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-top: 1px;
        }
        .cd-vote-cta-arrow {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* Security badge */
        .cd-security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--blue);
          text-decoration: none;
          padding: 8px 0;
        }

        /* ─── DESKTOP LAYOUT ─── */
        @media (min-width: 1024px) {
          .cd-detail-layout {
            display: grid;
            grid-template-columns: 1fr 420px;
            gap: 32px;
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 24px;
            align-items: start;
          }
          .cd-carousel-section {
            padding: 0;
          }
          .cd-info-section {
            padding: 0;
            position: sticky;
            top: 20px;
          }
          .cd-side-card {
            flex: 0 0 100px;
            min-height: 280px;
          }
          .cd-side-card-empty {
            flex: 0 0 100px;
            min-height: 280px;
          }
          .cd-main-img-wrap img {
            aspect-ratio: 2/3;
          }
          .cd-nav-arrow.left { left: -20px; }
          .cd-nav-arrow.right { right: -20px; }
        }

        /* ─── TABLET ─── */
        @media (min-width: 640px) and (max-width: 1023px) {
          .cd-carousel-section {
            padding: 0 20px 12px;
          }
          .cd-info-section {
            padding: 0 20px 20px;
          }
          .cd-side-card {
            flex: 0 0 90px;
            min-height: 240px;
          }
          .cd-side-card-empty {
            flex: 0 0 90px;
            min-height: 240px;
          }
        }
      `}</style>

      {/* Top bar */}
      <div className="cd-topbar">
        <button onClick={() => router.back()} className="cd-topbar-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <span className="cd-topbar-title">{t.candidate || "Candidat"}</span>
        <button onClick={async () => {
          const url = window.location.href;
          if (navigator.share) await navigator.share({ title: candidate.name, url });
          else { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); }
        }} className="cd-topbar-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      {/* Main content layout */}
      <div className="cd-detail-layout">

        {/* ── LEFT: Carousel ── */}
        <div className="cd-carousel-section">
          <div className="cd-carousel-row" style={{ position: "relative" }}>
            {/* Left arrow */}
            <button className="cd-nav-arrow left" onClick={handlePrev} disabled={!previousCandidate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            {/* Previous candidate card */}
            {previousCandidate ? (
              <div className="cd-side-card" onClick={handlePrev}>
                {prevPhoto && <img src={prevPhoto} alt={previousCandidate.name}
                  onError={(e: any) => { e.target.style.display = "none"; }} />}
                <div className="cd-side-card-label">
                  <span className="cd-side-card-rank">
                    #{categoryCandidates.findIndex(c => c.id === previousCandidate.id) + 1}
                  </span>
                  <span className="cd-side-card-name">{previousCandidate.name.split(" ")[0]}</span>
                  <span className="cd-side-card-cat">CATÉGORIE</span>
                </div>
              </div>
            ) : (
              <div className="cd-side-card-empty" />
            )}

            {/* Main candidate card */}
            <div className="cd-main-card">
              <div className="cd-main-img-wrap">
                {!imgLoaded && (
                  <div className="shimmer" style={{ width: "100%", aspectRatio: "3/4" }} />
                )}
                <img
                  src={photo}
                  alt={candidate.name}
                  style={{ display: imgLoaded ? "block" : "none" }}
                  onLoad={() => setImgLoaded(true)}
                  onError={(e: any) => { e.target.style.display = "none"; setImgLoaded(true); }}
                />

                {/* Rank badge */}
                <div className="cd-main-rank-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 19h20v2H2v-2zm18-9l-3 9H7L4 10l4 3 4-6 4 6 4-3z"/>
                  </svg>
                  #{rank}
                  <span style={{ fontSize: "0.6rem", opacity: 0.85, marginLeft: 2 }}>AU CLASSEMENT</span>
                </div>

                {/* Votes badge */}
                <div className="cd-main-votes-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--blue)" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  {votesDisplay}
                  <span style={{ fontSize: "0.6rem", opacity: 0.7, marginLeft: 2 }}>VOTES</span>
                </div>

                {/* Overlay: name, category, socials */}
                <div className="cd-main-overlay">
                  <div className="cd-main-name">{candidate.name}</div>
                  <div className="cd-main-cat-pill">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 19h20v2H2v-2zm18-9l-3 9H7L4 10l4 3 4-6 4 6 4-3z"/>
                    </svg>
                    CATÉGORIE : {candidate.category || candidate.type || "ÉLÉGANCE"}
                  </div>
                  <div className="cd-social-row">
                    {candidate.whatsappFan && (
                      <button className="cd-social-btn" style={{ background: "#25D366" }}
                        onClick={() => window.open(candidate.whatsappFan.startsWith("http") ? candidate.whatsappFan : `https://wa.me/${candidate.whatsappFan}`, "_blank")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </button>
                    )}
                    {/* Facebook placeholder (not in original data model but shown in mockup) */}
                    {candidate.facebook && (
                      <button className="cd-social-btn" style={{ background: "#1877F2" }}
                        onClick={() => window.open(`https://facebook.com/${candidate.facebook}`, "_blank")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                      </button>
                    )}
                    {candidate.tiktok && (
                      <button className="cd-social-btn" style={{ background: "#010101" }}
                        onClick={() => window.open(`https://tiktok.com/@${candidate.tiktok.replace("@", "")}`, "_blank")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>
                      </button>
                    )}
                    {candidate.instagram && (
                      <button className="cd-social-btn" style={{ background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}
                        onClick={() => window.open(`https://instagram.com/${candidate.instagram.replace("@", "")}`, "_blank")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none"/></svg>
                      </button>
                    )}
                    {candidate.snap && (
                      <button className="cd-social-btn" style={{ background: "#FFFC00" }}
                        onClick={() => window.open(`https://snapchat.com/add/${candidate.snap.replace("@", "")}`, "_blank")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M12 2C8.5 2 6 4.5 6 8v1.5c-.5.1-1.5.4-1.5 1s.8.9 1.5 1c-.2.5-.6 1.2-1.5 1.5-.3.1-.5.3-.5.6 0 .4.4.7.8.8.5.1 1 .2 1.2.7.1.2 0 .4-.1.6-.3.4-1 .9-1 1.5 0 .5.4.9.9.9.3 0 .7-.1 1.1-.3.6-.3 1.2-.4 1.6-.1.3.2.5.6.7 1 .3.6.8 1.3 2.3 1.3s2-.7 2.3-1.3c.2-.4.4-.8.7-1 .4-.3 1-.2 1.6.1.4.2.8.3 1.1.3.5 0 .9-.4.9-.9 0-.6-.7-1.1-1-1.5-.1-.2-.2-.4-.1-.6.2-.5.7-.6 1.2-.7.4-.1.8-.4.8-.8 0-.3-.2-.5-.5-.6-.9-.3-1.3-1-1.5-1.5.7-.1 1.5-.4 1.5-1s-1-.9-1.5-1V8c0-3.5-2.5-6-6-6z"/></svg>
                      </button>
                    )}
                    <button className="cd-share-btn" onClick={async () => {
                      const url = window.location.href;
                      if (navigator.share) await navigator.share({ title: candidate.name, url });
                      else { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); }
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                      PARTAGER
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Next candidate card */}
            {nextCandidate ? (
              <div className="cd-side-card" onClick={handleNext}>
                {nextPhoto && <img src={nextPhoto} alt={nextCandidate.name}
                  onError={(e: any) => { e.target.style.display = "none"; }} />}
                <div className="cd-side-card-label">
                  <span className="cd-side-card-rank">
                    #{categoryCandidates.findIndex(c => c.id === nextCandidate.id) + 1}
                  </span>
                  <span className="cd-side-card-name">{nextCandidate.name.split(" ")[0]}</span>
                  <span className="cd-side-card-cat">CATÉGORIE</span>
                </div>
              </div>
            ) : (
              <div className="cd-side-card-empty" />
            )}

            {/* Right arrow */}
            <button className="cd-nav-arrow right" onClick={handleNext} disabled={!nextCandidate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Dots */}
          <div className="cd-dots">
            {categoryCandidates.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, i) => {
              const isActive = i === Math.min(currentIndex, 2);
              return <div key={i} className={`cd-dot${isActive ? " active" : ""}`} />;
            })}
          </div>

          {/* Swipe hint */}
          <div className="cd-swipe-hint">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 5v14M5 8l3-3 3 3M16 5v14M13 16l3 3 3-3" opacity="0.5"/>
              <path d="M9 12h6"/>
            </svg>
            Swipez à gauche ou à droite pour découvrir d'autres candidats
          </div>
        </div>

        {/* ── RIGHT: Info panel ── */}
        <div className="cd-info-section">
          {/* About */}
          {candidate.bio && (
            <div className="cd-about-card">
              <div className="cd-about-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                À propos de moi
              </div>
              <p className="cd-about-text">{candidate.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="cd-stats-row">
            <div className="cd-stat">
              <div className="cd-stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div className="cd-stat-val">{votesDisplay}</div>
              <div className="cd-stat-lbl">Votes</div>
            </div>
            <div className="cd-stat">
              <div className="cd-stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18"/>
                  <path d="M8 22h8M12 2v20M6 9h12v7a5 5 0 01-10 0V9z"/>
                </svg>
              </div>
              <div className="cd-stat-val">#{rank || "—"}</div>
              <div className="cd-stat-lbl">Position</div>
            </div>
            {isTop10 && (
              <div className="cd-stat">
                <div className="cd-stat-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div className="cd-stat-val">TOP 10</div>
                <div className="cd-stat-lbl">Classement</div>
              </div>
            )}
          </div>

          {/* Vote CTA */}
          <Link href={`/vote/${candidate.id}`} className="cd-vote-cta">
            <div className="cd-vote-cta-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </div>
            <div className="cd-vote-cta-text">
              <h3>VOTER POUR {candidate.name.split(" ")[0].toUpperCase()}</h3>
              <p>Soutenez votre candidate préférée</p>
            </div>
            <div className="cd-vote-cta-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </Link>

          {/* Security badge */}
          <div className="cd-security">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>
              <strong>Votre vote compte</strong> ! Chaque vote peut faire la différence.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
