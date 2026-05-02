"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useT } from "@/store/langStore";

const PRESETS = [100, 500, 1000, 5000];
const PROVIDERS = [
  { id: "fapshi", label: "Fapshi", sub: "MTN · Orange Money" },
  { id: "paypal", label: "PayPal", sub: "International / multi-device" },
  { id: "geniuspay", label: "GeniusPay", sub: "Choix de paiement selon le pays" },
];

const COUNTRIES = [
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "ML", label: "Mali" },
  { code: "SN", label: "Sénégal" },
  { code: "FR", label: "France" },
  { code: "GB", label: "Europe" },
  { code: "OTHER", label: "Autre pays" },
];

type Step = "form" | "confirm" | "success";

export default function VoteByIdPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [amount, setAmount] = useState(500);
  const [provider, setProvider] = useState("fapshi");
  const [country, setCountry] = useState("CI");
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
        candidateId: id, amount, provider, country, voterName, voterEmail, voterPhone,
      });
      if (data.data?.paymentLink) {
        window.location.href = data.data.paymentLink;
      } else {
        setStep("success");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  // ── Constantes thème sombre vote ──────────────────────────────────────────
  const D = {
    bg:       "#0F0F1A",
    card:     "#1A1A2E",
    card2:    "#16213E",
    border:   "rgba(255,255,255,0.08)",
    text:     "#F1F5F9",
    muted:    "rgba(255,255,255,0.45)",
    blue:     "#60A5FA",
    blueBg:   "rgba(96,165,250,0.12)",
    accent:   "#818CF8",
  };

  if (!candidate) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: D.bg }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${D.blueBg}`, borderTopColor: D.blue, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  const photo = candidate.photoUrl?.startsWith("http") ? candidate.photoUrl : `${apiBase}${candidate.photoUrl}`;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", border: `1.5px solid rgba(255,255,255,0.1)`,
    borderRadius: 8, fontFamily: "var(--font)", fontSize: "0.88rem",
    color: "#F1F5F9", background: "#1A1A2E", outline: "none", marginBottom: 12,
  };

  /* ── CONFIRM step ── */
  if (step === "confirm") return (
    <div className="page-content fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px 80px", textAlign: "center", background: "#0F0F1A", minHeight: "100dvh", color: "#F1F5F9" }}>
      <div className="top-bar" style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#0F0F1A" }}>
        <button onClick={() => setStep("form")} style={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, background: "#1A1A2E", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span className="top-bar-title">{t.voteTitle}</span>
        <div style={{ width: 32 }} />
      </div>
      <div style={{ marginTop: 60 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(96,165,250,0.15)", border: "2px solid rgba(96,165,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="16" rx="2"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{t.confirmVote}</h2>
        <p style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>{t.aboutToVoteFor}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: 28, textAlign: "left" }}>
          <img src={photo} alt={candidate.name} className="avatar" style={{ width: 52, height: 52 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text)" }}>{candidate.name}</div>
            <div style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.4)" }}>{t.region} {candidate.city}</div>
            <div style={{ fontSize: "0.72rem", color: "#60A5FA", fontWeight: 600, marginTop: 2 }}>{candidate.type === "MISS" ? "Miss" : "Master"}</div>
          </div>
        </div>

        <div style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>{votes} vote{votes>1?"s":""}</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#60A5FA" }}>{amount.toLocaleString("fr-FR")} FCFA</span>
        </div>

        <button onClick={handleConfirm} disabled={loading} className="btn-blue" style={{ marginBottom: 10 }}>
          {loading ? t.redirecting : t.confirmMyVote}
        </button>
        <button onClick={() => setStep("form")} className="btn-outline" style={{ marginBottom: 16 }}>{t.cancel}</button>
        <div className="security-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>{t.voteConfidential}</div>
      </div>
      <BottomNav />
    </div>
  );

  /* ── SUCCESS step ── */
  if (step === "success") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", minHeight: "100vh", background: "#0F0F1A", color: "#F1F5F9" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 32px rgba(37,99,235,0.35)" }} className="scale-in">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>{t.thankYou}</h2>
      <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 32, maxWidth: 260 }}>{t.voteSuccess}</p>
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 340 }}>
        <a href="/ranking" className="btn-blue" style={{ flex: 1 }}>{t.seeResults}</a>
        <a href="/candidates" className="btn-outline" style={{ flex: 1 }}>{t.voteAgain}</a>
      </div>
      <div className="security-badge" style={{ marginTop: 24 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        {t.voteConfidential}
      </div>
    </div>
  );

  /* ── FORM step ── */
  return (
    <div className="page-content fade-up" style={{ background: D.bg, minHeight: "100dvh", color: D.text }}>
      <div className="top-bar" style={{ background: D.bg, borderBottom: `1px solid ${D.border}` }}>
        <button onClick={() => router.back()} style={{ width: 32, height: 32, border: `1px solid ${D.border}`, borderRadius: 8, background: D.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span className="top-bar-title" style={{ color: D.text }}>{t.voteTitle}</span>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: "0 16px 24px" }}>
        {/* Candidate mini card */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: D.blueBg, border: `1px solid rgba(96,165,250,0.2)`, borderRadius: 12, padding: "14px", marginBottom: 20 }}>
          <img src={photo} alt={candidate.name} className="avatar" style={{ width: 52, height: 52 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: D.text }}>{candidate.name}</div>
            <div style={{ fontSize: "0.72rem", color: D.blue, fontWeight: 600 }}>{candidate.type === "MISS" ? "Miss" : "Master"}</div>
          </div>
        </div>

        {/* Voter info */}
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t.yourInfo}</div>
        <input style={inputStyle} placeholder={t.fullNamePlaceholder} value={voterName} onChange={e => setVoterName(e.target.value)} />
        <input style={inputStyle} type="email" placeholder={t.emailPlaceholder} value={voterEmail} onChange={e => setVoterEmail(e.target.value)} />
        <input style={inputStyle} placeholder={t.phonePlaceholder} value={voterPhone} onChange={e => setVoterPhone(e.target.value)} />

        {/* Amount */}
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t.amount}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 10 }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => setAmount(p)} style={{
              padding: "10px 0", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600,
              border: `1.5px solid ${amount===p ? "#60A5FA" : "rgba(255,255,255,0.1)"}`,
              background: amount===p ? "rgba(96,165,250,0.15)" : "#1A1A2E",
              color: amount===p ? "#60A5FA" : "rgba(255,255,255,0.45)",
              cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s",
            }}>
              {p >= 1000 ? `${p/1000}k` : p}F
            </button>
          ))}
        </div>
        <input
          type="number"
          min={100}
          step={100}
          value={amount}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (Number.isNaN(value)) return;
            setAmount(Math.max(100, Math.floor(value)));
          }}
          placeholder="Montant libre (min 100 FCFA)"
          style={{
            ...inputStyle,
            marginBottom: 20,
          }}
        />

        {/* Summary */}
        <div style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>{votes} vote{votes>1?"s":""}</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#60A5FA" }}>{amount.toLocaleString("fr-FR")} FCFA</span>
        </div>

        {/* Provider */}
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t.payment}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderRadius: 10,
              border: `1.5px solid ${provider===p.id ? "#60A5FA" : "rgba(255,255,255,0.1)"}`,
              background: provider===p.id ? "rgba(96,165,250,0.12)" : "#1A1A2E",
              cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center", fontWeight: 700, color: "#fff", background: p.id === "fapshi" ? "#E84C4C" : p.id === "paypal" ? "#003087" : "#1F2937" }}>
                  {p.id === "fapshi" ? "F" : p.id === "paypal" ? "P" : "G"}
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: provider===p.id ? "#60A5FA" : "#F1F5F9" }}>{p.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{p.sub}</div>
                </div>
              </div>
              {provider===p.id && (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {provider === "fapshi" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            <div style={{ border: "1px solid rgba(255,100,100,0.2)", background: "rgba(255,100,100,0.08)", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#FF7900", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>
                  O
                </span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F1F5F9" }}>Orange Money</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Paiement mobile via Fapshi</div>
            </div>
            <div style={{ border: "1px solid rgba(255,200,0,0.2)", background: "rgba(255,200,0,0.06)", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#FFD600", color: "#1F2937", display: "grid", placeItems: "center", fontWeight: 700 }}>
                  M
                </span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F1F5F9" }}>MTN Money</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Paiement mobile via Fapshi</div>
            </div>
          </div>
        )}

        {provider === "paypal" && (
          <div style={{ background: "rgba(0,48,135,0.3)", borderRadius: 10, padding: 14, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "#003087", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>P</span>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F1F5F9" }}>PayPal</div>
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Paiement international depuis l'Europe et les appareils mobiles.</div>
          </div>
        )}

        {provider === "geniuspay" && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Pays</div>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                ...inputStyle,
                appearance: "none",
                MozAppearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {COUNTRIES.map((countryOption) => (
                <option key={countryOption.code} value={countryOption.code}>{countryOption.label}</option>
              ))}
            </select>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 10 }}>
              GeniusPay sélectionnera le meilleur mode de paiement disponible pour votre pays.
            </div>
          </div>
        )}

        <button
          className="btn-blue"
          disabled={!voterName.trim() || !voterEmail.trim()}
          onClick={() => {
            if (!voterName.trim() || !voterEmail.trim()) { toast.error(t.error); return; }
            setStep("confirm");
          }}
          style={{ opacity: (!voterName.trim() || !voterEmail.trim()) ? 0.5 : 1 }}
        >
          {t.continueBtn}
        </button>
        <div className="security-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          {t.voteConfidential}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
