"use client";
/**
 * GameControls.tsx
 * Drop into: components/GameControls.tsx
 *
 * Floating corner HUD with pause/resume/reset/leave + music for daily ops.
 * Matches the existing 0xdoku JetBrains Mono + #050a05 / #00ff41 aesthetic.
 *
 * Usage in app/game/page.tsx or app/daily/page.tsx:
 *   <GameControls
 *     isDaily={false}
 *     dailyTheme="ocean"
 *     isPaused={isPaused}
 *     onPause={() => setIsPaused(true)}
 *     onResume={() => setIsPaused(false)}
 *     onReset={handleReset}
 *     onLeave={handleLeave}
 *     onSaveSession={() => saveSession(board)}
 *   />
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ── Theme config ──────────────────────────────────────────────────────────────
export type DailyTheme = "ocean" | "forest" | "space" | "fire" | "zen";

const THEMES: Record<DailyTheme, { label: string; accent: string; synth: string }> = {
  ocean:  { label: "🌊 OCEAN DEPTHS",  accent: "#00d4ff", synth: "ocean"  },
  forest: { label: "🌲 ANCIENT FOREST", accent: "#7fff4f", synth: "forest" },
  space:  { label: "🚀 DEEP SPACE",     accent: "#a78bfa", synth: "space"  },
  fire:   { label: "🔥 VOLCANIC",       accent: "#ff6b35", synth: "fire"   },
  zen:    { label: "☯ ZEN GARDEN",     accent: "#d4a85a", synth: "zen"    },
};

// ── Web Audio ambient synth (no external files) ───────────────────────────────
function createAmbientEngine(ctx: AudioContext, preset: string) {
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);

  const nodes: (AudioNode | { stop: () => void })[] = [];

  const pad = (freqs: number[], type: OscillatorType = "sine") => {
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      osc.detune.value = i * 3;
      g.gain.value = 0.08;
      osc.connect(g);
      g.connect(master);
      osc.start();
      nodes.push(osc, g);
    });
  };

  const pulse = (freq: number, interval: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(master);
    osc.start();
    const id = setInterval(() => {
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    }, interval);
    nodes.push(osc, g, { stop: () => clearInterval(id) });
  };

  switch (preset) {
    case "ocean":  pad([55, 82.5, 110, 164.8]); pad([220, 329.6, 440], "triangle"); pulse(40, 3200); break;
    case "forest": pad([65.4, 130.8, 196, 261.6]); pad([392, 523.2, 659], "triangle"); pulse(80, 2400); break;
    case "space":  pad([32.7, 65.4, 98, 130.8]); pulse(30, 5000); break;
    case "fire":   pad([73.4, 110, 146.8, 220], "sawtooth"); pad([440, 587.3], "triangle"); pulse(55, 1800); break;
    default:       pad([174.6, 261.6, 349.2, 440]); pad([523.2, 698.5], "triangle"); pulse(174.6, 4000);
  }

  return {
    setVolume: (v: number) => { master.gain.value = v * 0.25; },
    stop: () => nodes.forEach(n => {
      try { "stop" in n ? n.stop() : (n as AudioNode).disconnect?.(); } catch (_) {}
    }),
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface GameControlsProps {
  isDaily?: boolean;
  dailyTheme?: DailyTheme;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onLeave: () => void;
  onSaveSession?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GameControls({
  isDaily = false,
  dailyTheme = "ocean",
  isPaused,
  onPause,
  onResume,
  onReset,
  onLeave,
  onSaveSession,
}: GameControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<ReturnType<typeof createAmbientEngine> | null>(null);

  const theme = isDaily ? THEMES[dailyTheme] : null;
  const accent = theme?.accent ?? "#00ff41";

  // ── Music ──
  const startMusic = useCallback(() => {
    if (!isDaily) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    engineRef.current?.stop();
    engineRef.current = createAmbientEngine(audioCtxRef.current, THEMES[dailyTheme].synth);
    engineRef.current.setVolume(volume);
  }, [isDaily, dailyTheme, volume]);

  const stopMusic = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
  }, []);

  useEffect(() => {
    if (musicOn && isDaily) startMusic(); else stopMusic();
    return stopMusic;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicOn, isDaily]);

  useEffect(() => { engineRef.current?.setVolume(volume); }, [volume]);

  // ── Pause / resume ──
  const handlePause = () => { onPause(); if (musicOn) stopMusic(); };
  const handleResume = () => { onResume(); if (musicOn) startMusic(); };

  // ── Leave ──
  const handleLeaveClick = () => {
    if (!isPaused) onPause();
    setExpanded(false);
    setShowLeave(true);
  };
  const handleSaveLeave = () => { onSaveSession?.(); stopMusic(); onLeave(); setShowLeave(false); };
  const handleForceLeave = () => { stopMusic(); onLeave(); setShowLeave(false); };
  const handleCancelLeave = () => { setShowLeave(false); onResume(); if (musicOn) startMusic(); };

  return (
    <>
      <style>{`
        .gc-hud { position:fixed; top:16px; right:16px; z-index:900; display:flex; flex-direction:column; align-items:flex-end; gap:6px; font-family:'JetBrains Mono',monospace; }
        .gc-toggle { width:40px; height:40px; border-radius:8px; border:none; color:#050a05; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,.5); transition:opacity .15s; font-weight:700; }
        .gc-toggle:hover { opacity:.85; }
        .gc-menu { background:rgba(5,10,5,.95); border:1px solid rgba(0,255,65,.15); border-radius:8px; padding:6px 4px; display:flex; flex-direction:column; gap:2px; min-width:160px; box-shadow:0 8px 32px rgba(0,0,0,.6); }
        .gc-item { background:transparent; border:none; cursor:pointer; display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:6px; font-family:'JetBrains Mono',monospace; font-size:0.72rem; letter-spacing:.05em; transition:background .12s; text-align:left; width:100%; }
        .gc-item:hover { background:rgba(0,255,65,.07); }
        .gc-vol { display:flex; align-items:center; gap:8px; padding:4px 12px 8px; }
        .gc-vol span { font-size:.6rem; color:rgba(0,255,65,.4); font-family:'JetBrains Mono',monospace; }
        .gc-vol input[type=range] { flex:1; height:3px; }
        /* pause overlay */
        .gc-pause-overlay { position:fixed; inset:0; z-index:800; background:rgba(0,0,0,.8); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; }
        .gc-pause-card { background:#050a05; border:1px solid rgba(0,255,65,.2); border-radius:4px; padding:40px 52px; text-align:center; font-family:'JetBrains Mono',monospace; }
        .gc-pause-icon { font-size:48px; margin-bottom:8px; }
        .gc-pause-label { font-size:1.8rem; font-weight:700; letter-spacing:.2em; color:#00ff41; text-shadow:0 0 30px rgba(0,255,65,.4); margin-bottom:8px; }
        .gc-pause-theme { font-size:.65rem; letter-spacing:.15em; margin-bottom:20px; }
        /* leave modal */
        .gc-modal-overlay { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; }
        .gc-modal { background:#050a05; border:1px solid rgba(0,255,65,.2); border-radius:4px; padding:40px 36px 32px; text-align:center; max-width:360px; width:90%; font-family:'JetBrains Mono',monospace; }
        .gc-modal-icon { font-size:36px; margin-bottom:12px; }
        .gc-modal-title { color:#00ff41; font-size:1.1rem; font-weight:700; letter-spacing:.1em; margin:0 0 8px; }
        .gc-modal-body { color:rgba(0,255,65,.45); font-size:.68rem; line-height:1.7; margin:0 0 24px; }
        .gc-modal-actions { display:flex; flex-direction:column; gap:8px; }
        .gc-btn { border:none; border-radius:4px; padding:10px 16px; font-family:'JetBrains Mono',monospace; font-size:.72rem; font-weight:700; letter-spacing:.08em; cursor:pointer; transition:opacity .15s; }
        .gc-btn:hover { opacity:.85; }
        .gc-btn-save  { background:#00ff41; color:#050a05; }
        .gc-btn-leave { background:#ff3d3d; color:#fff; }
        .gc-btn-stay  { background:rgba(0,255,65,.08); color:rgba(0,255,65,.6); border:1px solid rgba(0,255,65,.15); }
        .gc-btn-resume { color:#050a05; width:100%; font-size:.85rem; margin-top:8px; padding:12px; }
      `}</style>

      {/* Pause overlay */}
      {isPaused && !showLeave && (
        <div className="gc-pause-overlay">
          <div className="gc-pause-card">
            <div className="gc-pause-icon">⏸</div>
            <div className="gc-pause-label">PAUSED</div>
            {theme && (
              <div className="gc-pause-theme" style={{ color: accent }}>{theme.label}</div>
            )}
            <button
              className="gc-btn gc-btn-resume"
              style={{ background: accent }}
              onClick={handleResume}
            >
              ▶ RESUME
            </button>
          </div>
        </div>
      )}

      {/* Leave modal */}
      {showLeave && (
        <div className="gc-modal-overlay">
          <div className="gc-modal">
            <div className="gc-modal-icon">⚠</div>
            <h2 className="gc-modal-title">ABORT MISSION?</h2>
            <p className="gc-modal-body">
              Your progress will be lost unless you save your session first.
            </p>
            <div className="gc-modal-actions">
              {onSaveSession && (
                <button className="gc-btn gc-btn-save" onClick={handleSaveLeave}>
                  💾 SAVE &amp; LEAVE
                </button>
              )}
              <button className="gc-btn gc-btn-leave" onClick={handleForceLeave}>
                🚪 LEAVE ANYWAY
              </button>
              <button className="gc-btn gc-btn-stay" onClick={handleCancelLeave}>
                ← STAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="gc-hud">
        <button
          className="gc-toggle"
          style={{ background: accent }}
          onClick={() => setExpanded(e => !e)}
          title="Game menu"
        >
          {expanded ? "✕" : "☰"}
        </button>

        {expanded && (
          <div className="gc-menu">
            {/* Pause / Resume */}
            {isPaused ? (
              <button className="gc-item" style={{ color: "#00ff41" }} onClick={() => { setExpanded(false); handleResume(); }}>
                <span>▶</span><span>RESUME</span>
              </button>
            ) : (
              <button className="gc-item" style={{ color: "#00ff41" }} onClick={() => { setExpanded(false); handlePause(); }}>
                <span>⏸</span><span>PAUSE</span>
              </button>
            )}

            {/* Reset */}
            <button
              className="gc-item"
              style={{ color: "rgba(0,255,65,.5)" }}
              onClick={() => { setExpanded(false); onReset(); }}
            >
              <span>↺</span><span>RESET BOARD</span>
            </button>

            {/* Music (daily only) */}
            {isDaily && (
              <>
                <button
                  className="gc-item"
                  style={{ color: musicOn ? accent : "rgba(0,255,65,.4)" }}
                  onClick={() => setMusicOn(m => !m)}
                >
                  <span>{musicOn ? "🔊" : "🔇"}</span>
                  <span>{musicOn ? "MUSIC ON" : "MUSIC OFF"}</span>
                </button>
                {musicOn && (
                  <div className="gc-vol">
                    <span>VOL</span>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={volume}
                      onChange={e => setVolume(Number(e.target.value))}
                      style={{ accentColor: accent }}
                    />
                  </div>
                )}
              </>
            )}

            <div style={{ height: 1, background: "rgba(0,255,65,.08)", margin: "4px 12px" }} />

            {/* Leave */}
            <button className="gc-item" style={{ color: "#ff3d3d" }} onClick={handleLeaveClick}>
              <span>🚪</span><span>LEAVE</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}