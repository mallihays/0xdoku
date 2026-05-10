"use client";
import { useState, useEffect, useCallback } from "react";

// ── Sudoku generator ────────────────────────────────────────────────
type Board = (number | null)[][];

function generateSolution(): number[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

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
          const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
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

function makePuzzle(solution: number[][], difficulty: number): Board {
  const puzzle: Board = solution.map(r => [...r]);
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const removeCount = difficulty === 0 ? 30 : difficulty === 1 ? 40 : difficulty === 2 ? 50 : 58;
  for (let i = 0; i < removeCount; i++) {
    const idx = cells[i];
    puzzle[Math.floor(idx / 9)][idx % 9] = null;
  }
  return puzzle;
}

const DIFFICULTIES = [
  { name: "RECON", xp: 100, color: "#00ff41" },
  { name: "INFILTRATE", xp: 250, color: "#00e5ff" },
  { name: "DECRYPT", xp: 500, color: "#ff9800" },
  { name: "ZERO-DAY", xp: 1200, color: "#ff3d3d" },
];

export default function GamePage() {
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [initial, setInitial] = useState<boolean[][] | null>(null);
  const [selected, setSelected] = useState<[number,number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Map<string, Set<number>>>(new Map());
  const [noteMode, setNoteMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(false);
  const [flag, setFlag] = useState("");
  const [cursorOn, setCursorOn] = useState(true);
  const [hints, setHints] = useState(3);
  const [analyst, setAnalyst] = useState("");
  const [analystLoading, setAnalystLoading] = useState(false);

  // cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  // timer
  useEffect(() => {
    if (!running || solved) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, solved]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const startGame = (diff: number) => {
    const sol = generateSolution();
    const puz = makePuzzle(sol, diff);
    const ini = puz.map(r => r.map(c => c !== null));
    setDifficulty(diff);
    setSolution(sol);
    setBoard(puz);
    setInitial(ini);
    setSelected(null);
    setErrors(new Set());
    setNotes(new Map());
    setSeconds(0);
    setSolved(false);
    setFlag("");
    setHints(3);
    setAnalyst("");
    setRunning(true);
  };

  const checkSolved = useCallback((b: Board, sol: number[][]) => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (b[r][c] !== sol[r][c]) return false;
    return true;
  }, []);

  const handleInput = (num: number) => {
    if (!board || !selected || !solution || !initial) return;
    const [r, c] = selected;
    if (initial[r][c]) return;
    const key = `${r},${c}`;

    if (noteMode) {
      const newNotes = new Map(notes);
      const cellNotes = new Set(newNotes.get(key) || []);
      cellNotes.has(num) ? cellNotes.delete(num) : cellNotes.add(num);
      newNotes.set(key, cellNotes);
      setNotes(newNotes);
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num === 0 ? null : num;
    const newErrors = new Set(errors);
    if (num !== 0 && num !== solution[r][c]) {
      newErrors.add(key);
    } else {
      newErrors.delete(key);
    }
    setErrors(newErrors);
    setBoard(newBoard);

    if (checkSolved(newBoard, solution)) {
      setSolved(true);
      setRunning(false);
      const hash = btoa(`0xdoku-${Date.now()}-${difficulty}`).slice(0, 12).replace(/[+/=]/g, "x");
      setFlag(`nFac{${hash}}`);
    }
  };

  const useHint = () => {
    if (!board || !selected || !solution || !initial || hints <= 0) return;
    const [r, c] = selected;
    if (initial[r][c] || board[r][c] === solution[r][c]) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = solution[r][c];
    const key = `${r},${c}`;
    const newErrors = new Set(errors);
    newErrors.delete(key);
    setErrors(newErrors);
    setBoard(newBoard);
    setHints(h => h - 1);
    if (checkSolved(newBoard, solution)) {
      setSolved(true);
      setRunning(false);
      const hash = btoa(`0xdoku-hint-${Date.now()}`).slice(0, 12).replace(/[+/=]/g, "x");
      setFlag(`nFac{${hash}}`);
    }
  };

  const getAnalysis = async () => {
    if (!board || !selected || !solution) return;
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
      setAnalyst(data.analysis || "SIGNAL LOST.");
    } catch {
      setAnalyst("[ERROR] AI ANALYST OFFLINE. CHECK CONNECTION.");
    }
    setAnalystLoading(false);
  };

  const isHighlighted = (r: number, c: number) => {
    if (!selected) return false;
    const [sr, sc] = selected;
    return r === sr || c === sc ||
      (Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3));
  };

  const isSameNum = (r: number, c: number) => {
    if (!selected || !board) return false;
    const [sr, sc] = selected;
    const val = board[sr][sc];
    return val !== null && board[r][c] === val;
  };

  // ── Select screen ─────────────────────────────────────────────────
  if (difficulty === null) {
    return (
      <>
        <Style />
        <div className="select-screen">
          <div className="select-inner">
            <p className="select-tag">// SELECT OPERATION LEVEL</p>
            <h2 className="select-title">CHOOSE YOUR MISSION</h2>
            <div className="diff-grid">
              {DIFFICULTIES.map((d, i) => (
                <button key={d.name} className="diff-card" onClick={() => startGame(i)}
                  style={{ "--accent": d.color } as React.CSSProperties}>
                  <span className="diff-num">0{i+1}</span>
                  <span className="diff-name">{d.name}</span>
                  <span className="diff-xp">+{d.xp} XP</span>
                </button>
              ))}
            </div>
            <a href="/" className="back-link">← ABORT MISSION</a>
          </div>
        </div>
      </>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────
  const diff = DIFFICULTIES[difficulty];

  return (
    <>
      <Style />
      <div className="game-wrap">
        {/* Header */}
        <div className="game-header">
          <a href="/" className="logo-sm">0x<span>doku</span></a>
          <div className="game-meta">
            <span className="op-badge" style={{ color: diff.color }}>
              OP: {diff.name}
            </span>
            <span className="timer">{formatTime(seconds)}</span>
            <span className="xp-badge">+{diff.xp} XP</span>
          </div>
        </div>

        <div className="game-body">
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
                      className={`cell ${isSelected ? "selected" : ""} ${isErr ? "error" : ""} ${isInit ? "given" : ""} ${isHl && !isSelected ? "highlight" : ""} ${isSame && !isSelected ? "same-num" : ""}`}
                      style={{
                        borderRight: (c+1) % 3 === 0 && c !== 8 ? "2px solid rgba(0,255,65,0.4)" : undefined,
                        borderBottom: (r+1) % 3 === 0 && r !== 8 ? "2px solid rgba(0,255,65,0.4)" : undefined,
                      }}
                      onClick={() => setSelected([r, c])}
                    >
                      {cell !== null ? (
                        <span className="cell-num">{cell}</span>
                      ) : cellNotes && cellNotes.size > 0 ? (
                        <div className="notes-grid">
                          {[1,2,3,4,5,6,7,8,9].map(n => (
                            <span key={n} className="note-num">
                              {cellNotes.has(n) ? n : ""}
                            </span>
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
            {/* Numpad */}
            <div className="numpad">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} className="num-btn" onClick={() => handleInput(n)}>{n}</button>
              ))}
              <button className="num-btn erase" onClick={() => handleInput(0)}>⌫</button>
            </div>

            {/* Action buttons */}
            <div className="action-row">
              <button
                className={`action-btn ${noteMode ? "active" : ""}`}
                onClick={() => setNoteMode(v => !v)}
              >
                {noteMode ? "✎ NOTES ON" : "✎ NOTES"}
              </button>
              <button className="action-btn" onClick={useHint} disabled={hints === 0}>
                💡 HINT ({hints})
              </button>
            </div>

            {/* AI Analyst */}
            <div className="analyst-box">
              <div className="analyst-header">
                <span>// AI ANALYST</span>
                <button className="analyst-btn" onClick={getAnalysis} disabled={analystLoading || !selected}>
                  {analystLoading ? "SCANNING..." : "REQUEST BRIEFING"}
                </button>
              </div>
              <div className="analyst-output">
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

            {/* Error count */}
            <div className="status-row">
              <span>ERRORS: <span style={{color: errors.size > 0 ? "#ff3d3d" : "#00ff41"}}>{errors.size}</span></span>
              <span>NOTES: {noteMode ? <span style={{color:"#00e5ff"}}>ON</span> : "OFF"}</span>
            </div>
          </div>
        </div>

        {/* Solved overlay */}
        {solved && (
          <div className="solved-overlay">
            <div className="solved-box">
              <p className="solved-tag">// OPERATION COMPLETE</p>
              <h2 className="solved-title">ACCESS_GRANTED</h2>
              <p className="solved-time">TIME: {formatTime(seconds)}</p>
              <div className="flag-box">{flag}</div>
              <p className="flag-hint">capture this flag. it's yours.</p>
              <div className="solved-actions">
                <button className="btn-primary" onClick={() => startGame(difficulty)}>NEW OPERATION</button>
                <button className="btn-secondary" onClick={() => setDifficulty(null)}>CHANGE LEVEL</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #050a05; color: #00ff41; font-family: 'JetBrains Mono', monospace; }

      /* SELECT */
      .select-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
      .select-inner { text-align: center; }
      .select-tag { font-size: 0.7rem; color: rgba(0,255,65,0.4); letter-spacing: 0.3em; margin-bottom: 1rem; }
      .select-title { font-size: 2rem; font-weight: 700; margin-bottom: 2.5rem; }
      .diff-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: rgba(0,255,65,0.1); border: 1px solid rgba(0,255,65,0.15); margin-bottom: 2rem; max-width: 480px; }
      .diff-card { background: #050a05; border: none; padding: 2rem 1.5rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.4rem; align-items: center; transition: background 0.2s; font-family: 'JetBrains Mono', monospace; }
      .diff-card:hover { background: rgba(0,255,65,0.05); }
      .diff-num { font-size: 0.65rem; color: rgba(0,255,65,0.3); }
      .diff-name { font-size: 1.1rem; font-weight: 700; color: var(--accent); }
      .diff-xp { font-size: 0.65rem; color: rgba(0,255,65,0.4); }
      .back-link { font-size: 0.7rem; color: rgba(0,255,65,0.4); text-decoration: none; letter-spacing: 0.1em; }
      .back-link:hover { color: #00ff41; }

      /* GAME */
      .game-wrap { min-height: 100vh; display: flex; flex-direction: column; }
      .game-header { padding: 1rem 2rem; border-bottom: 1px solid rgba(0,255,65,0.12); display: flex; justify-content: space-between; align-items: center; }
      .logo-sm { font-size: 1.1rem; font-weight: 700; text-decoration: none; color: #fff; }
      .logo-sm span { color: #00ff41; }
      .game-meta { display: flex; gap: 1.5rem; align-items: center; font-size: 0.75rem; }
      .op-badge { font-weight: 700; letter-spacing: 0.1em; }
      .timer { color: rgba(0,255,65,0.8); font-size: 1rem; font-weight: 700; }
      .xp-badge { color: rgba(0,255,65,0.4); }

      .game-body { flex: 1; display: flex; gap: 2rem; padding: 2rem; justify-content: center; align-items: flex-start; flex-wrap: wrap; }

      /* GRID */
      .board-wrap { flex-shrink: 0; }
      .grid { display: grid; grid-template-columns: repeat(9, 1fr); border: 2px solid rgba(0,255,65,0.4); width: min(90vw, 480px); height: min(90vw, 480px); }
      .cell { border: 1px solid rgba(0,255,65,0.12); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.1s; position: relative; }
      .cell:hover { background: rgba(0,255,65,0.06); }
      .cell.highlight { background: rgba(0,255,65,0.04); }
      .cell.same-num { background: rgba(0,255,65,0.1); }
      .cell.selected { background: rgba(0,255,65,0.18) !important; outline: 2px solid #00ff41; z-index: 1; }
      .cell.error { background: rgba(255,61,61,0.12) !important; }
      .cell.error .cell-num { color: #ff3d3d !important; }
      .cell-num { font-size: clamp(0.9rem, 3vw, 1.3rem); font-weight: 700; }
      .cell.given .cell-num { color: #fff; }
      .cell:not(.given) .cell-num { color: #00ff41; text-shadow: 0 0 6px rgba(0,255,65,0.5); }

      .notes-grid { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; height: 100%; padding: 2px; }
      .note-num { font-size: clamp(0.35rem, 1.2vw, 0.5rem); color: rgba(0,255,65,0.5); display: flex; align-items: center; justify-content: center; }

      /* CONTROLS */
      .controls { display: flex; flex-direction: column; gap: 1.2rem; min-width: 240px; max-width: 300px; }
      .numpad { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
      .num-btn { background: rgba(0,255,65,0.06); border: 1px solid rgba(0,255,65,0.15); color: #00ff41; font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 700; padding: 0.7rem; cursor: pointer; transition: all 0.15s; }
      .num-btn:hover { background: rgba(0,255,65,0.15); border-color: #00ff41; }
      .num-btn.erase { color: #ff3d3d; border-color: rgba(255,61,61,0.2); }

      .action-row { display: flex; gap: 8px; }
      .action-btn { flex: 1; background: transparent; border: 1px solid rgba(0,255,65,0.2); color: rgba(0,255,65,0.6); font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; padding: 0.6rem; cursor: pointer; transition: all 0.2s; letter-spacing: 0.05em; }
      .action-btn:hover:not(:disabled) { border-color: #00ff41; color: #00ff41; }
      .action-btn.active { border-color: #00e5ff; color: #00e5ff; }
      .action-btn:disabled { opacity: 0.3; cursor: not-allowed; }

      .analyst-box { border: 1px solid rgba(0,255,65,0.15); padding: 1rem; }
      .analyst-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; font-size: 0.65rem; color: rgba(0,255,65,0.5); }
      .analyst-btn { background: rgba(0,255,65,0.08); border: 1px solid rgba(0,255,65,0.2); color: #00ff41; font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; padding: 0.3rem 0.7rem; cursor: pointer; transition: all 0.2s; }
      .analyst-btn:hover:not(:disabled) { background: rgba(0,255,65,0.15); }
      .analyst-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .analyst-output { font-size: 0.7rem; line-height: 1.6;  color: #00ff41;  min-height: 100px; max-height: 120px;overflow-y: auto; word-break: break-word;
}
      .analyst-idle { color: rgba(0,255,65,0.35); }

      .status-row { display: flex; justify-content: space-between; font-size: 0.65rem; color: rgba(0,255,65,0.4); padding: 0 0.2rem; }

      /* SOLVED */
      .solved-overlay { position: fixed; inset: 0; background: rgba(5,10,5,0.92); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(4px); }
      .solved-box { border: 1px solid rgba(0,255,65,0.3); background: #050a05; padding: 3rem 2.5rem; text-align: center; max-width: 440px; width: 90%; }
      .solved-tag { font-size: 0.65rem; color: rgba(0,255,65,0.4); letter-spacing: 0.3em; margin-bottom: 1rem; }
      .solved-title { font-size: 2.5rem; font-weight: 700; color: #00ff41; text-shadow: 0 0 40px rgba(0,255,65,0.5); margin-bottom: 0.5rem; }
      .solved-time { font-size: 0.8rem; color: rgba(0,255,65,0.5); margin-bottom: 1.5rem; }
      .flag-box { background: rgba(0,255,65,0.08); border: 1px solid rgba(0,255,65,0.2); padding: 1rem; font-size: 0.9rem; color: #00ff41; letter-spacing: 0.05em; margin-bottom: 0.5rem; word-break: break-all; }
      .flag-hint { font-size: 0.65rem; color: rgba(0,255,65,0.35); margin-bottom: 2rem; }
      .solved-actions { display: flex; gap: 0.8rem; justify-content: center; }
      .btn-primary { background: #00ff41; color: #050a05; border: none; padding: 0.8rem 1.8rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 700; cursor: pointer; letter-spacing: 0.1em; transition: all 0.2s; }
      .btn-primary:hover { background: #fff; }
      .btn-secondary { background: transparent; color: #00ff41; border: 1px solid rgba(0,255,65,0.3); padding: 0.8rem 1.8rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; cursor: pointer; letter-spacing: 0.1em; transition: all 0.2s; }
      .btn-secondary:hover { border-color: #00ff41; }

      @media (max-width: 600px) {
        .game-body { padding: 1rem; gap: 1.5rem; }
        .controls { max-width: 100%; min-width: unset; width: 100%; }
        .game-header { padding: 0.8rem 1rem; }
        .game-meta { gap: 0.8rem; font-size: 0.65rem; }
      }
    `}</style>
  );
}