"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { LayoutDashboard, Users, CreditCard, LogOut, CheckCircle2, XCircle, Trash2, type LucideIcon } from "lucide-react";

type Tab = "overview" | "candidates" | "payments";

type NavItem = { key: Tab; Icon: LucideIcon; label: string };

type StatCard = { Icon: LucideIcon; val: string | number; label: string; accent: string };

export default function AdminPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") { router.push("/xhrisadmin"); return; }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c, p] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/candidates?limit=50"),
        api.get("/admin/payments?limit=50"),
      ]);
      setStats(s.data.data);
      setCandidates(c.data.data.candidates || []);
      setPayments(p.data.data.payments || []);
    } catch {
      toast.error("Erreur chargement");
    }
    setLoading(false);
  };

  const approve = async (id: string) => {
    try {
      await api.patch(`/admin/candidates/${id}/approve`);
      toast.success("Approuvé");
      load();
    } catch {
      toast.error("Erreur");
    }
  };

  const reject = async (id: string) => {
    try {
      await api.patch(`/admin/candidates/${id}/reject`);
      toast.success("Rejeté");
      load();
    } catch {
      toast.error("Erreur");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    try {
      await api.delete(`/admin/candidates/${id}`);
      toast.success("Supprimé");
      load();
    } catch {
      toast.error("Erreur");
    }
  };

  const navItems: NavItem[] = [
    { key: "overview", Icon: LayoutDashboard, label: "Tableau de bord" },
    { key: "candidates", Icon: Users, label: "Candidats" },
    { key: "payments", Icon: CreditCard, label: "Paiements" },
  ];

  const statCards: StatCard[] = stats ? [
    { Icon: Users, val: stats.totalUsers, label: "Utilisateurs", accent: "var(--blue)" },
    { Icon: CheckCircle2, val: stats.totalVotes?.toLocaleString("fr-FR"), label: "Votes validés", accent: "#10B981" },
    { Icon: XCircle, val: stats.pendingCandidates, label: "Candidats en attente", accent: "#F59E0B" },
    { Icon: CreditCard, val: stats.completedPayments, label: "Paiements complétés", accent: "#2563EB" },
    { Icon: LayoutDashboard, val: stats.totalCandidates, label: "Candidats approuvés", accent: "var(--blue)" },
    { Icon: Users, val: (stats.revenue || 0).toLocaleString("fr-FR") + " FCFA", label: "Revenus", accent: "#10B981" },
  ] : [];

  const getTypeClass = (type: string) => type === "MISS" ? "status-pill status-pill-pink" : "status-pill status-pill-blue";
  const getStatusClass = (status: string) => status === "APPROVED" ? "status-pill status-pill-green" : status === "PENDING" ? "status-pill status-pill-amber" : "status-pill status-pill-red";
  const getPaymentStatusClass = (status: string) => status === "COMPLETED" ? "status-pill status-pill-green" : status === "PENDING" ? "status-pill status-pill-amber" : "status-pill status-pill-red";

  return (
    <div className="admin-page">
      <div className="admin-panel">
        <header className="admin-header">
          <div>
            <div className="admin-eyebrow">Panel admin</div>
            <h1 className="admin-title">Tableau de bord</h1>
            <p className="admin-subtitle">Gérez les candidats, paiements et statistiques dans le même thème propre et moderne.</p>
          </div>
          <div className="admin-header-actions">
            <Link href="/" className="btn-outline">Voir le site</Link>
            <button type="button" className="btn-blue" onClick={() => { logout(); router.push("/"); }}>
              <LogOut size={16} style={{ marginRight: 8 }} /> Déconnexion
            </button>
          </div>
        </header>

        <div className="admin-tabs">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={tab === item.key ? "admin-tab active" : "admin-tab"}
              onClick={() => setTab(item.key)}
            >
              <item.Icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <div className="admin-stat-grid">
                {statCards.map((card) => (
                  <div key={card.label} className="admin-card admin-stat-card">
                    <div className="admin-stat-icon" style={{ color: card.accent }}>
                      <card.Icon size={18} />
                    </div>
                    <div className="admin-stat-value">{card.val}</div>
                    <div className="admin-stat-label">{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "candidates" && (
              <section className="admin-card">
                <div className="admin-card-head">
                  <div>
                    <h2>Gestion des candidats</h2>
                    <p className="admin-card-text">{candidates.length} candidats au total</p>
                  </div>
                </div>
                <div className="admin-table">
                  <div className="admin-row admin-row-head">
                    <span>Profil</span>
                    <span>Type</span>
                    <span>Statut</span>
                    <span>Actions</span>
                  </div>
                  {candidates.map((c) => {
                    const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
                    return (
                      <div key={c.id} className="admin-row">
                        <div className="admin-row-profile">
                          <div className="admin-avatar">
                            <Image src={photo} alt={c.name} fill style={{ objectFit: "cover" }} onError={(e: any) => { e.target.src = "/placeholder.jpg"; }} />
                          </div>
                          <div>
                            <div className="admin-row-name">{c.name}</div>
                            <div className="admin-row-meta">{c.city} · {c.totalVotes} votes</div>
                          </div>
                        </div>
                        <span className={getTypeClass(c.type)}>{c.type}</span>
                        <span className={getStatusClass(c.status)}>{c.status}</span>
                        <div className="admin-actions-row">
                          {c.status === "PENDING" && (
                            <>
                              <button type="button" className="btn-icon btn-icon-success" onClick={() => approve(c.id)}>
                                <CheckCircle2 size={16} />
                              </button>
                              <button type="button" className="btn-icon btn-icon-danger" onClick={() => reject(c.id)}>
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button type="button" className="btn-icon btn-icon-danger" onClick={() => del(c.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {tab === "payments" && (
              <section className="admin-card">
                <div className="admin-card-head">
                  <div>
                    <h2>Paiements</h2>
                    <p className="admin-card-text">{payments.length} transactions</p>
                  </div>
                </div>
                <div className="admin-table">
                  <div className="admin-row admin-row-head">
                    <span>Dossier</span>
                    <span>Montant</span>
                    <span>Votes</span>
                    <span>Statut</span>
                    <span>Date</span>
                  </div>
                  {payments.map((p) => (
                    <div key={p.id} className="admin-row">
                      <div>
                        <div className="admin-row-name">{p.user?.name}</div>
                        <div className="admin-row-meta">{p.user?.email}</div>
                      </div>
                      <div className="admin-amount">{p.amount?.toLocaleString("fr-FR")} FCFA</div>
                      <div className="admin-row-meta">{p.votesCount} votes</div>
                      <span className={getPaymentStatusClass(p.status)}>{p.status}</span>
                      <div className="admin-row-meta">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
