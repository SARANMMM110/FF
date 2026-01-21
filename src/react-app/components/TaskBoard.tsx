import { useState } from "react";
import { CheckCircle2, Circle, Trash2, FolderOpen, Tag, Clock } from "lucide-react";
import type { Task } from "@/shared/types";

interface TaskBoardProps {
  tasks: Task[];
  onUpdate: (id: number, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  selectedTaskId?: number;
}

interface OptimisticTask extends Task {
  _optimistic?: boolean;
}

type ColumnType = "todo" | "scheduled" | "done";

export default function TaskBoard({ tasks, onUpdate, onDelete, selectedTaskId }: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnType | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<OptimisticTask[]>([]);

  // Use optimistic tasks if available, otherwise use props tasks
  const displayTasks = optimisticTasks.length > 0 ? optimisticTasks : tasks;

  // Filter tasks into columns
  const todoTasks = displayTasks.filter(t => !t.is_completed && !t.due_date);
  const scheduledTasks = displayTasks.filter(t => !t.is_completed && t.due_date);
  const doneTasks = displayTasks.filter(t => t.is_completed);

  const handleDragStart = (taskId: number) => {
    console.log("🎯 Drag started for task:", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    console.log("🎯 Drag ended");
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDrop = async (column: ColumnType) => {
    console.log("=== DROP EVENT ===");
    console.log("Target column:", column);
    console.log("Dragged task ID:", draggedTaskId);
    
    if (!draggedTaskId) {
      console.log("❌ No dragged task");
      return;
    }

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task) {
      console.log("❌ Task not found");
      return;
    }

    console.log("📋 Current task:", { 
      id: task.id, 
      title: task.title, 
      due_date: task.due_date, 
      is_completed: task.is_completed 
    });

    let updates: any = {};
    
    if (column === "todo") {
      console.log("➡️ Moving to To Do");
      updates = { 
        due_date: null,
        is_completed: false 
      };
    } else if (column === "scheduled") {
      console.log("➡️ Moving to Scheduled");
      const dueDate = task.due_date || new Date().toISOString().split("T")[0];
      updates = { 
        due_date: dueDate,
        is_completed: false 
      };
    } else if (column === "done") {
      console.log("➡️ Moving to Done");
      updates = { 
        is_completed: true 
      };
    }

    // OPTIMISTIC UPDATE: Update UI immediately
    const updatedTask = { ...task, ...updates, _optimistic: true };
    const newOptimisticTasks = tasks.map(t => 
      t.id === draggedTaskId ? updatedTask : t
    );
    setOptimisticTasks(newOptimisticTasks);
    console.log("⚡ Optimistic update applied");

    // Clear drag state immediately for instant feedback
    setDraggedTaskId(null);
    setDragOverColumn(null);

    // Now sync with API in background
    try {
      console.log("📤 Syncing with API...");
      await onUpdate(task.id, updates);
      console.log("✅ API sync successful");
      // Refresh the page to ensure data is up to date
      window.location.reload();
    } catch (error) {
      console.error("❌ API sync failed:", error);
      // Revert optimistic update on error
      setOptimisticTasks([]);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Column
        columnType="todo"
        title="To Do"
        description="Unscheduled tasks"
        tasks={todoTasks}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragEnter={setDragOverColumn}
        onDelete={onDelete}
        selectedTaskId={selectedTaskId}
        draggedTaskId={draggedTaskId}
        isDropTarget={dragOverColumn === "todo"}
        color="gray"
      />
      <Column
        columnType="scheduled"
        title="Scheduled"
        description="Tasks with due dates"
        tasks={scheduledTasks}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragEnter={setDragOverColumn}
        onDelete={onDelete}
        selectedTaskId={selectedTaskId}
        draggedTaskId={draggedTaskId}
        isDropTarget={dragOverColumn === "scheduled"}
        color="blue"
      />
      <Column
        columnType="done"
        title="Done"
        description="Completed tasks"
        tasks={doneTasks}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragEnter={setDragOverColumn}
        onDelete={onDelete}
        selectedTaskId={selectedTaskId}
        draggedTaskId={draggedTaskId}
        isDropTarget={dragOverColumn === "done"}
        color="green"
      />
    </div>
  );
}

function Column({ 
  columnType,
  title,
  description,
  tasks, 
  onDrop, 
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDelete,
  selectedTaskId,
  draggedTaskId,
  isDropTarget,
  color
}: {
  columnType: ColumnType;
  title: string;
  description: string;
  tasks: Task[];
  onDrop: (column: ColumnType) => void;
  onDragStart: (taskId: number) => void;
  onDragEnd: () => void;
  onDragEnter: (column: ColumnType) => void;
  onDelete: (id: number) => Promise<void>;
  selectedTaskId?: number;
  draggedTaskId: number | null;
  isDropTarget: boolean;
  color: "gray" | "blue" | "green";
}) {
  const colorClasses = {
    gray: "from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800",
    blue: "from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10",
    green: "from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10",
  };

  const borderClasses = {
    gray: "border-gray-300 dark:border-gray-700",
    blue: "border-blue-300 dark:border-blue-700",
    green: "border-green-300 dark:border-green-700",
  };

  return (
    <div
      className={`bg-gradient-to-b ${colorClasses[color]} border-2 ${borderClasses[color]} rounded-2xl p-4 min-h-[500px] transition-all ${
        isDropTarget ? 'ring-4 ring-[#E50914] ring-offset-2 scale-105 shadow-2xl' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedTaskId) {
          onDragEnter(columnType);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`📥 Drop event in ${title} column`);
        onDrop(columnType);
      }}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
            {tasks.length}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      <div 
        className="space-y-3 min-h-[400px]"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedTaskId) {
            onDragEnter(columnType);
          }
        }}
      >
        {tasks.length === 0 && (
          <div 
            className={`text-center py-12 transition-all pointer-events-none ${
              isDropTarget ? 'scale-110' : ''
            }`}
          >
            <div className="text-5xl mb-3 animate-bounce">
              {isDropTarget ? '⬇️' : '📋'}
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {isDropTarget ? 'Drop here!' : 'Drop tasks here'}
            </p>
          </div>
        )}
        
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable={true}
            onDragStart={(e) => {
              e.stopPropagation();
              onDragStart(task.id);
            }}
            onDragEnd={(e) => {
              e.stopPropagation();
              onDragEnd();
            }}
            className={`bg-white dark:bg-gray-900 border-2 rounded-xl p-3 transition-all hover:shadow-lg select-none ${
              draggedTaskId === task.id 
                ? 'opacity-50 cursor-grabbing scale-95 border-[#E50914]' 
                : 'cursor-grab active:cursor-grabbing'
            } ${
              selectedTaskId === task.id 
                ? "border-[#E50914] shadow-lg shadow-[#E50914]/20" 
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <div className="flex items-start gap-2 mb-2 pointer-events-none">
              <div className="mt-0.5 text-gray-400 flex-shrink-0">
                {task.is_completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100 ${
                  task.is_completed ? "line-through text-gray-500 dark:text-gray-400" : ""
                }`}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {task.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {task.due_date && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
                      <Clock className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {task.estimated_minutes && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
                      <Clock className="w-3 h-3" />
                      {task.estimated_minutes}m
                    </span>
                  )}
                  {task.project && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300">
                      <FolderOpen className="w-3 h-3" />
                      {task.project}
                    </span>
                  )}
                  {task.tags && JSON.parse(task.tags).slice(0, 2).map((tag: string) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-700 dark:text-orange-300">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-gray-400 hover:text-red-600 flex-shrink-0 pointer-events-auto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
