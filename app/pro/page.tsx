"use client";
import Navbar from "@/components/Navbar";

export default function ProPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050a05; color: #00ff41; font-family: 'JetBrains Mono', monospace; }
        .pro { max-width: 800px; margin: 0 auto; padding: 2rem; }
        .pro-tag { font-size: 0.65rem; color: rgba(255,215,0,0.5); letter-spacing: 0.25em; margin-bottom: 0.5rem; }
        .pro-title { font-size: 2.5rem; font-weight: 700; color: #ffd700; margin-bottom: 0.5rem; }
        .pro-sub { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 3rem; }
        .plans { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem; }
        @media (max-width: 600px) { .plans { grid-template-columns: 1fr; } }
        .plan { border: 1px solid rgba(0,255,65,0.15); padding: 2rem; }
        .plan.featured { border-color: rgba(255,215,0,0.4); background: rgba(255,215,0,0.02); }
        .plan-badge { font-size: 0.58rem; letter-spacing: 0.15em; color: #ffd700; margin-bottom: 0.8rem; }
        .plan-name { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.3rem; }
        .plan-price { font-size: 2rem; font-weight: 700; color: #ffd700; margin-bottom: 0.2rem; }
        .plan-period { font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-bottom: 1.5rem; }
        .feature-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.5rem; }
        .feature { font-size: 0.7rem; color: rgba(0,255,65,0.7); }
        .feature::before { content: "[x] "; color: #00ff41; }
        .feature.locked { color: rgba(255,255,255,0.2); }
        .feature.locked::before { content: "[ ] "; color: rgba(255,255,255,0.2); }
        .btn-pro { width: 100%; background: #ffd700; color: #050a05; border: none; padding: 0.9rem; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; }
        .btn-pro:hover { background: #fff; }
        .btn-free { width: 100%; background: transparent; color: rgba(0,255,65,0.5); border: 1px solid rgba(0,255,65,0.2); padding: 0.9rem; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; }
        .btn-free:hover { border-color: #00ff41; color: #00ff41; }
        .coming-soon { text-align: center; font-size: 0.65rem; color: rgba(255,215,0,0.3); padding: 1rem; border: 1px solid rgba(255,215,0,0.1); }
        .skins-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-top: 2rem; }
        .skin-card { border: 1px solid rgba(0,255,65,0.1); padding: 1.2rem; text-align: center; cursor: pointer; transition: all 0.2s; }
        .skin-card:hover { border-color: rgba(255,215,0,0.3); }
        .skin-card.locked { opacity: 0.4; }
        .skin-preview { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .skin-name { font-size: 0.6rem; color: rgba(0,255,65,0.5); }
        .section-title { font-size: 0.65rem; color: rgba(0,255,65,0.4); letter-spacing: 0.2em; margin-bottom: 1.2rem; }
      `}</style>

      <Navbar />
      <div className="pro">
        <p className="pro-tag">// CLASSIFIED UPGRADE</p>
        <h1 className="pro-title">⚡ GO PRO</h1>
        <p className="pro-sub">Unlock the full arsenal. Become the top agent.</p>

        <div className="plans">
          <div className="plan">
            <div className="plan-badge">FREE TIER</div>
            <div className="plan-name">AGENT</div>
            <div className="plan-price">$0</div>
            <div className="plan-period">forever free</div>
            <div className="feature-list">
              <div className="feature">All difficulty levels</div>
              <div className="feature">3 hints per game</div>
              <div className="feature">Basic leaderboard</div>
              <div className="feature">Daily challenge</div>
              <div className="feature locked">Custom themes</div>
              <div className="feature locked">Unlimited hints</div>
              <div className="feature locked">Pro badge</div>
            </div>
            <button className="btn-free" onClick={() => window.location.href="/game"}>CONTINUE FREE</button>
          </div>

          <div className="plan featured">
            <div className="plan-badge">⚡ RECOMMENDED</div>
            <div className="plan-name" style={{color:"#ffd700"}}>GHOST AGENT</div>
            <div className="plan-price">$4.99</div>
            <div className="plan-period">per month</div>
            <div className="feature-list">
              <div className="feature">Everything in Free</div>
              <div className="feature">Unlimited hints</div>
              <div className="feature">Custom terminal themes</div>
              <div className="feature">Pro badge on leaderboard</div>
              <div className="feature">Priority in Hall of Fame</div>
              <div className="feature">Exclusive agent skins</div>
              <div className="feature">Ad-free experience</div>
            </div>
            <button className="btn-pro" onClick={() => alert("STRIPE INTEGRATION COMING SOON\n\nnFac{pr0_unl0ck3d}")}>
              UPGRADE NOW
            </button>
          </div>
        </div>

        <div className="section-title">// AGENT SKINS (PRO EXCLUSIVE)</div>
        <div className="skins-grid">
          {[
            { name: "MATRIX", icon: "🟢", free: true },
            { name: "BLOOD", icon: "🔴", free: false },
            { name: "VOID", icon: "🟣", free: false },
            { name: "FROST", icon: "🔵", free: false },
            { name: "GOLD", icon: "🟡", free: false },
            { name: "GHOST", icon: "⬜", free: false },
          ].map(s => (
            <div key={s.name} className={`skin-card ${s.free ? "" : "locked"}`}>
              <div className="skin-preview">{s.icon}</div>
              <div className="skin-name">{s.name}</div>
              {!s.free && <div style={{fontSize:"0.55rem", color:"rgba(255,215,0,0.4)", marginTop:"0.3rem"}}>PRO</div>}
            </div>
          ))}
        </div>

        <div className="coming-soon" style={{marginTop:"2rem"}}>
          STRIPE PAYMENT INTEGRATION COMING SOON — INFRASTRUCTURE READY
        </div>
      </div>
    </>
  );
}
