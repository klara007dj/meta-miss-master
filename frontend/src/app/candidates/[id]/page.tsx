"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
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
    try {
      return JSON.parse(localStorage.getItem(likesKey) || "[]") as string[];
    } catch {
      return [];
    }
  };

  const saveStoredLikes = (ids: string[]) => {
    localStorage.setItem(likesKey, JSON.stringify(ids));
  };

  const loadCandidate = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get(`/candidates/${id}`);
      setCandidate(response.data.data);
    } catch {
      toast.error("Candidat introuvable");
      setCandidate(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryCandidates = async (type: string) => {
    try {
      const response = await api.get(`/candidates?type=${type}&limit=100`);
      setCategoryCandidates(response.data.data?.candidates || []);
    } catch {
      setCategoryCandidates([]);
    }
  };

  useEffect(() => {
    loadCandidate();
  }, [id]);

  useEffect(() => {
    if (!candidate) return;
    setLiked(getStoredLikes().includes(candidate.id));
    loadCategoryCandidates(candidate.type);
  }, [candidate, likesKey]);

  const goToCandidate = (candidateId: string) => {
    router.push(`/candidates/${candidateId}`);
  };

  const currentIndex = candidate ? categoryCandidates.findIndex((c) => c.id === candidate.id) : -1;
  const previousCandidate = currentIndex > 0 ? categoryCandidates[currentIndex - 1] : null;
  const nextCandidate = currentIndex >= 0 && currentIndex < categoryCandidates.length - 1 ? categoryCandidates[currentIndex + 1] : null;

  const handlePrev = () => {
    if (previousCandidate) goToCandidate(previousCandidate.id);
  };

  const handleNext = () => {
    if (nextCandidate) goToCandidate(nextCandidate.id);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (delta > 80) {
      handlePrev();
    } else if (delta < -80) {
      handleNext();
    }
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
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
      Candidat introuvable
    </div>
  );

  const photo = candidate.photoUrl?.startsWith("http") ? candidate.photoUrl : `${apiBase}${candidate.photoUrl}`;

  return (
    <div className="page-content fade-up" style={{ paddingBottom: 80 }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="top-bar">
        <button onClick={() => router.back()} style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="top-bar-title">{t.candidate}</span>
        <button onClick={async () => {
          const url = window.location.href;
          if (navigator.share) { await navigator.share({ title: candidate.name, url }); }
          else { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); }
        }} style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </div>

      <style>{`
        .photo-nav-row { display: flex; gap: 10px; margin: 10px 16px 4px; }
        .photo-nav-button { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); font-size: 0.8rem; font-weight: 700; cursor: pointer; }
        .photo-nav-button:disabled { background: var(--border-light); color: var(--text-muted); cursor: not-allowed; }
        .photo-nav-label { text-align: center; font-size: 0.75rem; color: var(--text-muted); margin: 0 16px 10px; }
        .candidate-layout { display: block; }
        .candidate-photo-wrap { position: relative; margin: 0 16px 10px; border-radius: 20px; overflow: hidden; background: var(--bg); }
        .candidate-info { padding: 0 16px 24px; }
        @media (min-width: 640px) { .candidate-photo-wrap { margin: 0 24px 20px; border-radius: 24px; } }
        @media (min-width: 1024px) {
          .candidate-layout { display: grid; grid-template-columns: 45% 55%; gap: 0; align-items: start; max-width: 1100px; margin: 0 auto; padding: 0 32px; }
          .candidate-photo-wrap { position: sticky; top: 20px; margin: 0; border-radius: 28px; }
          .candidate-info { padding: 0 0 40px 40px; }
        }
        .photo-skeleton { position: absolute; inset: 0; background: linear-gradient(90deg, var(--bg) 25%, var(--border-light) 50%, var(--bg) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div className="candidate-layout">
        <div className="candidate-photo-wrap">
          {!imgLoaded && <div className="photo-skeleton" style={{ height: 300 }} />}
          <img src={photo} alt={candidate.name} style={{ width: "100%", height: "auto", maxWidth: "100%", display: imgLoaded ? "block" : "none", objectFit: "contain", transition: "opacity .3s" }} onLoad={() => setImgLoaded(true)} onError={(e: any) => { e.target.style.display = "none"; setImgLoaded(true); }} />
        </div>
        <div className="photo-nav-row">
          <button type="button" onClick={handlePrev} disabled={!previousCandidate} className="photo-nav-button">
            ← {previousCandidate ? previousCandidate.name.split(" ")[0] : t.previous}
          </button>
          <button type="button" onClick={handleNext} disabled={!nextCandidate} className="photo-nav-button">
            {nextCandidate ? nextCandidate.name.split(" ")[0] : t.next} →
          </button>
        </div>
        <div className="photo-nav-label">{categoryCandidates.length > 0 ? `${currentIndex + 1} / ${categoryCandidates.length}` : "Swipe gauche/droite pour naviguer"}</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 4px", gap: 10 }}>
          <div style={{ background: candidate.type === "MISS" ? "linear-gradient(135deg,#ec4899,#be185d)" : "linear-gradient(135deg,#6366f1,#4338ca)", color: "#fff", padding: "5px 14px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em" }}>
            {candidate.type === "MISS" ? "♛ MISS" : "♚ MASTER"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg)", padding: "5px 12px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700, color: "var(--blue)" }}>
              <span style={{ color: "#FBBF24" }}>★</span>
              {candidate.totalVotes?.toLocaleString("fr-FR") || "0"} votes
            </div>
            <button onClick={toggleLike} style={{ width: 38, height: 38, borderRadius: "50%", background: liked ? "rgba(239,68,68,0.1)" : "var(--bg)", border: liked ? "1.5px solid #FCA5A5" : "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill={liked ? "#EF4444" : "none"} stroke={liked ? "#EF4444" : "var(--text-faint)"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="candidate-info">
          <h1 style={{ fontSize: "clamp(1.3rem, 4vw, 2rem)", fontWeight: 800, color: "var(--text)", marginBottom: 6, marginTop: 4 }}>{candidate.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 18 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {candidate.city}
          </div>

          {candidate.bio && <p style={{ fontSize: "0.88rem", color: "var(--text-2)", lineHeight: 1.75, marginBottom: 22 }}>{candidate.bio}</p>}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>{candidate.totalLikes?.toLocaleString("fr-FR") || "0"}</span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{t.likes}</span>
          </div>

          <div style={{ background: "var(--blue-light)", borderRadius: 16, padding: "16px 20px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>{t.totalVotesLabel}</div>
              <div style={{ fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 800, color: "var(--blue)" }}>{candidate.totalVotes?.toLocaleString("fr-FR") || "0"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>{t.oneVoteEquals}</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>= 100 FCFA</div>
            </div>
          </div>

          {(candidate.instagram || candidate.tiktok || candidate.snap || candidate.whatsappFan) && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>{t.findMeOn}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {candidate.instagram && (
                  <button onClick={() => window.open(`https://instagram.com/${candidate.instagram.replace("@", "")}`, "_blank")} style={{ width: 44, height: 44, borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(220,39,67,.3)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" /></svg>
                  </button>
                )}
                {candidate.tiktok && (
                  <button onClick={() => window.open(`https://tiktok.com/@${candidate.tiktok.replace("@", "")}`, "_blank")} style={{ width: 44, height: 44, borderRadius: 14, border: "none", cursor: "pointer", background: "#010101", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(0,0,0,.3)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" /></svg>
                  </button>
                )}
                {candidate.snap && (
                  <button onClick={() => window.open(`https://snapchat.com/add/${candidate.snap.replace("@", "")}`, "_blank")} style={{ width: 44, height: 44, borderRadius: 14, border: "none", cursor: "pointer", background: "#FFFC00", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M12 2C8.5 2 6 4.5 6 8v1.5c-.5.1-1.5.4-1.5 1s.8.9 1.5 1c-.2.5-.6 1.2-1.5 1.5-.3.1-.5.3-.5.6 0 .4.4.7.8.8.5.1 1 .2 1.2.7.1.2 0 .4-.1.6-.3.4-1 .9-1 1.5 0 .5.4.9.9.9.3 0 .7-.1 1.1-.3.6-.3 1.2-.4 1.6-.1.3.2.5.6.7 1 .3.6.8 1.3 2.3 1.3s2-.7 2.3-1.3c.2-.4.4-.8.7-1 .4-.3 1-.2 1.6.1.4.2.8.3 1.1.3.5 0 .9-.4.9-.9 0-.6-.7-1.1-1-1.5-.1-.2-.2-.4-.1-.6.2-.5.7-.6 1.2-.7.4-.1.8-.4.8-.8 0-.3-.2-.5-.5-.6-.9-.3-1.3-1-1.5-1.5.7-.1 1.5-.4 1.5-1s-1-.9-1.5-1V8c0-3.5-2.5-6-6-6z" /></svg>
                  </button>
                )}
                {candidate.whatsappFan && (
                  <button onClick={() => window.open(candidate.whatsappFan.startsWith("http") ? candidate.whatsappFan : `https://wa.me/${candidate.whatsappFan}`, "_blank")} style={{ width: 44, height: 44, borderRadius: 14, border: "none", cursor: "pointer", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <Link href={`/vote/${candidate.id}`} className="btn-blue" style={{ display: "block", textAlign: "center", textDecoration: "none", fontSize: "1rem", padding: "16px", borderRadius: 16, fontWeight: 800 }}>
            ⭐ {t.voteFor_prefix} {candidate.name.split(" ")[0]}
          </Link>
          <div className="security-badge" style={{ marginTop: 14 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            {t.voteSecure}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
