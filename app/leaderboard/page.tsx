"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function Leaderboard() {
  const [players, setPlayers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, city, xp, rank, streak")
        .order("xp", { ascending: false })
        .limit(100);

      const p = data || [];
      setPlayers(p);
      setFiltered(p);
      const uniqueCities = ["ALL", ...Array.from(new Set(p.map((x: any) => x.city).filter(Boolean)))];
      setCities(uniqueCities as string[]);
      setLoading(false);
    };
    load();
  }, []);

  const filterCity = (city: string) => {
    setSelectedCity(city);
    setFiltered(city === "ALL" ? players : players.filter(p => p.city === city));
  };

  const RANK_COLORS: Record<string, string> = {
    "RECON": "#00ff41",
    "INFILTRATE": "#00e5ff",
    "DECRYPT": "#ff9800",
    "ZERO-DAY": "#ff3d3d",
    "GHOST": "#ffd700",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050a05; color: #00ff41; font-family: 'JetBrains Mono', monospace; }
        .lb { max-width: 900px; margin: 0 auto; padding: 2rem; }
        .lb-header { margin-bottom: 2rem; }
        .lb-tag { font-size: 0.65rem; color: rgba(0,255,65,0.4); letter-spacing: 0.25em; margin-bottom: 0.5rem; }
        .lb-title { font-size: 2rem; font-weight: 700; margin-bottom: 0.3rem; }
        .lb-sub { font-size: 0.7rem; color: rgba(0,255,65,0.45); }
        .city-filter { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 2rem; }
        .city-btn { background: transparent; border: 1px solid rgba(0,255,65,0.15); color: rgba(0,255,65,0.5); font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; padding: 0.4rem 0.9rem; cursor: pointer; transition: all 0.2s; letter-spacing: 0.08em; }
        .city-btn:hover { border-color: rgba(0,255,65,0.4); color: #00ff41; }
        .city-btn.active { border-color: #00ff41; color: #00ff41; background: rgba(0,255,65,0.08); }
        .table-header { display: grid; grid-template-columns: 50px 1fr 120px 100px 80px 80px; gap: 1rem; padding: 0.6rem 1rem; font-size: 0.6rem; color: rgba(0,255,65,0.35); letter-spacing: 0.15em; border-bottom: 1px solid rgba(0,255,65,0.1); }
        .player-row { display: grid; grid-template-columns: 50px 1fr 120px 100px 80px 80px; gap: 1rem; padding: 0.9rem 1rem; font-size: 0.75rem; border-bottom: 1px solid rgba(0,255,65,0.06); align-items: center; transition: background 0.15s; }
        .player-row:hover { background: rgba(0,255,65,0.03); }
        .player-row.top1 { background: rgba(255,215,0,0.04); border-color: rgba(255,215,0,0.15); }
        .player-row.top2 { background: rgba(192,192,192,0.03); }
        .player-row.top3 { background: rgba(205,127,50,0.03); }
        .rank-num { font-size: 0.85rem; font-weight: 700; color: rgba(0,255,65,0.4); }
        .rank-num.g1 { color: #ffd700; }
        .rank-num.g2 { color: #c0c0c0; }
        .rank-num.g3 { color: #cd7f32; }
        .player-name { font-weight: 700; }
        .player-city { font-size: 0.65rem; color: rgba(0,255,65,0.4); }
        .player-rank-badge { font-size: 0.6rem; letter-spacing: 0.08em; }
        .player-xp { font-weight: 700; }
        .player-streak { color: #ff9800; }
        .empty { text-align: center; padding: 3rem; font-size: 0.75rem; color: rgba(0,255,65,0.25); }
        .trophy { font-size: 1.1rem; }
        @media (max-width: 600px) {
          .table-header { grid-template-columns: 40px 1fr 80px 70px; }
          .table-header span:nth-child(5), .table-header span:nth-child(6) { display: none; }
          .player-row { grid-template-columns: 40px 1fr 80px 70px; }
          .player-row > span:nth-child(5), .player-row > span:nth-child(6) { display: none; }
        }
      `}</style>

      <Navbar />
      <div className="lb">
        <div className="lb-header">
          <p className="lb-tag">// GLOBAL RANKINGS</p>
          <h1 className="lb-title">HALL OF FAME</h1>
          <p className="lb-sub">Top agents worldwide • Ranked by XP • Filter by city</p>
        </div>

        <div className="city-filter">
          {cities.map(c => (
            <button key={c} className={`city-btn ${selectedCity === c ? "active" : ""}`} onClick={() => filterCity(c)}>
              {c === "ALL" ? "🌍 ALL" : `📍 ${c}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty">SCANNING GLOBAL NETWORK...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">NO AGENTS FOUND IN THIS SECTOR</div>
        ) : (
          <>
            <div className="table-header">
              <span>#</span>
              <span>AGENT</span>
              <span>RANK</span>
              <span>XP</span>
              <span>STREAK</span>
              <span>CITY</span>
            </div>
            {filtered.map((p, i) => (
              <div key={p.username} className={`player-row ${i===0?"top1":i===1?"top2":i===2?"top3":""}`}>
                <span className={`rank-num ${i===0?"g1":i===1?"g2":i===2?"g3":""}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                </span>
                <span className="player-name">{p.username}</span>
                <span className="player-rank-badge" style={{color: RANK_COLORS[p.rank] || "#00ff41"}}>
                  {p.rank}
                </span>
                <span className="player-xp">{p.xp} XP</span>
                <span className="player-streak">🔥 {p.streak || 0}</span>
                <span className="player-city">{p.city || "—"}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
