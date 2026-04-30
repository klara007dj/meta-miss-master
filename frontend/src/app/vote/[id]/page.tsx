"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";
import toast from "react-hot-toast";

const PRESETS = [100, 500, 1000, 5000];
const PROVIDERS = [
  { id: "fapshi", label: "Fapshi", sub: "MTN · Orange Money" },
  { id: "cinetpay", label: "CinetPay", sub: "Mobile Money" },
  { id: "stripe", label: "Stripe", sub: "Carte bancaire" },
];

type Step = "form" | "confirm" | "success";

export default function VoteByIdPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [amount, setAmount] = useState(500);
  const [provider, setProvider] = useState("fapshi");
  const [voterName, setVoterName] = useState("");
  const [voterEmail, setVoterEmail] = useState("");
  const [voterPhone, setVoterPhone] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api","") || "http://localhost:5000";

  useEffect(() => {
    if (!id) return;
    api.get(`/candidates/${id}`).then(r => setCandidate(r.data.data)).catch(() => router.push("/candidates"));
  }, [id, router]);

  const votes = Math.floor(amount / 100);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/payments/initialize", {
        candidateId: id, amount, provider, voterName, voterEmail, voterPhone,
      });
      if (data.data?.paymentLink) {
        window.location.href = data.data.paymentLink;
      } else {
        setStep("success");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur paiement");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  if (!candidate) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #DBEAFE", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  const photo = candidate.photoUrl?.startsWith("http") ? candidate.photoUrl : `${apiBase}${candidate.photoUrl}`;

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "var(--font)", fontSize: "0.88rem", color: "var(--text)", background: "#fff", outline: "none", marginBottom: 12 };

  /* ── CONFIRM step ── */
  if (step === "confirm") return (
    <div className="page-content fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px 80px", textAlign: "center" }}>
      <div className="top-bar" style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff" }}>
        <button onClick={() => setStep("form")} style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span className="top-bar-title">Voter</span>
        <div style={{ width: 32 }} />
      </div>
      <div style={{ marginTop: 60 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#EFF6FF", border: "2px solid #DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="16" rx="2"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Confirmer votre vote</h2>
        <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 24 }}>Vous êtes sur le point de voter pour</p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 28, textAlign: "left" }}>
          <img src={photo} alt={candidate.name} className="avatar" style={{ width: 52, height: 52 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text)" }}>{candidate.name}</div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Région {candidate.city}</div>
            <div style={{ fontSize: "0.72rem", color: "#2563EB", fontWeight: 600, marginTop: 2 }}>{candidate.type === "MISS" ? "Miss Master" : "Mister Master"}</div>
          </div>
        </div>

        <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{votes} vote{votes>1?"s":""}</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2563EB" }}>{amount.toLocaleString("fr-FR")} FCFA</span>
        </div>

        <button onClick={handleConfirm} disabled={loading} className="btn-blue" style={{ marginBottom: 10 }}>
          {loading ? "Redirection..." : "Confirmer mon vote"}
        </button>
        <button onClick={() => setStep("form")} className="btn-outline" style={{ marginBottom: 16 }}>Annuler</button>
        <div className="security-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Votre vote est confidentiel et sécurisé.</div>
      </div>
      <BottomNav />
    </div>
  );

  /* ── SUCCESS step ── */
  if (step === "success") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", minHeight: "100vh", background: "#fff" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 32px rgba(37,99,235,0.35)" }} className="scale-in">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Merci !</h2>
      <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 32, maxWidth: 260 }}>
        Votre vote a été pris<br />en compte avec succès.
      </p>
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 340 }}>
        <a href="/ranking" className="btn-blue" style={{ flex: 1 }}>Voir les résultats</a>
        <a href="/candidates" className="btn-outline" style={{ flex: 1 }}>Voter encore</a>
      </div>
      <div className="security-badge" style={{ marginTop: 24 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Votre vote est confidentiel et sécurisé.
      </div>
    </div>
  );

  /* ── FORM step ── */
  return (
    <div className="page-content fade-up">
      <div className="top-bar">
        <button onClick={() => router.back()} style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span className="top-bar-title">Voter</span>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: "0 16px 24px" }}>
        {/* Candidate mini card */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--blue-light)", borderRadius: 12, padding: "14px", marginBottom: 20 }}>
          <img src={photo} alt={candidate.name} className="avatar" style={{ width: 52, height: 52 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text)" }}>{candidate.name}</div>
            <div style={{ fontSize: "0.72rem", color: "#2563EB", fontWeight: 600 }}>{candidate.type === "MISS" ? "Miss Master" : "Mister Master"}</div>
          </div>
        </div>

        {/* Voter info */}
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Vos informations</div>
        <input style={inputStyle} placeholder="Votre nom complet *" value={voterName} onChange={e => setVoterName(e.target.value)} />
        <input style={inputStyle} type="email" placeholder="Email *" value={voterEmail} onChange={e => setVoterEmail(e.target.value)} />
        <input style={inputStyle} placeholder="Téléphone (optionnel)" value={voterPhone} onChange={e => setVoterPhone(e.target.value)} />

        {/* Amount */}
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Montant</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 10 }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => setAmount(p)} style={{
              padding: "10px 0", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600,
              border: `1.5px solid ${amount===p ? "#2563EB" : "var(--border)"}`,
              background: amount===p ? "#EFF6FF" : "#fff",
              color: amount===p ? "#2563EB" : "var(--text-muted)",
              cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s",
            }}>
              {p >= 1000 ? `${p/1000}k` : p}F
            </button>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "12px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{votes} vote{votes>1?"s":""}</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2563EB" }}>{amount.toLocaleString("fr-FR")} FCFA</span>
        </div>

        {/* Provider */}
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Paiement</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderRadius: 10,
              border: `1.5px solid ${provider===p.id ? "#2563EB" : "var(--border)"}`,
              background: provider===p.id ? "#EFF6FF" : "#fff",
              cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s",
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: provider===p.id ? "#2563EB" : "var(--text)" }}>{p.label}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.sub}</div>
              </div>
              {provider===p.id && (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          className="btn-blue"
          disabled={!voterName.trim() || !voterEmail.trim()}
          onClick={() => {
            if (!voterName.trim() || !voterEmail.trim()) { toast.error("Renseignez nom et email"); return; }
            setStep("confirm");
          }}
          style={{ opacity: (!voterName.trim() || !voterEmail.trim()) ? 0.5 : 1 }}
        >
          Continuer →
        </button>
        <div className="security-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Votre vote est confidentiel et sécurisé.
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
