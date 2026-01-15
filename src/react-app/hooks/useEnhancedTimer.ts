import { useState, useEffect, useRef, useCallback } from "react";
import type { UserSettings } from "@/shared/types";
import { apiFetch } from "@/react-app/utils/api";

export type TimerMode = "focus" | "short_break" | "long_break";
export type TimerStrategy = "classic" | "pomodoro" | "custom";

interface CustomPreset {
  work: number; // minutes
  break: number; // minutes
}

const CUSTOM_PRESETS: Record<string, CustomPreset> = {
  "52/17": { work: 52, break: 17 },
  "90/20": { work: 90, break: 20 },
  "45/15": { work: 45, break: 15 },
};

export function useEnhancedTimer(
  settings: UserSettings | null,
  strategy: TimerStrategy = "pomodoro",
  customPreset?: string
) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasCleanedUp = useRef(false);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6F0fPTgjMGHm7A7+OZURQKSK3n77BdGwk9lunx");
  }, []);

  const getDuration = useCallback((timerMode: TimerMode): number => {
    if (strategy === "classic") {
      // Classic mode: single work block, no breaks
      return timerMode === "focus" ? (settings?.focus_duration_minutes || 25) * 60 : 0;
    } else if (strategy === "custom" && customPreset && CUSTOM_PRESETS[customPreset]) {
      const preset = CUSTOM_PRESETS[customPreset];
      return timerMode === "focus" ? preset.work * 60 : preset.break * 60;
    } else {
      // Pomodoro mode (default)
      if (!settings) return timerMode === "focus" ? 25 * 60 : 5 * 60;
      
      switch (timerMode) {
        case "focus":
          return settings.focus_duration_minutes * 60;
        case "short_break":
          return settings.short_break_minutes * 60;
        case "long_break":
          return settings.long_break_minutes * 60;
      }
    }
  }, [settings, strategy, customPreset]);

  useEffect(() => {
    setSecondsLeft(getDuration(mode));
  }, [mode, getDuration]);

  const playChime = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Audio play failed:", err));
    }
  }, []);

  const pulseEffect = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const startSession = async (taskId?: number) => {
    try {
      console.log("🎯 [Timer] Starting focus session:", {
        task_id: taskId,
        session_type: mode,
        timer_mode: strategy,
        start_time: new Date().toISOString()
      });
      
      const response = await apiFetch("api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          start_time: new Date().toISOString(),
          session_type: mode,
          timer_mode: strategy,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [Timer] Failed to start session:", response.status, errorText);
        throw new Error(`Failed to start session: ${response.status}`);
      }
      
      const session = await response.json();
      console.log("✅ [Timer] Session started successfully:", session.id);
      setCurrentSessionId(session.id);
    } catch (err) {
      console.error("❌ [Timer] Error starting session:", err);
    }
  };

  const endSession = async () => {
    if (!currentSessionId) {
      console.warn("⚠️ [Timer] No session ID to end");
      return;
    }

    try {
      const duration = Math.round((getDuration(mode) - secondsLeft) / 60);
      console.log("📝 [Timer] Ending session:", currentSessionId, "Duration:", duration, "minutes");
      
      const response = await fetch(`/api/focus-sessions/${currentSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          end_time: new Date().toISOString(),
          duration_minutes: duration,
          notes: sessionNotes || null,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [Timer] Failed to end session:", response.status, errorText);
        throw new Error(`Failed to end session: ${response.status}`);
      }
      
      console.log("✅ [Timer] Session ended successfully");
      setCurrentSessionId(null);
      setSessionNotes("");
    } catch (err) {
      console.error("❌ [Timer] Error ending session:", err);
    }
  };

  const start = async (taskId?: number) => {
    if (!isRunning) {
      setIsRunning(true);
      await startSession(taskId);
    }
  };

  const pause = async () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Save progress when pausing
    if (currentSessionId && mode === "focus") {
      const elapsed = getDuration(mode) - secondsLeft;
      if (elapsed > 30) { // Only save if at least 30 seconds of work
        const duration = Math.round(elapsed / 60);
        console.log("⏸️ [Timer] Pausing - saving session progress:", duration, "minutes");
        
        try {
          await fetch(`/api/focus-sessions/${currentSessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              end_time: new Date().toISOString(),
              duration_minutes: duration,
              notes: sessionNotes || null,
            }),
          });
          
          console.log("✅ [Timer] Session progress saved on pause");
          setCurrentSessionId(null);
        } catch (err) {
          console.error("❌ [Timer] Failed to save session on pause:", err);
        }
      }
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

  const skipToNext = async () => {
    await reset();
    
    // Classic mode doesn't have breaks
    if (strategy === "classic") return;

    // Switch to next mode
    if (mode === "focus") {
      setCycleCount((prev) => {
        const newCount = prev + 1;
        if (settings && newCount >= settings.cycles_before_long_break) {
          setMode("long_break");
          return 0;
        } else {
          setMode(strategy === "custom" || !settings ? "short_break" : "short_break");
          return newCount;
        }
      });
    } else {
      setMode("focus");
    }
  };

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            
            playChime();
            pulseEffect();
            
            // Handle cycle completion
            if (strategy !== "classic") {
              if (mode === "focus") {
                setCycleCount((prevCount) => {
                  const newCount = prevCount + 1;
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
  }, [isRunning, secondsLeft, mode, settings, strategy]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    const total = getDuration(mode);
    return total > 0 ? ((total - secondsLeft) / total) * 100 : 0;
  };

  // Cleanup effect - save session when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentSessionId && mode === "focus" && !hasCleanedUp.current) {
        const elapsed = getDuration(mode) - secondsLeft;
        if (elapsed > 30) { // Only save if at least 30 seconds
          const duration = Math.round(elapsed / 60);
          
          console.log("🚪 [Timer] Page unload - saving session:", duration, "minutes");
          
          // Use sendBeacon for reliable save on page unload
          const data = JSON.stringify({
            end_time: new Date().toISOString(),
            duration_minutes: duration,
            notes: sessionNotes || null,
          });
          
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon(`/api/focus-sessions/${currentSessionId}`, blob);
          
          hasCleanedUp.current = true;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Also save on component unmount
      if (currentSessionId && mode === "focus" && !hasCleanedUp.current) {
        const elapsed = getDuration(mode) - secondsLeft;
        if (elapsed > 30) {
          const duration = Math.round(elapsed / 60);
          
          console.log("🧹 [Timer] Component unmount - saving session:", duration, "minutes");
          
          fetch(`/api/focus-sessions/${currentSessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              end_time: new Date().toISOString(),
              duration_minutes: duration,
              notes: sessionNotes || null,
            }),
          }).catch(err => console.error("❌ Failed to save on unmount:", err));
          
          hasCleanedUp.current = true;
        }
      }
    };
  }, [currentSessionId, mode, secondsLeft, sessionNotes, getDuration]);

  return {
    mode,
    secondsLeft,
    isRunning,
    cycleCount,
    sessionNotes,
    start,
    pause,
    reset,
    switchMode,
    skipToNext,
    setSessionNotes,
    formatTime: () => formatTime(secondsLeft),
    getProgress,
    getDuration,
  };
}
