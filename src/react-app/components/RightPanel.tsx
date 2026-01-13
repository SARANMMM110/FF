import { useState, useEffect } from "react";
import { useTasks } from "@/react-app/hooks/useTasks";
import { useSmartTaskInput } from "@/react-app/hooks/useSmartTaskInput";
import CalendarPreview from "@/react-app/components/CalendarPreview";
import { Plus, Lightbulb, Target, CheckCircle2 } from "lucide-react";

const motivationalTips = [
  "Focus on one task at a time for maximum impact.",
  "Small progress is still progress. Keep going!",
  "Your future self will thank you for the work you do today.",
  "Break big tasks into smaller, manageable chunks.",
  "Consistency beats intensity. Show up every day.",
  "The secret to getting ahead is getting started.",
  "Done is better than perfect. Ship it!",
  "Your only competition is who you were yesterday.",
  "Action is the foundational key to all success.",
  "Focus on progress, not perfection.",
];

export default function RightPanel() {
  const { tasks, createTask } = useTasks();
  const { rawInput, parsedData, handleInputChange, reset } = useSmartTaskInput();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [currentTip, setCurrentTip] = useState("");

  useEffect(() => {
    setCurrentTip(motivationalTips[Math.floor(Math.random() * motivationalTips.length)]);
  }, []);

  const todaysTasks = tasks.filter((task) => {
    const createdToday = new Date(task.created_at).toDateString() === new Date().toDateString();
    return !task.is_completed && createdToday;
  });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedData?.title.trim()) return;

    try {
      await createTask({
        title: parsedData.title,
        priority: parsedData.priority,
        estimated_minutes: parsedData.estimated_minutes,
        project: parsedData.project,
        due_date: parsedData.due_date,
        tags: parsedData.tags,
      });
      reset();
      setShowQuickAdd(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  return (
    <aside className="w-64 border-l border-gray-200 dark:border-gray-900 bg-white/50 dark:bg-black/50 backdrop-blur-sm min-h-[calc(100vh-64px)] p-3 space-y-4">
      {/* Quick Add Task */}
      <div className="bg-gradient-to-br from-[#E50914]/10 to-[#FFD400]/5 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-xl p-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
          Quick Add
        </h3>
        {showQuickAdd ? (
          <form onSubmit={handleQuickAdd} className="space-y-2">
            <input
              type="text"
              value={rawInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="#project p:high @today"
              autoFocus
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#E50914]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!parsedData?.title.trim()}
                className="flex-1 py-1.5 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-md text-xs font-semibold text-black hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuickAdd(false);
                  reset();
                }}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-medium">Add Task</span>
          </button>
        )}
      </div>

      {/* Calendar Preview */}
      <CalendarPreview />

      {/* Today's Plan */}
      <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-[#E50914]" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Today's Plan
          </h3>
        </div>
        {todaysTasks.length === 0 ? (
          <p className="text-xs text-gray-600 dark:text-gray-500 italic">
            No tasks for today yet. Add one to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {todaysTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 p-1.5 bg-white dark:bg-gray-900 rounded-md"
              >
                <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-900 dark:text-white line-clamp-2">
                  {task.title}
                </span>
              </div>
            ))}
            {todaysTasks.length > 5 && (
              <p className="text-xs text-gray-500 dark:text-gray-600 text-center pt-1">
                +{todaysTasks.length - 5} more tasks
              </p>
            )}
          </div>
        )}
      </div>

      {/* Motivational Tip */}
      <div className="bg-gradient-to-br from-[#FFD400]/10 to-[#E50914]/5 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-[#FFD400]" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Daily Tip
          </h3>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
          "{currentTip}"
        </p>
      </div>
    </aside>
  );
}
