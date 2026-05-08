"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Link from "next/link";
import api from "@/lib/api";
import { useT } from "@/store/langStore";
import CandidacyButton from "@/components/CandidacyButton";
import toast from "react-hot-toast";

interface RC {
  id: string;
  name: string;
  city: string;
  photoUrl: string;
  totalVotes: number;
  rank: number;
}

interface TopVoter {
  id: string;
  name: string;
  totalVotes: number;
  votedFor: {
    id: string;
    name: string;
    type: string;
    photoUrl: string;
  } | null;
}

type RankTab = "MISS" | "MASTER" | "VOTERS";

export default function RankingPage() {
  const t = useT();

  const [tab, setTab] = useState<RankTab>("MISS");

  const [miss, setMiss] = useState<RC[]>([]);
  const [master, setMaster] = useState<RC[]>([]);
  const [topVoters, setTopVoters] = useState<TopVoter[]>([]);

  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  useEffect(() => {
    Promise.all([
      api
        .get("/ranking?type=MISS")
        .then((r) => setMiss(r.data.data || [])),

      api
        .get("/ranking?type=MASTER")
        .then((r) => setMaster(r.data.data || [])),

      api
        .get("/ranking/top-voters?limit=20")
        .then((r) => setTopVoters(r.data.data || []))
        .catch(() => setTopVoters([])),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));

    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
      }
    );

    socket.on("connect", () => {
      setLive(true);
      socket.emit("join:ranking");
    });

    socket.on("disconnect", () => setLive(false));

    socket.on("ranking:update", (d) => {
      setMiss(d.miss || []);
      setMaster(d.master || []);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const current = tab === "MISS" ? miss : master;

  const total =
    current.reduce((sum, c) => sum + c.totalVotes, 0) || 1;

  const pct = (v: number) =>
    Math.round((v / total) * 100);

  const filteredVoters = topVoters
    .filter((v) => v.totalVotes > 0)
    .sort((a, b) => b.totalVotes - a.totalVotes);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Meta Miss Master — Classement",
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié !");
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        "Classement Meta Miss Master 2025 : " +
          window.location.href
      )}`,
      "_blank"
    );
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        "Classement Meta Miss Master 2025"
      )}&url=${encodeURIComponent(window.location.href)}`,
      "_blank"
    );
  };

  return (
    <div className="page-content fade-up">

      {/* ───────────────────────────── */}
      {/* HEADER */}
      {/* ───────────────────────────── */}

      <div className="rk-header">
        <div className="rk-header-left">
          <h1>Résultats en direct</h1>

          <div className="rk-header-sub">
            {tab === "VOTERS"
              ? "Classement des supporters les plus actifs"
              : `Classement des candidates — Catégorie ${
                  tab === "MISS" ? "Miss" : "Master"
                }`}
          </div>
        </div>

        <span className="rk-edition-badge">
          Édition 2025
        </span>
      </div>

      {/* ───────────────────────────── */}
      {/* TABS */}
      {/* ───────────────────────────── */}

      <div className="rk-tabs">
        {[
          {
            key: "MISS",
            label: "Miss",
            icon: "👑",
          },
          {
            key: "MASTER",
            label: "Master",
            icon: "🎯",
          },
          {
            key: "VOTERS",
            label: "Top Votants",
            icon: "🗳️",
          },
        ].map((tabOpt) => (
          <button
            key={tabOpt.key}
            onClick={() =>
              setTab(tabOpt.key as RankTab)
            }
            className={`rk-tab${
              tab === tabOpt.key ? " active" : ""
            }`}
          >
            <span style={{ fontSize: "0.85rem" }}>
              {tabOpt.icon}
            </span>

            {tabOpt.label}
          </button>
        ))}
      </div>

      {/* ───────────────────────────── */}
      {/* CLASSIC RANKING */}
      {/* ───────────────────────────── */}

      {tab !== "VOTERS" && (
        <div className="rk-table-card">

          {/* HEADER */}
          <div className="rk-table-head">
            <div className="rk-th">#</div>
            <div className="rk-th">Candidate</div>
            <div className="rk-th right">
              %
            </div>
            <div className="rk-th right">
              Votes
            </div>
          </div>

          {/* LOADING */}
          {loading &&
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rk-skel-row"
              >
                Loading...
              </div>
            ))}

          {/* EMPTY */}
          {!loading && current.length === 0 && (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: 16,
                }}
              >
                🏆
              </div>

              <div
                style={{
                  fontWeight: 800,
                  fontSize: "1rem",
                  marginBottom: 8,
                }}
              >
                {t.noResultsYet ||
                  "Aucun résultat"}
              </div>

              <div
                style={{
                  fontSize: "0.83rem",
                  color: "var(--text-muted)",
                  marginBottom: 28,
                }}
              >
                {t.noResultsDesc ||
                  "Les résultats apparaîtront ici dès les premiers votes."}
              </div>

              <CandidacyButton
                variant="full"
                style={{ margin: "0 auto" }}
              />
            </div>
          )}

          {/* ROWS */}
          {!loading &&
            current.map((c, i) => {

              const photo =
                c.photoUrl?.startsWith("http")
                  ? c.photoUrl
                  : `${apiBase}${c.photoUrl}`;

              const percent = pct(c.totalVotes);

              const rankColor =
                i === 0
                  ? "#F59E0B"
                  : i === 1
                  ? "#9CA3AF"
                  : i === 2
                  ? "#D97706"
                  : "var(--blue)";

              return (
                <Link
                  key={c.id}
                  href={`/candidates/${c.id}`}
                  className="rk-row"
                >

                  {/* Rank */}
                  <div>
                    <div
                      className="rk-rank"
                      style={{
                        background: rankColor,
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Candidate */}
                  <div className="rk-cand-cell">
                    <img
                      src={photo}
                      alt={c.name}
                      className="rk-cand-photo"
                    />

                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div className="rk-cand-name">
                        {c.name}
                      </div>

                      <div className="rk-progress">
                        <div
                          className="rk-progress-fill"
                          style={{
                            width: `${percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="rk-pct">
                    {percent}%
                  </div>

                  {/* Votes */}
                  <div className="rk-votes">
                    {c.totalVotes}
                    <div className="rk-votes-sub">
                      votes
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      )}

      {/* ───────────────────────────── */}
      {/* TOP VOTERS */}
      {/* ───────────────────────────── */}

      {tab === "VOTERS" && (
        <div
          className="rk-table-card"
          style={{ overflowX: "auto" }}
        >

          {/* HEADER */}
          <div
            style={{
              padding: "14px 16px 10px",
              borderBottom:
                "1px solid var(--border)",
              background: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "0.9rem",
                }}
              >
                🗳️ Top Votants
              </div>

              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                }}
              >
                Les supporters les plus actifs
              </div>
            </div>

            <div
              className={`rk-live-dot${
                live ? " on" : ""
              }`}
            />
          </div>

          {/* COLUMNS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "40px 1fr 1fr 72px",
              padding: "8px 16px",
              background: "var(--bg)",
              borderBottom:
                "1px solid var(--border)",
            }}
          >
            {[
              "#",
              "Votant",
              "Soutient",
              "Votes",
            ].map((h, i) => (
              <div
                key={h}
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color:
                    "var(--text-muted)",
                  textTransform:
                    "uppercase",
                  textAlign:
                    i === 3
                      ? "right"
                      : "left",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* EMPTY */}
          {!loading &&
            filteredVoters.length === 0 && (
              <div
                style={{
                  padding: "60px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "3rem",
                    marginBottom: 12,
                  }}
                >
                  🗳️
                </div>

                <div
                  style={{
                    fontWeight: 800,
                  }}
                >
                  Aucun votant
                </div>
              </div>
            )}

          {/* ROWS */}
          {!loading &&
            filteredVoters.map((voter, i) => {

              const medalColor =
                i === 0
                  ? "#F59E0B"
                  : i === 1
                  ? "#9CA3AF"
                  : i === 2
                  ? "#D97706"
                  : "var(--blue)";

              const candidatePhoto =
                voter.votedFor?.photoUrl?.startsWith(
                  "http"
                )
                  ? voter.votedFor.photoUrl
                  : voter.votedFor
                  ? `${apiBase}${voter.votedFor.photoUrl}`
                  : null;

              return (
                <div
                  key={voter.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "40px 1fr 1fr 72px",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom:
                      "1px solid var(--border-light)",
                  }}
                >

                  {/* Rank */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: medalColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 800,
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* User */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background:
                          "var(--blue)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 800,
                      }}
                    >
                      {voter.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize:
                            "0.82rem",
                          fontWeight: 700,
                        }}
                      >
                        {
                          voter.name.split(
                            " "
                          )[0]
                        }
                      </div>
                    </div>
                  </div>

                  {/* Candidate */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {voter.votedFor ? (
                      <>
                        {candidatePhoto && (
                          <img
                            src={
                              candidatePhoto
                            }
                            alt={
                              voter.votedFor
                                .name
                            }
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              objectFit:
                                "cover",
                            }}
                          />
                        )}

                        <div>
                          <div
                            style={{
                              fontSize:
                                "0.74rem",
                              fontWeight: 700,
                            }}
                          >
                            {
                              voter
                                .votedFor
                                .name
                            }
                          </div>

                          <div
                            style={{
                              fontSize:
                                "0.6rem",
                              color:
                                "var(--text-muted)",
                            }}
                          >
                            {voter
                              .votedFor
                              .type ===
                            "MISS"
                              ? "Miss"
                              : "Master"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span>—</span>
                    )}
                  </div>

                  {/* Votes */}
                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "0.9rem",
                        fontWeight: 800,
                        color:
                          "var(--blue)",
                      }}
                    >
                      {voter.totalVotes >=
                      1000
                        ? `${(
                            voter.totalVotes /
                            1000
                          ).toFixed(1)}K`
                        : voter.totalVotes}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "0.6rem",
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      votes
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ───────────────────────────── */}
      {/* LIVE */}
      {/* ───────────────────────────── */}

      {tab !== "VOTERS" && (
        <div className="rk-live-row">
          <div
            className={`rk-live-dot${
              live ? " on" : ""
            }`}
          />

          <span>
            {live
              ? "Résultats mis à jour en temps réel"
              : "Connexion en cours..."}
          </span>
        </div>
      )}

      {/* ───────────────────────────── */}
      {/* SHARE */}
      {/* ───────────────────────────── */}

      {tab !== "VOTERS" && (
        <div className="rk-share-card">

          <div className="rk-share-title">
            Partager le classement
          </div>

          <div className="rk-share-sub">
            Partagez ces résultats
          </div>

          <div className="rk-share-btns">

            <button
              className="rk-share-btn"
              onClick={handleShare}
            >
              Partager
            </button>

            <button
              className="rk-share-btn"
              onClick={handleCopyLink}
            >
              Copier
            </button>

            <button
              className="rk-share-btn"
              onClick={handleWhatsApp}
            >
              WhatsApp
            </button>

            <button
              className="rk-share-btn"
              onClick={handleTwitter}
            >
              Twitter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
