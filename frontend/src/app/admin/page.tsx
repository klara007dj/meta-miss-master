"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { LayoutDashboard, Users, CreditCard, Trophy, User, LogOut, CheckCircle2, XCircle, Trash2, Edit3, type LucideIcon } from "lucide-react";

type Tab = "overview" | "candidates" | "payments" | "contests" | "users";

type NavItem = { key: Tab; Icon: LucideIcon; label: string };
type StatCard = { Icon: LucideIcon; val: string | number; label: string; accent: string };

export default function AdminPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [editValues, setEditValues] = useState({ name: "", city: "", age: "", bio: "", type: "MISS", status: "PENDING" });
  const [saving, setSaving] = useState(false);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/xhrisadmin");
      return;
    }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c, p, u] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/candidates?limit=50"),
        api.get("/admin/payments?limit=50"),
        api.get("/admin/users?limit=50"),
      ]);
      setStats(s.data.data);
      setCandidates(c.data.data.candidates || []);
      setPayments(p.data.data.payments || []);
      setUsers(u.data.data.users || []);
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

  const openEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setEditValues({
      name: candidate.name || "",
      city: candidate.city || "",
      age: String(candidate.age || ""),
      bio: candidate.bio || "",
      type: candidate.type || "MISS",
      status: candidate.status || "PENDING",
    });
  };

  const saveCandidate = async () => {
    if (!editingCandidate) return;
    setSaving(true);
    try {
      await api.patch(`/admin/candidates/${editingCandidate.id}`, {
        name: editValues.name,
        city: editValues.city,
        age: Number(editValues.age),
        bio: editValues.bio,
        type: editValues.type,
        status: editValues.status,
      });
      toast.success("Candidat mis à jour");
      setEditingCandidate(null);
      load();
    } catch {
      toast.error("Erreur de mise à jour");
    }
    setSaving(false);
  };

  const navItems: NavItem[] = [
    { key: "overview", Icon: LayoutDashboard, label: "Tableau de bord" },
    { key: "candidates", Icon: Users, label: "Candidats" },
    { key: "payments", Icon: CreditCard, label: "Paiements" },
    { key: "contests", Icon: Trophy, label: "Concours" },
    { key: "users", Icon: User, label: "Utilisateurs" },
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
    <div className="admin-page admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <LayoutDashboard size={20} />
          <div>
            <div className="admin-sidebar-label">Meta Miss</div>
            <div className="admin-sidebar-subtitle">Admin</div>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={tab === item.key ? "admin-sidebar-item active" : "admin-sidebar-item"}
              onClick={() => setTab(item.key)}
            >
              <item.Icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-sidebar-link">Retour site</Link>
          <button type="button" className="admin-sidebar-link danger" onClick={() => { logout(); router.push("/"); }}>Déconnexion</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-title">{tab === "overview" ? "Tableau de bord" : tab === "candidates" ? "Candidats" : tab === "payments" ? "Paiements" : tab === "contests" ? "Concours" : "Utilisateurs"}</h1>
            <p className="admin-subtitle">{tab === "overview" ? "Vue générale du concours" : tab === "candidates" ? "Validez, modifiez ou supprimez les candidatures" : tab === "payments" ? "Suivez les transactions" : tab === "contests" ? "Gestion des concours" : "Liste des utilisateurs"}.</p>
          </div>
          <button type="button" className="btn-outline" onClick={() => load()}>Rafraîchir</button>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="spinner" /></div>
        ) : (
          <>
            {tab === "overview" && (
              <div className="admin-stat-grid">
                {statCards.map((card) => (
                  <div key={card.label} className="admin-card admin-stat-card">
                    <div className="admin-stat-icon" style={{ color: card.accent }}><card.Icon size={18} /></div>
                    <div className="admin-stat-value">{card.val}</div>
                    <div className="admin-stat-label">{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "candidates" && (
              <section className="admin-card admin-section">
                <div className="admin-card-head">
                  <div>
                    <h2>Liste des candidatures</h2>
                    <p className="admin-card-text">{candidates.length} candidats enregistrés</p>
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
                          <div className="admin-avatar"><Image src={photo} alt={c.name} fill style={{ objectFit: "cover" }} onError={(e: any) => { e.target.src = "/placeholder.jpg"; }} /></div>
                          <div>
                            <div className="admin-row-name">{c.name}</div>
                            <div className="admin-row-meta">{c.city} · {c.totalVotes} votes</div>
                          </div>
                        </div>
                        <span className={getTypeClass(c.type)}>{c.type}</span>
                        <span className={getStatusClass(c.status)}>{c.status}</span>
                        <div className="admin-actions-row">
                          <button type="button" className="btn-icon btn-icon-secondary" onClick={() => openEdit(c)}><Edit3 size={16} /></button>
                          {c.status === "PENDING" && (
                            <>
                              <button type="button" className="btn-icon btn-icon-success" onClick={() => approve(c.id)}><CheckCircle2 size={16} /></button>
                              <button type="button" className="btn-icon btn-icon-danger" onClick={() => reject(c.id)}><XCircle size={16} /></button>
                            </>
                          )}
                          <button type="button" className="btn-icon btn-icon-danger" onClick={() => del(c.id)}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {tab === "payments" && (
              <section className="admin-card admin-section">
                <div className="admin-card-head">
                  <div>
                    <h2>Transactions</h2>
                    <p className="admin-card-text">{payments.length} paiements</p>
                  </div>
                </div>
                <div className="admin-table">
                  <div className="admin-row admin-row-head">
                    <span>Utilisateur</span>
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

            {tab === "contests" && (
              <section className="admin-card admin-section">
                <div className="admin-card-head">
                  <div>
                    <h2>Concours</h2>
                    <p className="admin-card-text">Fonctions de gestion des concours.</p>
                  </div>
                </div>
                <div style={{ padding: "16px", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "16px" }}>
                  <p>Gestion des concours à venir. Vous pouvez ouvrir ou fermer un concours et suivre les dates.</p>
                </div>
              </section>
            )}

            {tab === "users" && (
              <section className="admin-card admin-section">
                <div className="admin-card-head">
                  <div>
                    <h2>Utilisateurs</h2>
                    <p className="admin-card-text">{users.length} comptes enregistrés</p>
                  </div>
                </div>
                <div className="admin-table">
                  <div className="admin-row admin-row-head">
                    <span>Nom</span>
                    <span>Email</span>
                    <span>Rôle</span>
                    <span>Inscrit le</span>
                  </div>
                  {users.map((u) => (
                    <div key={u.id} className="admin-row">
                      <div>
                        <div className="admin-row-name">{u.name}</div>
                        <div className="admin-row-meta">{u.phone || "-"}</div>
                      </div>
                      <div>{u.email}</div>
                      <div className="status-pill status-pill-blue">{u.role}</div>
                      <div className="admin-row-meta">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {editingCandidate && (
        <div className="modal-backdrop" onClick={() => setEditingCandidate(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Modifier la candidature</h3>
                <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>ID {editingCandidate.id}</p>
              </div>
              <button type="button" onClick={() => setEditingCandidate(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}>×</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} placeholder="Nom" className="admin-input" />
              <input type="text" value={editValues.city} onChange={(e) => setEditValues({ ...editValues, city: e.target.value })} placeholder="Ville" className="admin-input" />
              <input type="number" value={editValues.age} onChange={(e) => setEditValues({ ...editValues, age: e.target.value })} placeholder="Âge" className="admin-input" />
              <textarea value={editValues.bio} onChange={(e) => setEditValues({ ...editValues, bio: e.target.value })} placeholder="Bio" className="admin-input" rows={4} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <select value={editValues.type} onChange={(e) => setEditValues({ ...editValues, type: e.target.value })} className="admin-input">
                  <option value="MISS">MISS</option>
                  <option value="MASTER">MASTER</option>
                </select>
                <select value={editValues.status} onChange={(e) => setEditValues({ ...editValues, status: e.target.value })} className="admin-input">
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <button type="button" className="btn-blue" onClick={saveCandidate} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
