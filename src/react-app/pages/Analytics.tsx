import { useEffect, useState } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/Layout";
import TimeTrackingComparison from "@/react-app/components/TimeTrackingComparison";
import { TrendingUp, Clock, Target, Flame, Download, FileText, BarChart3, PieChart as PieChartIcon, Calendar, Sparkles, Star, Activity, Crown } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useAnalytics } from "@/react-app/hooks/useAnalytics";
import { useSubscription } from "@/react-app/hooks/useSubscription";
import ProUpgradeModal from "@/react-app/components/ProUpgradeModal";

export default function Analytics() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const { isPro, isEnterprise, loading: subscriptionLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");
  const [isVisible, setIsVisible] = useState(false);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  const { 
    analytics, 
    dashboardStats, 
    modeData, 
    projectData, 
    loading
  } = useAnalytics({ 
    dateRange, 
    enabled: !!user 
  });

  // Fetch all sessions - only on mount and when dateRange changes
  useEffect(() => {
    if (!user) return;
    
    const fetchAllSessions = async () => {
      try {
        setLoadingSessions(true);
        const response = await fetch("/api/focus-sessions", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          // Sort by start_time descending
          const sorted = data.sort((a: any, b: any) => 
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
          );
          setAllSessions(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    };

    // Initial fetch
    fetchAllSessions();
    
    // Refresh when page becomes visible (e.g., switching back from focus mode)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAllSessions();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, dateRange]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/auth/login");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    // Advanced analytics is Pro/Enterprise only - check after subscription loads
    if (!subscriptionLoading && user && !isPro && !isEnterprise) {
      // For "all time" and detailed charts, require Pro
      if (dateRange === "all") {
        setShowUpgradeModal(true);
      }
    }
  }, [subscriptionLoading, user, isPro, isEnterprise, dateRange]);

  const handleExportSessions = async () => {
    try {
      const params = new URLSearchParams();
      const now = new Date();
      
      if (dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.set("from", weekAgo.toISOString());
      } else if (dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.set("from", monthAgo.toISOString());
      }

      const response = await fetch(`/api/export/sessions?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focusflow-sessions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export sessions:', error);
    }
  };

  const handleExportTasks = async () => {
    try {
      const response = await fetch("/api/export/tasks", {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focusflow-tasks-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export tasks:', error);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (isPending || subscriptionLoading || (user && loading)) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping">
                <BarChart3 className="w-16 h-16 text-[#E50914]/50 mx-auto" />
              </div>
              <div className="animate-spin">
                <TrendingUp className="w-16 h-16 text-[#E50914] mx-auto" />
              </div>
            </div>
            <div className="animate-pulse">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading Analytics</h2>
              <p className="text-gray-500 dark:text-gray-300">Crunching your productivity data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-fade-in">
            <div className="mb-6">
              <Target className="w-20 h-20 text-[#E50914] mx-auto mb-4 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
              Please log in to view analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
              Unlock insights into your productivity journey
            </p>
            <button 
              onClick={() => navigate("/auth/login")}
              className="group px-8 py-4 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-2xl font-bold text-lg text-black hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-3">
                Go to Login
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              </span>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const focusSessions = analytics.filter(a => a.session_type === "focus");
  const totalFocusMinutes = focusSessions.reduce((sum, a) => sum + a.total_minutes, 0);
  const totalSessions = focusSessions.reduce((sum, a) => sum + a.session_count, 0);
  const avgSessionLength = totalSessions > 0 ? Math.round(totalFocusMinutes / totalSessions) : 0;

  // Prepare data for Focus Time by Day chart (last 14 days)
  const last14Days = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last14Days.push(dateStr);
  }

  // Include all sessions (completed and incomplete) in daily data
  const dailyData = analytics.reduce((acc, curr) => {
    if (curr.session_type === "focus") {
      if (!acc[curr.date]) {
        acc[curr.date] = { date: curr.date, minutes: 0, sessions: 0 };
      }
      acc[curr.date].minutes += curr.total_minutes;
      acc[curr.date].sessions += curr.session_count;
    }
    return acc;
  }, {} as Record<string, { date: string; minutes: number; sessions: number }>);

  // Add incomplete sessions from today
  if (!loadingSessions && allSessions.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const incompleteSessions = allSessions.filter(s => !s.end_time && s.session_type === "focus");
    
    if (incompleteSessions.length > 0) {
      if (!dailyData[today]) {
        dailyData[today] = { date: today, minutes: 0, sessions: 0 };
      }
      
      incompleteSessions.forEach(session => {
        const duration = Math.floor((Date.now() - new Date(session.start_time).getTime()) / 60000);
        dailyData[today].minutes += duration;
        dailyData[today].sessions += 1;
      });
    }
  }

  const chartData = last14Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    minutes: dailyData[date]?.minutes || 0,
    sessions: dailyData[date]?.sessions || 0,
  }));

  // Prepare pie chart data
  const pieData = modeData.map(item => ({
    name: item.timer_mode === 'pomodoro' ? 'Pomodoro' : item.timer_mode === 'classic' ? 'Classic' : 'Custom',
    value: item.total_minutes,
    sessions: item.session_count,
  }));

  // Prepare project data
  const topProjects = projectData
    .filter(p => p.project)
    .sort((a, b) => b.total_minutes - a.total_minutes)
    .slice(0, 10)
    .map(p => ({
      project: p.project || 'No Project',
      minutes: p.total_minutes,
    }));

  const COLORS = ['#E50914', '#FFD400', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  const dateRangeConfig = {
    week: { label: "7 Days", icon: <Calendar className="w-4 h-4" /> },
    month: { label: "30 Days", icon: <Activity className="w-4 h-4" /> },
    all: { label: "All Time", icon: <Star className="w-4 h-4" /> }
  };

  return (
    <Layout>
      <div className={`max-w-7xl mx-auto print:max-w-full transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        {/* Enhanced Header */}
        <div className="relative mb-12 overflow-hidden print:mb-4">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/10 rounded-full animate-pulse blur-xl"></div>
            <div className="absolute top-8 -left-8 w-24 h-24 bg-gradient-to-br from-[#FFD400]/10 to-[#E50914]/10 rounded-full animate-bounce delay-700 blur-lg"></div>
            <div className="absolute top-20 right-1/3 w-16 h-16 bg-gradient-to-br from-[#E50914]/5 to-[#FFD400]/5 rounded-full animate-pulse delay-1000 blur-md"></div>
          </div>

          <div className="relative flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="animate-fade-in-up">
                <h1 className="text-5xl lg:text-6xl font-bold mb-3 leading-tight print:text-3xl">
                  <span className="bg-gradient-to-r from-[#E50914] via-[#FF6B6B] to-[#FFD400] bg-clip-text text-transparent animate-gradient-x bg-300%">
                    Analytics & Reports
                  </span>
                </h1>
              </div>
              
              <div className="animate-fade-in-up delay-200">
                <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl print:text-base">
                  Deep insights into your productivity journey and focus patterns.
                </p>
              </div>
            </div>
            
            {/* Enhanced Controls */}
            <div className="flex items-center gap-4 print:hidden animate-fade-in-up delay-300">
              {/* Date Range Selector */}
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 rounded-2xl p-1.5 shadow-lg">
                {(Object.keys(dateRangeConfig) as Array<"week" | "month" | "all">).map((range, index) => {
                  const config = dateRangeConfig[range];
                  const isActive = dateRange === range;
                  const isProOnly = range === "all" && !isPro && !isEnterprise;
                  
                  return (
                    <button
                      key={range}
                      onClick={() => {
                        if (isProOnly) {
                          setShowUpgradeModal(true);
                        } else {
                          setDateRange(range);
                        }
                      }}
                      className={`group px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                        isActive
                          ? "bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black shadow-lg transform scale-105"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                      } ${isProOnly ? 'relative' : ''}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`${isActive ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform duration-300`}>
                        {config.icon}
                      </div>
                      <span>{config.label}</span>
                      {isProOnly && <Crown className="w-4 h-4 text-[#FFD400] absolute -top-1 -right-1" />}
                    </button>
                  );
                })}
              </div>
              
              {/* Export Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleExportSessions}
                  className="group px-4 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-3"
                >
                  <Download className="w-4 h-4 group-hover:animate-bounce" />
                  Sessions CSV
                </button>
                <button
                  onClick={handleExportTasks}
                  className="group px-4 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-3"
                >
                  <Download className="w-4 h-4 group-hover:animate-bounce" />
                  Tasks CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="group px-6 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-bold text-black hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                  <FileText className="w-4 h-4 group-hover:animate-pulse" />
                  Export PDF
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                </button>
              </div>
            </div>
          </div>
        </div>

        

        {/* Enhanced Dashboard Stats Cards */}
        {dashboardStats && (
          <div className="grid md:grid-cols-5 gap-4 lg:gap-6 mb-12 print:mb-4 print:gap-2">
            {[
              {
                icon: <Clock className="w-6 h-6" />,
                label: "Today's Focus",
                value: `${Math.floor(dashboardStats.today_focus_minutes / 60)}h ${dashboardStats.today_focus_minutes % 60}m`,
                gradient: "from-[#E50914]/20 to-[#E50914]/5",
                delay: 100
              },
              {
                icon: <Activity className="w-6 h-6" />,
                label: "Week's Focus", 
                value: `${Math.floor(dashboardStats.week_focus_minutes / 60)}h ${dashboardStats.week_focus_minutes % 60}m`,
                gradient: "from-[#FFD400]/20 to-[#FFD400]/5",
                delay: 200
              },
              {
                icon: <Target className="w-6 h-6" />,
                label: "Completed Today",
                value: dashboardStats.completed_today.toString(),
                gradient: "from-green-500/20 to-green-500/5",
                delay: 300
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                label: "Avg Session",
                value: `${dashboardStats.avg_session_minutes}m`,
                gradient: "from-purple-500/20 to-purple-500/5",
                delay: 400
              },
              {
                icon: <Flame className="w-6 h-6" />,
                label: "Longest Streak",
                value: `${dashboardStats.longest_streak} days`,
                gradient: "from-orange-500/20 to-orange-500/5",
                delay: 500
              }
            ].map((stat, index) => (
              <div
                key={index}
                className={`animate-fade-in-up transform hover:scale-105 transition-all duration-300`}
                style={{ animationDelay: `${stat.delay}ms` }}
              >
                <StatCard
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  gradient={stat.gradient}
                />
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8 print:gap-4 animate-fade-in-up delay-600">
          {/* Enhanced Focus Time by Day Chart */}
          <div className="group bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 print:p-4 print:break-inside-avoid hover:shadow-2xl hover:border-[#E50914]/30 transition-all duration-500 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E50914] to-[#FFD400]"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl">
                  <BarChart3 className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold print:text-lg">Focus Time Trend</h2>
                <div className="ml-auto text-sm text-gray-500 dark:text-gray-300">Last 14 Days</div>
              </div>
              
              {chartData.every(d => d.minutes === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-300">
                  <Clock className="w-16 h-16 mb-4 opacity-50 animate-pulse" />
                  <p className="text-lg font-medium mb-2">No session data yet</p>
                  <p className="text-sm">Start focusing to see your progress here!</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E50914" stopOpacity={0.8} />
                        <stop offset="50%" stopColor="#FF6B6B" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#FFD400" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#F9FAFB',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'minutes' ? `${value} minutes` : `${value} sessions`,
                        name === 'minutes' ? 'Focus Time' : 'Sessions'
                      ]}
                    />
                    <Area dataKey="minutes" stroke="#E50914" strokeWidth={3} fill="url(#areaGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Enhanced Sessions by Mode Chart */}
          <div className="group bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 print:p-4 print:break-inside-avoid hover:shadow-2xl hover:border-[#FFD400]/30 transition-all duration-500 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD400] to-[#E50914]"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-[#FFD400] to-[#E50914] rounded-xl">
                  <PieChartIcon className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold print:text-lg">Timer Modes</h2>
              </div>
              
              {pieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-300">
                  <Target className="w-16 h-16 mb-4 opacity-50 animate-pulse" />
                  <p className="text-lg font-medium mb-2">No session data yet</p>
                  <p className="text-sm">Complete some focus sessions to see your preferences!</p>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                          const { name, percent } = props;
                          return percent > 5 ? `${name}: ${(percent * 100).toFixed(0)}%` : '';
                        }}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {pieData.map((_entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#F9FAFB',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value} min (${props.payload.sessions} sessions)`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Tracking Comparison */}
        <div className="mb-8 animate-fade-in-up delay-700">
          <TimeTrackingComparison />
        </div>

        {/* Enhanced Time by Project Chart */}
        {topProjects.length > 0 && (
          <div className="group bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 mb-8 print:p-4 print:mb-4 print:break-inside-avoid hover:shadow-2xl hover:border-purple-500/30 transition-all duration-500 relative overflow-hidden animate-fade-in-up delay-800">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-[#E50914]"></div>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-[#E50914] rounded-xl">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold print:text-lg">Project Focus Distribution</h2>
                <div className="ml-auto text-sm text-gray-500 dark:text-gray-300">Top 10 Projects</div>
              </div>
              
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProjects} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis type="number" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <YAxis type="category" dataKey="project" stroke="#9CA3AF" width={120} style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#F9FAFB',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    formatter={(value: number) => [`${value} minutes`, 'Focus Time']}
                  />
                  <Bar dataKey="minutes" fill="url(#projectGradient)" radius={[0, 8, 8, 0]} />
                  <defs>
                    <linearGradient id="projectGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="50%" stopColor="#E50914" />
                      <stop offset="100%" stopColor="#FFD400" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Enhanced Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 print:gap-4 print:break-inside-avoid animate-fade-in-up delay-900">
          {[
            {
              icon: <Clock className="w-8 h-8" />,
              label: "Total Focus Time",
              value: `${Math.round(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`,
              gradient: "from-[#E50914]/20 to-[#E50914]/5",
              accent: "text-[#E50914]"
            },
            {
              icon: <Target className="w-8 h-8" />,
              label: "Total Sessions",
              value: totalSessions.toString(),
              gradient: "from-[#FFD400]/20 to-[#FFD400]/5",
              accent: "text-[#FFD400]"
            },
            {
              icon: <TrendingUp className="w-8 h-8" />,
              label: "Avg Session Length",
              value: `${avgSessionLength}m`,
              gradient: "from-purple-500/20 to-purple-500/5",
              accent: "text-purple-500"
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="group transform hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className={`bg-gradient-to-br ${stat.gradient} backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 print:p-4 hover:shadow-2xl transition-all duration-500 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient.replace('/20', '').replace('/5', '')}`}></div>
                </div>
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`${stat.accent} group-hover:scale-110 transition-transform duration-300`}>
                      {stat.icon}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-semibold print:text-sm">{stat.label}</span>
                  </div>
                  <div className="text-4xl font-bold print:text-2xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PDF Print Header (hidden on screen) */}
        <div className="hidden print:block fixed top-0 left-0 right-0 bg-white p-4 border-b-2 border-gray-300 z-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-xl flex items-center justify-center">
              <Flame className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">FocusFlow Analytics Report</h1>
              <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Advanced Analytics & Reporting"
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
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in-up 0.5s ease-out forwards;
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
        .delay-800 { animation-delay: 800ms; }
        
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </Layout>
  );
}

function StatCard({ icon, label, value, gradient }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div className={`group bg-gradient-to-br ${gradient} backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 print:p-3 hover:shadow-2xl transition-all duration-500 relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient.replace('/20', '').replace('/5', '')}`}></div>
      </div>
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[#E50914] group-hover:scale-110 transition-transform duration-300">{icon}</div>
          <span className="text-gray-600 dark:text-gray-300 font-semibold print:text-xs">{label}</span>
        </div>
        <div className="text-3xl font-bold print:text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {value}
        </div>
      </div>
    </div>
  );
}
