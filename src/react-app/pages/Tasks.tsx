import { useEffect, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { useTasks } from "@/react-app/hooks/useTasks";
import { useToast } from "@/react-app/hooks/useToast";
import TaskList from "@/react-app/components/TaskList";
import TaskBoard from "@/react-app/components/TaskBoard";
import Layout from "@/react-app/components/Layout";
import CreateTaskModal from "@/react-app/components/CreateTaskModal";
import QuickAddTask from "@/react-app/components/QuickAddTask";
import TaskScheduler from "@/react-app/components/TaskScheduler";
import { ToastContainer } from "@/react-app/components/Toast";
import { Loader2, Plus, Inbox, Calendar, CalendarDays, Columns, Search, Sparkles, Target } from "lucide-react";

type ViewMode = "inbox" | "today" | "week" | "board";

export default function Tasks() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const { tasks, loading, createTask, updateTask, deleteTask, toggleTaskDone, completeTask } = useTasks();
  const { toasts, addToast, removeToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("inbox");
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/");
    }
  }, [user, isPending, navigate]);

  // Quick add keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastKeyTime < 300) return;
      setLastKeyTime(now);

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lastKeyTime]);

  const handleSchedule = async (dueDate: string | null) => {
    try {
      await Promise.all(
        selectedTaskIds.map((id) => updateTask(id, { due_date: dueDate }))
      );
      addToast(`Scheduled ${selectedTaskIds.length} task(s)`, "success");
      setSelectedTaskIds([]);
    } catch (error) {
      console.error("Failed to schedule tasks:", error);
      addToast("Failed to schedule tasks", "error");
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping">
              <Target className="w-16 h-16 text-[#E50914]/50 mx-auto" />
            </div>
            <div className="animate-spin">
              <Loader2 className="w-16 h-16 text-[#E50914] mx-auto" />
            </div>
          </div>
          <div className="animate-pulse">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading Tasks</h2>
            <p className="text-gray-500 dark:text-gray-400">Organizing your productivity workflow...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getFilteredTasks = () => {
    const today = new Date().toDateString();
    const nextWeek = new Date(Date.now() + 7 * 86400000);

    let filtered = tasks;

    // Apply view mode filter
    switch (viewMode) {
      case "inbox":
        filtered = tasks.filter(t => !t.due_date);
        break;
      case "today":
        filtered = tasks.filter(t => {
          if (!t.due_date) return false;
          return new Date(t.due_date).toDateString() === today;
        });
        break;
      case "week":
        filtered = tasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate <= nextWeek;
        });
        break;
      case "board":
        filtered = tasks;
        break;
      default:
        filtered = tasks;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.project && task.project.toLowerCase().includes(query)) ||
        (task.tags && task.tags.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  const viewModeConfig = {
    inbox: {
      icon: <Inbox className="w-5 h-5" />,
      label: "Inbox",
      description: "Unscheduled tasks"
    },
    today: {
      icon: <Calendar className="w-5 h-5" />,
      label: "Today",
      description: "Due today"
    },
    week: {
      icon: <CalendarDays className="w-5 h-5" />,
      label: "Week",
      description: "Next 7 days"
    },
    board: {
      icon: <Columns className="w-5 h-5" />,
      label: "Board",
      description: "Kanban view"
    }
  };

  return (
    <Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className={`max-w-7xl mx-auto transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        {/* Enhanced Header */}
        <div className="relative mb-12 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 rounded-full animate-pulse"></div>
            <div className="absolute top-8 -left-8 w-16 h-16 bg-gradient-to-br from-[#FFD400]/10 to-[#E50914]/10 rounded-full animate-bounce delay-700"></div>
            <div className="absolute top-16 right-1/3 w-12 h-12 bg-gradient-to-br from-[#E50914]/5 to-[#FFD400]/5 rounded-full animate-pulse delay-1000"></div>
          </div>

          <div className="relative flex items-start justify-between">
            <div className="space-y-4">
              <div className="animate-fade-in-up">
                <h1 className="text-5xl lg:text-6xl font-bold mb-3 leading-tight">
                  <span className="bg-gradient-to-r from-[#E50914] via-[#FF6B6B] to-[#FFD400] bg-clip-text text-transparent animate-gradient-x bg-300%">
                    Your Tasks
                  </span>
                </h1>
              </div>
              
              <div className="animate-fade-in-up delay-200">
                <div className="flex items-center gap-6 text-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{activeTasks.length}</span>
                    <span className="text-gray-600 dark:text-gray-300">active</span>
                  </div>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-300"></div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{completedTasks.length}</span>
                    <span className="text-gray-600 dark:text-gray-300">completed</span>
                  </div>
                  {filteredTasks.length !== tasks.length && (
                    <>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-500"></div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredTasks.length}</span>
                        <span className="text-gray-600 dark:text-gray-300">filtered</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="animate-fade-in-up delay-300">
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
                  Organize, prioritize, and conquer your goals with style.
                </p>
              </div>
            </div>
            
            {/* Action Buttons with Enhanced Styling */}
            <div className="flex items-center gap-2 sm:gap-4 animate-fade-in-up delay-400">
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="group px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2 sm:gap-3 border border-gray-200 dark:border-gray-700"
                title="Quick Add (Q)"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Quick Add</span>
                <kbd className="hidden sm:inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Q</kbd>
              </button>
              
              <button
                onClick={() => {
                  console.log("New Task button clicked, opening modal");
                  setIsCreateModalOpen(true);
                }}
                className="group relative px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-bold text-black overflow-hidden transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-[#E50914]/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD400] to-[#E50914] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2 sm:gap-3">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span>New Task</span>
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:animate-pulse hidden sm:inline" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Search & Filter Section */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-8 animate-fade-in-up delay-500">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#E50914] focus:ring-2 focus:ring-[#E50914]/20 transition-all duration-300 outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ×
              </button>
            )}
          </div>

          {/* View Mode Selector */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl p-1.5 w-full overflow-x-auto shadow-lg">
            {(Object.keys(viewModeConfig) as ViewMode[]).map((mode, index) => {
              const config = viewModeConfig[mode];
              const isActive = viewMode === mode;
              
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`group relative px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 sm:gap-3 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black shadow-lg transform scale-105"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`${isActive ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform duration-300 flex-shrink-0`}>
                    {config.icon}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-semibold">{config.label}</div>
                    <div className={`text-xs ${isActive ? 'text-black/70' : 'text-gray-500 dark:text-gray-400'}`}>
                      {config.description}
                    </div>
                  </div>
                  <div className="text-left sm:hidden">
                    <div className="font-semibold text-sm">{config.label}</div>
                  </div>
                  
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#E50914]/20 to-[#FFD400]/20 animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Content with Smooth Transitions */}
        <div className="animate-fade-in-up delay-600">
          {viewMode === "board" ? (
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <TaskBoard
                tasks={filteredTasks}
                onUpdate={updateTask}
                onDelete={deleteTask}
                selectedTaskId={selectedTaskId}
              />
            </div>
          ) : (
            <div className="transform transition-all duration-500 hover:scale-[1.01]">
              <TaskList
                tasks={filteredTasks}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onSelectTask={setSelectedTaskId}
                selectedTaskId={selectedTaskId}
                toggleTaskDone={toggleTaskDone}
                completeTask={completeTask}
              />
            </div>
          )}
        </div>

        {/* Empty State Enhancement */}
        {filteredTasks.length === 0 && tasks.length > 0 && (
          <div className="text-center py-16 animate-fade-in-up delay-700">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 animate-ping">
                <Search className="w-16 h-16 text-[#E50914]/30 mx-auto" />
              </div>
              <Search className="w-16 h-16 text-[#E50914] mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No tasks match your filter</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Try adjusting your search or view mode</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setViewMode("inbox");
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-semibold text-black hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Quick Action Floating Button for Mobile */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="group w-16 h-16 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
          >
            <Plus className="w-8 h-8 text-black group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Enhanced Modals */}
      {isCreateModalOpen && (
        <div className="animate-modal-in">
          <CreateTaskModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={async (task) => {
              await createTask(task);
              setIsCreateModalOpen(false);
              addToast("Task created successfully", "success");
            }}
          />
        </div>
      )}

      {isQuickAddOpen && (
        <div className="animate-modal-in">
          <QuickAddTask
            onClose={() => setIsQuickAddOpen(false)}
            onCreate={async (task) => {
              await createTask(task);
              addToast("Task created successfully", "success");
            }}
          />
        </div>
      )}

      <TaskScheduler
        selectedTaskIds={selectedTaskIds}
        onSchedule={handleSchedule}
        onClear={() => setSelectedTaskIds([])}
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
        
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-modal-in {
          animation: modal-in 0.3s ease-out forwards;
        }
        
        .animate-gradient-x {
          animation: gradient-x 8s ease infinite;
        }
        
        .bg-300\\% {
          background-size: 300% 300%;
        }
        
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }
        .delay-700 { animation-delay: 700ms; }
        .delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </Layout>
  );
}
