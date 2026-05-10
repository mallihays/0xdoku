"use client";
/**
 * useSafeAsync.ts + LoadingScreen + ErrorScreen
 * Drop into: hooks/useSafeAsync.ts
 *
 * FIXES the "freezes / doesn't redirect" bug on the daily page.
 *
 * The bug: an async fetch resolves AFTER the component unmounts (e.g. because
 * router.push already fired or the user navigated away). React then tries to
 * call setState on an unmounted component → freeze / crash.
 *
 * This hook:
 *  1. Tracks mount status via a ref so setState never fires after unmount.
 *  2. Adds a configurable safety timeout that redirects home if data never arrives.
 *  3. Calls onSuccess only when the component is still mounted.
 *
 * ── USAGE ────────────────────────────────────────────────────────────────────
 *
 * // In app/daily/page.tsx (REPLACE the existing useEffect fetch logic):
 *
 * "use client";
 * import { useRouter } from "next/navigation";
 * import { useSafeAsync, LoadingScreen, ErrorScreen } from "@/hooks/useSafeAsync";
 *
 * export default function DailyPage() {
 *   const router = useRouter();
 *
 *   const { loading, error, retry } = useSafeAsync({
 *     fetcher: async () => {
 *       const res = await fetch("/api/daily");
 *       if (!res.ok) throw new Error("Failed to load daily puzzle");
 *       return res.json();
 *     },
 *     onSuccess: (puzzle) => {
 *       // Only called if the component is still mounted
 *       router.push(`/play/daily/${puzzle.id}`);
 *     },
 *     timeoutMs: 8000,
 *     onTimeout: () => router.push("/"),
 *   });
 *
 *   if (loading) return <LoadingScreen message="LOADING DAILY OPERATION..." />;
 *   if (error)   return <ErrorScreen error={error} onRetry={retry} />;
 *   return null; // navigation happens in onSuccess
 * }
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── Hook ──────────────────────────────────────────────────────────────────────
interface UseSafeAsyncOptions<T> {
  fetcher: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onTimeout?: () => void;
  timeoutMs?: number;
  deps?: unknown[];
}

export function useSafeAsync<T>({
  fetcher,
  onSuccess,
  onTimeout,
  timeoutMs = 8000,
  deps = [],
}: UseSafeAsyncOptions<T>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async () => {
    if (!fetcher) return;
    mountedRef.current = true;
    setLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setLoading(false);
      setError(new Error("REQUEST TIMED OUT. CHECK CONNECTION AND RETRY."));
      onTimeout?.();
    }, timeoutMs);

    try {
      const result = await fetcher();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!mountedRef.current) return; // unmounted — bail silently
      setLoading(false);
      onSuccess?.(result);
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!mountedRef.current) return;
      setLoading(false);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [run]);

  return { loading, error, retry: run };
}

// ── LoadingScreen ─────────────────────────────────────────────────────────────
export function LoadingScreen({ message = "LOADING..." }: { message?: string }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes ls-spin { to { transform: rotate(360deg); } }
        @keyframes ls-pulse { 0%,100% { opacity:.12; transform:scale(.8); } 50% { opacity:.9; transform:scale(1); } }
        .ls-wrap { position:fixed; inset:0; background:#050a05; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; z-index:9999; font-family:'JetBrains Mono',monospace; }
        .ls-spinner { width:44px; height:44px; border-radius:50%; border:2px solid rgba(0,255,65,.1); border-top-color:#00ff41; animation:ls-spin .8s linear infinite; }
        .ls-grid { display:grid; grid-template-columns:repeat(3,10px); gap:4px; }
        .ls-dot { width:10px; height:10px; border-radius:2px; background:#00ff41; }
        .ls-msg { font-size:.68rem; color:rgba(0,255,65,.35); letter-spacing:.15em; }
      `}</style>
      <div className="ls-wrap">
        <div className="ls-spinner" />
        <div className="ls-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="ls-dot" style={{ animation: `ls-pulse 1.2s ease-in-out ${i * 0.1}s infinite` }} />
          ))}
        </div>
        <div className="ls-msg">{message}</div>
      </div>
    </>
  );
}

// ── ErrorScreen ───────────────────────────────────────────────────────────────
export function ErrorScreen({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        .es-wrap { position:fixed; inset:0; background:#050a05; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:24px; text-align:center; font-family:'JetBrains Mono',monospace; }
        .es-icon { font-size:40px; }
        .es-title { color:#ff3d3d; font-size:1.1rem; font-weight:700; letter-spacing:.1em; }
        .es-msg { color:rgba(0,255,65,.35); font-size:.68rem; max-width:320px; line-height:1.7; }
        .es-retry { background:#00ff41; color:#050a05; border:none; padding:10px 28px; font-family:'JetBrains Mono',monospace; font-size:.72rem; font-weight:700; letter-spacing:.08em; cursor:pointer; transition:opacity .15s; border-radius:2px; }
        .es-retry:hover { opacity:.85; }
        .es-home { color:rgba(0,255,65,.3); font-size:.6rem; text-decoration:none; margin-top:4px; letter-spacing:.08em; }
        .es-home:hover { color:#00ff41; }
      `}</style>
      <div className="es-wrap">
        <div className="es-icon">⚠</div>
        <div className="es-title">CONNECTION LOST</div>
        <div className="es-msg">{error?.message ?? "FAILED TO LOAD. CHECK YOUR CONNECTION AND TRY AGAIN."}</div>
        {onRetry && (
          <button className="es-retry" onClick={onRetry}>↺ RETRY</button>
        )}
        <a href="/" className="es-home">← ABORT TO HOME</a>
      </div>
    </>
  );
}