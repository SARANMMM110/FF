import { useState } from "react";
import { CheckCircle2, Circle, Trash2, Edit2, Clock, Target, Calendar, FolderOpen, Tag, ChevronDown, ChevronRight } from "lucide-react";
import type { Task } from "@/shared/types";
import SubtaskList from "@/react-app/components/SubtaskList";
import ConfirmDialog from "@/react-app/components/ConfirmDialog";

interface TaskListProps {
  tasks: Task[];
  onUpdate: (id: number, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSelectTask: (id: number | undefined) => void;
  selectedTaskId?: number;
  toggleTaskDone: (id: number) => Promise<boolean>;
  completeTask: (id: number) => Promise<boolean>;
}

export default function TaskList({ 
  tasks, 
  onUpdate, 
  onDelete, 
  onSelectTask, 
  selectedTaskId,
  toggleTaskDone,
  completeTask
}: TaskListProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.is_completed;
    if (filter === "completed") return task.is_completed;
    return true;
  });

  const activeTasks = filteredTasks.filter(t => !t.is_completed);
  const completedTasks = filteredTasks.filter(t => t.is_completed);

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 w-fit">
        {(["active", "completed", "all"] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
              filter === filterType
                ? "bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {filterType}
          </button>
        ))}
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          {activeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onSelect={onSelectTask}
              isSelected={selectedTaskId === task.id}
              toggleTaskDone={toggleTaskDone}
              completeTask={completeTask}
            />
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Completed
          </h3>
          {completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onSelect={onSelectTask}
              isSelected={selectedTaskId === task.id}
              toggleTaskDone={toggleTaskDone}
              completeTask={completeTask}
            />
          ))}
        </div>
      )}

      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <Target className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-base">No tasks yet</p>
          <p className="text-xs">Create your first task to get started</p>
        </div>
      )}
    </div>
  );
}

function TaskItem({ 
  task, 
  onUpdate, 
  onDelete, 
  onSelect, 
  isSelected,
  toggleTaskDone,
  completeTask
}: {
  task: Task;
  onUpdate: (id: number, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSelect: (id: number | undefined) => void;
  isSelected: boolean;
  toggleTaskDone: (id: number) => Promise<boolean>;
  completeTask: (id: number) => Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  

  const handleConfirmComplete = async () => {
    try {
      await completeTask(task.id);
      setShowCompleteConfirm(false);
    } catch (error) {
      console.error("Failed to mark task as complete:", error);
      // Keep the dialog open if there's an error
    }
  };

  const handleMarkCompleteButton = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click/drag handlers
    if (!task.is_completed) {
      setShowCompleteConfirm(true);
    } else {
      try {
        await toggleTaskDone(task.id);
      } catch (error) {
        console.error("Failed to toggle task completion:", error);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (editTitle.trim()) {
      await onUpdate(task.id, { title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleSelect = () => {
    if (isSelected) {
      onSelect(undefined);
    } else {
      onSelect(task.id);
    }
  };

  const priorityColors = {
    0: "border-gray-200 dark:border-gray-800",
    1: "border-[#FFD400]/30",
    2: "border-[#E50914]/30",
  };

  const checkboxId = `task-checkbox-${task.id}`;

  return (
    <div
      className={`group relative bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-sm border-2 rounded-xl p-5 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 ${
        isSelected ? "border-[#E50914]/50 shadow-lg shadow-[#E50914]/20" : priorityColors[task.priority as keyof typeof priorityColors] || priorityColors[0]
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox with proper event handling */}
        <div className="mt-1">
          <input
            type="checkbox"
            id={checkboxId}
            checked={task.is_completed === 1}
            readOnly
            className="sr-only"
          />
          <label 
            htmlFor={checkboxId}
            className="cursor-pointer text-gray-400 dark:text-gray-400 hover:text-[#E50914] transition-colors block"
            onClick={async (e) => {
              e.stopPropagation();
              // Handle the checkbox click through label
              if (!task.is_completed) {
                setShowCompleteConfirm(true);
              } else {
                try {
                  await toggleTaskDone(task.id);
                } catch (error) {
                  console.error("Failed to toggle task completion:", error);
                }
              }
            }}
          >
            {task.is_completed ? (
              <CheckCircle2 className="w-6 h-6 text-[#E50914]" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </label>
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") {
                  setEditTitle(task.title);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#E50914]"
            />
          ) : (
            <h3
              className={`text-base font-semibold mb-1.5 ${
                task.is_completed ? "line-through text-gray-500 dark:text-gray-500" : "text-gray-900 dark:text-white"
              }`}
            >
              {task.title}
            </h3>
          )}

          {task.description && (
            <p className="text-gray-600 dark:text-gray-300 text-xs mb-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 mb-2">
            {task.estimated_minutes && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-200">
                <Clock className="w-3 h-3" />
                <span>Est. {task.estimated_minutes}m</span>
              </div>
            )}
            {task.actual_minutes > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-[#E50914]/10 rounded">
                <Clock className="w-3 h-3 text-[#E50914]" />
                <span className="text-[#E50914]">Actual {task.actual_minutes}m</span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                <Calendar className="w-3 h-3 text-purple-700 dark:text-purple-300" />
                <span className="text-purple-700 dark:text-purple-300">
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {task.project && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                <FolderOpen className="w-3 h-3 text-blue-700 dark:text-blue-300" />
                <span className="text-blue-700 dark:text-blue-300">{task.project}</span>
              </div>
            )}
            {task.tags && JSON.parse(task.tags).length > 0 && (
              JSON.parse(task.tags).map((tag: string) => (
                <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                  <Tag className="w-3 h-3 text-orange-700 dark:text-orange-300" />
                  <span className="text-orange-700 dark:text-orange-300">{tag}</span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-3"
          >
            {showSubtasks ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Subtasks
          </button>

          {showSubtasks && (
            <div className="mb-3">
              <SubtaskList taskId={task.id} />
            </div>
          )}

          {/* Mark Complete Button */}
          {!task.is_completed && (
            <button
              onClick={handleMarkCompleteButton}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black text-xs font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Complete
            </button>
          )}
        </div>

        {/* Action buttons with drag handle */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleSelect}
            className={`p-2 rounded-lg transition-colors ${
              isSelected
                ? "bg-[#E50914]/20 text-[#E50914]"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
            title={isSelected ? "Deselect task" : "Select for timer"}
          >
            <Target className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#E50914] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCompleteConfirm}
        title="Mark Task Complete"
        message="Are you sure you want to mark this task as complete?"
        confirmText="Yes, Mark Complete"
        cancelText="Cancel"
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </div>
  );
}
