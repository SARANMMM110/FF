import { useState, useEffect } from "react";
import { Clock, CheckSquare, Target, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "task_completed" | "focus_session" | "goal_achieved" | "streak";
  title: string;
  description?: string;
  timestamp: string;
  metadata?: any;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Get recent completed tasks
      const tasksResponse = await fetch("/api/tasks");
      const tasks = await tasksResponse.json();
      
      // Get recent focus sessions
      const sessionsResponse = await fetch("/api/focus-sessions?limit=10");
      const sessions = await sessionsResponse.json();

      const recentTasks = tasks
        .filter((task: any) => task.is_completed && task.completed_at)
        .slice(0, 5)
        .map((task: any) => ({
          id: `task-${task.id}`,
          type: "task_completed" as const,
          title: `Completed: ${task.title}`,
          description: task.project ? `Project: ${task.project}` : undefined,
          timestamp: task.completed_at,
          metadata: { taskId: task.id, actualMinutes: task.actual_minutes },
        }));

      const recentSessions = sessions
        .filter((session: any) => session.end_time && session.session_type === "focus")
        .slice(0, 5)
        .map((session: any) => ({
          id: `session-${session.id}`,
          type: "focus_session" as const,
          title: `Focus session: ${session.duration_minutes} minutes`,
          description: session.notes || undefined,
          timestamp: session.end_time,
          metadata: { sessionId: session.id, duration: session.duration_minutes },
        }));

      // Combine and sort by timestamp
      const combined = [...recentTasks, ...recentSessions]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      setActivities(combined);
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "task_completed":
        return <CheckSquare className="w-4 h-4 text-green-600" />;
      case "focus_session":
        return <Clock className="w-4 h-4 text-[#E50914]" />;
      case "goal_achieved":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "streak":
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
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
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#E50914]" />
        Recent Activity
      </h2>
      
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-300">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No recent activity</p>
          <p className="text-sm">Complete tasks or start focus sessions to see your progress here.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {activity.title}
                </h3>
                {activity.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {activity.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
