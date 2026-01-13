import { useEffect, useState } from "react";
import { Play, Pause, X, Maximize2 } from "lucide-react";
import { getRotatingPrompt } from "@/shared/motivationalPrompts";
import type { Task } from "@/shared/types";

interface MinimalFocusModeProps {
  isActive: boolean;
  onExit: () => void;
  currentTask?: Task;
  timeDisplay: string;
  progress: number;
  isRunning: boolean;
  mode: "focus" | "short_break" | "long_break";
  onStart: () => void;
  onPause: () => void;
  showPrompts: boolean;
}

export default function MinimalFocusMode({
  isActive,
  onExit,
  currentTask,
  timeDisplay,
  progress,
  isRunning,
  mode,
  onStart,
  onPause,
  showPrompts,
}: MinimalFocusModeProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Rotate prompt every 2 minutes during focus
  useEffect(() => {
    if (!isActive || !isRunning || mode !== "focus" || !showPrompts) return;

    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => prev + 1);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isActive, isRunning, mode, showPrompts]);

  if (!isActive) return null;

  const modeColors = {
    focus: "from-[#E50914] via-[#FF2600] to-[#FFD400]",
    short_break: "from-[#FFD400] via-[#FFB700] to-[#E50914]",
    long_break: "from-[#FFD400] via-orange-400 to-orange-500",
  };

  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${modeColors[mode]} opacity-5 animate-pulse`}
        style={{ animationDuration: "8s" }}
      />

      {/* Exit button */}
      <button
        onClick={onExit}
        className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl transition-colors text-white"
        title="Exit minimal mode (Escape)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Fullscreen toggle hint */}
      <button
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }}
        className="absolute top-6 left-6 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl transition-colors text-white"
        title="Toggle fullscreen (F11)"
      >
        <Maximize2 className="w-6 h-6" />
      </button>

      <div className="relative flex flex-col items-center">
        {/* Timer circle */}
        <div className="relative mb-12">
          <svg className="transform -rotate-90" width="320" height="320">
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="url(#minimalGradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="minimalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E50914" />
                <stop offset="100%" stopColor="#FFD400" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl font-bold tabular-nums text-white mb-2">
                {timeDisplay}
              </div>
              {currentTask && (
                <div className="text-xl text-white/70 font-medium px-8 text-center line-clamp-2">
                  {currentTask.title}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Control button */}
        <button
          onClick={isRunning ? onPause : onStart}
          className={`px-12 py-5 bg-gradient-to-r ${modeColors[mode]} rounded-2xl font-bold text-2xl text-black hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 flex items-center gap-4`}
        >
          {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          {isRunning ? "Pause" : "Start"}
        </button>

        {/* Motivational prompt */}
        {showPrompts && mode === "focus" && isRunning && (
          <div className="mt-16 animate-fade-in">
            <p className="text-2xl text-white/80 font-light text-center italic">
              {getRotatingPrompt(currentPromptIndex)}
            </p>
          </div>
        )}

        {/* Keyboard hint */}
        <div className="absolute bottom-8 text-white/40 text-sm">
          <kbd className="px-3 py-1.5 bg-white/10 rounded-lg">Space</kbd> to start/pause
          <span className="mx-3">•</span>
          <kbd className="px-3 py-1.5 bg-white/10 rounded-lg">Esc</kbd> to exit
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
