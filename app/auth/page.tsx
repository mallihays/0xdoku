"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

function validatePassword(pw: string) {
  const errors = [];
  if (pw.length < 8) errors.push("min 8 characters");
  if (!/[0-9]/.test(pw)) errors.push("at least 1 number");
  if (!/[^a-zA-Z0-9]/.test(pw)) errors.push("at least 1 special char");
  return errors;
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (resetError) setError(resetError.message);
      else setMessage("RESET LINK SENT. CHECK YOUR EMAIL.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const errors = validatePassword(password);
      if (errors.length > 0) {
        setError("WEAK PASSWORD: " + errors.join(", "));
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }

      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          username: username || email.split("@")[0],
          city: city || "Unknown",
          xp: 0,
          rank: "RECON",
          streak: 0,
        });
      }
      setMessage("AGENT CREATED. ACCESS GRANTED.");
      setTimeout(() => router.push("/dashboard"), 1000);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050a05; color: #00ff41; font-family: 'JetBrains Mono', monospace; }
        .auth-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; }
        .auth-box { border: 1px solid rgba(0,255,65,0.2); padding: 3rem 2.5rem; width: 100%; max-width: 440px; }
        .auth-logo { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.5rem; }
        .auth-logo span { color: #00ff41; }
        .auth-sub { font-size: 0.65rem; color: rgba(0,255,65,0.4); letter-spacing: 0.2em; margin-bottom: 2.5rem; }
        .tab-row { display: flex; gap: 1px; background: rgba(0,255,65,0.1); margin-bottom: 2rem; }
        .tab { flex: 1; background: #050a05; border: none; color: rgba(0,255,65,0.4); font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; padding: 0.7rem; cursor: pointer; letter-spacing: 0.1em; transition: all 0.2s; }
        .tab.active { color: #00ff41; background: rgba(0,255,65,0.08); }
        .field { margin-bottom: 1.2rem; }
        .field label { display: block; font-size: 0.65rem; color: rgba(0,255,65,0.5); letter-spacing: 0.15em; margin-bottom: 0.4rem; }
        .field input { width: 100%; background: rgba(0,255,65,0.04); border: 1px solid rgba(0,255,65,0.15); color: #00ff41; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; padding: 0.7rem 0.9rem; outline: none; transition: border 0.2s; }
        .field input:focus { border-color: #00ff41; }
        .field input::placeholder { color: rgba(0,255,65,0.2); }
        .pw-strength { margin-top: 0.4rem; display: flex; flex-direction: column; gap: 0.2rem; }
        .pw-rule { font-size: 0.6rem; }
        .pw-rule.ok { color: #00ff41; }
        .pw-rule.fail { color: rgba(255,61,61,0.7); }
        .btn-submit { width: 100%; background: #00ff41; color: #050a05; border: none; padding: 0.9rem; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
        .btn-submit:hover { background: #fff; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .msg { margin-top: 1rem; font-size: 0.7rem; padding: 0.7rem; }
        .msg.error { color: #ff3d3d; border: 1px solid rgba(255,61,61,0.2); background: rgba(255,61,61,0.05); }
        .msg.success { color: #00ff41; border: 1px solid rgba(0,255,65,0.2); background: rgba(0,255,65,0.05); }
        .forgot-link { font-size: 0.6rem; color: rgba(0,255,65,0.35); cursor: pointer; text-align: right; margin-top: -0.8rem; margin-bottom: 1rem; display: block; background: none; border: none; font-family: 'JetBrains Mono', monospace; width: 100%; }
        .forgot-link:hover { color: #00ff41; }
        .back { display: block; text-align: center; margin-top: 1.5rem; font-size: 0.65rem; color: rgba(0,255,65,0.35); text-decoration: none; }
        .back:hover { color: #00ff41; }
      `}</style>

      <div className="auth-wrap">
        <div className="auth-box">
          <div className="auth-logo"><span>0x</span>doku</div>
          <p className="auth-sub">
            {mode === "forgot" ? "// PASSWORD RECOVERY PROTOCOL" : "// AGENT AUTHENTICATION REQUIRED"}
          </p>

          {mode !== "forgot" && (
            <div className="tab-row">
              <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>LOGIN</button>
              <button className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>REGISTER</button>
            </div>
          )}

          {mode === "signup" && (
            <>
              <div className="field">
                <label>AGENT CALLSIGN</label>
                <input type="text" placeholder="h4ck3r_name" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="field">
                <label>CITY / BASE</label>
                <input type="text" placeholder="Almaty" value={city} onChange={e => setCity(e.target.value)} />
              </div>
            </>
          )}

          <div className="field">
            <label>EMAIL</label>
            <input type="email" placeholder="agent@0xdoku.io" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {mode !== "forgot" && (
            <div className="field">
              <label>PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (mode === "signup") setPwErrors(validatePassword(e.target.value));
                }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              {mode === "signup" && password.length > 0 && (
                <div className="pw-strength">
                  {[
                    { label: "min 8 chars", ok: password.length >= 8 },
                    { label: "has number", ok: /[0-9]/.test(password) },
                    { label: "has special char", ok: /[^a-zA-Z0-9]/.test(password) },
                  ].map(r => (
                    <span key={r.label} className={`pw-rule ${r.ok ? "ok" : "fail"}`}>
                      {r.ok ? "✓" : "✗"} {r.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "login" && (
            <button className="forgot-link" onClick={() => setMode("forgot")}>
              FORGOT PASSWORD?
            </button>
          )}

          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "PROCESSING..." : mode === "login" ? "INITIATE SESSION" : mode === "signup" ? "CREATE AGENT" : "SEND RESET LINK"}
          </button>

          {error && <div className="msg error">⚠ {error}</div>}
          {message && <div className="msg success">✓ {message}</div>}

          {mode === "forgot" && (
            <button className="back" onClick={() => setMode("login")}>← BACK TO LOGIN</button>
          )}
          <a href="/" className="back">← ABORT</a>
        </div>
      </div>
    </>
  );
}