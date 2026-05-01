"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";
import { useT } from "@/store/langStore";

interface RC { id: string; name: string; city: string; photoUrl: string; totalVotes: number; rank: number; }

export default function RankingPage() {
  const t = useT();
  const [tab, setTab] = useState<"MISS"|"MASTER">("MISS");
  const [miss, setMiss] = useState<RC[]>([]);
  const [master, setMaster] = useState<RC[]>([]);
  const [live, setLive] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api","") || "http://localhost:5000";

  useEffect(() => {
    api.get("/ranking?type=MISS").then(r => setMiss(r.data.data || []));
    api.get("/ranking?type=MASTER").then(r => setMaster(r.data.data || []));
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", { transports: ["websocket"] });
    socket.on("connect", () => { setLive(true); socket.emit("join:ranking"); });
    socket.on("disconnect", () => setLive(false));
    socket.on("ranking:update", (d) => { setMiss(d.miss || []); setMaster(d.master || []); });
    return () => { socket.disconnect(); };
  }, []);

  const current = tab === "MISS" ? miss : master;
  const total = current.reduce((sum, c) => sum + c.totalVotes, 0) || 1;
  const pct = (v: number) => Math.round((v / total) * 100);

  return (
    <div className="page-content fade-up">
      {/* Top bar */}
      <div className="top-bar">
        <div style={{ width: 32 }} />
        <span className="top-bar-title">{t.results}</span>
        <button style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-white)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/>
            <line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/>
            <circle cx="12" cy="4" r="2"/><circle cx="10" cy="12" r="2"/>
          </svg>
        </button>
      </div>

      {/* Live indicator */}
      <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text)" }}>{t.currentRanking}</div>
        <div style={{ fontSize: "0.68rem", color: live ? "#10B981" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: live ? "#10B981" : "var(--border)", display: "inline-block", animation: live ? "live-pulse 1.5s infinite" : "none" }} />
          {t.liveUpdate}
        </div>
      </div>

      <style>{`@keyframes live-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Tabs */}
      <div style={{ display: "flex", background: "var(--bg)", borderRadius: 10, margin: "0 16px 20px", padding: 3 }}>
        {(["MISS","MASTER"] as const).map(tabOpt => (
          <button key={tabOpt} onClick={() => setTab(tabOpt)} style={{
            flex: 1, padding: "9px 0",
            borderRadius: 8, fontSize: "0.82rem", fontWeight: 700,
            border: "none", cursor: "pointer", fontFamily: "var(--font)",
            background: tab===tabOpt ? "#2563EB" : "transparent",
            color: tab===tabOpt ? "#fff" : "var(--text-muted)",
            transition: "all 0.2s",
          }}>
            {tabOpt === "MISS" ? "Miss" : "Master"}
          </button>
        ))}
      </div>

      {/* Ranking list */}
      <div style={{ padding: "0 16px" }}>
        {current.length === 0
          ? [1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 60, borderRadius: 10, marginBottom: 8 }} />)
          : current.map((c, i) => {
              const photo = c.photoUrl?.startsWith("http") ? c.photoUrl : `${apiBase}${c.photoUrl}`;
              const percent = pct(c.totalVotes);
              return (
                <div key={c.id} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border-light)", animationDelay: `${i*0.06}s` }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: i===0?"#F59E0B":i===1?"#9CA3AF":i===2?"#D97706":"var(--blue-light)",
                    color: i<3?"#fff":"var(--blue)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", fontWeight: 800,
                  }}>
                    {i+1}
                  </div>
                  <img src={photo} alt={c.name} className="avatar" style={{ width: 40, height: 40 }} onError={(e:any)=>{e.target.style.background="var(--blue-light)";}} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div className="progress-bar" style={{ marginTop: 4 }}>
                      <div className="progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--blue)", flexShrink: 0, minWidth: 34, textAlign: "right" }}>
                    {percent}%
                  </div>
                </div>
              );
            })
        }
      </div>

      <BottomNav />
    </div>
  );
}
