"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function SplashPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [contest, setContest] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // ✅ added loading state
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    if (isAuthenticated) { router.replace("/home"); return; }

    Promise.all([
      api.get("/contest/active").catch(() => null),
      api.get("/candidates/top?limit=10").catch(() => null)
    ]).then(([contestRes, candidatesRes]) => {
      if (contestRes?.data?.data) setContest(contestRes.data.data);
      if (candidatesRes?.data?.data) setCandidates(candidatesRes.data.data);
      setLoading(false); // ✅ stop loading after requests
    });
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (candidates.length < 2) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % candidates.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [candidates.length]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* Carousel */}
      <div style={{ position: "relative", width: "100%", height: "52vh", overflow: "hidden" }}>

        {/* ✅ Loading skeleton ONLY when loading */}
        {loading ? (
          <div style={{ width: "100%", height: "100%", background: "#e5e7eb" }} />
        ) : candidates.length === 0 ? (
          // ✅ Empty state (no more infinite skeleton)
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: "#1e293b"
          }}>
            Aucun candidat disponible
          </div>
        ) : (
          candidates.map((c, i) => {
            const photo = c.photoUrl && c.photoUrl.trim() !== ""
              ? c.photoUrl.startsWith("http")
                ? c.photoUrl
                : `${apiBase}${c.photoUrl}`
              : null;

            return (
              <div key={c.id} style={{
                position: "absolute",
                inset: 0,
                opacity: i === currentSlide ? 1 : 0,
                transition: "opacity 0.8s ease"
              }}>

                {photo ? (
                  <img
                    src={photo}
                    alt={c.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    background: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff"
                  }}>
                    Image indisponible
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
