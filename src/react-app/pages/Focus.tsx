import { useEffect, useState } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { useSettings } from "@/react-app/hooks/useSettings";
import { useTasks } from "@/react-app/hooks/useTasks";
import { useEnhancedTimer, type TimerStrategy } from "@/react-app/hooks/useEnhancedTimer";
import { useToast } from "@/react-app/hooks/useToast";
import { useKeyboardShortcuts } from "@/react-app/hooks/useKeyboardShortcuts";
import { useUserPreferences } from "@/react-app/hooks/useLocalStorage";
import { useFocusGuard } from "@/react-app/hooks/useFocusGuard";
import Layout from "@/react-app/components/Layout";
import FloatingTimer from "@/react-app/components/FloatingTimer";
import MinimalFocusMode from "@/react-app/components/MinimalFocusMode";
import FocusGuardWarning from "@/react-app/components/FocusGuardWarning";
import CreateTaskModal from "@/react-app/components/CreateTaskModal";
import { ToastContainer } from "@/react-app/components/Toast";
import { apiFetch } from "@/react-app/utils/api";

import EmptyState from "@/react-app/components/EmptyState";
import {
  Target,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Zap,
  Coffee,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Star,
  Flame,
  Clock,
  Focus as FocusIcon,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";

export default function Focus() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { settings, loading: settingsLoading } = useSettings();
  const { tasks, loading: tasksLoading, createTask, completeTask } = useTasks();
  const { preferences, updatePreference } = useUserPreferences();
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();
  const [timerStrategy, setTimerStrategy] = useState<TimerStrategy>(preferences.preferredTimerMode);
  const [customPreset, setCustomPreset] = useState<string>("52/17");
  const [isTasksPanelCollapsed, setIsTasksPanelCollapsed] = useState(false);
  const [isMinimalMode, setIsMinimalMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(preferences.soundEnabled);
  const [isVisible, setIsVisible] = useState(false);
  const [isPageFocused, setIsPageFocused] = useState(true);
  const [distractionTimeAway, setDistractionTimeAway] = useState(0);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const {
    mode,
    secondsLeft,
    isRunning,
    cycleCount,
    sessionNotes,
    start,
    pause,
    reset,
    skipToNext,
    setSessionNotes,
    formatTime,
    getProgress,
    getDuration,
  } = useEnhancedTimer(settings, timerStrategy, customPreset);

  // Get blocked websites from settings
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([]);
  const [detectedBlockedSite, setDetectedBlockedSite] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.blocked_websites) {
      try {
        const parsed = JSON.parse(settings.blocked_websites);
        setBlockedWebsites(Array.isArray(parsed) ? parsed : []);
      } catch {
        setBlockedWebsites([]);
      }
    }
  }, [settings]);

  // Focus Guard tracking - must come after useEnhancedTimer so isRunning and mode are available
  const {
    isPageVisible,
    showBlockedSiteWarning,
    totalDistractions,
  } = useFocusGuard({
    isActive: isRunning && mode === "focus",
    blockedWebsites,
    onDistraction: async (type, duration, metadata) => {
      setDistractionTimeAway(duration);
      
      // Track if they visited a blocked site
      if (metadata?.blockedSite) {
        setDetectedBlockedSite(metadata.blockedSite);
      }
      
      // Record distraction to backend
      try {
        await apiFetch("api/focus-distractions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            distraction_type: metadata?.blockedSite ? "blocked_site_visit" : type,
            duration_seconds: duration,
            metadata: metadata ? JSON.stringify(metadata) : null,
          }),
        });
      } catch (error) {
        console.error("Failed to record distraction:", error);
      }
    },
    onReturn: () => {
      if (distractionTimeAway > 5) {
        const message = detectedBlockedSite 
          ? `Back to focus! (You visited ${detectedBlockedSite})`
          : `Welcome back! You were away for ${Math.round(distractionTimeAway)}s`;
        addToast(message, "info");
      }
      // Clear detected site after a delay
      setTimeout(() => setDetectedBlockedSite(null), 3000);
    },
  });

  // Track if component is mounted and on Focus page
  useEffect(() => {
    const isFocusPage = location.pathname === "/focus-mode";
    
    if (isFocusPage) {
      setIsVisible(true);
      // Small delay to ensure proper mounting
      setTimeout(() => setIsPageFocused(true), 100);
    }
    
    return () => {
      // Immediately disable shortcuts when component unmounts
      setIsPageFocused(false);
      setIsVisible(false);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/");
    }
  }, [user, isPending, navigate]);

  // Handle quick start from URL params
  useEffect(() => {
    const quickStart = searchParams.get("quick");
    if (quickStart && user && !isRunning) {
      const minutes = parseInt(quickStart);
      if (minutes > 0) {
        setTimerStrategy("classic");
        // Auto-start the timer after a short delay
        setTimeout(() => {
          start(selectedTaskId);
          addToast(`Started ${minutes}-minute focus session`, "success");
        }, 500);
      }
    }
  }, [searchParams, user, selectedTaskId, isRunning]);

  // Show toast when mode changes
  useEffect(() => {
    if (secondsLeft === getDuration(mode) && secondsLeft > 0) {
      const modeLabels = {
        focus: "Focus session",
        short_break: "Short break",
        long_break: "Long break",
      };
      if (mode !== "focus" || cycleCount > 0) {
        addToast(`${modeLabels[mode]} started!`, "info");
      }
    }
  }, [mode, secondsLeft, getDuration, cycleCount]);

  // Auto-enter minimal mode if enabled
  useEffect(() => {
    if (settings?.minimal_mode_enabled && isRunning && mode === "focus") {
      setIsMinimalMode(true);
    }
  }, [settings, isRunning, mode]);

  // Keyboard shortcuts - only enabled when on Focus page and not in minimal mode
  const shortcutsEnabled = !isMinimalMode && isPageFocused;
  
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: " ",
        action: () => isRunning ? pause() : start(selectedTaskId),
        description: "Start/Pause timer",
      },
      {
        key: "r",
        action: reset,
        description: "Reset timer",
      },
      {
        key: "n",
        action: skipToNext,
        description: "Skip to next phase",
      },
      {
        key: "m",
        action: () => setIsMinimalMode(!isMinimalMode),
        description: "Toggle minimal mode",
      },
      {
        key: "Escape",
        action: () => setIsMinimalMode(false),
        description: "Exit minimal mode",
      },
      {
        key: "s",
        action: () => setSoundEnabled(!soundEnabled),
        description: "Toggle sound",
      },
      {
        key: "t",
        action: () => setIsTasksPanelCollapsed(!isTasksPanelCollapsed),
        description: "Toggle tasks panel",
      },
    ],
    enabled: shortcutsEnabled,
  });

  // Save timer strategy preference
  useEffect(() => {
    updatePreference("preferredTimerMode", timerStrategy);
  }, [timerStrategy, updatePreference]);

  // Save sound preference
  useEffect(() => {
    updatePreference("soundEnabled", soundEnabled);
  }, [soundEnabled, updatePreference]);

  const handleCreateTask = async (task: any) => {
    try {
      await createTask(task);
      setIsCreateTaskModalOpen(false);
      addToast("Task created successfully", "success");
    } catch (error) {
      addToast("Failed to create task", "error");
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTaskId) return;

    try {
      await completeTask(selectedTaskId);
      addToast("Task completed! Great work! 🎉", "success");
      setSelectedTaskId(undefined);
    } catch (error) {
      console.error("Failed to complete task:", error);
      addToast("Failed to complete task", "error");
    }
  };

  const handleNextTask = () => {
    const activeTasks = tasks.filter((t) => !t.is_completed);
    if (activeTasks.length === 0) return;

    const currentIndex = activeTasks.findIndex((t) => t.id === selectedTaskId);
    const nextIndex = (currentIndex + 1) % activeTasks.length;
    setSelectedTaskId(activeTasks[nextIndex].id);
    addToast(`Switched to: ${activeTasks[nextIndex].title}`, "info");
  };

  if (isPending || settingsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping">
              <FocusIcon className="w-16 h-16 text-[#E50914]/50 mx-auto" />
            </div>
            <div className="animate-spin">
              <Clock className="w-16 h-16 text-[#E50914] mx-auto" />
            </div>
          </div>
          <div className="animate-pulse">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading Focus Session</h2>
            <p className="text-gray-500 dark:text-gray-400">Preparing your deep work environment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeTasks = tasks.filter((t) => !t.is_completed);
  const selectedTask = activeTasks.find((t) => t.id === selectedTaskId);

  const modeConfig = {
    focus: {
      label: "Focus Session",
      icon: <Zap className="w-8 h-8" />,
      color: "from-[#E50914] to-[#FFD400]",
      bgColor: "from-[#E50914]/15 via-[#FF6B6B]/10 to-[#FFD400]/15",
      accentColor: "text-[#E50914]",
    },
    short_break: {
      label: "Short Break",
      icon: <Coffee className="w-8 h-8" />,
      color: "from-[#FFD400] to-green-400",
      bgColor: "from-[#FFD400]/15 via-green-400/10 to-blue-400/15",
      accentColor: "text-green-500",
    },
    long_break: {
      label: "Long Break",
      icon: <Coffee className="w-8 h-8" />,
      color: "from-[#FFD400] to-orange-400",
      bgColor: "from-[#FFD400]/15 via-orange-400/10 to-purple-400/15",
      accentColor: "text-orange-500",
    },
  };

  const currentConfig = modeConfig[mode];
  const progress = getProgress();
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress / 100);

  const strategyConfig = {
    classic: {
      label: "Classic",
      description: "Single focus session",
      icon: <Clock className="w-5 h-5" />
    },
    pomodoro: {
      label: "Pomodoro",
      description: "25min work + breaks",
      icon: <Target className="w-5 h-5" />
    },
    custom: {
      label: "Custom",
      description: "Your own timing",
      icon: <Sparkles className="w-5 h-5" />
    }
  };

  return (
    <Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Focus Guard Warning Overlay */}
      <FocusGuardWarning
        isVisible={isPageVisible}
        timeAwaySeconds={distractionTimeAway}
        totalDistractions={totalDistractions}
        blockedSite={detectedBlockedSite}
        onReturn={() => window.focus()}
      />
      
      {/* Blocked Site Warning Badge */}
      {showBlockedSiteWarning && detectedBlockedSite && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
          <div className="p-4 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-2xl shadow-2xl text-black max-w-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold mb-1">Distraction Detected</p>
                <p className="text-sm opacity-90">
                  You visited <span className="font-mono font-bold">{detectedBlockedSite}</span>
                </p>
                <p className="text-xs opacity-75 mt-1">
                  Stay focused on your goals! 🎯
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={`max-w-7xl mx-auto transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        {/* Enhanced Header */}
        <div className="relative mb-12 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 rounded-full animate-pulse blur-xl"></div>
            <div className="absolute top-8 -left-8 w-24 h-24 bg-gradient-to-br from-[#FFD400]/10 to-[#E50914]/10 rounded-full animate-bounce delay-700 blur-lg"></div>
            <div className="absolute top-20 right-1/3 w-16 h-16 bg-gradient-to-br from-[#E50914]/5 to-[#FFD400]/5 rounded-full animate-pulse delay-1000 blur-md"></div>
          </div>

          <div className="relative">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-[#E50914] via-[#FF6B6B] to-[#FFD400] bg-clip-text text-transparent animate-gradient-x bg-300%">
                  Focus Session
                </span>
              </h1>
            </div>
            
            <div className="animate-fade-in-up delay-200">
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 max-w-2xl">
                Choose your strategy, select a task, and enter the zone of deep productivity.
              </p>
            </div>

            {/* Enhanced Timer Strategy Selector */}
            <div className="animate-fade-in-up delay-300">
              <div className="flex flex-wrap gap-3 mb-8">
                {(Object.keys(strategyConfig) as TimerStrategy[]).map((strategy, index) => {
                  const config = strategyConfig[strategy];
                  const isActive = timerStrategy === strategy;
                  
                  return (
                    <button
                      key={strategy}
                      onClick={() => setTimerStrategy(strategy)}
                      className={`group relative px-6 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        isActive
                          ? "bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black shadow-2xl shadow-[#E50914]/30"
                          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-[#E50914]/30"
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${isActive ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform duration-300`}>
                          {config.icon}
                        </div>
                        <div className="text-left">
                          <div className="font-bold">{config.label}</div>
                          <div className={`text-sm ${isActive ? 'text-black/70' : 'text-gray-500 dark:text-gray-400'}`}>
                            {config.description}
                          </div>
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E50914]/20 to-[#FFD400]/20 animate-pulse blur-sm"></div>
                      )}
                    </button>
                  );
                })}
                
                {timerStrategy === "custom" && (
                  <div className="animate-slide-in-right">
                    <select
                      value={customPreset}
                      onChange={(e) => setCustomPreset(e.target.value)}
                      className="px-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl font-semibold text-gray-900 dark:text-white hover:border-[#E50914] focus:border-[#E50914] focus:ring-2 focus:ring-[#E50914]/20 transition-all duration-300 outline-none"
                    >
                      <option value="52/17">52min work / 17min break</option>
                      <option value="90/20">90min work / 20min break</option>
                      <option value="45/15">45min work / 15min break</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Enhanced Timer Section */}
          <div className={`${isTasksPanelCollapsed ? "lg:col-span-3" : "lg:col-span-2"} animate-fade-in-up delay-400`}>
            <div
              className={`relative overflow-hidden bg-gradient-to-br ${currentConfig.bgColor} backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-8 lg:p-10 group hover:shadow-3xl transition-all duration-500`}
              role="timer"
              aria-label={`${currentConfig.label} timer: ${formatTime()}`}
              aria-live="polite"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className={`absolute inset-0 bg-gradient-to-r ${currentConfig.color} animate-gradient-x bg-300%`}></div>
              </div>
              
              {/* Floating Sparkles */}
              <div className="absolute top-6 right-6 animate-pulse delay-1000">
                <Sparkles className="w-6 h-6 text-[#FFD400]" />
              </div>
              <div className="absolute bottom-6 left-6 animate-pulse delay-1500">
                <Star className="w-4 h-4 text-[#E50914]" />
              </div>

              {/* Enhanced Header */}
              <div className="relative flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className={`absolute -inset-2 bg-gradient-to-r ${currentConfig.color} rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300`}></div>
                    <div className={`relative p-4 bg-gradient-to-r ${currentConfig.color} rounded-2xl text-black transform group-hover:scale-110 transition-transform duration-300`}>
                      {currentConfig.icon}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold">{currentConfig.label}</h2>
                    {settings && timerStrategy === "pomodoro" && (
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        Cycle {cycleCount + 1} of {settings.cycles_before_long_break}
                      </p>
                    )}
                    {selectedTask && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#E50914] rounded-full animate-pulse"></div>
                        <p className="text-lg font-semibold text-[#E50914] truncate max-w-md">{selectedTask.title}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 transform hover:scale-110 ${soundEnabled ? 'text-[#E50914]' : 'text-gray-400'}`}
                    title={`${soundEnabled ? "Disable" : "Enable"} sound (S)`}
                  >
                    {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => setIsMinimalMode(true)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 transform hover:scale-110"
                    title="Enter minimal mode (M)"
                  >
                    <Minimize2 className="w-6 h-6" />
                  </button>
                  {!isTasksPanelCollapsed && activeTasks.length > 0 && (
                    <button
                      onClick={() => setIsTasksPanelCollapsed(true)}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 transform hover:scale-110"
                      title="Collapse tasks panel (T)"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Timer Display with Progress Ring */}
              <div className="relative flex justify-center mb-10">
                <div className="relative w-80 h-80">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#E50914]/20 to-[#FFD400]/20 blur-xl animate-pulse"></div>
                  
                  <svg className="transform -rotate-90 w-80 h-80">
                    {/* Background circle */}
                    <circle
                      cx="160"
                      cy="160"
                      r="120"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-800"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="160"
                      cy="160"
                      r="120"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 drop-shadow-lg"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E50914" />
                        <stop offset="50%" stopColor="#FF6B6B" />
                        <stop offset="100%" stopColor="#FFD400" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-7xl font-bold tabular-nums mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" aria-live="off">
                        {formatTime()}
                      </div>
                      <div className="text-lg text-gray-600 dark:text-gray-400">
                        {Math.round(progress)}% complete
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Controls */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <button
                  onClick={() => (isRunning ? pause() : start(selectedTaskId))}
                  className={`col-span-2 py-5 bg-gradient-to-r ${currentConfig.color} rounded-2xl font-bold text-xl text-black hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-4 group relative overflow-hidden`}
                  aria-label={isRunning ? "Pause timer (Space)" : "Start timer (Space)"}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFD400] to-[#E50914] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4">
                    {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                    <span>{isRunning ? "Pause" : "Start"}</span>
                    <kbd className="px-2 py-1 bg-black/20 rounded text-sm">Space</kbd>
                  </div>
                </button>
                
                <button
                  onClick={reset}
                  className="py-5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:scale-105 hover:shadow-lg group"
                  aria-label="Reset timer (R)"
                >
                  <RotateCcw className="w-7 h-7 group-hover:rotate-180 transition-transform duration-500" />
                </button>
                
                {timerStrategy !== "classic" && (
                  <button
                    onClick={skipToNext}
                    className="py-5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:scale-105 hover:shadow-lg group"
                    aria-label="Skip to next (N)"
                  >
                    <SkipForward className="w-7 h-7 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                )}
              </div>

              {/* Enhanced Task Actions */}
              {selectedTask && (
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={handleCompleteTask}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-3 group"
                  >
                    <Target className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    Mark Complete
                  </button>
                  {activeTasks.length > 1 && (
                    <button
                      onClick={handleNextTask}
                      className="px-8 py-4 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3 group"
                    >
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                      Next Task
                    </button>
                  )}
                </div>
              )}

              {/* Enhanced Keyboard Shortcuts Help */}
              <div className="p-6 bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Keyboard Shortcuts
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "Space", action: "Start/Pause" },
                    { key: "R", action: "Reset" },
                    { key: "N", action: "Next/Skip" },
                    { key: "M", action: "Minimal Mode" },
                    { key: "S", action: "Toggle Sound" },
                    { key: "T", action: "Toggle Tasks" }
                  ].map((shortcut, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <kbd className="px-3 py-2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg font-mono text-sm shadow-md">
                        {shortcut.key}
                      </kbd>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{shortcut.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tasks Panel */}
          {!isTasksPanelCollapsed && (
            <div className="space-y-6 animate-fade-in-up delay-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Target className="w-7 h-7 text-[#E50914]" />
                  Select a Task
                </h2>
                {activeTasks.length > 0 && (
                  <button
                    onClick={() => setIsTasksPanelCollapsed(true)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                    title="Collapse panel (T)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {activeTasks.length === 0 ? (
                <div className="animate-fade-in">
                  <EmptyState
                    icon={<Target className="w-12 h-12" />}
                    title="No active tasks"
                    description="Create a task to focus on during your session."
                    action={{
                      label: "Create Task",
                      onClick: () => setIsCreateTaskModalOpen(true),
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {activeTasks.map((task, index) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(selectedTaskId === task.id ? undefined : task.id)}
                      className={`w-full text-left p-6 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 hover:scale-[1.02] transform ${
                        selectedTaskId === task.id
                          ? "border-[#E50914] shadow-2xl shadow-[#E50914]/20 bg-gradient-to-br from-[#E50914]/5 to-[#FFD400]/5"
                          : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg"
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <h3 className="font-bold text-lg leading-tight">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            {task.estimated_minutes && (
                              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full font-medium">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {task.estimated_minutes}m est.
                              </span>
                            )}
                            {task.priority > 0 && (
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                task.priority >= 3 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                                task.priority >= 2 ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              }`}>
                                <Flame className="w-3 h-3 inline mr-1" />
                                Priority {task.priority}
                              </span>
                            )}
                            {task.project && (
                              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full font-medium">
                                {task.project}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedTaskId === task.id && (
                          <div className="text-[#E50914] animate-pulse">
                            <Target className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Collapsed Panel Toggle */}
              {isTasksPanelCollapsed && activeTasks.length > 0 && (
                <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40">
                  <button
                    onClick={() => setIsTasksPanelCollapsed(false)}
                    className="p-4 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 text-black"
                    title="Show tasks panel (T)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Floating Timer */}
      <FloatingTimer
        isCollapsed={isTasksPanelCollapsed}
        onToggleCollapse={() => setIsTasksPanelCollapsed(!isTasksPanelCollapsed)}
        currentTask={selectedTask}
        timeDisplay={formatTime()}
        progress={progress}
        isRunning={isRunning}
        mode={mode}
        onStart={() => start(selectedTaskId)}
        onPause={pause}
        onReset={reset}
        onSkip={skipToNext}
        onComplete={selectedTask ? handleCompleteTask : undefined}
        notes={sessionNotes}
        onNotesChange={setSessionNotes}
      />

      {/* Enhanced Minimal Focus Mode */}
      <MinimalFocusMode
        isActive={isMinimalMode}
        onExit={() => setIsMinimalMode(false)}
        currentTask={selectedTask}
        timeDisplay={formatTime()}
        progress={progress}
        isRunning={isRunning}
        mode={mode}
        onStart={() => start(selectedTaskId)}
        onPause={pause}
        showPrompts={settings?.show_motivational_prompts === 1}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onCreate={handleCreateTask}
      />

      {/* Enhanced Custom Styles */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out forwards;
        }
        
        .animate-gradient-x {
          animation: gradient-x 8s ease infinite;
        }
        
        .bg-300\\% {
          background-size: 300% 300%;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #E50914, #FFD400);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #FFD400, #E50914);
        }
        
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-700 { animation-delay: 700ms; }
        .delay-1000 { animation-delay: 1000ms; }
        .delay-1500 { animation-delay: 1500ms; }
      `}</style>
    </Layout>
  );
}
