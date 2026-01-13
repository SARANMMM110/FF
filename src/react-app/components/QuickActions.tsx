import React from "react";
import { useNavigate } from "react-router";
import { Plus, Timer, BarChart3, Settings, Target, Clock } from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  gradient: string;
  shortcut?: string;
}

interface QuickActionsProps {
  onCreateTask?: () => void;
  onStartTimer?: () => void;
}

export default function QuickActions({ onCreateTask, onStartTimer }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: "create-task",
      label: "New Task",
      icon: <Plus className="w-5 h-5" />,
      action: onCreateTask || (() => navigate("/tasks")),
      gradient: "from-[#E50914] to-[#FFD400]",
      shortcut: "Q",
    },
    {
      id: "start-focus",
      label: "Start Focus",
      icon: <Timer className="w-5 h-5" />,
      action: onStartTimer || (() => navigate("/focus-mode")),
      gradient: "from-[#FFD400] to-[#E50914]",
      shortcut: "F",
    },
    {
      id: "view-analytics", 
      label: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      action: () => navigate("/analytics"),
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "quick-session",
      label: "Quick 25min",
      icon: <Clock className="w-5 h-5" />,
      action: () => navigate("/focus-mode?quick=25"),
      gradient: "from-green-500 to-emerald-500",
    },
    {
      id: "goals",
      label: "Goals",
      icon: <Target className="w-5 h-5" />,
      action: () => navigate("/settings#goals"),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      action: () => navigate("/settings"),
      gradient: "from-gray-500 to-gray-600",
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-[#E50914]" />
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`group relative p-4 bg-gradient-to-br ${action.gradient} rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
          >
            <div className="flex flex-col items-center gap-2">
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </div>
            
            {action.shortcut && (
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <kbd className="px-1.5 py-0.5 text-xs bg-black/20 rounded">
                  {action.shortcut}
                </kbd>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
