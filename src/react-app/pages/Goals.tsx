import { useEffect, useState } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/Layout";
import { useSubscription } from "@/react-app/hooks/useSubscription";
import ProUpgradeModal from "@/react-app/components/ProUpgradeModal";
import { Target, Plus, Trophy, TrendingUp, Calendar, CheckCircle2, Circle, Trash2 } from "lucide-react";

interface Goal {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function Goals() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const { isPro, isEnterprise, loading: subscriptionLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/auth/login");
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    // Check if user has access to goals (Pro or Enterprise only)
    if (!subscriptionLoading && user && !isPro && !isEnterprise) {
      setShowUpgradeModal(true);
    }
  }, [subscriptionLoading, user, isPro, isEnterprise]);

  useEffect(() => {
    if (user && (isPro || isEnterprise)) {
      fetchGoals();
    }
  }, [user, isPro, isEnterprise]);

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals");
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (goalId: number) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGoals(goals.filter(g => g.id !== goalId));
      }
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  if (isPending || loading || subscriptionLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-center">
            <Target className="w-16 h-16 text-[#E50914] mx-auto mb-4" />
            <p className="text-gray-400">Loading goals...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  // Show upgrade modal if not Pro/Enterprise
  if (!isPro && !isEnterprise) {
    return (
      <Layout>
        <ProUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            navigate("/dashboard");
          }}
          feature="Goal Setting & Tracking"
        />
      </Layout>
    );
  }

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
                  Goals & Tracking
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Set targets and track your productivity progress
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-bold text-black hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Goal
            </button>
          </div>
        </div>

        {/* Active Goals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#E50914]" />
            Active Goals ({activeGoals.length})
          </h2>

          {activeGoals.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No active goals yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Set your first goal to start tracking your progress
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-bold text-black hover:shadow-lg transition-all duration-300"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={deleteGoal}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#FFD400]" />
              Completed Goals ({completedGoals.length})
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {completedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={deleteGoal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Create Goal Modal */}
        {showCreateModal && (
          <CreateGoalModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchGoals();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

function GoalCard({ goal, onDelete }: {
  goal: Goal;
  onDelete: (id: number) => void;
}) {
  const progress = (goal.current_value / goal.target_value) * 100;
  const daysLeft = Math.ceil((new Date(goal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case "focus_minutes": return "minutes of focus";
      case "completed_tasks": return "tasks completed";
      case "focus_sessions": return "focus sessions";
      case "daily_streak": return "day streak";
      default: return type;
    }
  };

  return (
    <div className={`bg-gradient-to-br ${goal.is_completed ? 'from-green-500/10 to-green-600/5' : 'from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30'} border-2 ${goal.is_completed ? 'border-green-500/30' : 'border-gray-200 dark:border-gray-800'} rounded-2xl p-6 hover:shadow-xl transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            {goal.is_completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{goal.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">
            {goal.current_value} / {goal.target_value} {getTargetTypeLabel(goal.target_type)}
          </span>
          <span className="text-sm font-semibold text-[#E50914]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E50914] to-[#FFD400] transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4" />
          {goal.is_completed ? (
            <span>Completed {new Date(goal.completed_at!).toLocaleDateString()}</span>
          ) : daysLeft > 0 ? (
            <span>{daysLeft} days left</span>
          ) : (
            <span className="text-red-500">Overdue</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateGoalModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState("focus_minutes");
  const [targetValue, setTargetValue] = useState(1000);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          target_type: targetType,
          target_value: targetValue,
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate,
        }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Create New Goal</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete 50 hours of focused work"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this goal..."
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Goal Type</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3"
            >
              <option value="focus_minutes">Focus Minutes</option>
              <option value="completed_tasks">Completed Tasks</option>
              <option value="focus_sessions">Focus Sessions</option>
              <option value="daily_streak">Daily Streak</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Target Value</label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(parseInt(e.target.value))}
              min="1"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-bold text-black hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
