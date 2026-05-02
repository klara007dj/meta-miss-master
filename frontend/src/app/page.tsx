"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function SplashPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [contest, setContest] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) { router.replace("/home"); return; }
    api.get("/contest/active").then((r) => setContest(r.data.data)).catch(() => {});
  }, [isAuthenticated, router]);

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
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      background: "var(--bg-white)",
      padding: "60px 28px 40px",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
        
        {/* LOGO SVG MODERNE META MISS MASTER */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
          <svg width="140" height="110" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10 60 L20 30 L40 55 L60 20 L80 55 L100 30 L110 60 L110 72 L10 72 Z"
              fill="url(#gradBlue)"
              stroke="#1D4ED8"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <rect x="15" y="70" width="90" height="10" rx="5" fill="#1D4ED8" opacity="0.9"/>
            <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="900" fill="#ffffff">
              MM
            </text>
            <circle cx="60" cy="18" r="3" fill="#60A5FA" />
            <circle cx="25" cy="35" r="2" fill="#93C5FD" />
            <circle cx="95" cy="35" r="2" fill="#93C5FD" />
            <defs>
              <linearGradient id="gradBlue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3B82F6"/>
                <stop offset="50%" stopColor="#1D4ED8"/>
                <stop offset="100%" stopColor="#1E3A8A"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.22em", color: "#2563EB", textTransform: "uppercase", marginBottom: 4 }}>
          META
        </div>

        <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1.1, textAlign: "center", marginBottom: 2 }}>
          MISS MASTER
        </div>

        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#2563EB", marginBottom: 32 }}>
          2025
        </div>

        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text)", lineHeight: 1.3, marginBottom: 10 }}>
            Votre voix célèbre<br />
            <span style={{ color: "#2563EB" }}>l'excellence</span>
          </div>

          <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 300 }}>
            Bienvenue sur la plateforme officielle de vote Meta Miss Master. Soutenez vos candidats préférés et suivez les résultats en direct.
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, margin: "24px 0 8px", background: "var(--blue-light)", borderRadius: 16, padding: "14px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563EB" }}>32</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>Candidats</div>
          </div>
          <div style={{ width: 1, background: "var(--blue-mid)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563EB" }}>1.2K+</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>Votes</div>
          </div>
          <div style={{ width: 1, background: "var(--blue-mid)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: contestInfo.color }}>{contestInfo.label}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>{contestInfo.sub}</div>
          </div>
        </div>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <Link href="/login?tab=login" style={{ textDecoration: "none" }}>
          <button style={{
            width: "100%",
            padding: "15px 0",
            borderRadius: 14,
            border: "none",
            background: "#2563EB",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            fontFamily: "var(--font)",
          }}>
            Se connecter
          </button>
        </Link>

        <Link href="/login?tab=register" style={{ textDecoration: "none" }}>
          <button style={{
            width: "100%",
            padding: "15px 0",
            borderRadius: 14,
            border: "1.5px solid #2563EB",
            background: "transparent",
            color: "#2563EB",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            fontFamily: "var(--font)",
          }}>
            Créer un compte
          </button>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ou</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button
          onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1.5px solid var(--border)",
            background: "var(--bg-white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
            color: "var(--text)",
            fontFamily: "var(--font)",
          }}
        >
          {/* Google official SVG icon */}
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continuer avec Google
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Vote sécurisé et confidentiel
          </span>
        </div>
      </div>
    </div>
  );
}
