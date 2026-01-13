import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TaskTimeData {
  id: number;
  title: string;
  estimated_minutes: number;
  actual_minutes: number;
  difference: number;
  accuracy_percentage: number;
  completed_at: string;
  project: string | null;
}

interface TimeTrackingStats {
  total_tasks_with_estimates: number;
  avg_estimation_accuracy: number;
  total_overestimated: number;
  total_underestimated: number;
  total_accurate: number;
  avg_overestimation_minutes: number;
  avg_underestimation_minutes: number;
}

export default function TimeTrackingComparison() {
  const [tasks, setTasks] = useState<TaskTimeData[]>([]);
  const [stats, setStats] = useState<TimeTrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("month");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTimeComparison();
  }, [dateRange]);

  const fetchTimeComparison = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/time-comparison?range=${dateRange}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch time comparison:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin">
            <Clock className="w-12 h-12 text-[#E50914]" />
          </div>
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Time Tracking Comparison</h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          <Target className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No completed tasks with time estimates yet</p>
          <p className="text-sm text-center max-w-md">
            Add estimated time when creating tasks, then track actual time during focus sessions to see insights here!
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data - top 10 tasks by absolute difference
  const chartData = [...tasks]
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 10)
    .map(task => ({
      name: task.title.length > 25 ? task.title.substring(0, 25) + "..." : task.title,
      estimated: task.estimated_minutes,
      actual: task.actual_minutes,
      difference: task.difference,
    }));

  const displayedTasks = showAll ? tasks : tasks.slice(0, 10);

  return (
    <div className="group bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 hover:shadow-2xl hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Time Tracking Comparison</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimated vs Actual Time</p>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {[
              { value: "week", label: "7 Days" },
              { value: "month", label: "30 Days" },
              { value: "all", label: "All Time" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDateRange(value as any)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  dateRange === value
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Accuracy</span>
              </div>
              <div className="text-2xl font-bold">{stats.avg_estimation_accuracy.toFixed(0)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.total_tasks_with_estimates} tasks analyzed
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Underestimated</span>
              </div>
              <div className="text-2xl font-bold text-orange-500">{stats.total_underestimated}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Avg +{stats.avg_underestimation_minutes.toFixed(0)}m over
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Overestimated</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{stats.total_overestimated}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Avg {stats.avg_overestimation_minutes.toFixed(0)}m under
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Accurate (±10%)</span>
              </div>
              <div className="text-2xl font-bold text-blue-500">{stats.total_accurate}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.total_tasks_with_estimates > 0 
                  ? ((stats.total_accurate / stats.total_tasks_with_estimates) * 100).toFixed(0)
                  : 0}% of tasks
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">Top 10 Tasks by Estimation Variance</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: '#F9FAFB',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'estimated') return [`${value} min`, 'Estimated'];
                  if (name === 'actual') return [`${value} min`, 'Actual'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="estimated" fill="#3B82F6" name="Estimated" radius={[8, 8, 0, 0]} />
              <Bar dataKey="actual" fill="#8B5CF6" name="Actual" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task List */}
        <div>
          <h3 className="text-lg font-bold mb-4">Individual Task Breakdown</h3>
          <div className="space-y-3">
            {displayedTasks.map((task) => {
              const isUnderestimated = task.difference > 0;
              const isAccurate = Math.abs(task.accuracy_percentage - 100) <= 10;
              
              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold truncate">{task.title}</h4>
                        {task.project && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                            {task.project}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Est: {task.estimated_minutes}m</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Target className="w-3.5 h-3.5" />
                          <span>Actual: {task.actual_minutes}m</span>
                        </div>
                        <div className={`flex items-center gap-1 font-semibold ${
                          isAccurate ? 'text-blue-600 dark:text-blue-400' :
                          isUnderestimated ? 'text-orange-600 dark:text-orange-400' : 
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {isAccurate ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : isUnderestimated ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isUnderestimated ? '+' : ''}{task.difference}m 
                            ({task.accuracy_percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        isAccurate 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : isUnderestimated
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {isAccurate ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Accurate
                          </>
                        ) : isUnderestimated ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Under
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Over
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(task.completed_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {tasks.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-semibold transition-all duration-300"
            >
              {showAll ? 'Show Less' : `Show All ${tasks.length} Tasks`}
            </button>
          )}
        </div>

        {/* Insights Box */}
        {stats && stats.total_tasks_with_estimates >= 5 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">💡 Planning Insights</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {stats.avg_estimation_accuracy < 70 && (
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>Your estimates are off by an average of {Math.abs(100 - stats.avg_estimation_accuracy).toFixed(0)}%. Consider padding estimates by 20-30%.</span>
                    </li>
                  )}
                  {stats.avg_estimation_accuracy >= 70 && stats.avg_estimation_accuracy < 90 && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Good estimation accuracy! You're within {Math.abs(100 - stats.avg_estimation_accuracy).toFixed(0)}% on average.</span>
                    </li>
                  )}
                  {stats.avg_estimation_accuracy >= 90 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>Excellent estimation accuracy! You're consistently within 10% of your estimates.</span>
                    </li>
                  )}
                  {stats.total_underestimated > stats.total_overestimated * 2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>You frequently underestimate tasks. Try adding a buffer of {Math.ceil(stats.avg_underestimation_minutes / 5) * 5} minutes to your estimates.</span>
                    </li>
                  )}
                  {stats.total_overestimated > stats.total_underestimated * 2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>You tend to overestimate, which provides good buffer time. You could tighten estimates slightly if needed.</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Track more tasks with estimates to improve these insights. Current sample: {stats.total_tasks_with_estimates} tasks.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
