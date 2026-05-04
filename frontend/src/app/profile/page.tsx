"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/store/langStore";

export default function ProfilePage() {
  const t = useT();
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => { logout(); router.push("/"); };

  const menuItems = [
    {
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>),
      label: t.myVotes, href: "/profile/votes", color: "var(--blue-light)",
    },
    {
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>),
      label: t.favorites, href: "/profile/favorites", color: "#FDF2F8",
    },
    {
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>),
      label: t.settings, href: "/profile/settings", color: "var(--bg)",
    },
    {
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M18 8a6 6 0 11-12 0 6 6 0 0112 0z"/><path d="M12 14v6"/><path d="M9 17h6"/></svg>),
      label: t.support, href: "/support", color: "rgba(16,185,129,0.12)",
    },
  ];

  return (
    <div className="page-content fade-up">
      <div className="top-bar">
        <div style={{ width: 32 }} />
        <span className="top-bar-title">{t.myProfile}</span>
        <button style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Avatar + name — only shown when authenticated */}
      {isAuthenticated && user ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 32px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,var(--blue-mid),var(--blue-light))", border: "3px solid var(--blue-mid)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5">
                <circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text)" }}>{user.name}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{user.email}</div>
        </div>
      ) : (
        /* Not logged in — prompt */
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5">
              <circle cx="12" cy="7" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)", marginBottom: 6 }}>Bienvenue !</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.5 }}>
            Connectez-vous pour accéder à votre profil et gérer vos votes.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/login" className="btn-blue">{t.loginBtn || "Se connecter"}</Link>
            <Link href="/login?tab=register" className="btn-outline">{t.createAccount || "Créer un compte"}</Link>
          </div>
        </div>
      )}

      {/* Menu items — only when authenticated */}
      {isAuthenticated && (
        <div style={{ padding: "0 16px" }}>
          {menuItems.map((item) => (
            <Link key={item.label} href={item.href} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>{item.label}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          ))}

          <div style={{ padding: "16px 0" }}>
            <Link href="/candidates/register" className="btn-blue" style={{ fontSize: "0.9rem", marginBottom: 12, display: "block" }}>
              {t.submitCandidacy || "Déposer ma candidature"}
            </Link>
          </div>

          {/* WhatsApp sponsor */}
          <a href="https://wa.me/237600000000" target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 16, background: "#25D366", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>Sponsoriser l'événement</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)" }}>Contactez-nous via WhatsApp</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </a>

          {/* Déconnexion */}
          <button onClick={() => setShowLogoutConfirm(true)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--border-light)", width: "100%", background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#EF4444" }}>{t.logout}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          {user?.role === "ADMIN" && (
            <div style={{ padding: "16px 0 0" }}>
              <Link href="/admin" className="btn-blue" style={{ fontSize: "0.85rem" }}>{t.adminLink || "Panneau Admin"}</Link>
            </div>
          )}
        </div>
      )}

      {/* Logout confirm sheet */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{t.logoutConfirm}</h3>
            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 24 }}>{t.logoutDesc}</p>
            <button onClick={handleLogout} className="btn-blue" style={{ background: "#EF4444", marginBottom: 10 }}>{t.confirm}</button>
            <button onClick={() => setShowLogoutConfirm(false)} className="btn-outline">{t.cancel}</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
