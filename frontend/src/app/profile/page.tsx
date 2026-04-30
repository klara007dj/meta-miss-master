"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => { logout(); router.push("/"); };

  const menuItems = [
    {
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>),
      label: "Mes votes",
      href: "/profile/votes",
      color: "#EFF6FF",
    },
    {
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>),
      label: "Favoris",
      href: "/profile/favorites",
      color: "#FDF2F8",
    },
    {
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>),
      label: "Paramètres",
      href: "/profile/settings",
      color: "#F9FAFB",
    },
  ];

  return (
    <div className="page-content fade-up">
      {/* Top bar */}
      <div className="top-bar">
        <div style={{ width: 32 }} />
        <span className="top-bar-title">Mon profil</span>
        <button style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Avatar + name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 32px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)", border: "3px solid #DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5">
              <circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          )}
        </div>
        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text)" }}>
          {user?.name || "Sophie Diop"}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
          {user?.email || "sophie.diop@email.com"}
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: "0 16px" }}>
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon}
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>{item.label}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
        ))}

        {/* Déconnexion */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border-light)", width: "100%", background: "none", border: "none", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#EF4444" }}>Déconnexion</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* Admin link if applicable */}
      {isAuthenticated && user?.role === "ADMIN" && (
        <div style={{ padding: "16px 16px 0" }}>
          <Link href="/admin" className="btn-blue" style={{ fontSize: "0.85rem" }}>
            Administration →
          </Link>
        </div>
      )}

      {/* Not logged in */}
      {!isAuthenticated && (
        <div style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/candidates/register" className="btn-blue">Se connecter</Link>
          <Link href="/candidates/register" className="btn-outline">Créer un compte</Link>
        </div>
      )}

      {/* Logout confirm sheet */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Se déconnecter ?</h3>
            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 24 }}>Vous serez redirigé vers la page d'accueil.</p>
            <button onClick={handleLogout} className="btn-blue" style={{ background: "#EF4444", marginBottom: 10 }}>Confirmer</button>
            <button onClick={() => setShowLogoutConfirm(false)} className="btn-outline">Annuler</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
