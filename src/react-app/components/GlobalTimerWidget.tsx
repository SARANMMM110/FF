import { useGlobalTimer } from "@/react-app/contexts/GlobalTimerContext";
import { useTasks } from "@/react-app/hooks/useTasks";
import { Play, Pause, CheckCircle, Clock, Target } from "lucide-react";
import { useState } from "react";

export default function GlobalTimerWidget() {
  const { timerState, pauseTimer, resumeTimer, completeTimer, formatTime, getProgress } = useGlobalTimer();
  const { tasks, completeTask } = useTasks();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!timerState.isRunning) {
    return null;
  }

  const selectedTask = tasks.find((t) => t.id === timerState.selectedTaskId);
  const progress = getProgress();

  const handleComplete = async () => {
    if (timerState.selectedTaskId) {
      try {
        await completeTask(timerState.selectedTaskId);
      } catch (error) {
        console.error("Failed to complete task:", error);
      }
    }
    await completeTimer();
  };

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in-down">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-gray-700 overflow-hidden">
        {/* Compact View */}
        <div
          className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            {/* Timer Display */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <svg className="transform -rotate-90 w-12 h-12">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="url(#mini-gradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - progress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="mini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E50914" />
                      <stop offset="100%" stopColor="#FFD400" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-white tabular-nums">
                  {formatTime()}
                </div>
                {selectedTask && (
                  <div className="text-sm text-gray-400 truncate max-w-[200px]">
                    {selectedTask.title}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-2">
              {timerState.isPaused ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resumeTimer();
                  }}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 hover:scale-110"
                  title="Resume"
                >
                  <Play className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    pauseTimer();
                  }}
                  className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all duration-200 hover:scale-110"
                  title="Pause"
                >
                  <Pause className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete();
                }}
                className="p-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] hover:from-[#FFD400] hover:to-[#E50914] text-black rounded-lg transition-all duration-200 hover:scale-110"
                title="Complete"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t border-gray-700 p-4 space-y-4 animate-slide-down">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className={`font-semibold ${timerState.isPaused ? "text-yellow-400" : "text-green-400"}`}>
                  {timerState.isPaused ? "Paused" : "Running"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="font-semibold text-white">{Math.round(progress)}%</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Mode</span>
                <span className="font-semibold text-white capitalize">{timerState.strategy}</span>
              </div>
            </div>

            {selectedTask && (
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-[#E50914] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {selectedTask.title}
                    </div>
                    {selectedTask.description && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {selectedTask.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {timerState.isPaused ? (
                <button
                  onClick={resumeTimer}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
              )}

              <button
                onClick={handleComplete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] hover:from-[#FFD400] hover:to-[#E50914] text-black rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              >
                <CheckCircle className="w-5 h-5" />
                Complete
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }

        .animate-slide-in-down {
          animation: slide-in-down 0.3s ease-out forwards;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
