"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

type Props = {
  initialTab: "login" | "register";
  redirect: string;
  oauthToken?: string;
  oauthRefreshToken?: string;
};

export default function LoginClient({ initialTab, redirect, oauthToken, oauthRefreshToken }: Props) {
  const router = useRouter();
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

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "#fff",
    color: "var(--text)",
    fontFamily: "var(--font)",
    outline: "none",
    marginBottom: 14,
  };

  return (
    <div className="page-content fade-up">
      <div className="top-bar">
        <div style={{ width: 32 }} />
        <span className="top-bar-title">Connexion / Inscription</span>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: "20px 16px 24px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            { key: "login", label: "Se connecter" },
            { key: "register", label: "S'inscrire" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key as "login" | "register")}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 999,
                border: item.key === tab ? "1px solid var(--blue)" : "1px solid var(--border)",
                background: item.key === tab ? "var(--blue)" : "transparent",
                color: item.key === tab ? "#fff" : "var(--text)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <input
              value={credentials.email}
              type="email"
              placeholder="Email"
              onChange={(e) => handleChange("email", e.target.value)}
              style={inputStyle}
            />
            <input
              value={credentials.password}
              type="password"
              placeholder="Mot de passe"
              onChange={(e) => handleChange("password", e.target.value)}
              style={inputStyle}
            />
            <button type="submit" className="btn-blue" style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <input
              value={credentials.name}
              type="text"
              placeholder="Nom complet"
              onChange={(e) => handleChange("name", e.target.value)}
              style={inputStyle}
            />
            <input
              value={credentials.email}
              type="email"
              placeholder="Email"
              onChange={(e) => handleChange("email", e.target.value)}
              style={inputStyle}
            />
            <input
              value={credentials.password}
              type="password"
              placeholder="Mot de passe"
              onChange={(e) => handleChange("password", e.target.value)}
              style={inputStyle}
            />
            <input
              value={credentials.phone}
              type="tel"
              placeholder="Téléphone"
              onChange={(e) => handleChange("phone", e.target.value)}
              style={inputStyle}
            />
            <button type="submit" className="btn-blue" style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Inscription..." : "Créer un compte"}
            </button>
          </form>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ou</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button
          type="button"
          onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
            fontWeight: 600,
            color: "#374151"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12.24c0-.71-.06-1.4-.17-2.06H12v3.9h5.61c-.24 1.3-.96 2.4-2.05 3.13v2.6h3.32c1.94-1.79 3.06-4.42 3.06-7.57z" fill="#4285F4"/>
            <path d="M12 23c2.7 0 4.97-.9 6.63-2.44l-3.32-2.6c-.92.62-2.09.98-3.31.98-2.54 0-4.7-1.72-5.48-4.03H2.97v2.53C4.62 20.88 8.02 23 12 23z" fill="#34A853"/>
            <path d="M6.52 14.94c-.2-.6-.31-1.24-.31-1.94s.11-1.34.31-1.94V8.53H2.97c-.62 1.24-.97 2.62-.97 4.06s.35 2.82.97 4.06l3.55-2.53z" fill="#FBBC05"/>
            <path d="M12 4.47c1.47 0 2.8.51 3.84 1.51l2.88-2.88C16.96 1.45 14.7.5 12 .5 8.02.5 4.62 2.62 2.97 5.76l3.55 2.53C7.3 6.19 9.46 4.47 12 4.47z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>
      </div>
    </div>
  );
}
