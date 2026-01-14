import { useEffect, useState } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate } from "react-router";
import { useTasks } from "@/react-app/hooks/useTasks";
import { useRecurringTasks } from "@/react-app/hooks/useRecurringTasks";
import Layout from "@/react-app/components/Layout";
import DashboardWidget from "@/react-app/components/DashboardWidget";
import QuickActions from "@/react-app/components/QuickActions";
import RecentActivity from "@/react-app/components/RecentActivity";
import UpcomingTasks from "@/react-app/components/UpcomingTasks";
import CreateTaskModal from "@/react-app/components/CreateTaskModal";
import { useToast } from "@/react-app/hooks/useToast";
import { ToastContainer } from "@/react-app/components/Toast";
import { Loader2, Timer, CheckSquare, TrendingUp, Zap, Clock, Flame, Target, Sparkles, Star } from "lucide-react";

interface DashboardStats {
  today_focus_minutes: number;
  week_focus_minutes: number;
  completed_today: number;
  avg_session_minutes: number;
  longest_streak: number;
}

export default function Dashboard() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, createTask } = useTasks();
  const { toasts, addToast, removeToast } = useToast();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Process recurring tasks automatically
  useRecurringTasks();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const [statsResponse, streakResponse] = await Promise.all([
          fetch("/api/dashboard-stats"),
          fetch("/api/streak")
        ]);
        
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setDashboardStats(data);
        }
        
        if (streakResponse.ok) {
          const streakData = await streakResponse.json();
          setCurrentStreak(streakData.streak);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (isPending || tasksLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping">
              <Loader2 className="w-16 h-16 text-[#E50914]/50 mx-auto" />
            </div>
            <div className="animate-spin">
              <Loader2 className="w-16 h-16 text-[#E50914] mx-auto" />
            </div>
          </div>
          <div className="animate-pulse">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading Dashboard</h2>
            <p className="text-gray-500 dark:text-gray-400">Preparing your productivity insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasksToday = tasks.filter(t => 
    t.is_completed && 
    t.completed_at && 
    new Date(t.completed_at).toDateString() === new Date().toDateString()
  ).length;

  const handleCreateTask = async (task: any) => {
    try {
      await createTask(task);
      setIsCreateModalOpen(false);
      addToast("Task created successfully", "success");
    } catch (error) {
      addToast("Failed to create task", "error");
    }
  };

  const handleStartQuickTimer = () => {
    navigate("/focus-mode?quick=25");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    if (completedTasksToday === 0) {
      return "Ready to make today amazing? Every great achievement starts with a single task.";
    }
    if (completedTasksToday === 1) {
      return "Great start! You've completed your first task. Keep the momentum going!";
    }
    if (completedTasksToday < 5) {
      return `Excellent progress! You've completed ${completedTasksToday} tasks. You're building great momentum!`;
    }
    return `Outstanding work! ${completedTasksToday} tasks completed. You're absolutely crushing it today! 🚀`;
  };

  return (
    <Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className={`max-w-7xl mx-auto transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        {/* Enhanced Header with Floating Elements */}
        <div className="relative mb-12 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 rounded-full animate-pulse"></div>
            <div className="absolute top-8 -left-8 w-16 h-16 bg-gradient-to-br from-[#FFD400]/10 to-[#E50914]/10 rounded-full animate-bounce delay-700"></div>
            <div className="absolute top-16 right-1/3 w-12 h-12 bg-gradient-to-br from-[#E50914]/5 to-[#FFD400]/5 rounded-full animate-pulse delay-1000"></div>
          </div>

          <div className="relative flex items-start justify-between">
            <div className="space-y-4">
              {/* Greeting Animation */}
              <div className="animate-fade-in-up">
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  {getGreeting()}, {user.email?.split('@')[0] || 'there'}!
                </p>
              </div>
              
              {/* Main Title with Gradient */}
              <div className="animate-fade-in-up delay-200">
                <h1 className="text-5xl lg:text-6xl font-bold mb-3 leading-tight">
                  <span className="bg-gradient-to-r from-[#E50914] via-[#FF6B6B] to-[#FFD400] bg-clip-text text-transparent animate-gradient-x bg-300%">
                    Dashboard
                  </span>
                </h1>
              </div>
              
              {/* Motivational Message */}
              <div className="animate-fade-in-up delay-300">
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl leading-relaxed">
                  {getMotivationalMessage()}
                </p>
              </div>
            </div>
            
            {/* Streak Badge with Enhanced Animation */}
            {currentStreak > 0 && (
              <div className="animate-fade-in-up delay-500">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#E50914] flex items-center justify-center gap-2 mb-1">
                        <Flame className="w-10 h-10 animate-pulse" />
                        {currentStreak}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        day streak
                      </p>
                      <div className="flex justify-center mt-2">
                        {[...Array(Math.min(currentStreak, 5))].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-[#FFD400] fill-current animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Stats Grid with Staggered Animation */}
        {dashboardStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-12">
            {[
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Today's Focus",
                value: `${Math.floor(dashboardStats.today_focus_minutes / 60)}h ${dashboardStats.today_focus_minutes % 60}m`,
                subtitle: "Minutes focused today",
                gradient: "from-[#E50914]/20 to-[#E50914]/5",
                trend: dashboardStats.today_focus_minutes > 25 ? { value: 15, isPositive: true } : undefined,
                delay: 100
              },
              {
                icon: <CheckSquare className="w-6 h-6" />,
                title: "Completed",
                value: completedTasksToday,
                subtitle: "Tasks done today",
                gradient: "from-green-500/20 to-green-500/5",
                delay: 200
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: "Active Tasks",
                value: activeTasks.length,
                subtitle: "In your queue",
                gradient: "from-blue-500/20 to-blue-500/5",
                onClick: () => navigate("/tasks"),
                delay: 300
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Avg Session",
                value: `${dashboardStats.avg_session_minutes}m`,
                subtitle: "Per focus session",
                gradient: "from-purple-500/20 to-purple-500/5",
                delay: 400
              },
              {
                icon: <Flame className="w-6 h-6" />,
                title: "Current Streak",
                value: `${currentStreak} days`,
                subtitle: "Keep it going!",
                gradient: "from-orange-500/20 to-orange-500/5",
                onClick: () => navigate("/analytics"),
                delay: 500
              }
            ].map((stat, index) => (
              <div
                key={index}
                className={`animate-fade-in-up transform hover:scale-105 transition-all duration-300`}
                style={{ animationDelay: `${stat.delay}ms` }}
              >
                <DashboardWidget
                  icon={stat.icon}
                  title={stat.title}
                  value={stat.value}
                  subtitle={stat.subtitle}
                  gradient={stat.gradient}
                  trend={stat.trend}
                  onClick={stat.onClick}
                  isLoading={statsLoading}
                />
              </div>
            ))}
          </div>
        )}

        {/* Main Content Grid with Smooth Animations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {/* Quick Actions */}
          <div className="animate-fade-in-up delay-600 transform hover:scale-[1.02] transition-all duration-300">
            <QuickActions 
              onCreateTask={() => setIsCreateModalOpen(true)}
              onStartTimer={handleStartQuickTimer}
            />
          </div>
          
          {/* Upcoming Tasks */}
          <div className="animate-fade-in-up delay-700 transform hover:scale-[1.02] transition-all duration-300">
            <UpcomingTasks />
          </div>
          
          {/* Recent Activity */}
          <div className="animate-fade-in-up delay-800 transform hover:scale-[1.02] transition-all duration-300">
            <RecentActivity />
          </div>
        </div>

        {/* Enhanced Focus Session CTA */}
        {activeTasks.length > 0 && (
          <div className="animate-fade-in-up delay-900">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#E50914]/10 via-[#FF6B6B]/5 to-[#FFD400]/10 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl group hover:shadow-3xl transition-all duration-500">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-r from-[#E50914] to-[#FFD400] animate-gradient-x bg-300%"></div>
              </div>
              
              {/* Floating Sparkles */}
              <div className="absolute top-6 right-6 animate-pulse delay-1000">
                <Sparkles className="w-6 h-6 text-[#FFD400]" />
              </div>
              <div className="absolute bottom-6 left-6 animate-pulse delay-1500">
                <Sparkles className="w-4 h-4 text-[#E50914]" />
              </div>

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="relative group flex-shrink-0">
                    <div className="absolute -inset-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative p-4 sm:p-6 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-2xl text-black transform group-hover:scale-110 transition-transform duration-300">
                      <Timer className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Ready to Focus?
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
                      You have <span className="font-bold text-[#E50914]">{activeTasks.length}</span> active task{activeTasks.length === 1 ? '' : 's'}. 
                      <br />Start a focus session and make real progress!
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => navigate("/focus-mode")}
                    className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg text-black overflow-hidden transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-[#E50914]/50 w-full sm:w-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FFD400] to-[#E50914] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-2 sm:gap-3">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />
                      <span className="whitespace-nowrap">Start Focus Session</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTask}
      />

      {/* Custom Animations Styles */}
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
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animate-gradient-x {
          animation: gradient-x 8s ease infinite;
        }
        
        .bg-300\\% {
          background-size: 300% 300%;
        }
        
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }
        .delay-700 { animation-delay: 700ms; }
        .delay-750 { animation-delay: 750ms; }
        .delay-800 { animation-delay: 800ms; }
        .delay-900 { animation-delay: 900ms; }
        .delay-1000 { animation-delay: 1000ms; }
        .delay-1500 { animation-delay: 1500ms; }
      `}</style>
    </Layout>
  );
}
