"use client";
import { useState, useEffect } from "react";

const BOOT_LINES = [
  "> INITIALIZING 0xdoku v2.026...",
  "> LOADING CIPHER ENGINE............[OK]",
  "> CONNECTING TO GLOBAL NETWORK.....[OK]",
  "> SCANNING FOR DAILY OPERATION.....[OK]",
  "> ACCESS GRANTED. WELCOME, AGENT.",
];

export default function Home() {
  const [bootStep, setBootStep] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [showMain, setShowMain] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (bootStep < BOOT_LINES.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, BOOT_LINES[bootStep]]);
        setBootStep((s) => s + 1);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowMain(true), 600);
      return () => clearTimeout(timer);
    }
  }, [bootStep]);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Share+Tech+Mono&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: #050a05;
          color: #00ff41;
          font-family: 'JetBrains Mono', monospace;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .scanlines {
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.08) 2px,
            rgba(0,0,0,0.08) 4px
          );
          pointer-events: none;
          z-index: 100;
        }

        .noise {
          position: fixed;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 99;
        }

        .boot-screen {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 3rem;
          gap: 0.5rem;
          animation: fadeOut 0.4s ease forwards;
          animation-play-state: paused;
        }

        .boot-screen.done {
          animation-play-state: running;
        }

        @keyframes fadeOut {
          to { opacity: 0; display: none; }
        }

        .boot-line {
          font-size: clamp(0.75rem, 2vw, 0.95rem);
          opacity: 0;
          animation: appear 0.1s ease forwards;
          text-shadow: 0 0 8px #00ff41;
        }

        @keyframes appear {
          to { opacity: 1; }
        }

        .main {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          opacity: 0;
          animation: fadeIn 0.8s ease 0.2s forwards;
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        .header {
          padding: 2rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0,255,65,0.15);
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .logo span { color: #fff; }

        .status {
          font-size: 0.7rem;
          color: rgba(0,255,65,0.6);
          display: flex;
          gap: 2rem;
        }

        .status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #00ff41;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem 2rem;
          text-align: center;
          position: relative;
        }

        .hero-tag {
          font-size: 0.7rem;
          color: rgba(0,255,65,0.5);
          letter-spacing: 0.3em;
          margin-bottom: 1.5rem;
        }

        .hero-title {
          font-size: clamp(4rem, 12vw, 9rem);
          font-weight: 700;
          line-height: 0.9;
          letter-spacing: -0.04em;
          margin-bottom: 0.5rem;
        }

        .hero-title .x { color: #fff; }
        .hero-title .doku { color: #00ff41; text-shadow: 0 0 40px rgba(0,255,65,0.5); }

        .hero-sub {
          font-size: clamp(0.7rem, 2vw, 0.85rem);
          color: rgba(0,255,65,0.6);
          letter-spacing: 0.25em;
          margin-bottom: 3rem;
        }

        .hero-sub .cursor {
          display: inline-block;
          width: 8px;
          height: 1em;
          background: #00ff41;
          margin-left: 4px;
          vertical-align: middle;
        }

        .ops-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(0,255,65,0.1);
          border: 1px solid rgba(0,255,65,0.1);
          margin-bottom: 3rem;
          max-width: 700px;
          width: 100%;
        }

        .op-card {
          background: #050a05;
          padding: 1.2rem 1rem;
          text-align: center;
          transition: background 0.2s;
          cursor: pointer;
        }

        .op-card:hover { background: rgba(0,255,65,0.05); }

        .op-level {
          font-size: 0.6rem;
          color: rgba(0,255,65,0.4);
          letter-spacing: 0.2em;
          margin-bottom: 0.4rem;
        }

        .op-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #00ff41;
        }

        .op-xp {
          font-size: 0.6rem;
          color: rgba(0,255,65,0.4);
          margin-top: 0.3rem;
        }

        .cta-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-primary {
          background: #00ff41;
          color: #050a05;
          border: none;
          padding: 0.9rem 2.5rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .btn-primary:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0,255,65,0.3);
        }

        .btn-secondary {
          background: transparent;
          color: #00ff41;
          border: 1px solid rgba(0,255,65,0.3);
          padding: 0.9rem 2.5rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .btn-secondary:hover {
          border-color: #00ff41;
          background: rgba(0,255,65,0.05);
        }

        .bottom-bar {
          padding: 1.5rem 3rem;
          border-top: 1px solid rgba(0,255,65,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.65rem;
          color: rgba(0,255,65,0.3);
        }

        .flag-preview {
          color: rgba(0,255,65,0.5);
          font-size: 0.65rem;
        }

        .glow-bg {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0,255,65,0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        @media (max-width: 600px) {
          .ops-grid { grid-template-columns: repeat(2, 1fr); }
          .header { padding: 1.5rem; }
          .hero { padding: 2rem 1rem; }
          .bottom-bar { flex-direction: column; gap: 0.5rem; text-align: center; }
          .status { display: none; }
        }
      `}</style>

      <div className="scanlines" />
      <div className="noise" />

      {!showMain ? (
        <div className={`boot-screen ${bootStep >= BOOT_LINES.length ? "done" : ""}`}>
          {displayedLines.map((line, i) => (
            <div key={i} className="boot-line" style={{ animationDelay: "0ms" }}>
              {line}
            </div>
          ))}
          {bootStep < BOOT_LINES.length && (
            <span style={{ opacity: cursorVisible ? 1 : 0, color: "#00ff41" }}>█</span>
          )}
        </div>
      ) : (
        <div className="main">
          <header className="header">
            <div className="logo">
              <span>0x</span><span style={{color:"#00ff41"}}>doku</span>
            </div>
            <div className="status">
              <span><span className="status-dot" />SYSTEM ONLINE</span>
              <span><span className="status-dot" style={{animationDelay:"1s"}} />DAILY OP ACTIVE</span>
              <span><span className="status-dot" style={{animationDelay:"0.5s"}} />v2.026</span>
            </div>
          </header>

          <main className="hero">
            <div className="glow-bg" />
            <p className="hero-tag">// EVERY PUZZLE IS AN OPERATION</p>
            <h1 className="hero-title">
              <span className="x">0x</span><span className="doku">doku</span>
            </h1>
            <p className="hero-sub">
              CRACK THE GRID. CAPTURE THE FLAG.
              <span className="cursor" style={{ opacity: cursorVisible ? 1 : 0 }} />
            </p>

            <div className="ops-grid">
              {[
                { level: "LVL 01", name: "RECON", xp: "100 XP" },
                { level: "LVL 02", name: "INFILTRATE", xp: "250 XP" },
                { level: "LVL 03", name: "DECRYPT", xp: "500 XP" },
                { level: "LVL 04", name: "ZERO-DAY", xp: "1200 XP" },
              ].map((op) => (
                <div className="op-card" key={op.name}>
                  <div className="op-level">{op.level}</div>
                  <div className="op-name">{op.name}</div>
                  <div className="op-xp">{op.xp}</div>
                </div>
              ))}
            </div>

            <div className="cta-row">
              <a href="/auth"><button className="btn-primary">INITIATE OPERATION</button></a>
              <button className="btn-secondary">DAILY OPS</button>
            </div>
          </main>

          <footer className="bottom-bar">
            <span>SECURE_SESSION_v2.026 // CIPHER ENGINE ACTIVE</span>
            <span className="flag-preview">nFac{"{"} s0lv3_th3_gr1d {"}"}</span>
            <span>HALL OF FAME ↗</span>
          </footer>
        </div>
      )}
    </>
  );
}