import { useState } from "react";
import { Play, Pause, RotateCcw, SkipForward, ChevronLeft, CheckCircle, StickyNote } from "lucide-react";
import type { Task } from "@/shared/types";
import type { TimerMode } from "@/react-app/hooks/useTimer";

interface FloatingTimerProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentTask?: Task;
  timeDisplay: string;
  progress: number;
  isRunning: boolean;
  mode: TimerMode;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onComplete?: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function FloatingTimer({
  isCollapsed,
  onToggleCollapse,
  currentTask,
  timeDisplay,
  progress,
  isRunning,
  mode,
  onStart,
  onPause,
  onReset,
  onSkip,
  onComplete,
  notes,
  onNotesChange,
}: FloatingTimerProps) {
  const [showNotes, setShowNotes] = useState(false);

  if (!isCollapsed) return null;

  const modeColors = {
    focus: "from-[#E50914] to-[#FFD400]",
    short_break: "from-[#FFD400] to-[#E50914]",
    long_break: "from-[#FFD400] to-orange-500",
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div 
      className="fixed top-20 right-6 z-40 pointer-events-none"
    >
      <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors pointer-events-auto"
              title="Expand timer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-semibold text-sm capitalize">{mode.replace('_', ' ')}</h3>
              {currentTask && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                  {currentTask.title}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 pointer-events-auto"
              title="Session notes"
            >
              <StickyNote className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Progress Ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="transform -rotate-90 w-20 h-20">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-200 dark:text-gray-800"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="url(#floatingGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="floatingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E50914" />
                    <stop offset="100%" stopColor="#FFD400" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold tabular-nums">{timeDisplay}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={isRunning ? onPause : onStart}
                  className={`p-2 bg-gradient-to-r ${modeColors[mode]} rounded-lg text-black hover:shadow-lg transition-all duration-300 hover:scale-105 pointer-events-auto`}
                  title={isRunning ? "Pause" : "Start"}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={onReset}
                  className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors pointer-events-auto"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={onSkip}
                  className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors pointer-events-auto"
                  title="Skip"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 pointer-events-auto"
                >
                  <CheckCircle className="w-3 h-3" />
                  Complete
                </button>
              )}
            </div>
          </div>

          {/* Session Notes */}
          {showNotes && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Session notes..."
                rows={3}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914] resize-none pointer-events-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
