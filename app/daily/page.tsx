"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import GameControls, { type DailyTheme } from "@/components/GameControls";
import DailyThemeBanner from "@/components/DailyThemeBanner";
import { useGameSession } from "@/hooks/useGameSession";

// ── Sudoku generator (same as game/page.tsx) ──────────────────────────────────
type Board = (number | null)[][];

function generateSolution(): number[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  function isValid(b: number[][], r: number, c: number, n: number) {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === n || b[i][c] === n) return false;
    }
    const sr = Math.floor(r / 3) * 3, sc = Math.floor(c / 3) * 3;
    for (let dr = 0; dr < 3; dr++)
      for (let dc = 0; dc < 3; dc++)
        if (b[sr + dr][sc + dc] === n) return false;
    return true;
  }
  function solve(b: number[][]): boolean {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (b[r][c] === 0) {
          for (const n of [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5)) {
            if (isValid(b, r, c, n)) {
              b[r][c] = n;
              if (solve(b)) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
    return true;
  }
  solve(board);
  return board;
}

function makePuzzle(solution: number[][]): Board {
  const puzzle: Board = solution.map(r => [...r]);
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (let i = 0; i < 46; i++) {
    puzzle[Math.floor(cells[i] / 9)][cells[i] % 9] = null;
  }
  return puzzle;
}

// Pick theme by day of week
const WEEK_THEMES: DailyTheme[] = ["ocean", "forest", "space", "fire", "zen", "ocean", "forest"];
const OPERATION_NAMES = ["GHOST-7","SHADOW-3","CIPHER-9","PHANTOM-1","VECTOR-5","MATRIX-2","BREACH-8"];

export default function DailyChallenge() {
  const router = useRouter();
  const supabase = createClient();

  const todayTheme = WEEK_THEMES[new Date().getDay()];
  const operationName = OPERATION_NAMES[new Date().getDay()];

  // Game state
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [initial, setInitial] = useState<boolean[][] | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Map<string, Set<number>>>(new Map());
  const [noteMode, setNoteMode] = useState(false);
  const [solved, setSolved] = useState(false);
  const [flag, setFlag] = useState("");
  const [hints, setHints] = useState(3);
  const [analyst, setAnalyst] = useState("");
  const [analystLoading, setAnalystLoading] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const [loading, setLoading] = useState(true);

  // Session hook (handles pause state + timer + save/restore)
  const boardKey = `daily-${new Date().toDateString()}`;
  const { isPaused, formattedTime, pause, resume, reset, saveSession, clearSession } =
    useGameSession({
      boardKey,
      onRestore: (savedBoard) => {
        // If there's a saved session for today, restore it
        if (savedBoard && typeof savedBoard === "object" && "board" in (savedBoard as object)) {
          const s = savedBoard as { board: Board; solution: number[][]; initial: boolean[][] };
          setBoard(s.board);
          setSolution(s.solution);
          setInitial(s.initial);
        }
      },
    });

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  // Initialize puzzle
  useEffect(() => {
    // Small timeout so the loading screen shows, then we generate
    const t = setTimeout(() => {
      const sol = generateSolution();
      const puz = makePuzzle(sol);
      const ini = puz.map(r => r.map(c => c !== null));
      setSolution(sol);
      setBoard(puz);
      setInitial(ini);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const checkSolved = useCallback((b: Board, sol: number[][]) => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (b[r][c] !== sol[r][c]) return false;
    return true;
  }, []);

  const handleInput = (num: number) => {
    if (!board || !selected || !solution || !initial || isPaused) return;
    const [r, c] = selected;
    if (initial[r][c]) return;
    const key = `${r},${c}`;

    if (noteMode) {
      const newNotes = new Map(notes);
      const cell = new Set(newNotes.get(key) ?? []);
      cell.has(num) ? cell.delete(num) : cell.add(num);
      newNotes.set(key, cell);
      setNotes(newNotes);
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num === 0 ? null : num;
    const newErrors = new Set(errors);
    if (num !== 0 && num !== solution[r][c]) newErrors.add(key);
    else newErrors.delete(key);
    setErrors(newErrors);
    setBoard(newBoard);

    if (checkSolved(newBoard, solution)) {
      setSolved(true);
      const hash = btoa(`0xdoku-daily-${Date.now()}`).slice(0, 12).replace(/[+/=]/g, "x");
      setFlag(`nFac{d41ly_${hash}}`);
      clearSession();
      // Save to Supabase
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        supabase.from("games").insert({
          user_id: data.user.id,
          difficulty: 3,
          time_seconds: 0,
          errors: newErrors.size,
          flag: `nFac{d41ly_${hash}}`,
          is_daily: true,
        });
      });
    }
  };

  const useHint = () => {
    if (!board || !selected || !solution || !initial || hints <= 0 || isPaused) return;
    const [r, c] = selected;
    if (initial[r][c] || board[r][c] === solution[r][c]) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = solution[r][c];
    const newErrors = new Set(errors);
    newErrors.delete(`${r},${c}`);
    setErrors(newErrors);
    setBoard(newBoard);
    setHints(h => h - 1);
    if (checkSolved(newBoard, solution)) {
      setSolved(true);
      const hash = btoa(`0xdoku-daily-hint-${Date.now()}`).slice(0, 12).replace(/[+/=]/g, "x");
      setFlag(`nFac{d41ly_${hash}}`);
      clearSession();
    }
  };

  const getAnalysis = async () => {
    if (!board || !selected || !solution || isPaused) return;
    const [r, c] = selected;
    setAnalystLoading(true);
    setAnalyst("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, solution, row: r, col: c }),
      });
      const data = await res.json();
      setAnalyst(data.analysis ?? "SIGNAL LOST.");
    } catch {
      setAnalyst("[ERROR] AI ANALYST OFFLINE.");
    }
    setAnalystLoading(false);
  };

  const isHighlighted = (r: number, c: number) => {
    if (!selected) return false;
    const [sr, sc] = selected;
    return r === sr || c === sc ||
      (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3));
  };

  const isSameNum = (r: number, c: number) => {
    if (!selected || !board) return false;
    const val = board[selected[0]][selected[1]];
    return val !== null && board[r][c] === val;
  };

  const handleReset = () => {
    if (!solution) return;
    const puz = makePuzzle(solution);
    const ini = puz.map(r => r.map(c => c !== null));
    setBoard(puz);
    setInitial(ini);
    setErrors(new Set());
    setNotes(new Map());
    setSolved(false);
    setFlag("");
    setHints(3);
    setAnalyst("");
    reset();
    clearSession();
  };

  const handleSaveSession = () => {
    if (board && solution && initial) {
      saveSession({ board, solution, initial });
    }
  };

  const handleLeave = () => {
    router.push("/dashboard");
  };

  // Loading state
  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes gp { 0%,100% { opacity:.12; transform:scale(.8); } 50% { opacity:.9; transform:scale(1); } }
          * { box-sizing:border-box; margin:0; padding:0; }
          body { background:#050a05; }
        `}</style>
        <div style={{
          position: "fixed", inset: 0, background: "#050a05",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 20, fontFamily: "'JetBrains Mono',monospace",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "2px solid rgba(0,255,65,.1)", borderTopColor: "#00ff41",
            animation: "spin .8s linear infinite",
          }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,10px)", gap: 4 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: 2, background: "#00ff41",
                animation: `gp 1.2s ease-in-out ${i * 0.1}s infinite`,
              }} />
            ))}
          </div>
          <div style={{ color: "rgba(0,255,65,.35)", fontSize: ".68rem", letterSpacing: ".15em" }}>
            LOADING DAILY OPERATION...
          </div>
        </div>
      </>
    );
  }

  return (
    <DailyThemeBanner theme={todayTheme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }

        .daily-wrap { min-height:100vh; display:flex; flex-direction:column; }
        .daily-body { flex:1; display:flex; gap:2rem; padding:2rem; justify-content:center; align-items:flex-start; flex-wrap:wrap; }

        /* header */
        .daily-hdr { padding:.8rem 2rem; border-bottom:1px solid rgba(0,255,65,.1); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,.3); backdrop-filter:blur(8px); }
        .daily-hdr-meta { display:flex; gap:1.5rem; align-items:center; font-size:.72rem; font-family:'JetBrains Mono',monospace; }
        .daily-op { color:#00ff41; font-weight:700; letter-spacing:.1em; }
        .daily-timer { color:rgba(0,255,65,.7); font-size:.95rem; font-weight:700; }
        .live-dot { width:6px; height:6px; background:#00ff41; border-radius:50%; animation:pulse 2s infinite; display:inline-block; margin-right:5px; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }

        /* board */
        .board-wrap { flex-shrink:0; }
        .grid { display:grid; grid-template-columns:repeat(9,1fr); border:2px solid rgba(0,255,65,.35); width:min(90vw,480px); height:min(90vw,480px); background:rgba(0,0,0,.4); }
        .cell { border:1px solid rgba(0,255,65,.1); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .1s; position:relative; }
        .cell:hover { background:rgba(0,255,65,.06); }
        .cell.hl  { background:rgba(0,255,65,.04); }
        .cell.sn  { background:rgba(0,255,65,.1); }
        .cell.sel { background:rgba(0,255,65,.18)!important; outline:2px solid #00ff41; z-index:1; }
        .cell.err { background:rgba(255,61,61,.12)!important; }
        .cell.err .cell-num { color:#ff3d3d!important; }
        .cell-num { font-size:clamp(.9rem,3vw,1.3rem); font-weight:700; font-family:'JetBrains Mono',monospace; }
        .cell.given .cell-num { color:#fff; }
        .cell:not(.given) .cell-num { color:#00ff41; text-shadow:0 0 6px rgba(0,255,65,.5); }
        .notes-grid { display:grid; grid-template-columns:repeat(3,1fr); width:100%; height:100%; padding:2px; }
        .note-num { font-size:clamp(.35rem,1.2vw,.5rem); color:rgba(0,255,65,.5); display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; }

        /* controls */
        .controls { display:flex; flex-direction:column; gap:1.2rem; min-width:240px; max-width:300px; }
        .numpad { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; }
        .num-btn { background:rgba(0,255,65,.06); border:1px solid rgba(0,255,65,.15); color:#00ff41; font-family:'JetBrains Mono',monospace; font-size:1rem; font-weight:700; padding:.7rem; cursor:pointer; transition:all .15s; }
        .num-btn:hover { background:rgba(0,255,65,.15); border-color:#00ff41; }
        .num-btn.erase { color:#ff3d3d; border-color:rgba(255,61,61,.2); }
        .action-row { display:flex; gap:8px; }
        .action-btn { flex:1; background:transparent; border:1px solid rgba(0,255,65,.2); color:rgba(0,255,65,.6); font-family:'JetBrains Mono',monospace; font-size:.65rem; padding:.6rem; cursor:pointer; transition:all .2s; letter-spacing:.05em; }
        .action-btn:hover:not(:disabled) { border-color:#00ff41; color:#00ff41; }
        .action-btn.active { border-color:#00e5ff; color:#00e5ff; }
        .action-btn:disabled { opacity:.3; cursor:not-allowed; }
        .analyst-box { border:1px solid rgba(0,255,65,.15); padding:1rem; background:rgba(0,0,0,.3); }
        .analyst-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:.8rem; font-size:.65rem; color:rgba(0,255,65,.5); font-family:'JetBrains Mono',monospace; }
        .analyst-btn { background:rgba(0,255,65,.08); border:1px solid rgba(0,255,65,.2); color:#00ff41; font-family:'JetBrains Mono',monospace; font-size:.6rem; padding:.3rem .7rem; cursor:pointer; transition:all .2s; }
        .analyst-btn:hover:not(:disabled) { background:rgba(0,255,65,.15); }
        .analyst-btn:disabled { opacity:.4; cursor:not-allowed; }
        .analyst-out { font-size:.7rem; line-height:1.6; color:#00ff41; min-height:80px; max-height:120px; overflow-y:auto; word-break:break-word; font-family:'JetBrains Mono',monospace; }
        .analyst-idle { color:rgba(0,255,65,.35); }
        .status-row { display:flex; justify-content:space-between; font-size:.65rem; color:rgba(0,255,65,.4); font-family:'JetBrains Mono',monospace; }

        /* solved overlay */
        .solved-overlay { position:fixed; inset:0; background:rgba(5,10,5,.92); display:flex; align-items:center; justify-content:center; z-index:50; backdrop-filter:blur(4px); }
        .solved-box { border:1px solid rgba(0,255,65,.3); background:#050a05; padding:3rem 2.5rem; text-align:center; max-width:440px; width:90%; font-family:'JetBrains Mono',monospace; }
        .solved-tag { font-size:.65rem; color:rgba(0,255,65,.4); letter-spacing:.3em; margin-bottom:1rem; }
        .solved-title { font-size:2.2rem; font-weight:700; color:#00ff41; text-shadow:0 0 40px rgba(0,255,65,.5); margin-bottom:.5rem; }
        .solved-time { font-size:.8rem; color:rgba(0,255,65,.5); margin-bottom:1.5rem; }
        .flag-box { background:rgba(0,255,65,.08); border:1px solid rgba(0,255,65,.2); padding:1rem; font-size:.85rem; color:#00ff41; word-break:break-all; margin-bottom:.5rem; }
        .flag-hint { font-size:.65rem; color:rgba(0,255,65,.35); margin-bottom:2rem; }
        .solved-actions { display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
        .btn-primary { background:#00ff41; color:#050a05; border:none; padding:.8rem 1.8rem; font-family:'JetBrains Mono',monospace; font-size:.75rem; font-weight:700; cursor:pointer; letter-spacing:.1em; transition:all .2s; }
        .btn-primary:hover { background:#fff; }
        .btn-secondary { background:transparent; color:#00ff41; border:1px solid rgba(0,255,65,.3); padding:.8rem 1.8rem; font-family:'JetBrains Mono',monospace; font-size:.75rem; cursor:pointer; letter-spacing:.1em; transition:all .2s; }
        .btn-secondary:hover { border-color:#00ff41; }

        @media (max-width:600px) {
          .daily-body { padding:1rem; gap:1.5rem; }
          .controls { max-width:100%; min-width:unset; width:100%; }
        }
      `}</style>

      <div className="daily-wrap">
        <Navbar />

        {/* Sub-header */}
        <div className="daily-hdr">
          <div style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            <div style={{ fontSize: ".58rem", color: "rgba(0,255,65,.4)", letterSpacing: ".2em", marginBottom: 2 }}>
              <span className="live-dot" />DAILY OPERATION
            </div>
            <div className="daily-op">OP: {operationName}</div>
          </div>
          <div className="daily-hdr-meta">
            <span className="daily-timer">{formattedTime}</span>
            <span style={{ color: "rgba(0,255,65,.4)" }}>HINT ({hints})</span>
            <span style={{ color: "rgba(0,255,65,.4)", fontSize: ".6rem" }}>
              RESETS IN {23 - new Date().getHours()}h {59 - new Date().getMinutes()}m
            </span>
          </div>
        </div>

        <div className="daily-body">
          {/* Board */}
          <div className="board-wrap">
            <div className="grid">
              {board && board.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r},${c}`;
                  const isSelected = selected?.[0] === r && selected?.[1] === c;
                  const isErr = errors.has(key);
                  const isInit = initial?.[r][c];
                  const isHl = isHighlighted(r, c);
                  const isSame = isSameNum(r, c);
                  const cellNotes = notes.get(key);

                  return (
                    <div
                      key={key}
                      className={[
                        "cell",
                        isSelected ? "sel" : "",
                        isErr ? "err" : "",
                        isInit ? "given" : "",
                        isHl && !isSelected ? "hl" : "",
                        isSame && !isSelected ? "sn" : "",
                      ].join(" ")}
                      style={{
                        borderRight: (c + 1) % 3 === 0 && c !== 8 ? "2px solid rgba(0,255,65,.35)" : undefined,
                        borderBottom: (r + 1) % 3 === 0 && r !== 8 ? "2px solid rgba(0,255,65,.35)" : undefined,
                        opacity: isPaused ? 0 : 1,
                      }}
                      onClick={() => !isPaused && setSelected([r, c])}
                    >
                      {cell !== null ? (
                        <span className="cell-num">{cell}</span>
                      ) : cellNotes && cellNotes.size > 0 ? (
                        <div className="notes-grid">
                          {[1,2,3,4,5,6,7,8,9].map(n => (
                            <span key={n} className="note-num">{cellNotes.has(n) ? n : ""}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="controls">
            <div className="numpad">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} className="num-btn" onClick={() => handleInput(n)}>{n}</button>
              ))}
              <button className="num-btn erase" onClick={() => handleInput(0)}>⌫</button>
            </div>

            <div className="action-row">
              <button
                className={`action-btn ${noteMode ? "active" : ""}`}
                onClick={() => setNoteMode(v => !v)}
              >
                {noteMode ? "✎ NOTES ON" : "✎ NOTES"}
              </button>
              <button className="action-btn" onClick={useHint} disabled={hints === 0 || isPaused}>
                💡 HINT ({hints})
              </button>
            </div>

            <div className="analyst-box">
              <div className="analyst-hdr">
                <span>// AI ANALYST</span>
                <button
                  className="analyst-btn"
                  onClick={getAnalysis}
                  disabled={analystLoading || !selected || isPaused}
                >
                  {analystLoading ? "SCANNING..." : "REQUEST BRIEFING"}
                </button>
              </div>
              <div className="analyst-out">
                {analystLoading ? (
                  <span>ANALYZING SECTOR{cursorOn ? "█" : " "}</span>
                ) : analyst ? (
                  <span>{analyst}</span>
                ) : (
                  <span className="analyst-idle">
                    SELECT A CELL AND REQUEST BRIEFING{cursorOn ? "█" : " "}
                  </span>
                )}
              </div>
            </div>

            <div className="status-row">
              <span>ERRORS: <span style={{ color: errors.size > 0 ? "#ff3d3d" : "#00ff41" }}>{errors.size}</span></span>
              <span>NOTES: {noteMode ? <span style={{ color: "#00e5ff" }}>ON</span> : "OFF"}</span>
            </div>
          </div>
        </div>

        {/* Solved overlay */}
        {solved && (
          <div className="solved-overlay">
            <div className="solved-box">
              <p className="solved-tag">// DAILY OPERATION COMPLETE</p>
              <h2 className="solved-title">MISSION_SUCCESS</h2>
              <p className="solved-time">TIME: {formattedTime}</p>
              <div className="flag-box">{flag}</div>
              <p className="flag-hint">capture this flag. it&apos;s yours.</p>
              <div className="solved-actions">
                <button className="btn-primary" onClick={() => window.location.href = "/leaderboard"}>
                  VIEW HALL OF FAME
                </button>
                <button className="btn-secondary" onClick={handleReset}>
                  REPLAY
                </button>
                <button className="btn-secondary" onClick={() => router.push("/game")}>
                  NEW OPERATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game controls HUD (pause/resume/leave/music) */}
        <GameControls
          isDaily={true}
          dailyTheme={todayTheme}
          isPaused={isPaused}
          onPause={pause}
          onResume={resume}
          onReset={handleReset}
          onLeave={handleLeave}
          onSaveSession={handleSaveSession}
        />
      </div>
    </DailyThemeBanner>
  );
}