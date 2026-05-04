"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function SplashPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [contest, setContest] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    if (isAuthenticated) { router.replace("/home"); return; }
    api.get("/contest/active").then((r) => setContest(r.data.data)).catch(() => {});
    api.get("/candidates/top?limit=10").then((r) => setCandidates(r.data.data || [])).catch(() => {});
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (candidates.length < 2) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % candidates.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [candidates.length]);

  const contestInfo = (() => {
    if (!contest) return { label: "—", sub: "Jours restants", color: "#2563EB" };
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

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      background: "var(--bg-white)", overflow: "hidden",
    }}>
      {/* Candidate Carousel */}
      <div style={{
        position: "relative", width: "100%", height: "52vh", minHeight: 280,
        overflow: "hidden", flexShrink: 0,
        background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
      }}>
        {candidates.length === 0 ? (
          <div style={{
            width: "100%", height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12, position: "relative",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ position: "absolute", bottom: -60, left: -30, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div style={{ textAlign: "center", padding: "0 32px" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 6 }}>
                Pas encore de candidats
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                Les candidatures s'afficheront ici dès approbation.
              </div>
            </div>
            <Link href="/candidates/register" style={{ textDecoration: "none", marginTop: 4 }}>
              <button style={{
                padding: "10px 24px", borderRadius: 50,
                border: "1.5px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.12)", color: "#fff",
                fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
              }}>
                ✦ Déposer ma candidature
              </button>
            </Link>
          </div>
        ) : (
          <>
            {candidates.map((c, i) => {
              const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
              return (
                <div key={c.id} style={{
                  position: "absolute", inset: 0,
                  opacity: i === currentSlide ? 1 : 0,
                  transition: "opacity 0.8s ease",
                  zIndex: i === currentSlide ? 1 : 0,
                }}>
                  <img src={photo} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                  <div style={{ position: "absolute", bottom: 24, left: 20, right: 60, color: "#fff" }}>
                    <div style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 50,
                      background: i === 0 ? "#F59E0B" : "#2563EB",
                      fontSize: "0.68rem", fontWeight: 700, marginBottom: 6,
                    }}>
                      #{i + 1} {c.type === "MISS" ? "Miss" : "Master"}
                    </div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1.2 }}>{c.name}</div>
                    {c.city && <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", marginTop: 2 }}>📍 {c.city}</div>}
                  </div>
                </div>
              );
            })}
            <div style={{ position: "absolute", bottom: 28, right: 16, display: "flex", gap: 5, zIndex: 10 }}>
              {candidates.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} style={{
                  width: i === currentSlide ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === currentSlide ? "#fff" : "rgba(255,255,255,0.4)",
                  border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s",
                }} />
              ))}
            </div>
          </>
        )}
        {/* Logo badge */}
        <div style={{
          position: "absolute", top: 16, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10,
        }}>
          <div style={{
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
            borderRadius: 50, padding: "6px 16px",
            border: "1px solid rgba(255,255,255,0.25)",
          }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.06em" }}>
              ✦ META MISS MASTER 2025
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 24px 32px", overflow: "auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text)", lineHeight: 1.2, marginBottom: 6 }}>
            Votre voix célèbre<br />
            <span style={{ color: "#2563EB" }}>l'excellence</span>
          </div>
          <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Soutenez vos candidats préférés et suivez les résultats en direct.
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", background: "var(--blue-light)",
          borderRadius: 16, overflow: "hidden", marginBottom: 24,
        }}>
          {[
            { val: candidates.length > 0 ? candidates.length : "—", label: "Candidats" },
            { val: contestInfo.label, label: contestInfo.sub, color: contestInfo.color },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center", padding: "14px 10px",
              borderRight: i === 0 ? "1px solid var(--blue-mid)" : "none",
            }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: s.color || "#2563EB" }}>{s.val}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
          <Link href="/login?tab=login" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
              background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: "1rem",
              cursor: "pointer", fontFamily: "var(--font)",
            }}>Se connecter</button>
          </Link>

          <Link href="/login?tab=register" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: "15px 0", borderRadius: 14,
              border: "1.5px solid #2563EB", background: "transparent",
              color: "#2563EB", fontWeight: 700, fontSize: "1rem",
              cursor: "pointer", fontFamily: "var(--font)",
            }}>Créer un compte</button>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <button
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 14,
              border: "1.5px solid var(--border)", background: "var(--bg-white)",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, cursor: "pointer", fontWeight: 600, fontSize: "0.95rem",
              color: "var(--text)", fontFamily: "var(--font)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuer avec Google
          </button>

          <Link href="/candidates/register" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: "13px 16px", borderRadius: 14,
              border: "1.5px solid #F59E0B", background: "rgba(245,158,11,0.06)",
              color: "#B45309", fontWeight: 600, fontSize: "0.88rem",
              cursor: "pointer", fontFamily: "var(--font)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              ✦ Déposer ma candidature
            </button>
          </Link>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Vote sécurisé et confidentiel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
