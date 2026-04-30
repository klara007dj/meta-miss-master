"use client";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="page-content fade-up">
      <div className="top-bar">
        <button
          onClick={() => router.back()}
          style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span className="top-bar-title">Paramètres</span>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>⚙️</div>
        <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Paramètres à venir</div>
        <div style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>Cette page sera bientôt complétée avec vos préférences.</div>
      </div>

      <BottomNav />
    </div>
  );
}
