import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Search, Calendar, Play, Plus, BarChart3, Settings, Focus, CheckSquare } from "lucide-react";
import { useTasks } from "@/react-app/hooks/useTasks";

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  group: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const inputRef = useRef<HTMLInputElement>(null);

  // Navigation commands
  const navigationCommands: Command[] = [
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => {
        navigate("/dashboard");
        onClose();
      },
      group: "Navigation",
    },
    {
      id: "nav-tasks",
      title: "Go to Tasks",
      icon: <CheckSquare className="w-4 h-4" />,
      action: () => {
        navigate("/tasks");
        onClose();
      },
      group: "Navigation",
    },
    {
      id: "nav-focus",
      title: "Go to Focus Mode",
      icon: <Focus className="w-4 h-4" />,
      action: () => {
        navigate("/focus-mode");
        onClose();
      },
      group: "Navigation",
    },
    {
      id: "nav-planner",
      title: "Go to Weekly Planner",
      icon: <Calendar className="w-4 h-4" />,
      action: () => {
        navigate("/planner");
        onClose();
      },
      group: "Navigation",
    },
    {
      id: "nav-analytics",
      title: "Go to Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => {
        navigate("/analytics");
        onClose();
      },
      group: "Navigation",
    },
    {
      id: "nav-settings",
      title: "Go to Settings",
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        navigate("/settings");
        onClose();
      },
      group: "Navigation",
    },
  ];

  // Action commands
  const actionCommands: Command[] = [
    {
      id: "action-quick-add",
      title: "Quick Add Task",
      description: "Create a new task",
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        // TODO: Open quick add modal
        navigate("/tasks");
        onClose();
      },
      group: "Actions",
    },
    {
      id: "action-start-focus",
      title: "Start Focus Session",
      description: "Begin a new focus session",
      icon: <Play className="w-4 h-4" />,
      action: () => {
        navigate("/focus-mode");
        onClose();
      },
      group: "Actions",
    },
  ];

  // Task commands
  const taskCommands: Command[] = tasks
    .filter((task) => !task.is_completed)
    .slice(0, 5) // Limit to 5 tasks
    .map((task) => ({
      id: `task-${task.id}`,
      title: `Start focus on "${task.title}"`,
      description: task.project ? `Project: ${task.project}` : undefined,
      icon: <Play className="w-4 h-4" />,
      action: () => {
        navigate(`/focus-mode?taskId=${task.id}`);
        onClose();
      },
      group: "Tasks",
    }));

  const allCommands = [...navigationCommands, ...actionCommands, ...taskCommands];

  const filteredCommands = allCommands.filter(
    (command) =>
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.description?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.group]) {
      acc[command.group] = [];
    }
    acc[command.group].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, tasks, or navigate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
          />
          <div className="text-xs text-gray-400 dark:text-gray-300 ml-2">
            ESC to close
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedCommands).map(([group, commands]) => (
            <div key={group}>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
                {group}
              </div>
              {commands.map((command) => {
                const globalIndex = filteredCommands.indexOf(command);
                const isSelected = globalIndex === selectedIndex;
                
                return (
                  <button
                    key={command.id}
                    onClick={command.action}
                    className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500" : ""
                    }`}
                  >
                    <div className="mr-3 text-gray-400">
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {command.title}
                      </div>
                      {command.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-300 truncate">
                          {command.description}
                        </div>
                      )}
                    </div>
                    {command.shortcut && (
                      <div className="text-xs text-gray-400 dark:text-gray-300 font-mono">
                        {command.shortcut}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">
              No commands found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
