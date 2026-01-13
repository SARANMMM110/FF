import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Users, 
  CheckSquare, 
  Clock, 
  TrendingUp, 
  Shield, 
  LogOut,
  Trash2,
  Search,
  Activity,
  Plus,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  Ticket,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/react-app/hooks/useToast";
import { ToastContainer } from "@/react-app/components/Toast";

interface AdminStats {
  total_users: number;
  total_tasks: number;
  total_sessions: number;
  total_focus_minutes: number;
  active_users_7d: number;
}

interface UserData {
  user_id: string;
  email: string;
  name: string;
  signup_source: string;
  subscription_plan: string;
  created_at: string;
  task_count: number;
  completed_tasks: number;
  total_focus_minutes: number;
  total_sessions: number;
  last_session_time: string;
  last_activity: string;
}

interface TaskData {
  id: number;
  user_id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  estimated_minutes: number;
  actual_minutes: number;
  is_completed: number;
  completed_at: string;
  project: string;
  due_date: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUserPlan, setEditingUserPlan] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const USERS_PER_PAGE = 20;
  const { success: showSuccess, error: showError, toasts, removeToast } = useToast();

  const getAuthHeaders = () => {
    // Try both localStorage and sessionStorage for better cross-browser compatibility
    const token = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      const response = await fetch("/api/admin/me", {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const adminData = await response.json();
        setAdmin(adminData);
        loadDashboardData();
      } else {
        localStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_token");
        window.location.href = "/admin/login";
      }
    } catch (error) {
      showError("Failed to verify admin session");
      localStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
  };

  const loadDashboardData = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: getAuthHeaders() }),
        fetch(`/api/admin/users?page=${page}&limit=${USERS_PER_PAGE}`, { headers: getAuthHeaders() })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
        setTotalUsers(usersData.pagination.total);
        setTotalPages(Math.ceil(usersData.pagination.total / USERS_PER_PAGE));
      }
    } catch (error) {
      showError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    loadDashboardData(page);
    setExpandedUser(null); // Collapse any expanded users when changing pages
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: getAuthHeaders()
      });
    } catch (error) {
      // Continue with logout even if request fails
    }
    
    localStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  };

  const deleteUser = async (userId: string) => {
    if (!admin?.is_super_admin) {
      showError("Super admin access required");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user ${userId} and all their data?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        showSuccess("User deleted successfully");
        loadDashboardData();
        if (selectedUser === userId) {
          setSelectedUser(null);
          setUserDetails(null);
        }
      } else {
        const error = await response.json();
        showError(error.error || "Failed to delete user");
      }
    } catch (error) {
      showError("Failed to delete user");
    }
  };

  const viewUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const userData = await response.json();
        setUserDetails(userData);
        setSelectedUser(userId);
      }
    } catch (error) {
      showError("Failed to load user details");
    }
  };

  const createTaskForUser = async (userId: string, taskData: any) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        showSuccess("Task assigned successfully");
        setShowCreateTask(false);
        if (selectedUser === userId) {
          viewUserDetails(userId);
        }
        loadDashboardData();
      } else {
        const error = await response.json();
        showError(error.error || "Failed to create task");
      }
    } catch (error) {
      showError("Failed to create task");
    }
  };

  const updateUserTask = async (taskId: number, taskData: any) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        showSuccess("Task updated successfully");
        setEditingTask(null);
        if (selectedUser) {
          viewUserDetails(selectedUser);
        }
      } else {
        const error = await response.json();
        showError(error.error || "Failed to update task");
      }
    } catch (error) {
      showError("Failed to update task");
    }
  };

  const deleteUserTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        showSuccess("Task deleted successfully");
        if (selectedUser) {
          viewUserDetails(selectedUser);
        }
        loadDashboardData();
      } else {
        showError("Failed to delete task");
      }
    } catch (error) {
      showError("Failed to delete task");
    }
  };

  const toggleUserExpand = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      if (!userDetails || selectedUser !== userId) {
        await viewUserDetails(userId);
      }
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const updateUserPlan = async (userId: string, planId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ plan_id: planId })
      });

      if (response.ok) {
        showSuccess("User plan updated successfully");
        setEditingUserPlan(null);
        loadDashboardData();
        if (selectedUser === userId) {
          viewUserDetails(userId);
        }
      } else {
        const error = await response.json();
        showError(error.error || "Failed to update user plan");
      }
    } catch (error) {
      showError("Failed to update user plan");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Admin Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">FocusFlow Admin</h1>
                <p className="text-gray-300">Welcome, {admin?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/registration-codes")}
                className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Ticket className="w-4 h-4" />
                <span>Codes</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Total Users</p>
                  <p className="text-white text-2xl font-bold">{stats.total_users}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <Activity className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Active (7d)</p>
                  <p className="text-white text-2xl font-bold">{stats.active_users_7d}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <CheckSquare className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Total Tasks</p>
                  <p className="text-white text-2xl font-bold">{stats.total_tasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Focus Sessions</p>
                  <p className="text-white text-2xl font-bold">{stats.total_sessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Focus Time</p>
                  <p className="text-white text-2xl font-bold">{formatDuration(stats.total_focus_minutes)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black px-4 py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Task</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Focus Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users
                  .filter(user => 
                    searchQuery === "" || 
                    user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((user) => (
                  <>
                    <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {user.email || <span className="text-gray-500 italic">No email</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {user.name || <span className="text-gray-500 italic">No name</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.subscription_plan === 'enterprise' ? 'bg-purple-500/20 text-purple-300' :
                          user.subscription_plan === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {user.subscription_plan || 'free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {user.task_count} <span className="text-gray-500">({user.completed_tasks} done)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {user.total_sessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-white font-semibold">{formatDuration(user.total_focus_minutes)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {user.last_session_time ? new Date(user.last_session_time).toLocaleDateString() : 
                         user.last_activity ? new Date(user.last_activity).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => toggleUserExpand(user.user_id)}
                          className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                        >
                          {expandedUser === user.user_id ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              View
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingUserPlan(user)}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                          title="Change Plan"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        {admin?.is_super_admin && (
                          <button
                            onClick={() => deleteUser(user.user_id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedUser === user.user_id && userDetails && selectedUser === user.user_id && (
                      <tr>
                        <td colSpan={8} className="bg-black/20 p-6">
                          <div className="space-y-6">
                            {/* User Tasks */}
                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-white">Tasks ({userDetails.tasks.length})</h4>
                                <button
                                  onClick={() => {
                                    setSelectedUserId(user.user_id);
                                    setShowCreateTask(true);
                                  }}
                                  className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Task
                                </button>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                {userDetails.tasks.map((task: TaskData) => (
                                  <div key={task.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <p className="text-white font-medium">{task.title}</p>
                                        {task.description && (
                                          <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-2 ml-2">
                                        <button
                                          onClick={() => setEditingTask(task)}
                                          className="text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => deleteUserTask(task.id)}
                                          className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-sm">
                                      <span className={`px-2 py-1 rounded ${
                                        task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                        task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                                        'bg-gray-500/20 text-gray-300'
                                      }`}>
                                        {task.status}
                                      </span>
                                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                        Priority: {task.priority}
                                      </span>
                                      {task.project && (
                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">
                                          {task.project}
                                        </span>
                                      )}
                                      {task.actual_minutes > 0 && (
                                        <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded">
                                          {formatDuration(task.actual_minutes)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* User Sessions */}
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-4">Recent Sessions ({userDetails.sessions.length})</h4>
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                                {userDetails.sessions.slice(0, 15).map((session: any) => (
                                  <div key={session.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <p className="text-white font-medium capitalize">{session.session_type.replace('_', ' ')}</p>
                                    <p className="text-gray-400 text-sm">
                                      Duration: {session.duration_minutes || 0} min
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                      {new Date(session.start_time).toLocaleString()}
                                    </p>
                                    {session.timer_mode && (
                                      <p className="text-gray-400 text-xs mt-1">
                                        Mode: {session.timer_mode}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* User Settings */}
                            {userDetails.settings && (
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-4">Settings</h4>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-gray-400 text-sm">Focus Duration</p>
                                    <p className="text-white">{userDetails.settings.focus_duration_minutes}min</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-sm">Short Break</p>
                                    <p className="text-white">{userDetails.settings.short_break_minutes}min</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-sm">Long Break</p>
                                    <p className="text-white">{userDetails.settings.long_break_minutes}min</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-sm">Minimal Mode</p>
                                    <p className="text-white">{userDetails.settings.minimal_mode_enabled ? "Enabled" : "Disabled"}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <div className="text-gray-300 text-sm">
              Showing {users.length > 0 ? ((currentPage - 1) * USERS_PER_PAGE + 1) : 0} to {Math.min(currentPage * USERS_PER_PAGE, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {/* Show first page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="text-gray-400 px-2">...</span>}
                  </>
                )}

                {/* Show pages around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        page === currentPage
                          ? "bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black font-semibold"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {/* Show last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="text-gray-400 px-2">...</span>}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Assign Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Assign Task to User</h3>
              <button
                onClick={() => {
                  setShowCreateTask(false);
                  setSelectedUserId("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userId = selectedUserId || (formData.get("user_id") as string);
              
              createTaskForUser(userId, {
                title: formData.get("title"),
                description: formData.get("description") || null,
                priority: parseInt(formData.get("priority") as string) || 0,
                estimated_minutes: parseInt(formData.get("estimated_minutes") as string) || null,
                project: formData.get("project") || null,
                due_date: formData.get("due_date") || null,
              });
            }}>
              <div className="space-y-4">
                {!selectedUserId && (
                  <div>
                    <label className="block text-gray-300 mb-2">User ID</label>
                    <select
                      name="user_id"
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select a user...</option>
                      {users.map(user => (
                        <option key={user.user_id} value={user.user_id} className="bg-gray-800">
                          {user.user_id.substring(0, 20)}... ({user.task_count} tasks)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 mb-2">Task Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter task title..."
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Task description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Priority</label>
                    <input
                      type="number"
                      name="priority"
                      min="0"
                      max="10"
                      defaultValue="0"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Estimated Minutes</label>
                    <input
                      type="number"
                      name="estimated_minutes"
                      min="0"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Project</label>
                    <input
                      type="text"
                      name="project"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Project name..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Due Date</label>
                    <input
                      type="datetime-local"
                      name="due_date"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTask(false);
                    setSelectedUserId("");
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Plan Modal */}
      {editingUserPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Update User Plan</h3>
              <button
                onClick={() => setEditingUserPlan(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">User: {editingUserPlan.email || editingUserPlan.user_id.substring(0, 20) + '...'}</p>
              <p className="text-gray-400 text-sm">Name: {editingUserPlan.name || 'N/A'}</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateUserPlan(editingUserPlan.user_id, formData.get("plan_id") as string);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Select Plan *</label>
                  <select
                    name="plan_id"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="free" className="bg-gray-800">Free Plan</option>
                    <option value="pro" className="bg-gray-800">Pro Plan ($9/month)</option>
                    <option value="enterprise" className="bg-gray-800">Enterprise Plan ($29/month)</option>
                  </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>Note:</strong> Changing the plan will update the user's subscription. For paid plans, ensure the user has completed payment.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUserPlan(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Update Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              updateUserTask(editingTask.id, {
                title: formData.get("title"),
                description: formData.get("description") || null,
                status: formData.get("status"),
                priority: parseInt(formData.get("priority") as string),
                estimated_minutes: parseInt(formData.get("estimated_minutes") as string) || null,
                project: formData.get("project") || null,
                due_date: formData.get("due_date") || null,
                is_completed: formData.get("status") === "completed",
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Task Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingTask.title}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingTask.description || ""}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={editingTask.status}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="todo" className="bg-gray-800">To Do</option>
                      <option value="in_progress" className="bg-gray-800">In Progress</option>
                      <option value="completed" className="bg-gray-800">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Priority</label>
                    <input
                      type="number"
                      name="priority"
                      min="0"
                      max="10"
                      defaultValue={editingTask.priority}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Estimated Minutes</label>
                    <input
                      type="number"
                      name="estimated_minutes"
                      min="0"
                      defaultValue={editingTask.estimated_minutes || ""}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Project</label>
                    <input
                      type="text"
                      name="project"
                      defaultValue={editingTask.project || ""}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    defaultValue={editingTask.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ""}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
