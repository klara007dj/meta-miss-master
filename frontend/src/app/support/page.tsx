"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";

const faqs = [
  { q: "Comment voter ?", a: "Choisissez un candidat, cliquez 'Voter', renseignez votre nom et email, choisissez le montant (100 FCFA = 1 vote) et payez." },
  { q: "Combien coûte un vote ?", a: "1 vote = 100 FCFA. Vous pouvez voter autant de fois que vous le souhaitez." },
  { q: "Quels paiements acceptés ?", a: "Fapshi (MTN / Orange Money), CinetPay (Mobile Money) et Stripe (carte bancaire)." },
  { q: "Mes votes sont-ils instantanés ?", a: "Oui. Dès validation du paiement, vos votes sont comptabilisés dans le classement en temps réel." },
  { q: "Comment participer au concours ?", a: "Accédez à la page Catégories et cherchez le formulaire de candidature. Validation sous 24h." },
];

export default function SupportPage() {
  const router = useRouter();
  const [open, setOpen] = useState<number|null>(null);

  return (
    <div className="page-content fade-up">
      <div className="top-bar">
        <button onClick={() => router.back()} style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span className="top-bar-title">Support</span>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: "0 16px 20px" }}>
        <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 20 }}>Questions fréquentes sur le vote et le concours.</p>

        {faqs.map((f, i) => (
          <div key={i} style={{ border: `1px solid ${open===i?"#2563EB":"var(--border)"}`, borderRadius: 10, marginBottom: 8, overflow: "hidden", transition: "border-color 0.15s" }}>
            <button onClick={() => setOpen(open===i?null:i)} style={{ width: "100%", padding: "14px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)", gap: 12 }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: open===i?"#2563EB":"var(--text)", textAlign: "left" }}>{f.q}</span>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: open===i?"#2563EB":"var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: open===i?"#fff":"var(--text-muted)", fontSize: "1rem", transition: "all 0.15s", transform: open===i?"rotate(45deg)":"none" }}>+</span>
            </button>
            {open===i && <div style={{ padding: "0 14px 14px", fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.7 }}>{f.a}</div>}
          </div>
        ))}

        <div style={{ background: "#EFF6FF", border: "1px solid #DBEAFE", borderRadius: 12, padding: "20px 16px", marginTop: 20, textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 10 }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", marginBottom: 6 }}>Contactez-nous</div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 16 }}>Notre équipe est disponible pour vous aider.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="https://wa.me/237600000000" className="btn-blue" style={{ flex: 1, fontSize: "0.8rem" }}>📱 WhatsApp</a>
            <a href="mailto:support@metamissemaster.cm" className="btn-outline" style={{ flex: 1, fontSize: "0.8rem" }}>✉️ Email</a>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
