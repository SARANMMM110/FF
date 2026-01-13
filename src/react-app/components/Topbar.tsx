import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { useTheme } from "@/react-app/contexts/ThemeContext";
import { useProfileContext } from "@/react-app/contexts/ProfileContext";
import GlobalTimerWidget from "@/react-app/components/GlobalTimerWidget";
import { 
  Zap, 
  Moon, 
  Sun, 
  LogOut, 
  User, 
  Settings, 
  Flame,
  Menu,
  Crown,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";

interface TopbarProps {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfileContext();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [streak, setStreak] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>(() => {
    // Initialize from localStorage to avoid flash
    return localStorage.getItem('user_subscription_plan') || 'free';
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [streakResponse, planResponse] = await Promise.all([
          fetch("/api/streak"),
          fetch("/api/user/subscription")
        ]);
        
        if (streakResponse.ok) {
          const data = await streakResponse.json();
          setStreak(data.streak);
        }
        
        if (planResponse.ok) {
          const data = await planResponse.json();
          const plan = data.plan_id || 'free';
          setSubscriptionPlan(plan);
          // Cache in localStorage to prevent flash on reload
          localStorage.setItem('user_subscription_plan', plan);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const getPlanBadge = () => {
    const planName = subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1);
    
    if (subscriptionPlan === 'enterprise') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full border border-purple-500/30 shadow-lg shadow-purple-500/20">
          <Crown className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold text-white">{planName}</span>
        </div>
      );
    }
    
    if (subscriptionPlan === 'pro') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-full border border-[#FFD400]/30 shadow-lg shadow-[#E50914]/20">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span className="text-xs font-bold text-black">{planName}</span>
        </div>
      );
    }
    
    // Free plan
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{planName}</span>
      </div>
    );
  };

  return (
    <>
      {/* Global Timer Widget - shows on all pages when timer is running */}
      {user && <GlobalTimerWidget />}
      
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black sticky top-0 z-50 shadow-sm">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left - Logo and Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-xl flex items-center justify-center shadow-lg shadow-[#E50914]/30 group-hover:shadow-[#E50914]/50 transition-all duration-300 group-hover:scale-105">
              <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
              FocusFlow
            </span>
          </button>
        </div>

        {/* Center - Date, Plan Badge, and Streak */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {today}
          </div>
          
          {/* Plan Badge */}
          {getPlanBadge()}
          
          {streak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E50914]/10 to-[#FFD400]/10 rounded-full border border-[#E50914]/20">
              <Flame className="w-4 h-4 text-[#E50914]" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {streak} day{streak !== 1 ? "s" : ""} streak
              </span>
            </div>
          )}
        </div>

        {/* Mobile Plan Badge and Streak */}
        <div className="flex md:hidden items-center gap-2">
          {/* Plan Badge - Always visible on mobile */}
          <div className="flex md:hidden">
            {getPlanBadge()}
          </div>
          
          {/* Streak Badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-[#E50914]/10 to-[#FFD400]/10 rounded-full border border-[#E50914]/20">
              <Flame className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">{streak}</span>
            </div>
          )}
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              {profile?.profile_photo_url || user?.google_user_data?.picture ? (
                <img
                  src={profile?.profile_photo_url || user?.google_user_data?.picture || ''}
                  alt={user?.google_user_data?.name || profile?.display_name || "User"}
                  className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E50914] to-[#FFD400] flex items-center justify-center">
                  <User className="w-4 h-4 text-black" />
                </div>
              )}
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {(user?.google_user_data || profile) && (
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                      <p className="text-sm font-semibold truncate">
                        {profile?.display_name || user?.google_user_data?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">
                        {user?.email || user?.google_user_data?.email || ""}
                      </p>
                    </div>
                  )}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#E50914] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
