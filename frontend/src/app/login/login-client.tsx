"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import LangSelector from "@/components/ui/LangSelector";
import { useT } from "@/store/langStore";

type Props = {
  initialTab: "login" | "register";
  redirect: string;
  oauthToken?: string;
  oauthRefreshToken?: string;
};

export default function LoginClient({ initialTab, redirect, oauthToken, oauthRefreshToken }: Props) {
  const router = useRouter();
  const t = useT();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setTokens = useAuthStore((state) => state.setTokens);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (oauthToken && oauthRefreshToken && !isAuthenticated) {
      setTokens(oauthToken, oauthRefreshToken);
      api.get("/auth/me")
        .then((response) => {
          setAuth(response.data.data, oauthToken, oauthRefreshToken);
          setRedirectAfterPopup(redirect);
          setShowWhatsAppPopup(true);
        })
        .catch(() => {
          toast.error("Connexion Google échouée");
        });
    }
  }, [oauthToken, oauthRefreshToken, isAuthenticated, redirect, router, setAuth, setTokens]);

  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [loading, setLoading] = useState(false);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [redirectAfterPopup, setRedirectAfterPopup] = useState(redirect);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });

  useEffect(() => { setTab(initialTab); }, [initialTab]);

  const handleChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/user/login", {
        email: credentials.email,
        password: credentials.password,
      });
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      setRedirectAfterPopup(redirect);
      setShowWhatsAppPopup(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/user/register", {
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
        phone: credentials.phone,
      });
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      setRedirectAfterPopup(redirect);
      setShowWhatsAppPopup(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* ─── Header avec LangSelector ──────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)" }}>
          Meta<span style={{ color: "var(--blue)" }}>Miss</span>
        </div>
        <LangSelector />
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 20px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
          {tab === "login" ? t.loginTitle : t.registerTitle}
        </h1>
        <div style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 24 }}>
          {(["login", "register"] as const).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.88rem",
                fontFamily: "var(--font)",
                background: tab === tabKey ? "var(--blue)" : "var(--border-light)",
                color: tab === tabKey ? "#fff" : "var(--text-muted)",
                transition: "all 0.2s",
              }}
            >
              {tabKey === "login" ? t.login : t.register}
            </button>
          ))}
        </div>

        {/* ─── Login form ─────────────────────────────────────────────────── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                {t.email}
              </label>
              <input
                type="email"
                required
                value={credentials.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="vous@email.com"
                className="admin-input"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                {t.password}
              </label>
              <input
                type="password"
                required
                value={credentials.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                className="admin-input"
                style={{ width: "100%" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-blue"
              style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t.loading : t.login}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {t.noAccount}{" "}
              <button type="button" onClick={() => setTab("register")} style={{ color: "var(--blue)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)", fontSize: "0.82rem" }}>
                {t.register}
              </button>
            </p>
          </form>
        )}

        {/* ─── Register form ──────────────────────────────────────────────── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                {t.fullName}
              </label>
              <input
                type="text"
                required
                value={credentials.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Jean Dupont"
                className="admin-input"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                {t.email}
              </label>
              <input
                type="email"
                required
                value={credentials.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="vous@email.com"
                className="admin-input"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                {t.phone}
              </label>
              <input
                type="tel"
                value={credentials.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="admin-input"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                {t.password}
              </label>
              <input
                type="password"
                required
                value={credentials.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                className="admin-input"
                style={{ width: "100%" }}
              />
            </div>

            {/* Sélecteur de langue visible aussi dans le formulaire */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: "var(--border-light)", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-2)" }}>
                {t.selectLanguage}
              </span>
              <LangSelector />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-blue"
              style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t.loading : t.register}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {t.alreadyAccount}{" "}
              <button type="button" onClick={() => setTab("login")} style={{ color: "var(--blue)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)", fontSize: "0.82rem" }}>
                {t.login}
              </button>
            </p>
          </form>
        )}
      </div>

      {showWhatsAppPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "var(--bg-white)", borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", padding: 24, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 16.5a9 9 0 10-9 9c1.6 0 3.18-.4 4.55-1.1L23 23l-1.6-4.65A8.95 8.95 0 0021 16.5z"/><path d="M16 13.5c-.3.1-1.8.9-2.1 1a1 1 0 01-1.3-.45c-.4-.7-1.1-1.1-1.1-1.2 0-.1 0-.2.1-.3.1-.1.2-.2.3-.3.1-.1.2-.1.3-.1.1 0 .2 0 .3.1.1.1.5.4.6.5.1.1.1.2.1.3 0 .1 0 .2-.1.3-.1.1-.2.2-.4.3-.2.1-.3.2-.5.2-.2 0-.3 0-.4-.1-.1-.1-.3-.2-.4-.3-.1-.1-.2-.3-.2-.4 0-.2 0-.4.1-.5.1-.1.2-.2.3-.3.1-.1.4-.3.7-.3.3 0 .7.1 1 .3.3.2.5.5.6.8.1.3.2.6.2.8 0 .3 0 .6-.1.9-.1.3-.2.5-.4.8z"/></svg>
            </div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Rejoignez le groupe WhatsApp</h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: 22, lineHeight: 1.6 }}>
              Pour ne rien manquer, rejoignez notre groupe WhatsApp après votre connexion ou inscription.
            </p>
            <button
              type="button"
              onClick={() => window.open("https://chat.whatsapp.com/HuksAebrAfVBEt292xU4KF?mode=gi_t", "_blank")}
              className="btn-blue"
              style={{ width: "100%", marginBottom: 10 }}
            >
              Rejoindre le groupe WhatsApp
            </button>
            <button
              type="button"
              onClick={() => { setShowWhatsAppPopup(false); router.push(redirectAfterPopup); }}
              className="btn-outline"
              style={{ width: "100%" }}
            >
              Continuer sans rejoindre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
