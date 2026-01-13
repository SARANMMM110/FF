import { useState, useEffect, useRef, useCallback } from "react";
import type { UserSettings } from "@/shared/types";

export type TimerMode = "focus" | "short_break" | "long_break";

export function useTimer(settings: UserSettings | null) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const getDuration = useCallback((timerMode: TimerMode) => {
    if (!settings) return 25 * 60;
    
    switch (timerMode) {
      case "focus":
        return settings.focus_duration_minutes * 60;
      case "short_break":
        return settings.short_break_minutes * 60;
      case "long_break":
        return settings.long_break_minutes * 60;
    }
  }, [settings]);

  useEffect(() => {
    setSecondsLeft(getDuration(mode));
  }, [mode, getDuration]);

  const startSession = async (taskId?: number) => {
    try {
      const response = await fetch("/api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          start_time: new Date().toISOString(),
          session_type: mode,
          timer_mode: "pomodoro",
        }),
      });
      if (!response.ok) throw new Error("Failed to start session");
      const session = await response.json();
      setCurrentSessionId(session.id);
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const endSession = async () => {
    if (!currentSessionId) return;

    try {
      const duration = Math.round((getDuration(mode) - secondsLeft) / 60);
      await fetch(`/api/focus-sessions/${currentSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          end_time: new Date().toISOString(),
          duration_minutes: duration,
        }),
      });
      setCurrentSessionId(null);
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  const start = async (taskId?: number) => {
    if (!isRunning) {
      setIsRunning(true);
      await startSession(taskId);
    }
  };

  const pause = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = async () => {
    pause();
    if (currentSessionId) {
      await endSession();
    }
    setSecondsLeft(getDuration(mode));
  };

  const switchMode = async (newMode: TimerMode) => {
    await reset();
    setMode(newMode);
  };

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            
            // Handle cycle completion
            if (mode === "focus") {
              setCycleCount((prev) => {
                const newCount = prev + 1;
                if (settings && newCount >= settings.cycles_before_long_break) {
                  setMode("long_break");
                  return 0;
                } else {
                  setMode("short_break");
                  return newCount;
                }
              });
            } else {
              setMode("focus");
            }
            
            endSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft, mode, settings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    mode,
    secondsLeft,
    isRunning,
    cycleCount,
    start,
    pause,
    reset,
    switchMode,
    formatTime: () => formatTime(secondsLeft),
  };
}
