import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Coffee, Zap } from "lucide-react";
import { useTimer } from "@/react-app/hooks/useTimer";
import type { UserSettings } from "@/shared/types";

interface FocusTimerProps {
  settings: UserSettings | null;
  selectedTaskId?: number;
}

export default function FocusTimer({ settings, selectedTaskId }: FocusTimerProps) {
  const { mode, secondsLeft, isRunning, cycleCount, start, pause, reset, switchMode, formatTime } = useTimer(settings);
  const [lastKeyTime, setLastKeyTime] = useState(0);

  const modeConfig = {
    focus: {
      label: "Focus",
      icon: <Zap className="w-8 h-8" />,
      color: "from-[#E50914] to-[#FFD400]",
      bgColor: "from-[#E50914]/20 to-[#FFD400]/10",
    },
    short_break: {
      label: "Short Break",
      icon: <Coffee className="w-8 h-8" />,
      color: "from-[#FFD400] to-[#E50914]",
      bgColor: "from-[#FFD400]/20 to-[#E50914]/10",
    },
    long_break: {
      label: "Long Break",
      icon: <Coffee className="w-8 h-8" />,
      color: "from-[#FFD400] to-orange-500",
      bgColor: "from-[#FFD400]/20 to-orange-500/10",
    },
  };

  const currentConfig = modeConfig[mode];
  const progress = settings ? (secondsLeft / (settings[`${mode === "focus" ? "focus_duration_minutes" : mode === "short_break" ? "short_break_minutes" : "long_break_minutes"}`] * 60)) * 100 : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (progress / 100);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Debounce keyboard events
      const now = Date.now();
      if (now - lastKeyTime < 300) return;
      setLastKeyTime(now);

      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        isRunning ? pause() : start(selectedTaskId);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        reset();
      } else if (e.key === "1") {
        e.preventDefault();
        switchMode("focus");
      } else if (e.key === "2") {
        e.preventDefault();
        switchMode("short_break");
      } else if (e.key === "3") {
        e.preventDefault();
        switchMode("long_break");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, selectedTaskId, lastKeyTime, pause, start, reset, switchMode]);

  return (
    <div
      className={`bg-gradient-to-br ${currentConfig.bgColor} backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8`}
      role="timer"
      aria-label={`${currentConfig.label} timer: ${formatTime()}`}
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 bg-gradient-to-r ${currentConfig.color} rounded-xl text-black`}>
            {currentConfig.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{currentConfig.label}</h2>
            {settings && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cycle {cycleCount + 1} of {settings.cycles_before_long_break}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timer Display with Progress Ring */}
      <div className="flex justify-center mb-8">
        <div className="relative w-64 h-64">
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-800"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E50914" />
                <stop offset="100%" stopColor="#FFD400" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold tabular-nums" aria-live="off">
                {formatTime()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => (isRunning ? pause() : start(selectedTaskId))}
          className={`flex-1 py-4 bg-gradient-to-r ${currentConfig.color} rounded-xl font-bold text-lg text-black hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3`}
          aria-label={isRunning ? "Pause timer (Space)" : "Start timer (Space)"}
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="p-4 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Reset timer (R)"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Mode Switch */}
      <div className="space-y-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide">
          Switch Mode (Keyboard: 1, 2, 3)
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ModeButton
            active={mode === "focus"}
            onClick={() => switchMode("focus")}
            label="Focus"
            duration={settings?.focus_duration_minutes}
          />
          <ModeButton
            active={mode === "short_break"}
            onClick={() => switchMode("short_break")}
            label="Short Break"
            duration={settings?.short_break_minutes}
          />
          <ModeButton
            active={mode === "long_break"}
            onClick={() => switchMode("long_break")}
            label="Long Break"
            duration={settings?.long_break_minutes}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-xl text-xs text-gray-600 dark:text-gray-400">
        <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
        <div className="space-y-1">
          <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">Space</kbd> Start/Pause</div>
          <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">R</kbd> Reset</div>
          <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">1</kbd>, <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">2</kbd>, <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">3</kbd> Switch modes</div>
        </div>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, label, duration }: {
  active: boolean;
  onClick: () => void;
  label: string;
  duration?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black"
          : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
      }`}
      aria-label={`${label} mode${duration ? `, ${duration} minutes` : ""}`}
    >
      <div className="font-semibold">{label}</div>
      {duration && <div className="text-xs opacity-75">{duration}m</div>}
    </button>
  );
}
