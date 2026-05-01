"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";
import { useT } from "@/store/langStore";
import toast from "react-hot-toast";

interface Candidate {
  id: string;
  name: string;
  type: string;
  city: string;
  photoUrl: string;
  totalVotes: number;
  totalLikes: number;
}

export default function FavoritesPage() {
  const router = useRouter();
  const t = useT();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // Lire les IDs depuis localStorage
      const likedIds: string[] = JSON.parse(localStorage.getItem("mmm-likes") || "[]");
      if (likedIds.length === 0) { setLoading(false); return; }

      // Fetch chaque candidat
      const results = await Promise.allSettled(
        likedIds.map((id) => api.get(`/candidates/${id}`).then((r) => r.data.data))
      );
      const valid = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<Candidate>).value);
      setCandidates(valid);
    } catch {
      toast.error(t.error);
    }
    setLoading(false);
  };

  const unlike = async (candidateId: string) => {
    // Retirer du localStorage
    const likedIds: string[] = JSON.parse(localStorage.getItem("mmm-likes") || "[]");
    const newIds = likedIds.filter((id) => id !== candidateId);
    localStorage.setItem("mmm-likes", JSON.stringify(newIds));

    // Décrémenter le compteur côté API
    try {
      await api.delete(`/candidates/${candidateId}/like`);
    } catch {
      // Silencieux — le like local est déjà retiré
    }

    // Mettre à jour l'UI
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    toast("Retiré des favoris");
  };

  return (
    <div className="page-content fade-up">
      {/* Top bar */}
      <div className="top-bar">
        <button
          onClick={() => router.back()}
          style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="top-bar-title">{t.favorites}</span>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", minWidth: 32, textAlign: "right" }}>
          {candidates.length > 0 ? candidates.length : ""}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 16px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 88, borderRadius: 16, background: "var(--border-light)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>❤️</div>
          <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8, fontSize: "1rem" }}>
            {t.noFavorites}
          </div>
          <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 28 }}>
            {t.noFavoritesDesc}
          </div>
          <Link href="/candidates" className="btn-blue" style={{ fontSize: "0.85rem", textDecoration: "none" }}>
            Découvrir les candidats
          </Link>
        </div>
      ) : (
        <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {candidates.map((c) => {
            const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
            return (
              <div key={c.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 14px",
                borderRadius: 16,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}>
                {/* Photo */}
                <Link href={`/candidates/${c.id}`} style={{ flexShrink: 0 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, overflow: "hidden", background: "var(--border-light)", position: "relative" }}>
                    <Image src={photo} alt={c.name} fill style={{ objectFit: "cover" }}
                      onError={(e: any) => { e.target.style.display = "none"; }} />
                  </div>
                </Link>

                {/* Infos */}
                <Link href={`/candidates/${c.id}`} style={{ flex: 1, textDecoration: "none", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.92rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                    📍 {c.city}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--blue)", background: "var(--blue-light)", padding: "2px 8px", borderRadius: 100 }}>
                      ★ {c.totalVotes?.toLocaleString("fr-FR") || "0"} votes
                    </span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#EC4899", background: "#FDF2F8", padding: "2px 8px", borderRadius: 100 }}>
                      ♥ {c.totalLikes?.toLocaleString("fr-FR") || "0"} likes
                    </span>
                  </div>
                </Link>

                {/* Unlike button */}
                <button
                  onClick={() => unlike(c.id)}
                  style={{ width: 38, height: 38, borderRadius: "50%", background: "#FEF2F2", border: "1.5px solid #FCA5A5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="1">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
