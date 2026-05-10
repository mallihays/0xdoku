"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("profiles").select("*").eq("id", data.user.id).single()
          .then(({ data: p }) => setProfile(p));
      }
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        .navbar { padding: 0.9rem 2rem; border-bottom: 1px solid rgba(0,255,65,0.12); display: flex; justify-content: space-between; align-items: center; font-family: 'JetBrains Mono', monospace; background: #050a05; position: sticky; top: 0; z-index: 50; }
        .nav-logo { font-size: 1.1rem; font-weight: 700; text-decoration: none; color: #fff; }
        .nav-logo span { color: #00ff41; }
        .nav-right { display: flex; gap: 1.5rem; align-items: center; font-size: 0.7rem; flex-wrap: wrap; }
        .nav-link { color: rgba(0,255,65,0.5); text-decoration: none; letter-spacing: 0.08em; transition: color 0.2s; cursor: pointer; background: none; border: none; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; }
        .nav-link:hover { color: #00ff41; }
        .nav-username { color: #00ff41; font-weight: 700; text-decoration: none; }
        .nav-xp { color: rgba(0,255,65,0.35); font-size: 0.65rem; }
        .nav-rank { border: 1px solid rgba(0,255,65,0.2); padding: 0.15rem 0.5rem; font-size: 0.58rem; color: #00ff41; letter-spacing: 0.1em; }
        .nav-pro { border: 1px solid rgba(255,215,0,0.3); padding: 0.15rem 0.6rem; font-size: 0.58rem; color: #ffd700; letter-spacing: 0.1em; text-decoration: none; }
        .nav-pro:hover { background: rgba(255,215,0,0.05); }
      `}</style>
      <nav className="navbar">
        <a href="/" className="nav-logo">0x<span>doku</span></a>
        <div className="nav-right">
          <a href="/game" className="nav-link">OPERATIONS</a>
          <a href="/daily" className="nav-link">DAILY OPS</a>
          <a href="/leaderboard" className="nav-link">HALL OF FAME</a>
          {user ? (
            <>
              <span className="nav-rank">{profile?.rank || "RECON"}</span>
              <a href="/dashboard" className="nav-username">{profile?.username || "AGENT"}</a>
              <span className="nav-xp">{profile?.xp || 0} XP</span>
              <a href="/pro" className="nav-pro">⚡ PRO</a>
              <button className="nav-link" onClick={logout}>LOGOUT</button>
            </>
          ) : (
            <a href="/auth" className="nav-link">LOGIN</a>
          )}
        </div>
      </nav>
    </>
  );
}
