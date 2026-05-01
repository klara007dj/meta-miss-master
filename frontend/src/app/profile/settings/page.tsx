"use client";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LangSelector from "@/components/ui/LangSelector";
import { useT } from "@/store/langStore";

export default function SettingsPage() {
  const router = useRouter();
  const t = useT();

  // TODO: Remplacer ce lien par le vrai lien d'invitation du groupe WhatsApp
  const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/VOTRE_LIEN_GROUPE";
  const WHATSAPP_SUPPORT = "https://wa.me/237694600007";

  const sectionStyle = {
    margin: "0 16px 16px",
    borderRadius: 16,
    border: "1px solid var(--border)",
    background: "var(--bg-card)",
    overflow: "hidden",
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px",
    borderBottom: "1px solid var(--border-light)",
  };

  const rowLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const iconBoxStyle = (bg: string) => ({
    width: 36,
    height: 36,
    borderRadius: 10,
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0 as const,
  });

  const sectionTitleStyle = {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    padding: "18px 16px 8px",
    margin: "0 16px",
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
        <span className="top-bar-title">{t.settings}</span>
        <div style={{ width: 32 }} />
      </div>

      {/* ─── Section Apparence ─────────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>{t.appearance}</div>
      <div style={sectionStyle}>

        {/* Dark mode */}
        <div style={rowStyle}>
          <div style={rowLabelStyle}>
            <div style={iconBoxStyle("#1E293B")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6366F1" stroke="none">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>
              {t.darkMode}
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Langue */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div style={rowLabelStyle}>
            <div style={iconBoxStyle("#EFF6FF")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>
              {t.language}
            </span>
          </div>
          <LangSelector />
        </div>
      </div>

      {/* ─── Section Support ───────────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>{t.support}</div>
      <div style={sectionStyle}>

        {/* En-tête support */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0118 0v6" />
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>{t.support}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 1 }}>{t.supportSubtitle}</div>
            </div>
          </div>
        </div>

        {/* Bouton WhatsApp support individuel */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-light)" }}>
          <button
            onClick={() => window.open(WHATSAPP_SUPPORT, "_blank")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 16px",
              borderRadius: 14,
              background: "#25D366",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.88rem",
              fontFamily: "var(--font)",
            }}
          >
            {/* WhatsApp SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t.contactSupport}
          </button>
        </div>

        {/* Bouton groupe WhatsApp */}
        <div style={{ padding: "12px 16px" }}>
          <button
            onClick={() => window.open(WHATSAPP_GROUP_LINK, "_blank")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 16px",
              borderRadius: 14,
              background: "transparent",
              border: "2px solid #25D366",
              cursor: "pointer",
              color: "#16A34A",
              fontWeight: 700,
              fontSize: "0.88rem",
              fontFamily: "var(--font)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            {t.joinGroup}
          </button>
        </div>
      </div>

      <div style={{ height: 32 }} />
      <BottomNav />
    </div>
  );
}
