"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Users, CreditCard, Trophy, User, LogOut,
  CheckCircle2, XCircle, Trash2, Edit3, Plus, Camera, type LucideIcon
} from "lucide-react";

type Tab = "overview" | "candidates" | "payments" | "contests" | "users";
type NavItem = { key: Tab; Icon: LucideIcon; label: string };
type StatCard = { Icon: LucideIcon; val: string | number; label: string; color: string };

const EMPTY_EDIT = { name: "", city: "", age: "", bio: "", type: "MISS", status: "PENDING", instagram: "", tiktok: "", snap: "", whatsappFan: "", phone: "" };

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
  const [isCreating, setIsCreating] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<any>(null);
  const [editValues, setEditValues] = useState({ ...EMPTY_EDIT });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ─── Contest state ──────────────────────────────────────────────────────────
  const [contests, setContests] = useState<any[]>([]);
  const [contestLoading, setContestLoading] = useState(false);
  const [showCreateContest, setShowCreateContest] = useState(false);
  const [newContest, setNewContest] = useState({ name: "", startDate: "", endDate: "" });
  const [contestSaving, setContestSaving] = useState(false);
  const [editingContest, setEditingContest] = useState<any>(null);
  const [editContestValues, setEditContestValues] = useState({ name: "", startDate: "", endDate: "" });
  const [editContestSaving, setEditContestSaving] = useState(false);
  // ─── User state ─────────────────────────────────────────────────────────────
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserValues, setEditUserValues] = useState({ name: "", email: "", role: "" });
  const [editUserSaving, setEditUserSaving] = useState(false);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") { router.push("/xhrisadmin"); return; }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c, p, u] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/candidates?limit=100"),
        api.get("/admin/payments?limit=50"),
        api.get("/admin/users?limit=50"),
      ]);
      setStats(s.data.data);
      setCandidates(c.data.data.candidates || []);
      setPayments(p.data.data.payments || []);
      setUsers(u.data.data.users || []);
      // Charger les contests séparément (pas bloquant)
      try {
        const ct = await api.get("/admin/contests");
        setContests(ct.data.data || []);
      } catch { setContests([]); }
    } catch { toast.error("Erreur chargement"); }
    setLoading(false);
  };

  const approve = async (id: string) => { try { await api.patch(`/admin/candidates/${id}/approve`); toast.success("Approuvé ✓"); load(); } catch { toast.error("Erreur"); } };
  const reject = async (id: string) => { try { await api.patch(`/admin/candidates/${id}/reject`); toast.success("Rejeté"); load(); } catch { toast.error("Erreur"); } };
  const del = async (id: string) => { if (!confirm("Supprimer définitivement ?")) return; try { await api.delete(`/admin/candidates/${id}`); toast.success("Supprimé"); load(); } catch { toast.error("Erreur"); } };

  const openEdit = (candidate: any) => {
    setIsCreating(false);
    setEditingCandidate(candidate);
    setEditValues({
      name: candidate.name || "", city: candidate.city || "",
      age: String(candidate.age || ""), bio: candidate.bio || "",
      type: candidate.type || "MISS", status: candidate.status || "PENDING",
      instagram: candidate.instagram || "", tiktok: candidate.tiktok || "",
      snap: candidate.snap || "", whatsappFan: candidate.whatsappFan || "",
      phone: candidate.phone || "",
    });
    setPhotoFile(null);
    setPhotoPreview(candidate.photoUrl?.startsWith("http") ? candidate.photoUrl : `${apiBase}${candidate.photoUrl}`);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditingCandidate({});
    setEditValues({ ...EMPTY_EDIT });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const saveCandidate = async () => {
    if (isCreating && !photoFile) { toast.error("Photo obligatoire"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editValues).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photoFile) fd.append("photo", photoFile);

      if (isCreating) {
        await api.post("/admin/candidates", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Candidat ajouté ✓");
      } else {
        await api.patch(`/admin/candidates/${editingCandidate.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Mis à jour ✓");
      }
      setEditingCandidate(null);
      load();
    } catch { toast.error("Erreur d'enregistrement"); }
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
    { Icon: Users, val: stats.totalUsers, label: "Utilisateurs", color: "#6366F1" },
    { Icon: CheckCircle2, val: stats.totalVotes?.toLocaleString("fr-FR"), label: "Votes validés", color: "#10B981" },
    { Icon: XCircle, val: stats.pendingCandidates, label: "En attente", color: "#F59E0B" },
    { Icon: CreditCard, val: stats.completedPayments, label: "Paiements", color: "#2563EB" },
    { Icon: LayoutDashboard, val: stats.totalCandidates, label: "Candidats approuvés", color: "#8B5CF6" },
    { Icon: Users, val: (stats.revenue || 0).toLocaleString("fr-FR") + " FCFA", label: "Revenus", color: "#10B981" },
  ] : [];

  const getStatusPill = (s: string) => {
    const map: Record<string, string> = { APPROVED: "#10B981", PENDING: "#F59E0B", REJECTED: "#EF4444" };
    return { background: map[s] ? map[s] + "18" : "#64748B18", color: map[s] || "#64748B", border: `1px solid ${map[s] || "#64748B"}30` };
  };

  // ─── Sidebar content ───────────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 4px" }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "grid", placeItems: "center" }}>
          <LayoutDashboard size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>Meta Miss</div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Panneau admin</div>
        </div>
      </div>

      <nav style={{ display: "grid", gap: 4, marginTop: 8 }}>
        {navItems.map(({ key, Icon, label }) => (
          <button key={key} type="button" onClick={() => { setTab(key); setSidebarOpen(false); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 14, border: "none", cursor: "pointer",
              background: tab === key ? "linear-gradient(135deg,#6366F118,#8B5CF618)" : "transparent",
              color: tab === key ? "#6366F1" : "#64748B",
              fontWeight: tab === key ? 700 : 500, fontSize: 14,
              borderLeft: tab === key ? "3px solid #6366F1" : "3px solid transparent",
              textAlign: "left",
            }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: "auto", display: "grid", gap: 8 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, background: "#F8FAFF", color: "#64748B", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
          ← Retour au site
        </Link>
        <button type="button" onClick={() => { logout(); router.push("/"); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, background: "#FEF2F2", color: "#EF4444", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" }}>
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFF", fontFamily: "system-ui, sans-serif" }}>

      {/* ─── Desktop sidebar (always visible on md+) ────────────────────────── */}
      <aside style={{
        display: "none", flexDirection: "column", gap: 16,
        position: "fixed", top: 0, left: 0, bottom: 0, width: 260,
        background: "#fff", borderRight: "1px solid #E2E8F0",
        padding: "28px 18px", zIndex: 50,
        // Show on desktop via media query — we use a style tag workaround below
      }} className="admin-desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* ─── Mobile sidebar overlay ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 60, backdropFilter: "blur(4px)" }} />
      )}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 270,
        background: "#fff", borderRight: "1px solid #E2E8F0",
        padding: "28px 18px", zIndex: 70, display: "flex", flexDirection: "column", gap: 16,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .25s ease",
      }} className="admin-mobile-sidebar">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -8 }}>
          <button onClick={() => setSidebarOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", padding: 4 }}>
            <XCircle size={20} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ─── Main content ────────────────────────────────────────────────────── */}
      <main className="admin-main-content" style={{ flex: 1, minHeight: "100vh", padding: "24px 20px 40px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button type="button" onClick={() => setSidebarOpen(true)}
            className="admin-menu-btn"
            style={{ width: 44, height: 44, borderRadius: 14, border: "1.5px solid #E2E8F0", background: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
              {tab === "overview" ? "Tableau de bord" : tab === "candidates" ? "Candidats" : tab === "payments" ? "Paiements" : tab === "contests" ? "Concours" : "Utilisateurs"}
            </h1>
            <p style={{ margin: "3px 0 0", color: "#94A3B8", fontSize: 13 }}>
              {tab === "candidates" ? `${candidates.length} candidats enregistrés` : "Panneau d'administration"}
            </p>
          </div>
          {tab === "candidates" && (
            <button type="button" onClick={openCreate}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 14, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 20px #6366F130" }}>
              <Plus size={16} /> Ajouter
            </button>
          )}
          <button type="button" onClick={load}
            style={{ padding: "10px 16px", borderRadius: 14, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            ↺
          </button>
        </div>

        {loading ? (
          <div style={{ minHeight: 300, display: "grid", placeItems: "center" }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* ─── Overview ────────────────────────────────────────────────── */}
            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {statCards.map((card) => (
                  <div key={card.label} style={{ padding: 22, borderRadius: 20, background: "#fff", border: "1px solid #E2E8F0", transition: "box-shadow .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(0,0,0,.08)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: card.color + "18", display: "grid", placeItems: "center", marginBottom: 16 }}>
                      <card.Icon size={20} color={card.color} />
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: "#0F172A" }}>{card.val}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "#94A3B8" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Candidates ──────────────────────────────────────────────── */}
            {tab === "candidates" && (
              <div style={{ display: "grid", gap: 12 }}>
                {candidates.map((c) => {
                  const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
                  return (
                    <div key={c.id} style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <div onClick={() => setViewingCandidate(c)} style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, cursor: "pointer" }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, overflow: "hidden", background: "#EFF6FF", position: "relative", flexShrink: 0 }}>
                          <Image src={photo} alt={c.name} fill style={{ objectFit: "cover" }} onError={(e: any) => { e.target.style.display = "none"; }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                          <div style={{ marginTop: 3, fontSize: 12, color: "#94A3B8" }}>{c.city} · {c.totalVotes} votes</div>
                          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 100, background: c.type === "MISS" ? "#EC489918" : "#6366F118", color: c.type === "MISS" ? "#EC4899" : "#6366F1", fontSize: 11, fontWeight: 700 }}>{c.type}</span>
                            <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, ...getStatusPill(c.status) }}>{c.status}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button type="button" onClick={() => openEdit(c)} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
                          <Edit3 size={15} color="#6366F1" />
                        </button>
                        {c.status === "PENDING" && (
                          <>
                            <button type="button" onClick={() => approve(c.id)} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #10B98130", background: "#10B98110", display: "grid", placeItems: "center", cursor: "pointer" }}>
                              <CheckCircle2 size={15} color="#10B981" />
                            </button>
                            <button type="button" onClick={() => reject(c.id)} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #F59E0B30", background: "#F59E0B10", display: "grid", placeItems: "center", cursor: "pointer" }}>
                              <XCircle size={15} color="#F59E0B" />
                            </button>
                          </>
                        )}
                        <button type="button" onClick={() => del(c.id)} style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #EF444430", background: "#EF444410", display: "grid", placeItems: "center", cursor: "pointer" }}>
                          <Trash2 size={15} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Payments ────────────────────────────────────────────────── */}
            {tab === "payments" && (
              <div style={{ display: "grid", gap: 12 }}>
                {payments.map((p) => (
                  <div key={p.id} style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{p.user?.name}</div>
                        <div style={{ marginTop: 2, fontSize: 13, color: "#94A3B8" }}>{p.user?.email}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "#6366F1", fontSize: 15 }}>{p.amount?.toLocaleString("fr-FR")} FCFA</div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{p.votesCount} votes</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12, color: "#64748B" }}>
                      <span>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontWeight: 700, ...getStatusPill(p.status) }}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Contests ────────────────────────────────────────────────── */}
            {tab === "contests" && (
              <div style={{ display: "grid", gap: 16 }}>

                {/* Header + bouton créer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 16 }}>Concours</div>
                    <div style={{ color: "#94A3B8", fontSize: 13, marginTop: 2 }}>{contests.length} concours enregistré{contests.length > 1 ? "s" : ""}</div>
                  </div>
                  <button type="button" onClick={() => setShowCreateContest(true)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 14, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 20px #6366F130" }}>
                    <Plus size={16} /> Nouveau concours
                  </button>
                </div>

                {/* Liste des concours */}
                {contestLoading ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Chargement...</div>
                ) : contests.length === 0 ? (
                  <div style={{ background: "#fff", borderRadius: 20, border: "2px dashed #E2E8F0", padding: "48px 24px", textAlign: "center" }}>
                    <Trophy size={40} color="#CBD5E1" style={{ margin: "0 auto 16px" }} />
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 15 }}>Aucun concours créé</div>
                    <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 8 }}>Créez votre premier concours pour activer les votes.</p>
                    <button type="button" onClick={() => setShowCreateContest(true)}
                      style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                      + Créer un concours
                    </button>
                  </div>
                ) : (
                  contests.map((ct: any) => {
                    const isOpen = ct.status === "OPEN";
                    return (
                      <div key={ct.id} style={{ background: "#fff", borderRadius: 20, border: `1.5px solid ${isOpen ? "#10B98130" : "#E2E8F0"}`, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
                        {isOpen && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10B981,#34D399)" }} />}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 16 }}>{ct.name}</div>
                              <span style={{ padding: "3px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: isOpen ? "#10B98118" : "#64748B18", color: isOpen ? "#10B981" : "#64748B", border: `1px solid ${isOpen ? "#10B98130" : "#64748B30"}` }}>
                                {isOpen ? "● OUVERT" : "● FERMÉ"}
                              </span>
                            </div>
                            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 16 }}>
                              <div style={{ fontSize: 13 }}>
                                <span style={{ color: "#94A3B8" }}>Début : </span>
                                <span style={{ fontWeight: 600, color: "#0F172A" }}>{ct.startDate ? new Date(ct.startDate).toLocaleDateString("fr-FR") : "—"}</span>
                              </div>
                              <div style={{ fontSize: 13 }}>
                                <span style={{ color: "#94A3B8" }}>Fin : </span>
                                <span style={{ fontWeight: 600, color: "#0F172A" }}>{ct.endDate ? new Date(ct.endDate).toLocaleDateString("fr-FR") : "Indéfinie"}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                            <button type="button" title="Modifier"
                              onClick={() => {
                                setEditingContest(ct);
                                setEditContestValues({
                                  name: ct.name,
                                  startDate: ct.startDate ? new Date(ct.startDate).toISOString().split("T")[0] : "",
                                  endDate: ct.endDate ? new Date(ct.endDate).toISOString().split("T")[0] : "",
                                });
                              }}
                              style={{ padding: "9px 14px", borderRadius: 12, border: "1.5px solid #6366F130", background: "#6366F110", color: "#6366F1", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                              ✏️ Modifier
                            </button>
                            {isOpen ? (
                              <button type="button"
                                onClick={async () => {
                                  if (!confirm("Fermer ce concours ? Les votes seront désactivés.")) return;
                                  try {
                                    await api.patch(`/admin/contest/${ct.id}/close`);
                                    toast.success("Concours fermé");
                                    const res = await api.get("/admin/contests");
                                    setContests(res.data.data || []);
                                  } catch { toast.error("Erreur"); }
                                }}
                                style={{ padding: "9px 14px", borderRadius: 12, border: "1.5px solid #EF444430", background: "#EF444410", color: "#EF4444", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                                Fermer
                              </button>
                            ) : (
                              <button type="button"
                                onClick={async () => {
                                  try {
                                    await api.patch(`/admin/contest/${ct.id}/open`);
                                    toast.success("Concours ouvert ✓");
                                    const res = await api.get("/admin/contests");
                                    setContests(res.data.data || []);
                                  } catch { toast.error("Erreur"); }
                                }}
                                style={{ padding: "9px 14px", borderRadius: 12, border: "1.5px solid #10B98130", background: "#10B98110", color: "#10B981", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                                Ouvrir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ─── Users ───────────────────────────────────────────────────── */}
            {tab === "users" && (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 16 }}>
                  Utilisateurs <span style={{ color: "#94A3B8", fontWeight: 400 }}>({users.length})</span>
                </div>
                {users.map((u) => (
                  <div key={u.id} style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{u.name}</div>
                        <div style={{ marginTop: 2, fontSize: 13, color: "#94A3B8" }}>{u.email}</div>
                        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ padding: "2px 10px", borderRadius: 100, background: u.role === "ADMIN" ? "#EF444418" : "#6366F118", color: u.role === "ADMIN" ? "#EF4444" : "#6366F1", fontSize: 11, fontWeight: 700 }}>{u.role}</span>
                          <span style={{ fontSize: 12, color: "#94A3B8" }}>Inscrit le {new Date(u.createdAt).toLocaleDateString("fr-FR")}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB" }}>🗳 {u.totalVotes ?? u._count?.votes ?? 0} votes</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" title="Modifier"
                          onClick={() => { setEditingUser(u); setEditUserValues({ name: u.name || "", email: u.email || "", role: u.role || "USER" }); }}
                          style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFF", cursor: "pointer", display: "grid", placeItems: "center" }}>
                          <Edit3 size={15} color="#6366F1" />
                        </button>
                        <button type="button" title="Supprimer"
                          onClick={async () => {
                            if (!confirm(`Supprimer ${u.name} ? Cette action est irréversible.`)) return;
                            try {
                              await api.delete(`/admin/users/${u.id}`);
                              toast.success("Utilisateur supprimé");
                              const res = await api.get("/admin/users?limit=50");
                              setUsers(res.data.data.users || []);
                            } catch { toast.error("Erreur lors de la suppression"); }
                          }}
                          style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", display: "grid", placeItems: "center" }}>
                          <Trash2 size={15} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── View modal ──────────────────────────────────────────────────────── */}
      {viewingCandidate && (
        <div className="modal-backdrop" onClick={() => setViewingCandidate(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Fiche candidat</h3>
              <button onClick={() => setViewingCandidate(null)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "1.4rem", color: "#94A3B8", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ width: "100%", height: 200, borderRadius: 16, overflow: "hidden", background: "#EFF6FF", marginBottom: 16, position: "relative" }}>
              <Image src={viewingCandidate.photoUrl?.startsWith("http") ? viewingCandidate.photoUrl : `${apiBase}${viewingCandidate.photoUrl}`}
                alt={viewingCandidate.name} fill style={{ objectFit: "cover" }} onError={(e: any) => { e.target.style.display = "none"; }} />
            </div>
            {[
              { label: "Nom", value: viewingCandidate.name },
              { label: "Type", value: viewingCandidate.type },
              { label: "Statut", value: viewingCandidate.status },
              { label: "Âge", value: viewingCandidate.age + " ans" },
              { label: "Ville", value: viewingCandidate.city },
              { label: "Votes", value: viewingCandidate.totalVotes },
              { label: "Bio", value: viewingCandidate.bio || "—" },
              { label: "Instagram", value: viewingCandidate.instagram || "—" },
              { label: "TikTok", value: viewingCandidate.tiktok || "—" },
              { label: "Téléphone", value: viewingCandidate.phone || "—" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F5F9", fontSize: "0.83rem" }}>
                <span style={{ color: "#94A3B8", fontWeight: 500 }}>{row.label}</span>
                <span style={{ color: "#0F172A", fontWeight: 600, textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>{String(row.value)}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn-blue" style={{ flex: 1, fontSize: "0.82rem" }} onClick={() => { setViewingCandidate(null); openEdit(viewingCandidate); }}>
                ✏️ Modifier
              </button>
              {viewingCandidate.status === "PENDING" && (
                <button style={{ flex: 1, fontSize: "0.82rem", background: "#10B981", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", cursor: "pointer", fontWeight: 700 }}
                  onClick={() => { approve(viewingCandidate.id); setViewingCandidate(null); }}>
                  ✓ Approuver
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit / Create modal ─────────────────────────────────────────────── */}
      {editingCandidate !== null && (
        <div className="modal-backdrop" onClick={() => setEditingCandidate(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>{isCreating ? "Ajouter un candidat" : "Modifier la candidature"}</h3>
                {!isCreating && <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.8rem" }}>ID {editingCandidate.id}</p>}
              </div>
              <button type="button" onClick={() => setEditingCandidate(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", fontSize: "1.3rem" }}>×</button>
            </div>

            {/* Photo upload zone */}
            <div style={{ marginBottom: 18 }}>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              <div onClick={() => photoInputRef.current?.click()}
                style={{
                  width: "100%", height: 180, borderRadius: 16, overflow: "hidden", position: "relative",
                  background: photoPreview ? "transparent" : "#F8FAFF",
                  border: photoPreview ? "none" : "2px dashed #CBD5E1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "border-color .2s",
                }}>
                {photoPreview
                  ? <Image src={photoPreview} alt="preview" fill style={{ objectFit: "cover" }} />
                  : <div style={{ textAlign: "center", color: "#94A3B8" }}>
                    <Camera size={32} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Cliquer pour ajouter une photo</div>
                  </div>
                }
                {photoPreview && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = "1"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = "0"}>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Camera size={16} /> Changer la photo
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} placeholder="Nom complet *" className="admin-input" />
              <input type="text" value={editValues.city} onChange={(e) => setEditValues({ ...editValues, city: e.target.value })} placeholder="Ville *" className="admin-input" />
              <input type="number" value={editValues.age} onChange={(e) => setEditValues({ ...editValues, age: e.target.value })} placeholder="Âge (16-35) *" className="admin-input" />
              <textarea value={editValues.bio} onChange={(e) => setEditValues({ ...editValues, bio: e.target.value })} placeholder="Bio" className="admin-input" rows={3} style={{ resize: "vertical" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
              <input type="text" value={editValues.phone} onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })} placeholder="Téléphone" className="admin-input" />
              <input type="text" value={editValues.instagram} onChange={(e) => setEditValues({ ...editValues, instagram: e.target.value })} placeholder="Instagram (@...)" className="admin-input" />
              <input type="text" value={editValues.tiktok} onChange={(e) => setEditValues({ ...editValues, tiktok: e.target.value })} placeholder="TikTok (@...)" className="admin-input" />
              <input type="text" value={editValues.snap} onChange={(e) => setEditValues({ ...editValues, snap: e.target.value })} placeholder="Snapchat" className="admin-input" />
              <input type="text" value={editValues.whatsappFan} onChange={(e) => setEditValues({ ...editValues, whatsappFan: e.target.value })} placeholder="WhatsApp Fan" className="admin-input" />

              <button type="button" className="btn-blue" onClick={saveCandidate} disabled={saving}
                style={{ marginTop: 6, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", fontSize: "0.9rem", padding: "14px" }}>
                {saving ? "Enregistrement..." : isCreating ? "✓ Créer le candidat" : "✓ Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal modifier utilisateur ──────────────────────────────────────── */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Modifier l'utilisateur</h3>
                <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.8rem" }}>ID #{editingUser.id}</p>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", fontSize: "1.3rem" }}>×</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Nom</label>
                <input type="text" value={editUserValues.name} onChange={(e) => setEditUserValues({ ...editUserValues, name: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Email</label>
                <input type="email" value={editUserValues.email} onChange={(e) => setEditUserValues({ ...editUserValues, email: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Rôle</label>
                <select value={editUserValues.role} onChange={(e) => setEditUserValues({ ...editUserValues, role: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: 14, background: "#F8FAFF", outline: "none", cursor: "pointer" }}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#F8FAFF", border: "1px solid #E2E8F0", fontSize: 12, color: "#64748B" }}>
                🗳 Votes effectués : <strong>{editingUser.totalVotes ?? editingUser._count?.votes ?? 0}</strong>
              </div>
              <button type="button" className="btn-blue" disabled={editUserSaving}
                onClick={async () => {
                  setEditUserSaving(true);
                  try {
                    await api.patch(`/admin/users/${editingUser.id}`, editUserValues);
                    toast.success("Utilisateur mis à jour ✓");
                    setEditingUser(null);
                    const res = await api.get("/admin/users?limit=50");
                    setUsers(res.data.data.users || []);
                  } catch { toast.error("Erreur"); }
                  setEditUserSaving(false);
                }}
                style={{ marginTop: 4, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", fontSize: "0.9rem", padding: "14px" }}>
                {editUserSaving ? "Enregistrement..." : "✓ Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal modifier concours ──────────────────────────────────────────── */}
      {editingContest && (
        <div className="modal-backdrop" onClick={() => setEditingContest(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Modifier le concours</h3>
                <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.8rem" }}>{editingContest.name}</p>
              </div>
              <button type="button" onClick={() => setEditingContest(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", fontSize: "1.3rem" }}>×</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Nom du concours</label>
                <input type="text" value={editContestValues.name} onChange={(e) => setEditContestValues({ ...editContestValues, name: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Date de début</label>
                <input type="date" value={editContestValues.startDate} onChange={(e) => setEditContestValues({ ...editContestValues, startDate: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Date de fin <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optionnelle)</span></label>
                <input type="date" value={editContestValues.endDate} onChange={(e) => setEditContestValues({ ...editContestValues, endDate: e.target.value })} className="admin-input" />
                {editContestValues.endDate && (
                  <button type="button" onClick={() => setEditContestValues({ ...editContestValues, endDate: "" })}
                    style={{ marginTop: 4, fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>
                    × Supprimer la date de fin
                  </button>
                )}
              </div>
              <button type="button" className="btn-blue" disabled={editContestSaving}
                onClick={async () => {
                  setEditContestSaving(true);
                  try {
                    await api.patch(`/admin/contest/${editingContest.id}`, {
                      name: editContestValues.name,
                      startDate: editContestValues.startDate,
                      endDate: editContestValues.endDate || null,
                    });
                    toast.success("Concours mis à jour ✓");
                    setEditingContest(null);
                    const res = await api.get("/admin/contests");
                    setContests(res.data.data || []);
                  } catch { toast.error("Erreur"); }
                  setEditContestSaving(false);
                }}
                style={{ marginTop: 4, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", fontSize: "0.9rem", padding: "14px" }}>
                {editContestSaving ? "Enregistrement..." : "✓ Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal création concours ────────────────────────────────────────── */}
      {showCreateContest && (
        <div className="modal-backdrop" onClick={() => setShowCreateContest(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Nouveau concours</h3>
                <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.8rem" }}>Le concours sera créé avec le statut OUVERT</p>
              </div>
              <button type="button" onClick={() => setShowCreateContest(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", fontSize: "1.3rem" }}>×</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Nom du concours *</label>
                <input type="text" value={newContest.name} onChange={(e) => setNewContest({ ...newContest, name: e.target.value })}
                  placeholder="Ex: Meta Miss 2026" className="admin-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Date de début *</label>
                <input type="date" value={newContest.startDate} onChange={(e) => setNewContest({ ...newContest, startDate: e.target.value })}
                  className="admin-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Date de fin <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optionnelle)</span></label>
                <input type="date" value={newContest.endDate} onChange={(e) => setNewContest({ ...newContest, endDate: e.target.value })}
                  className="admin-input" />
              </div>
              <div style={{ marginTop: 4, padding: "12px 16px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>ℹ️ Le concours sera immédiatement ouvert</div>
                <div style={{ fontSize: 12, color: "#4ADE80", marginTop: 2 }}>Les votes seront activés dès la création.</div>
              </div>
              <button type="button" className="btn-blue"
                disabled={contestSaving || !newContest.name || !newContest.startDate}
                onClick={async () => {
                  if (!newContest.name.trim() || !newContest.startDate) { toast.error("Nom et date de début requis"); return; }
                  setContestSaving(true);
                  try {
                    await api.post("/admin/contest", {
                      name: newContest.name.trim(),
                      startDate: newContest.startDate,
                      ...(newContest.endDate && { endDate: newContest.endDate }),
                    });
                    toast.success("Concours créé et ouvert ✓");
                    setShowCreateContest(false);
                    setNewContest({ name: "", startDate: "", endDate: "" });
                    const res = await api.get("/admin/contests");
                    setContests(res.data.data || []);
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || "Erreur lors de la création");
                  }
                  setContestSaving(false);
                }}
                style={{ marginTop: 4, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", fontSize: "0.9rem", padding: "14px", opacity: (!newContest.name || !newContest.startDate) ? 0.5 : 1 }}>
                {contestSaving ? "Création..." : "✓ Créer le concours"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CSS for responsive sidebar ──────────────────────────────────────── */}
      <style>{`
        @media (min-width: 900px) {
          .admin-desktop-sidebar { display: flex !important; }
          .admin-mobile-sidebar { display: none !important; }
          .admin-menu-btn { display: none !important; }
          .admin-main-content { margin-left: 260px; }
        }
      `}</style>
    </div>
  );
}
