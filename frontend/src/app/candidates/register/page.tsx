"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  type: z.enum(["MISS","MASTER"]),
  age: z.coerce.number().min(16).max(35),
  city: z.string().min(2, "Ville requise"),
  bio: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { type: "MISS" },
  });

  const handleFile = (f: File) => { if (f.size > 5*1024*1024) { toast.error("Max 5MB"); return; } setPhoto(f); setPreview(URL.createObjectURL(f)); };

  const onSubmit = async (data: FormData) => {
    if (!photo) { toast.error("Ajoutez une photo"); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      Object.entries(data).forEach(([k,v]) => v !== undefined && form.append(k, String(v)));
      form.append("photo", photo);
      await api.post("/candidates/register", form, { headers: { "Content-Type": "multipart/form-data" } });
      setDone(true);
    } catch (err: any) { toast.error(err.response?.data?.message || "Erreur"); }
    finally { setSubmitting(false); }
  };

  const inp: React.CSSProperties = { width:"100%", padding:"12px 14px", border:"1.5px solid var(--border)", borderRadius:8, fontFamily:"var(--font)", fontSize:"0.88rem", color:"var(--text)", background:"#fff", outline:"none", marginBottom:12 };
  const lbl: React.CSSProperties = { display:"block", fontSize:"0.72rem", fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 };

  return (
    <div className="page-content fade-up">
      <div className="top-bar">
        <button onClick={() => router.back()} style={{ width:32, height:32, border:"1px solid var(--border)", borderRadius:8, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span className="top-bar-title">Candidature</span>
        <div style={{ width:32 }} />
      </div>

      {done ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#EFF6FF", border:"2px solid #DBEAFE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }} className="scale-in">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 style={{ fontSize:"1.1rem", fontWeight:800, color:"var(--text)", marginBottom:8 }}>Candidature envoyée !</h2>
          <p style={{ fontSize:"0.84rem", color:"var(--text-muted)", lineHeight:1.7, marginBottom:28 }}>Votre profil sera visible après validation par l'équipe (sous 24h).</p>
          <button onClick={() => router.push("/candidates")} className="btn-blue" style={{ maxWidth:300 }}>Voir les candidats</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} style={{ padding:"0 16px 24px" }}>
          {/* Photo upload */}
          <label style={{ display:"block", marginBottom:16, cursor:"pointer" }}>
            <div style={{ ...lbl, marginBottom:8 }}>Photo *</div>
            <div style={{ height:140, border:"1.5px dashed #BFDBFE", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", background:"#F8FAFF", position:"relative" }}>
              {preview ? (
                <img src={preview} style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />
              ) : (
                <div style={{ textAlign:"center", color:"var(--text-muted)" }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:6 }}>📸</div>
                  <div style={{ fontSize:"0.78rem" }}>Cliquez pour choisir une photo</div>
                  <div style={{ fontSize:"0.68rem", marginTop:2, color:"var(--text-faint)" }}>JPG/PNG max 5MB</div>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f); }} />
          </label>

          <label style={lbl}>Nom complet *</label>
          <input {...register("name")} style={inp} placeholder="Votre nom" />
          {errors.name && <p style={{ color:"#EF4444", fontSize:"0.72rem", marginTop:-8, marginBottom:10 }}>{errors.name.message}</p>}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:0 }}>
            <div>
              <label style={lbl}>Âge *</label>
              <input {...register("age")} type="number" style={inp} placeholder="22" />
            </div>
            <div>
              <label style={lbl}>Ville *</label>
              <input {...register("city")} style={inp} placeholder="Yaoundé" />
            </div>
          </div>

          <label style={lbl}>Catégorie *</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {[{v:"MISS",l:"Miss Master"},{v:"MASTER",l:"Mister Master"}].map(o => (
              <label key={o.v} style={{ cursor:"pointer" }}>
                <input {...register("type")} type="radio" value={o.v} style={{ display:"none" }} />
                <div style={{ padding:"12px", borderRadius:8, textAlign:"center", border:"1.5px solid var(--border)", fontSize:"0.82rem", fontWeight:600, color:"var(--text)" }}>
                  {o.l}
                </div>
              </label>
            ))}
          </div>

          <label style={lbl}>Bio (optionnel)</label>
          <textarea {...register("bio")} rows={3} style={{ ...inp, resize:"none" }} placeholder="Parlez de vous..." />

          <button type="submit" disabled={submitting} className="btn-blue" style={{ opacity:submitting?0.6:1 }}>
            {submitting ? "Envoi..." : "Soumettre ma candidature"}
          </button>
          <div className="security-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Validation sous 24h</div>
        </form>
      )}
      <BottomNav />
    </div>
  );
}
