import { useLocation } from "react-router";
import { 
  LayoutDashboard,
  Timer,
  CheckSquare,
  Calendar,
  Target,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSubscription } from "@/react-app/hooks/useSubscription";

interface LeftNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LeftNav({ isOpen = true, onClose }: LeftNavProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isPro, isEnterprise } = useSubscription();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", isPro: false },
    { path: "/focus-mode", icon: Timer, label: "Focus Mode", isPro: false },
    { path: "/tasks", icon: CheckSquare, label: "Tasks", isPro: false },
    { path: "/planner", icon: Calendar, label: "Weekly Planner", isPro: false },
    { path: "/goals", icon: Target, label: "Goals", isPro: true },
    { path: "/analytics", icon: TrendingUp, label: "Analytics", isPro: false },
    { path: "/settings", icon: Settings, label: "Settings", isPro: false },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string, e?: React.MouseEvent) => {
    // Prevent any keyboard shortcuts from interfering
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Close mobile menu first
    if (onClose) {
      onClose();
    }
    
    // Use direct browser navigation to bypass any event handler issues
    window.location.href = path;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Collapse Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={handleToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const showProBadge = item.isPro && !isPro && !isEnterprise;

            return (
              <button
                key={item.path}
                onClick={(e) => handleNavigation(item.path, e)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#E50914]/10 to-[#FFD400]/10 text-gray-900 dark:text-white border border-[#E50914]/20"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#E50914]" : ""}`} />
                {!isCollapsed && (
                  <span className="truncate flex items-center gap-2 flex-1">
                    {item.label}
                    {showProBadge && <Crown className="w-3.5 h-3.5 text-[#FFD400] flex-shrink-0" />}
                  </span>
                )}
                {isCollapsed && showProBadge && (
                  <Crown className="w-3.5 h-3.5 text-[#FFD400] absolute -top-1 -right-1" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Navigation Items */}
        <nav className="p-4 space-y-1 mt-16 overflow-y-auto h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const showProBadge = item.isPro && !isPro && !isEnterprise;

            return (
              <button
                key={item.path}
                onClick={(e) => handleNavigation(item.path, e)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#E50914]/10 to-[#FFD400]/10 text-gray-900 dark:text-white border border-[#E50914]/20"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-[#E50914]" : ""}`} />
                <span className="flex items-center gap-2 flex-1">
                  {item.label}
                  {showProBadge && <Crown className="w-3.5 h-3.5 text-[#FFD400]" />}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
