"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/profile";
  const setAuth = useAuthStore((state) => state.setAuth);

  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    tiktok: "",
    snap: "",
    instagram: "",
    whatsappFan: "",
  });

  useEffect(() => {
    if (searchParams.get("tab") === "register") {
      setTab("register");
    }
  }, [searchParams]);

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
        tiktok: credentials.tiktok,
        snap: credentials.snap,
        instagram: credentials.instagram,
        whatsappFan: credentials.whatsappFan,
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
            <input
              value={credentials.tiktok}
              type="text"
              placeholder="TikTok (username)"
              onChange={(e) => handleChange("tiktok", e.target.value)}
              style={inputStyle}
            />
            <input
              value={credentials.snap}
              type="text"
              placeholder="Snapchat (username)"
              onChange={(e) => handleChange("snap", e.target.value)}
              style={inputStyle}
            />
            <input
              value={credentials.instagram}
              type="text"
              placeholder="Instagram (username)"
              onChange={(e) => handleChange("instagram", e.target.value)}
              style={inputStyle}
            />
            <input
              value={credentials.whatsappFan}
              type="text"
              placeholder="WhatsApp fan link"
              onChange={(e) => handleChange("whatsappFan", e.target.value)}
              style={inputStyle}
            />
            <button type="submit" className="btn-blue" style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Inscription..." : "Créer un compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
