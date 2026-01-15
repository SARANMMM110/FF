import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/react-app/utils/api";

export type TimerMode = "focus" | "short_break" | "long_break";
export type TimerStrategy = "classic" | "pomodoro" | "custom";

interface TimerState {
  mode: TimerMode;
  secondsLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  strategy: TimerStrategy;
  selectedTaskId: number | null;
  sessionId: number | null;
  startTime: string | null;
}

interface GlobalTimerContextType {
  timerState: TimerState;
  startTimer: (taskId?: number, strategy?: TimerStrategy, durationMinutes?: number) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => void;
  completeTimer: () => Promise<void>;
  resetTimer: () => void;
  formatTime: () => string;
  getProgress: () => number;
}

const GlobalTimerContext = createContext<GlobalTimerContextType | null>(null);

const STORAGE_KEY = "focusflow_timer_state";

const defaultTimerState: TimerState = {
  mode: "focus",
  secondsLeft: 0,
  isRunning: false,
  isPaused: false,
  strategy: "pomodoro",
  selectedTaskId: null,
  sessionId: null,
  startTime: null,
};

export function GlobalTimerProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultTimerState;
      }
    }
    return defaultTimerState;
  });

  const intervalRef = useRef<number | null>(null);
  const hasCleanedUp = useRef(false);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
  }, [timerState]);

  // Timer tick effect
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && timerState.secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimerState((prev) => {
          if (prev.secondsLeft <= 1) {
            // Timer completed
            completeTimer();
            return { ...prev, secondsLeft: 0, isRunning: false };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused, timerState.secondsLeft]);

  const startTimer = useCallback(async (taskId?: number, strategy: TimerStrategy = "pomodoro", durationMinutes: number = 25) => {
    console.log("🎯 [Global Timer] Starting timer:", { taskId, strategy, durationMinutes });

    try {
      // Create session in backend
      const response = await apiFetch("api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId || null,
          start_time: new Date().toISOString(),
          session_type: "focus",
          timer_mode: strategy,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start session");
      }

      const session = await response.json();
      console.log("✅ [Global Timer] Session started:", session.id);

      setTimerState({
        mode: "focus",
        secondsLeft: durationMinutes * 60,
        isRunning: true,
        isPaused: false,
        strategy,
        selectedTaskId: taskId || null,
        sessionId: session.id,
        startTime: new Date().toISOString(),
      });

      hasCleanedUp.current = false;
    } catch (error) {
      console.error("❌ [Global Timer] Failed to start:", error);
    }
  }, []);

  const pauseTimer = useCallback(async () => {
    console.log("⏸️ [Global Timer] Pausing timer");

    if (timerState.sessionId && timerState.mode === "focus") {
      const totalSeconds = (timerState.startTime ? 
        (Date.now() - new Date(timerState.startTime).getTime()) / 1000 : 0);
      const duration = Math.round(totalSeconds / 60);

      if (duration >= 1) {
        try {
          await fetch(`/api/focus-sessions/${timerState.sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              end_time: new Date().toISOString(),
              duration_minutes: duration,
            }),
          });
          console.log("✅ [Global Timer] Session saved on pause:", duration, "minutes");
        } catch (error) {
          console.error("❌ [Global Timer] Failed to save on pause:", error);
        }
      }
    }

    setTimerState((prev) => ({ ...prev, isPaused: true }));
  }, [timerState.sessionId, timerState.mode, timerState.startTime]);

  const resumeTimer = useCallback(() => {
    console.log("▶️ [Global Timer] Resuming timer");
    setTimerState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const completeTimer = useCallback(async () => {
    console.log("✅ [Global Timer] Completing timer");

    if (timerState.sessionId && !hasCleanedUp.current) {
      const totalSeconds = (timerState.startTime ? 
        (Date.now() - new Date(timerState.startTime).getTime()) / 1000 : 0);
      const duration = Math.round(totalSeconds / 60);

      if (duration >= 1) {
        try {
          await fetch(`/api/focus-sessions/${timerState.sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              end_time: new Date().toISOString(),
              duration_minutes: duration,
            }),
          });
          console.log("✅ [Global Timer] Session completed:", duration, "minutes");
          hasCleanedUp.current = true;
        } catch (error) {
          console.error("❌ [Global Timer] Failed to complete session:", error);
        }
      }
    }

    setTimerState(defaultTimerState);
    localStorage.removeItem(STORAGE_KEY);
  }, [timerState.sessionId, timerState.startTime]);

  const resetTimer = useCallback(() => {
    console.log("🔄 [Global Timer] Resetting timer");
    
    if (timerState.sessionId) {
      completeTimer();
    } else {
      setTimerState(defaultTimerState);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [timerState.sessionId, completeTimer]);

  const formatTime = useCallback(() => {
    const mins = Math.floor(timerState.secondsLeft / 60);
    const secs = timerState.secondsLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timerState.secondsLeft]);

  const getProgress = useCallback(() => {
    if (!timerState.startTime) return 0;
    
    const totalDuration = timerState.mode === "focus" ? 25 * 60 : 5 * 60; // Default durations
    const elapsed = totalDuration - timerState.secondsLeft;
    return totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  }, [timerState.secondsLeft, timerState.startTime, timerState.mode]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (timerState.sessionId && timerState.mode === "focus" && !hasCleanedUp.current) {
        const totalSeconds = (timerState.startTime ? 
          (Date.now() - new Date(timerState.startTime).getTime()) / 1000 : 0);
        const duration = Math.round(totalSeconds / 60);

        if (duration >= 1) {
          console.log("🚪 [Global Timer] Page unload - saving session:", duration, "minutes");

          const data = JSON.stringify({
            end_time: new Date().toISOString(),
            duration_minutes: duration,
          });

          const blob = new Blob([data], { type: "application/json" });
          navigator.sendBeacon(`/api/focus-sessions/${timerState.sessionId}`, blob);

          hasCleanedUp.current = true;
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [timerState.sessionId, timerState.mode, timerState.startTime]);

  return (
    <GlobalTimerContext.Provider
      value={{
        timerState,
        startTimer,
        pauseTimer,
        resumeTimer,
        completeTimer,
        resetTimer,
        formatTime,
        getProgress,
      }}
    >
      {children}
    </GlobalTimerContext.Provider>
  );
}

export function useGlobalTimer() {
  const context = useContext(GlobalTimerContext);
  if (!context) {
    throw new Error("useGlobalTimer must be used within GlobalTimerProvider");
  }
  return context;
}
