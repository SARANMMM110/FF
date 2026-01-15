import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import Layout from "@/react-app/components/Layout";
import { apiFetch } from "@/react-app/utils/api";

export default function AnalyticsTest() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [dbCheck, setDbCheck] = useState<any>(null);

  const createTestSession = async () => {
    try {
      setTestResult("Creating test session...");
      const response = await apiFetch("api/test/create-session", {
        method: "POST",
      });
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
      
      // Refresh database check
      await checkDatabase();
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiFetch("api/analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const checkDatabase = async () => {
    try {
      // Get all sessions with end_time
      const completedRes = await apiFetch("api/focus-sessions");
      const completedSessions = await completedRes.json();
      
      // Get dashboard stats
      const statsRes = await apiFetch("api/dashboard-stats");
      const stats = await statsRes.json();

      setDbCheck({
        user_id: user?.id,
        completed_sessions: completedSessions.filter((s: any) => s.end_time).length,
        incomplete_sessions: completedSessions.filter((s: any) => !s.end_time).length,
        total_sessions: completedSessions.length,
        dashboard_stats: stats,
        all_sessions: completedSessions,
      });
    } catch (error) {
      console.error("Failed to check database:", error);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">🔍 Timer Analytics Diagnostics</h1>
        
        <div className="space-y-6">
          {/* Quick Summary */}
          {dbCheck && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
              <h2 className="text-2xl font-bold mb-4">Quick Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur">
                  <div className="text-3xl font-bold">{dbCheck.total_sessions}</div>
                  <div className="text-sm">Total Sessions</div>
                </div>
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur">
                  <div className="text-3xl font-bold">{dbCheck.completed_sessions}</div>
                  <div className="text-sm">Completed</div>
                </div>
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur">
                  <div className="text-3xl font-bold">{dbCheck.incomplete_sessions}</div>
                  <div className="text-sm">Incomplete</div>
                </div>
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur">
                  <div className="text-3xl font-bold">{dbCheck.dashboard_stats?.today_focus_minutes || 0}</div>
                  <div className="text-sm">Today (min)</div>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <strong>Your User ID:</strong> {dbCheck.user_id}
              </div>
            </div>
          )}

          {/* Current User */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">👤 Current User Info</h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4">🎯 Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={createTestSession}
                className="px-6 py-3 bg-[#E50914] text-white rounded-lg font-bold hover:bg-[#b8070f] transition-colors"
              >
                ➕ Create Test Session
              </button>
              <button
                onClick={checkDatabase}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh Data
              </button>
              <button
                onClick={checkDatabase}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
              >
                🔍 Check Database
              </button>
              <button
                onClick={loadAnalytics}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                📊 Load Analytics
              </button>
            </div>
            {testResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Last Action Result:</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                  {testResult}
                </pre>
              </div>
            )}
          </div>

          {/* Database Check Results */}
          {dbCheck && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4">💾 Database Status</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Sessions</div>
                    <div className="text-2xl font-bold">{dbCheck.total_sessions}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">Completed (with end_time)</div>
                    <div className="text-2xl font-bold">{dbCheck.completed_sessions}</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Incomplete (no end_time)</div>
                    <div className="text-2xl font-bold">{dbCheck.incomplete_sessions}</div>
                  </div>
                </div>
                
                {dbCheck.incomplete_sessions > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                      ⚠️ You have {dbCheck.incomplete_sessions} incomplete session(s). These won't show in analytics because they don't have an end_time.
                    </p>
                    <p className="text-sm mt-2 text-yellow-700 dark:text-yellow-400">
                      Incomplete sessions happen when the timer is started but not properly stopped/completed. Try using the timer again and let it run for at least 1 minute, then pause or let it complete naturally.
                    </p>
                  </div>
                )}
                
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Show All Sessions (Raw Data)
                  </summary>
                  <pre className="mt-2 bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs max-h-96">
                    {JSON.stringify(dbCheck.all_sessions, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* Analytics Data */}
          {analytics && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4">📊 Analytics Query Results</h2>
              {analytics.length === 0 ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-800">
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    ❌ No analytics data found
                  </p>
                  <p className="text-sm mt-2 text-red-700 dark:text-red-400">
                    This usually means you don't have any completed focus sessions yet. Make sure sessions have an end_time set.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold mb-2">✅ Found {analytics.length} analytics records:</p>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm max-h-96">
                    {JSON.stringify(analytics, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {/* Instructions */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg text-white">
            <h2 className="text-xl font-bold mb-4">📝 How to Test</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click "Create Test Session" to manually add a 30-minute completed session</li>
              <li>Click "Refresh Sessions" to see if it appears</li>
              <li>Click "Load Analytics" to see if it shows in analytics</li>
              <li>Or go to Focus Mode and run the actual timer for 1-2 minutes, then pause it</li>
              <li>Return here and refresh to see if that session appears</li>
            </ol>
            <div className="mt-4 text-sm bg-white/20 p-3 rounded backdrop-blur">
              <strong>Note:</strong> Only sessions with both start_time AND end_time will appear in analytics. The timer should automatically set end_time when you pause or complete a session.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
