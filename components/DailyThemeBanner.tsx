"use client";
/**
 * DailyThemeBanner.tsx
 * Drop into: components/DailyThemeBanner.tsx
 *
 * Full-page themed background + animated particles for daily challenges.
 * Wrap your daily game content inside this component.
 *
 * Usage in app/daily/page.tsx:
 *
 *   const WEEK_THEMES = ["ocean","forest","space","fire","zen","ocean","forest"];
 *   const todayTheme = WEEK_THEMES[new Date().getDay()];
 *
 *   return (
 *     <DailyThemeBanner theme={todayTheme}>
 *       <Navbar />
 *       <YourBoard />
 *       <GameControls isDaily dailyTheme={todayTheme} ... />
 *     </DailyThemeBanner>
 *   );
 */

import { useEffect, useRef, type ReactNode } from "react";
import type { DailyTheme } from "./GameControls";

const THEMES: Record<DailyTheme, {
  label: string;
  bg: string;
  accent: string;
  glow: string;
  particle: string;
  subtitle: string;
}> = {
  ocean: {
    label: "🌊 OCEAN DEPTHS",
    bg: "radial-gradient(ellipse at 50% 0%,#0d3b6e 0%,#0a1628 60%,#050d18 100%)",
    accent: "#00d4ff",
    glow: "rgba(0,212,255,.15)",
    particle: "#00d4ff",
    subtitle: "DIVE DEEP — FIND THE PATTERN BENEATH THE WAVES",
  },
  forest: {
    label: "🌲 ANCIENT FOREST",
    bg: "radial-gradient(ellipse at 50% 0%,#1a3a1a 0%,#0d1f0d 60%,#060d06 100%)",
    accent: "#7fff4f",
    glow: "rgba(127,255,79,.12)",
    particle: "#7fff4f",
    subtitle: "THINK LIKE THE ROOTS — SLOW, DEEP, INEVITABLE",
  },
  space: {
    label: "🚀 DEEP SPACE",
    bg: "radial-gradient(ellipse at 50% 0%,#1a1a4e 0%,#0d0d2b 60%,#020208 100%)",
    accent: "#a78bfa",
    glow: "rgba(167,139,250,.15)",
    particle: "#a78bfa",
    subtitle: "IN THE VOID, EVERY NUMBER IS A STAR",
  },
  fire: {
    label: "🔥 VOLCANIC",
    bg: "radial-gradient(ellipse at 50% 100%,#4a0e00 0%,#1a0500 50%,#080100 100%)",
    accent: "#ff6b35",
    glow: "rgba(255,107,53,.15)",
    particle: "#ff6b35",
    subtitle: "FORGE YOUR SOLUTION UNDER PRESSURE",
  },
  zen: {
    label: "☯ ZEN GARDEN",
    bg: "radial-gradient(ellipse at 50% 50%,#2d2010 0%,#1a1209 60%,#0a0804 100%)",
    accent: "#d4a85a",
    glow: "rgba(212,168,90,.12)",
    particle: "#d4a85a",
    subtitle: "STILLNESS REVEALS WHAT HASTE CANNOT",
  },
};

function ParticleCanvas({ color }: { color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: -(Math.random() * 0.35 + 0.08),
      alpha: Math.random() * 0.55 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

export default function DailyThemeBanner({
  theme = "ocean",
  children,
}: {
  theme?: DailyTheme;
  children: ReactNode;
}) {
  const t = THEMES[theme];

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: t.bg, color: "#f0f0f0", overflow: "hidden" }}>
      <ParticleCanvas color={t.particle} />

      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "60vw", height: "40vh", background: t.glow, borderRadius: "50%",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      {/* Top banner */}
      <div style={{
        position: "relative", zIndex: 10,
        borderBottom: `1px solid ${t.accent}22`,
        background: "rgba(0,0,0,.35)",
        backdropFilter: "blur(10px)",
        padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "'JetBrains Mono',monospace",
      }}>
        <div>
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.3em", color: t.accent, opacity: .75, marginBottom: 3 }}>
            // DAILY OPERATION
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{t.label}</div>
        </div>
        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,.3)", maxWidth: 200, textAlign: "right", lineHeight: 1.6, letterSpacing: ".05em" }}>
          {t.subtitle}
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10 }}>{children}</div>
    </div>
  );
}