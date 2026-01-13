import { useState } from "react";
import { Plus, CheckCircle2, Circle, Trash2, Edit2, Clock } from "lucide-react";
import { useSubtasks } from "@/react-app/hooks/useSubtasks";

interface SubtaskListProps {
  taskId: number;
}

export default function SubtaskList({ taskId }: SubtaskListProps) {
  const { subtasks, loading, createSubtask, updateSubtask, deleteSubtask } = useSubtasks(taskId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskTime, setNewSubtaskTime] = useState<number | undefined>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      await createSubtask({
        title: newSubtaskTitle.trim(),
        estimated_minutes: newSubtaskTime,
      });
      setNewSubtaskTitle("");
      setNewSubtaskTime(undefined);
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to create subtask:", error);
    }
  };

  const handleToggleComplete = async (id: number, isCompleted: boolean) => {
    try {
      await updateSubtask(id, { is_completed: isCompleted ? 0 : 1 });
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editTitle.trim()) return;

    try {
      await updateSubtask(id, { title: editTitle.trim() });
      setEditingId(null);
      setEditTitle("");
    } catch (error) {
      console.error("Failed to update subtask:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSubtask(id);
    } catch (error) {
      console.error("Failed to delete subtask:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const completedCount = subtasks.filter(st => st.is_completed).length;

  return (
    <div className="space-y-3">
      {/* Progress */}
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-[#E50914] to-[#FFD400] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%` }}
            />
          </div>
          <span>{completedCount}/{subtasks.length}</span>
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <button
              onClick={() => handleToggleComplete(subtask.id, subtask.is_completed === 1)}
              className="text-gray-400 hover:text-[#E50914] transition-colors flex-shrink-0"
            >
              {subtask.is_completed ? (
                <CheckCircle2 className="w-4 h-4 text-[#E50914]" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              {editingId === subtask.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleEdit(subtask.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(subtask.id);
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditTitle("");
                    }
                  }}
                  autoFocus
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#E50914]"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      subtask.is_completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {subtask.title}
                  </span>
                  {subtask.estimated_minutes && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                      <Clock className="w-2.5 h-2.5" />
                      {subtask.estimated_minutes}m
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingId(subtask.id);
                  setEditTitle(subtask.title);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDelete(subtask.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm ? (
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Subtask title..."
              autoFocus
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E50914]"
            />
            <input
              type="number"
              value={newSubtaskTime || ""}
              onChange={(e) => setNewSubtaskTime(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Time"
              min="1"
              className="w-20 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E50914]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="px-3 py-1.5 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-lg text-sm font-semibold text-black hover:shadow-lg transition-all disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewSubtaskTitle("");
                setNewSubtaskTime(undefined);
              }}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add subtask
        </button>
      )}
    </div>
  );
}
