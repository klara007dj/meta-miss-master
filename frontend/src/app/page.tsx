"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function SplashPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, router]);

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#fff",
      padding: "60px 28px 40px",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
        
        {/* LOGO SVG MODERNE META MISS MASTER */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
          <svg width="140" height="110" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            
            {/* Crown */}
            <path
              d="M10 60 L20 30 L40 55 L60 20 L80 55 L100 30 L110 60 L110 72 L10 72 Z"
              fill="url(#gradBlue)"
              stroke="#1D4ED8"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Base */}
            <rect x="15" y="70" width="90" height="10" rx="5" fill="#1D4ED8" opacity="0.9"/>

            {/* MM letters */}
            <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="900" fill="#ffffff">
              MM
            </text>

            {/* sparkle */}
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

        <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#111827", letterSpacing: "0.04em", lineHeight: 1.1, textAlign: "center", marginBottom: 2 }}>
          MISS MASTER
        </div>

        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#2563EB", marginBottom: 32 }}>
          2025
        </div>

        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#111827", lineHeight: 1.3, marginBottom: 10 }}>
            Votre voix célèbre<br />
            <span style={{ color: "#2563EB" }}>l'excellence</span>
          </div>

          <div style={{ fontSize: "0.88rem", color: "#6B7280", lineHeight: 1.6, maxWidth: 300 }}>
            Bienvenue sur la plateforme officielle de vote Meta Miss Master. Soutenez vos candidats préférés et suivez les résultats en direct.
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, margin: "24px 0 8px", background: "#F0F6FF", borderRadius: 16, padding: "14px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563EB" }}>32</div>
            <div style={{ fontSize: "0.65rem", color: "#6B7280", fontWeight: 500 }}>Candidats</div>
          </div>
          <div style={{ width: 1, background: "#DBEAFE" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563EB" }}>1.2K+</div>
            <div style={{ fontSize: "0.65rem", color: "#6B7280", fontWeight: 500 }}>Votes</div>
          </div>
          <div style={{ width: 1, background: "#DBEAFE" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563EB" }}>5</div>
            <div style={{ fontSize: "0.65rem", color: "#6B7280", fontWeight: 500 }}>Jours restants</div>
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
          }}>
            Créer un compte
          </button>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>ou</span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        <button
          onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1.5px solid #E5E7EB",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
            color: "#374151",
          }}
        >
          Continuer avec Google
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>
            Vote sécurisé et confidentiel
          </span>
        </div>
      </div>
    </div>
  );
}
