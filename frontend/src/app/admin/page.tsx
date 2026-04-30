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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", zIndex: 40 }}
        />
      )}

      <aside style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: 260,
        maxWidth: "100%",
        background: "#fff",
        borderRight: "1px solid rgba(229,231,235,1)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 22,
        zIndex: 50,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-120%)",
        transition: "transform 0.2s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(59,130,246,0.12)", display: "grid", placeItems: "center" }}>
              <LayoutDashboard size={18} color="#2563EB" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Meta Miss</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Panneau admin</div>
            </div>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8" }}>
            <XCircle size={20} />
          </button>
        </div>

        <nav style={{ display: "grid", gap: 6 }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => { setTab(item.key); setSidebarOpen(false); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 14px",
                borderRadius: 18,
                border: "1px solid transparent",
                background: tab === item.key ? "rgba(59,130,246,0.08)" : "transparent",
                color: tab === item.key ? "#2563EB" : "#475569",
                fontWeight: tab === item.key ? 700 : 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <item.Icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ display: "grid", gap: 10 }}>
          <Link href="/" className="admin-sidebar-link">Retour site</Link>
          <button type="button" className="admin-sidebar-link danger" onClick={() => { logout(); router.push("/"); }}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ padding: "20px 18px 36px", marginLeft: 0, minHeight: "100vh", background: "#F8FAFF" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid rgba(226,232,240,1)", background: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
              {tab === "overview" ? "Tableau de bord" : tab === "candidates" ? "Candidats" : tab === "payments" ? "Paiements" : tab === "contests" ? "Concours" : "Utilisateurs"}
            </div>
            <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 14 }}>
              {tab === "overview" ? "Vue générale du concours" : tab === "candidates" ? "Validez, modifiez ou supprimez les candidatures" : tab === "payments" ? "Suivez les transactions" : tab === "contests" ? "Gestion des concours" : "Liste des utilisateurs"}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(226,232,240,1)", background: "#fff", color: "#0F172A", cursor: "pointer", fontWeight: 600 }}
          >
            Rafraîchir
          </button>
        </div>

        {loading ? (
          <div style={{ minHeight: 240, display: "grid", placeItems: "center" }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat( auto-fit, minmax(220px, 1fr) )", gap: 16 }}>
                {statCards.map((card) => (
                  <div key={card.label} style={{ padding: 18, borderRadius: 24, background: "#fff", border: "1px solid rgba(229,231,235,1)" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 12, background: "rgba(59,130,246,0.14)", marginBottom: 14, color: card.accent }}>
                      <card.Icon size={18} />
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{card.val}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "#64748B" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "candidates" && (
              <section style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Liste des candidatures</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: "#64748B" }}>{candidates.length} candidats enregistrés</div>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {candidates.map((c) => {
                    const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
                    return (
                      <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, borderRadius: 22, background: "#fff", border: "1px solid rgba(229,231,235,1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 18, overflow: "hidden", background: "#EFF6FF", position: "relative" }}>
                            <Image src={photo} alt={c.name} fill style={{ objectFit: "cover" }} onError={(e: any) => { e.target.style.display = "none"; }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                            <div style={{ marginTop: 4, fontSize: 13, color: "#64748B" }}>{c.city} · {c.totalVotes} votes</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(59,130,246,0.08)", color: "#2563EB", fontSize: 12, fontWeight: 700 }}>{c.type}</span>
                          <span className={getStatusClass(c.status)} style={{ fontSize: 12 }}>{c.status}</span>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {tab === "payments" && (
              <section style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Transactions</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: "#64748B" }}>{payments.length} paiements</div>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {payments.map((p) => (
                    <div key={p.id} style={{ padding: 18, borderRadius: 22, background: "#fff", border: "1px solid rgba(229,231,235,1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{p.user?.name}</div>
                          <div style={{ marginTop: 2, fontSize: 13, color: "#64748B" }}>{p.user?.email}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#2563EB" }}>{p.amount?.toLocaleString("fr-FR")} FCFA</div>
                          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{p.votesCount} votes</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, color: "#475569", fontSize: 12 }}>
                        <span>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                        <span className={getPaymentStatusClass(p.status)}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tab === "contests" && (
              <section style={{ padding: 20, borderRadius: 24, background: "#fff", border: "1px solid rgba(229,231,235,1)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Concours</div>
                <p style={{ marginTop: 10, color: "#64748B", fontSize: 14 }}>Gestion des concours à venir. Vous pouvez ouvrir ou fermer un concours et suivre les dates.</p>
              </section>
            )}

            {tab === "users" && (
              <section style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Utilisateurs</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "#64748B" }}>{users.length} comptes enregistrés</div>
                </div>
                {users.map((u) => (
                  <div key={u.id} style={{ padding: 18, borderRadius: 22, background: "#fff", border: "1px solid rgba(229,231,235,1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{u.name}</div>
                        <div style={{ marginTop: 3, fontSize: 13, color: "#64748B" }}>{u.email}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span className="status-pill status-pill-blue" style={{ fontSize: 12 }}>{u.role}</span>
                        <span style={{ fontSize: 12, color: "#64748B" }}>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
