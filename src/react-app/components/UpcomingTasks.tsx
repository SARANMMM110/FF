import { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { useNavigate } from "react-router";

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: number;
  estimated_minutes?: number;
  project?: string;
  is_completed: boolean;
}

export default function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingTasks();
  }, []);

  const fetchUpcomingTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      const allTasks = await response.json();
      
      // Filter for upcoming tasks (not completed, with due dates)
      const upcoming = allTasks
        .filter((task: Task) => !task.is_completed && task.due_date)
        .sort((a: Task, b: Task) => {
          // Sort by due date, then by priority
          const dateA = new Date(a.due_date!).getTime();
          const dateB = new Date(b.due_date!).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return b.priority - a.priority;
        })
        .slice(0, 6); // Show only 6 upcoming tasks

      setTasks(upcoming);
    } catch (error) {
      console.error("Failed to fetch upcoming tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return "Overdue";
    return format(date, "MMM d");
  };

  const getDateColor = (dateString: string) => {
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return "text-red-600 dark:text-red-400";
    if (isToday(date)) return "text-[#E50914]";
    if (isTomorrow(date)) return "text-orange-600 dark:text-orange-400";
    return "text-gray-600 dark:text-gray-300";
  };

  const getPriorityDot = (priority: number) => {
    if (priority >= 3) return "bg-red-500";
    if (priority >= 2) return "bg-orange-500";
    if (priority >= 1) return "bg-yellow-500";
    return "bg-gray-400";
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Upcoming Tasks</h2>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#E50914]" />
          Upcoming Tasks
        </h2>
        <button
          onClick={() => navigate("/tasks")}
          className="text-sm text-[#E50914] hover:text-[#FFD400] transition-colors flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-300">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No upcoming tasks</p>
          <p className="text-sm">Schedule some tasks to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => navigate("/tasks")}
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityDot(task.priority)}`}></div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {task.title}
                </h3>
                
                <div className="flex items-center gap-3 mt-1">
                  <div className={`text-xs font-medium ${getDateColor(task.due_date!)}`}>
                    {isPast(new Date(task.due_date!)) && !isToday(new Date(task.due_date!)) && (
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                    )}
                    {getDateLabel(task.due_date!)}
                  </div>
                  
                  {task.estimated_minutes && (
                    <div className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.estimated_minutes}m
                    </div>
                  )}
                  
                  {task.project && (
                    <div className="text-xs text-gray-500 dark:text-gray-300 truncate max-w-20">
                      {task.project}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
