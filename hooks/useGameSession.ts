"use client";
/**
 * useGameSession.ts
 * Drop into: hooks/useGameSession.ts
 *
 * Manages pause state, elapsed timer, and localStorage session save/restore.
 *
 * Usage in app/game/page.tsx:
 *
 *   const {
 *     isPaused, elapsedSeconds, formattedTime,
 *     pause, resume, reset,
 *     saveSession, clearSession,
 *   } = useGameSession({
 *     boardKey: `game-${difficulty}`,
 *     onRestore: (savedBoard) => setBoard(savedBoard),
 *   });
 */

import { useState, useEffect, useRef, useCallback } from "react";

const SESSION_KEY = "0xdoku_session";

interface SessionData {
  boardKey: string;
  elapsed: number;
  boardState: unknown;
  savedAt: number;
}

interface UseGameSessionOptions {
  boardKey: string;
  onRestore?: (boardState: unknown) => void;
}

export function useGameSession({ boardKey, onRestore }: UseGameSessionOptions) {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Restore on mount ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session: SessionData = JSON.parse(raw);
      if (session.boardKey !== boardKey) return;
      setElapsedSeconds(session.elapsed ?? 0);
      if (session.boardState) onRestore?.(session.boardState);
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardKey]);

  // ── Timer ──
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const reset = useCallback(() => { setElapsedSeconds(0); setIsPaused(false); }, []);

  const saveSession = useCallback((boardState: unknown) => {
    try {
      const data: SessionData = { boardKey, elapsed: elapsedSeconds, boardState, savedAt: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (_) {}
  }, [boardKey, elapsedSeconds]);

  const clearSession = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
  }, []);

  const formattedTime = (() => {
    const m = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
    const s = (elapsedSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  })();

  return { isPaused, elapsedSeconds, formattedTime, pause, resume, reset, saveSession, clearSession };
}