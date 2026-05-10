"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const RANKS = ["RECON", "INFILTRATE", "DECRYPT", "ZERO-DAY", "GHOST"];
const RANK_XP = [0, 500, 1500, 3500, 7000];
const DIFF_NAMES = ["RECON", "INFILTRATE", "DECRYPT", "ZERO-DAY"];

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursorOn, setCursorOn] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const t = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p);
      const { data: g } = await supabase.from("games").select("*").eq("user_id", user.id).order("played_at", { ascending: false }).limit(5);
      setGames(g || []);
      setLoading(false);
    };
    load();
  }, []);

  const xpProgress = () => {
    const idx = RANKS.indexOf(profile?.rank || "RECON");
    const current = profile?.xp || 0;
    const from = RANK_XP[idx] || 0;
    const to = RANK_XP[idx + 1] || 9999;
    return Math.min(100, Math.round(((current - from) / (to - from)) * 100));
  };

  const nextRank = () => {
    const idx = RANKS.indexOf(profile?.rank || "RECON");
    return RANKS[idx + 1] || "MAX RANK";
  };

  if (loading) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { background: #050a05; color: #00ff41; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-size: 0.85rem; }`}</style>
      <div>LOADING AGENT DATA...</div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050a05; color: #00ff41; font-family: 'JetBrains Mono', monospace; }
        .dash { max-width: 1100px; margin: 0 auto; padding: 2rem; }
        .hero-section { border: 1px solid rgba(0,255,65,0.15); padding: 2.5rem; margin-bottom: 1.5rem; position: relative; overflow: hidden; }
        .hero-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at top left, rgba(0,255,65,0.04) 0%, transparent 60%); pointer-events: none; }
        .hero-tag { font-size: 0.65rem; color: rgba(0,255,65,0.4); letter-spacing: 0.25em; margin-bottom: 0.5rem; }
        .hero-name { font-size: 2.2rem; font-weight: 700; line-height: 1; margin-bottom: 0.3rem; }
        .hero-city { font-size: 0.7rem; color: rgba(0,255,65,0.45); margin-bottom: 1.5rem; }
        .rank-row { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .rank-badge { border: 1px solid rgba(0,255,65,0.3); padding: 0.4rem 1rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; }
        .xp-section { flex: 1; min-width: 200px; }
        .xp-label { font-size: 0.6rem; color: rgba(0,255,65,0.4); margin-bottom: 0.4rem; display: flex; justify-content: space-between; }
        .xp-bar { background: rgba(0,255,65,0.1); height: 3px; }
        .xp-fill { background: #00ff41; height: 3px; box-shadow: 0 0 8px rgba(0,255,65,0.5); }
        .streak-badge { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #ff9800; }
        .cta-row { display: flex; gap: 0.8rem; flex-wrap: wrap; }
        .btn-primary { background: #00ff41; color: #050a05; border: none; padding: 0.8rem 2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .btn-primary:hover { background: #fff; }
        .btn-secondary { background: transparent; color: #00ff41; border: 1px solid rgba(0,255,65,0.25); padding: 0.8rem 2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; letter-spacing: 0.1em; cursor: pointer; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .btn-secondary:hover { border-color: #00ff41; }
        .daily-card { border: 1px solid rgba(0,255,65,0.2); padding: 1.5rem; margin-bottom: 1.5rem; background: rgba(0,255,65,0.02); }
        .live-dot { width: 6px; height: 6px; background: #00ff41; border-radius: 50%; animation: pulse 2s infinite; display: inline-block; margin-right: 6px; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .daily-live { font-size: 0.6rem; color: #00ff41; letter-spacing: 0.15em; margin-bottom: 0.8rem; display: flex; align-items: center; }
        .daily-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.4rem; }
        .daily-sub { font-size: 0.7rem; color: rgba(0,255,65,0.5); margin-bottom: 1.2rem; }
        .pro-banner { border: 1px solid rgba(255,215,0,0.2); padding: 1.5rem 2rem; background: rgba(255,215,0,0.02); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
        .pro-text { font-size: 0.85rem; color: #ffd700; font-weight: 700; }
        .pro-sub { font-size: 0.65rem; color: rgba(255,215,0,0.5); margin-top: 0.3rem; }
        .btn-pro { background: transparent; color: #ffd700; border: 1px solid rgba(255,215,0,0.3); padding: 0.8rem 2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; letter-spacing: 0.1em; cursor: pointer; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .btn-pro:hover { border-color: #ffd700; background: rgba(255,215,0,0.05); }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 700px) { .grid-2 { grid-template-columns: 1fr; } }
        .card { border: 1px solid rgba(0,255,65,0.12); padding: 1.5rem; }
        .card-title { font-size: 0.6rem; color: rgba(0,255,65,0.4); letter-spacing: 0.2em; margin-bottom: 1.2rem; }
        .stats-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.2rem; }
        .stat-val { font-size: 1.6rem; font-weight: 700; }
        .stat-lbl { font-size: 0.58rem; color: rgba(0,255,65,0.35); margin-top: 0.2rem; }
        .games-list { display: flex; flex-direction: column; gap: 1px; background: rgba(0,255,65,0.06); }
        .game-row { background: #050a05; padding: 0.7rem 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; }
        .game-diff { font-weight: 700; font-size: 0.65rem; }
        .game-flag { color: rgba(0,255,65,0.3); font-size: 0.58rem; overflow: hidden; text-overflow: ellipsis; max-width: 140px; white-space: nowrap; }
        .empty-state { font-size: 0.7rem; color: rgba(0,255,65,0.25); padding: 1.5rem; text-align: center; }
      `}</style>

      <Navbar />
      <div className="dash">
        <div className="hero-section">
          <p className="hero-tag">// AGENT TERMINAL</p>
          <h1 className="hero-name">
            {profile?.username}
            <span style={{color:"rgba(0,255,65,0.3)", fontWeight:400}}>{cursorOn ? "█" : " "}</span>
          </h1>
          <p className="hero-city">📍 {profile?.city || "Unknown Base"}</p>

          <div className="rank-row">
            <div className="rank-badge">{profile?.rank || "RECON"}</div>
            <div className="xp-section">
              <div className="xp-label">
                <span>{profile?.xp || 0} XP</span>
                <span>→ {nextRank()}</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpProgress()}%` }} />
              </div>
            </div>
            <div className="streak-badge">🔥 {profile?.streak || 0} day streak</div>
          </div>

          <div className="cta-row">
            <a href="/game" className="btn-primary">NEW OPERATION</a>
            <a href="/daily" className="btn-secondary">DAILY OPS</a>
            <a href="/leaderboard" className="btn-secondary">HALL OF FAME</a>
          </div>
        </div>

        <div className="daily-card">
          <div className="daily-live">
            <span className="live-dot" />
            DAILY OPERATION ACTIVE
          </div>
          <div className="daily-title">
            OPERATION: {["GHOST-7","SHADOW-3","CIPHER-9","PHANTOM-1","VECTOR-5","MATRIX-2","BREACH-8"][new Date().getDay()]}
          </div>
          <div className="daily-sub">
            Today's global challenge • Resets in {23 - new Date().getHours()}h {59 - new Date().getMinutes()}m • All agents compete on the same grid
          </div>
          <a href="/daily" className="btn-primary">ACCEPT MISSION</a>
        </div>

        <div className="pro-banner">
          <div>
            <div className="pro-text">⚡ UPGRADE TO PRO</div>
            <div className="pro-sub">Custom terminal themes • Unlimited hints • Priority leaderboard badge • Exclusive agent skins</div>
          </div>
          <a href="/pro" className="btn-pro">UPGRADE — $4.99/mo</a>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">// MISSION STATS</div>
            <div className="stats-row">
              <div>
                <div className="stat-val">{games.length}</div>
                <div className="stat-lbl">OPERATIONS</div>
              </div>
              <div>
                <div className="stat-val">{games.filter(g => g.flag).length}</div>
                <div className="stat-lbl">FLAGS CAPTURED</div>
              </div>
              <div>
                <div className="stat-val">
                  {games.length > 0 ? Math.round(games.reduce((a,g) => a + g.time_seconds, 0) / games.length) : 0}s
                </div>
                <div className="stat-lbl">AVG TIME</div>
              </div>
              <div>
                <div className="stat-val">
                  {games.length > 0 ? Math.round(games.reduce((a,g) => a + (g.errors||0), 0) / games.length) : 0}
                </div>
                <div className="stat-lbl">AVG ERRORS</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">// RECENT OPERATIONS</div>
            {games.length === 0 ? (
              <div className="empty-state">NO OPERATIONS YET. START YOUR FIRST MISSION.</div>
            ) : (
              <div className="games-list">
                {games.map(g => (
                  <div key={g.id} className="game-row">
                    <span className="game-diff">{DIFF_NAMES[g.difficulty]}</span>
                    <span style={{color:"rgba(0,255,65,0.6)", fontSize:"0.65rem"}}>
                      {Math.floor(g.time_seconds/60)}:{String(g.time_seconds%60).padStart(2,"0")}
                    </span>
                    <span style={{color: g.errors>0 ? "#ff3d3d" : "#00ff41", fontSize:"0.6rem"}}>
                      {g.errors} err
                    </span>
                    <span className="game-flag">{g.flag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
