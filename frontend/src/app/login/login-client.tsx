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
          router.push(redirect);
        })
        .catch(() => {
          toast.error("Connexion Google échouée");
        });
    }
  }, [oauthToken, oauthRefreshToken, isAuthenticated, redirect, router, setAuth, setTokens]);

  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [loading, setLoading] = useState(false);
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
      router.push(redirect);
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
      router.push(redirect);
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
    </div>
  );
}
