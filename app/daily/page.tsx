"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

type Board = (number | null)[][];

function generateSeededSolution(seed: number): number[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  let s = seed;
  const seededRandom = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  function isValid(b: number[][], row: number, col: number, num: number) {
    for (let i = 0; i < 9; i++) {
      if (b[row][i] === num || b[i][col] === num) return false;
    }
    const sr = Math.floor(row / 3) * 3;
    const sc = Math.floor(col / 3) * 3;
    for (let r = sr; r < sr + 3; r++)
      for (let c = sc; c < sc + 3; c++)
        if (b[r][c] === num) return false;
    return true;
  }

  function solve(b: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (b[row][col] === 0) {
          const nums = [1,2,3,4,5,6,7,8,9].sort(() => seededRandom() - 0.5);
          for (const n of nums) {
            if (isValid(b, row, col, n)) {
              b[row][col] = n;
              if (solve(b)) return true;
              b[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(board);
  return board;
}

function makePuzzle(solution: number[][], seed: number): Board {
  const puzzle: Board = solution.map(r => [...r]);
  let s = seed + 999;
  const seededRandom = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => seededRandom() - 0.5);
  for (let i = 0; i < 45; i++) {
    const idx = cells[i];
    puzzle[Math.floor(idx / 9)][idx % 9] = null;
  }
  return puzzle;
}

function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

const OP_NAMES = ["GHOST-7","SHADOW-3","CIPHER-9","PHANTOM-1","VECTOR-5","MATRIX-2","BREACH-8"];

export default function DailyChallenge() {
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [initial, setInitial] = useState<boolean[][] | null>(null);
  const [selected, setSelected] = useState<[number,number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(false);
  const [flag, setFlag] = useState("");
  const [cursorOn, setCursorOn] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [started, setStarted] = useState(false);
  const supabase = createClient();

  const todayKey = new Date().toISOString().split("T")[0];
  const opName = OP_NAMES[new Date().getDay()];

  useEffect(() => {
    const t = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("profiles").select("*").eq("id", data.user.id).single()
          .then(({ data: p }) => setUserProfile(p));
      }
    });
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (!running || solved) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, solved]);

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from("games")
      .select("time_seconds, errors, profiles(username, city)")
      .eq("played_at::date", todayKey)
      .order("time_seconds", { ascending: true })
      .limit(10);
    setLeaderboard(data || []);
  };

  const startDaily = () => {
    const seed = getDailySeed();
    const sol = generateSeededSolution(seed);
    const puz = makePuzzle(sol, seed);
    setSolution(sol);
    setBoard(puz);
    setInitial(puz.map(r => r.map(c => c !== null)));
    setStarted(true);
    setRunning(true);
  };

  const checkSolved = useCallback((b: Board, sol: number[][]) => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (b[r][c] !== sol[r][c]) return false;
    return true;
  }, []);

  const handleInput = async (num: number) => {
    if (!board || !selected || !solution || !initial) return;
    const [r, c] = selected;
    if (initial[r][c]) return;
    const key = `${r},${c}`;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num === 0 ? null : num;
    const newErrors = new Set(errors);
    if (num !== 0 && num !== solution[r][c]) newErrors.add(key);
    else newErrors.delete(key);
    setErrors(newErrors);
    setBoard(newBoard);

    if (checkSolved(newBoard, solution)) {
      setSolved(true);
      setRunning(false);
      const hash = btoa(`daily-${todayKey}-${seconds}`).slice(0,12).replace(/[+/=]/g,"x");
      const f = `nFac{d41ly_${hash}}`;
      setFlag(f);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("games").insert({
          user_id: user.id,
          difficulty: 2,
          time_seconds: seconds,
          errors: newErrors.size,
          flag: f,
        });
        const { data: p } = await supabase.from("profiles").select("xp,streak,last_played").eq("id", user.id).single();
        if (p) {
          const today = new Date().toISOString().split("T")[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          const newStreak = p.last_played === yesterday ? p.streak + 1 : p.last_played === today ? p.streak : 1;
          await supabase.from("profiles").update({ xp: p.xp + 500, streak: newStreak, last_played: today }).eq("id", user.id);
        }
        loadLeaderboard();
      }
    }
  };

  const isHighlighted = (r: number, c: number) => {
    if (!selected) return false;
    const [sr, sc] = selected;
    return r === sr || c === sc || (Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3));
  };

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050a05; color: #00ff41; font-family: 'JetBrains Mono', monospace; }
        .daily-wrap { max-width: 1100px; margin: 0 auto; padding: 2rem; }
        .daily-hero { border: 1px solid rgba(0,255,65,0.2); padding: 2rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: rgba(0,255,65,0.02); }
        .live-badge { display: flex; align-items: center; gap: 6px; font-size: 0.6rem; color: #00ff41; letter-spacing: 0.2em; margin-bottom: 0.5rem; }
        .live-dot { width: 6px; height: 6px; background: #00ff41; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        .op-title { font-size: 1.5rem; font-weight: 700; }
        .op-sub { font-size: 0.7rem; color: rgba(0,255,65,0.45); margin-top: 0.3rem; }
        .timer-big { font-size: 2.5rem; font-weight: 700; letter-spacing: 0.05em; }
        .game-body { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; }
        .grid { display: grid; grid-template-columns: repeat(9,1fr); border: 2px solid rgba(0,255,65,0.4); width: min(90vw,440px); height: min(90vw,440px); flex-shrink: 0; }
        .cell { border: 1px solid rgba(0,255,65,0.12); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.1s; font-size: clamp(0.9rem,3vw,1.3rem); font-weight: 700; }
        .cell:hover { background: rgba(0,255,65,0.06); }
        .cell.hl { background: rgba(0,255,65,0.04); }
        .cell.sel { background: rgba(0,255,65,0.18) !important; outline: 2px solid #00ff41; z-index: 1; }
        .cell.err { background: rgba(255,61,61,0.12) !important; color: #ff3d3d !important; }
        .cell.given { color: #fff; }
        .cell.player { color: #00ff41; text-shadow: 0 0 6px rgba(0,255,65,0.4); }
        .side { display: flex; flex-direction: column; gap: 1.2rem; min-width: 220px; }
        .numpad { display: grid; grid-template-columns: repeat(5,1fr); gap: 4px; }
        .num-btn { background: rgba(0,255,65,0.06); border: 1px solid rgba(0,255,65,0.15); color: #00ff41; font-family: 'JetBrains Mono',monospace; font-size: 1rem; font-weight: 700; padding: 0.7rem; cursor: pointer; transition: all 0.15s; }
        .num-btn:hover { background: rgba(0,255,65,0.15); border-color: #00ff41; }
        .num-btn.erase { color: #ff3d3d; }
        .lb-box { border: 1px solid rgba(0,255,65,0.12); padding: 1rem; }
        .lb-title { font-size: 0.6rem; color: rgba(0,255,65,0.4); letter-spacing: 0.2em; margin-bottom: 0.8rem; }
        .lb-row { display: flex; justify-content: space-between; font-size: 0.65rem; padding: 0.4rem 0; border-bottom: 1px solid rgba(0,255,65,0.06); }
        .lb-empty { font-size: 0.65rem; color: rgba(0,255,65,0.25); text-align: center; padding: 1rem; }
        .start-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 1.5rem; text-align: center; }
        .btn-primary { background: #00ff41; color: #050a05; border: none; padding: 0.9rem 2.5rem; font-family: 'JetBrains Mono',monospace; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #fff; }
        .solved-overlay { position: fixed; inset: 0; background: rgba(5,10,5,0.92); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(4px); }
        .solved-box { border: 1px solid rgba(0,255,65,0.3); background: #050a05; padding: 3rem 2.5rem; text-align: center; max-width: 420px; width: 90%; }
        .solved-title { font-size: 2rem; font-weight: 700; color: #00ff41; margin-bottom: 0.5rem; }
        .flag-box { background: rgba(0,255,65,0.08); border: 1px solid rgba(0,255,65,0.2); padding: 1rem; font-size: 0.85rem; margin: 1rem 0; word-break: break-all; }
        .errors-bar { font-size: 0.65rem; color: rgba(0,255,65,0.4); }
      `}</style>

      <Navbar />
      <div className="daily-wrap">
        <div className="daily-hero">
          <div>
            <div className="live-badge"><span className="live-dot"/>DAILY OPERATION LIVE</div>
            <div className="op-title">OPERATION: {opName}</div>
            <div className="op-sub">{todayKey} • Same grid for all agents worldwide</div>
          </div>
          {started && <div className="timer-big">{formatTime(seconds)}</div>}
        </div>

        {!started ? (
          <div className="start-screen">
            <p style={{fontSize:"0.8rem", color:"rgba(0,255,65,0.6)"}}>
              Every agent gets the same puzzle today.<br/>Compete for the fastest time.
            </p>
            <button className="btn-primary" onClick={startDaily}>ACCEPT MISSION</button>
            <div className="lb-box" style={{width:"100%", maxWidth:"500px"}}>
              <div className="lb-title">// TODAY'S LEADERBOARD</div>
              {leaderboard.length === 0 ? (
                <div className="lb-empty">NO COMPLETIONS YET — BE THE FIRST</div>
              ) : leaderboard.map((e, i) => (
                <div key={i} className="lb-row">
                  <span>#{i+1} {(e.profiles as any)?.username}</span>
                  <span style={{color:"rgba(0,255,65,0.5)"}}>{(e.profiles as any)?.city}</span>
                  <span>{formatTime(e.time_seconds)}</span>
                  <span style={{color: e.errors>0?"#ff3d3d":"#00ff41"}}>{e.errors} err</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="game-body">
            <div className="grid">
              {board && board.map((row, r) => row.map((cell, c) => {
                const key = `${r},${c}`;
                const isSel = selected?.[0]===r && selected?.[1]===c;
                const isInit = initial?.[r][c];
                return (
                  <div
                    key={key}
                    className={`cell ${isSel?"sel":""} ${errors.has(key)?"err":""} ${isInit?"given":"player"} ${isHighlighted(r,c)&&!isSel?"hl":""}`}
                    style={{
                      borderRight: (c+1)%3===0&&c!==8?"2px solid rgba(0,255,65,0.4)":undefined,
                      borderBottom: (r+1)%3===0&&r!==8?"2px solid rgba(0,255,65,0.4)":undefined,
                    }}
                    onClick={() => setSelected([r,c])}
                  >
                    {cell}
                  </div>
                );
              }))}
            </div>

            <div className="side">
              <div className="numpad">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} className="num-btn" onClick={() => handleInput(n)}>{n}</button>
                ))}
                <button className="num-btn erase" onClick={() => handleInput(0)}>⌫</button>
              </div>
              <div className="errors-bar">
                ERRORS: <span style={{color: errors.size>0?"#ff3d3d":"#00ff41"}}>{errors.size}</span>
              </div>
              <div className="lb-box">
                <div className="lb-title">// TODAY'S TOP AGENTS</div>
                {leaderboard.length === 0 ? (
                  <div className="lb-empty">BE THE FIRST TO COMPLETE</div>
                ) : leaderboard.slice(0,5).map((e,i) => (
                  <div key={i} className="lb-row">
                    <span>#{i+1} {(e.profiles as any)?.username}</span>
                    <span>{formatTime(e.time_seconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {solved && (
        <div className="solved-overlay">
          <div className="solved-box">
            <p style={{fontSize:"0.65rem",color:"rgba(0,255,65,0.4)",letterSpacing:"0.2em",marginBottom:"0.8rem"}}>// DAILY OPERATION COMPLETE</p>
            <div className="solved-title">MISSION SUCCESS</div>
            <p style={{fontSize:"0.8rem",color:"rgba(0,255,65,0.6)",margin:"0.5rem 0"}}>TIME: {formatTime(seconds)}</p>
            <div className="flag-box">{flag}</div>
            <p style={{fontSize:"0.65rem",color:"rgba(0,255,65,0.3)",marginBottom:"1.5rem"}}>+500 XP • streak updated 🔥</p>
            <button className="btn-primary" onClick={() => window.location.href="/leaderboard"}>VIEW HALL OF FAME</button>
          </div>
        </div>
      )}
    </>
  );
}