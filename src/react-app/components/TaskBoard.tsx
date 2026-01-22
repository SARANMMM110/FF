import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, Circle, Trash2, FolderOpen, Tag, Clock } from "lucide-react";
import type { Task } from "@/shared/types";

interface TaskBoardProps {
  tasks: Task[];
  onUpdate: (id: number, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  selectedTaskId?: number;
}

type ColumnType = "todo" | "scheduled" | "done";

export default function TaskBoard({ tasks, onUpdate, onDelete, selectedTaskId }: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnType | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);
  const [focusedColumn, setFocusedColumn] = useState<ColumnType>("todo");

  const taskRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Track if we're in the middle of a drag operation or recent update
  const isSyncLocked = useRef(false);
  const syncLockTimeout = useRef<NodeJS.Timeout | null>(null);

  // Lock sync for a period after drag operations
  const lockSync = (duration: number = 2000) => {
    isSyncLocked.current = true;
    if (syncLockTimeout.current) {
      clearTimeout(syncLockTimeout.current);
    }
    syncLockTimeout.current = setTimeout(() => {
      isSyncLocked.current = false;
    }, duration);
  };

  // Only sync from props when not locked and when tasks actually change structurally
  useEffect(() => {
    if (isSyncLocked.current) {
      return;
    }
    // Check if this is a structural change (add/remove tasks) vs just an update
    const localIds = new Set(localTasks.map(t => t.id));
    const propIds = new Set(tasks.map(t => t.id));
    const hasAddedTasks = tasks.some(t => !localIds.has(t.id));
    const hasRemovedTasks = localTasks.some(t => !propIds.has(t.id));
    
    if (hasAddedTasks || hasRemovedTasks) {
      // Structural change - sync fully
      setLocalTasks(tasks);
    }
    // Otherwise, ignore prop updates to preserve local optimistic state
  }, [tasks]);

  // Initial sync on mount
  useEffect(() => {
    setLocalTasks(tasks);
  }, []); // Only on mount

  // Filter tasks into columns
  const todoTasks = localTasks.filter(t => !t.is_completed && !t.due_date);
  const scheduledTasks = localTasks.filter(t => !t.is_completed && t.due_date);
  const doneTasks = localTasks.filter(t => t.is_completed);

  const getColumnTasks = (column: ColumnType) => {
    switch (column) {
      case "todo": return todoTasks;
      case "scheduled": return scheduledTasks;
      case "done": return doneTasks;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.contentEditable === "true"
      ) {
        return;
      }

      const columnTasks = getColumnTasks(focusedColumn);
      const currentIndex = focusedTaskId ? columnTasks.findIndex(t => t.id === focusedTaskId) : -1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < columnTasks.length - 1) {
            const nextTask = columnTasks[currentIndex + 1];
            setFocusedTaskId(nextTask.id);
            taskRefs.current.get(nextTask.id)?.focus();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            const prevTask = columnTasks[currentIndex - 1];
            setFocusedTaskId(prevTask.id);
            taskRefs.current.get(prevTask.id)?.focus();
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          const columns: ColumnType[] = ["todo", "scheduled", "done"];
          const currentColIndex = columns.indexOf(focusedColumn);
          if (currentColIndex < columns.length - 1) {
            const nextColumn = columns[currentColIndex + 1];
            setFocusedColumn(nextColumn);
            const nextColumnTasks = getColumnTasks(nextColumn);
            if (nextColumnTasks.length > 0) {
              setFocusedTaskId(nextColumnTasks[0].id);
              taskRefs.current.get(nextColumnTasks[0].id)?.focus();
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          const cols: ColumnType[] = ["todo", "scheduled", "done"];
          const currentIdx = cols.indexOf(focusedColumn);
          if (currentIdx > 0) {
            const prevColumn = cols[currentIdx - 1];
            setFocusedColumn(prevColumn);
            const prevColumnTasks = getColumnTasks(prevColumn);
            if (prevColumnTasks.length > 0) {
              setFocusedTaskId(prevColumnTasks[0].id);
              taskRefs.current.get(prevColumnTasks[0].id)?.focus();
            }
          }
          break;
        case "d":
          e.preventDefault();
          if (focusedTaskId) {
            handleDelete(focusedTaskId);
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedTaskId) {
            if (focusedColumn === "todo") {
              handleDrop("scheduled", focusedTaskId);
            } else if (focusedColumn === "scheduled") {
              handleDrop("done", focusedTaskId);
            }
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedTaskId, focusedColumn, localTasks]);

  const handleDragStart = (taskId: number) => {
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDelete = async (taskId: number) => {
    // Optimistically remove from local state
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    lockSync(2000);
    try {
      await onDelete(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
      // On error, we'd need to restore - but for now just log
    }
  };

  const handleDrop = async (column: ColumnType, taskId?: number) => {
    const taskToMove = taskId || draggedTaskId;
    if (!taskToMove) return;

    const task = localTasks.find(t => t.id === taskToMove);
    if (!task) return;

    // Determine updates based on target column
    let updates: Partial<Task> = {};
    
    if (column === "todo") {
      if (!task.is_completed && !task.due_date) {
        setDraggedTaskId(null);
        setDragOverColumn(null);
        return;
      }
      updates = { 
        due_date: null as unknown as string,
        is_completed: 0 
      };
    } else if (column === "scheduled") {
      if (!task.is_completed && task.due_date) {
        setDraggedTaskId(null);
        setDragOverColumn(null);
        return;
      }
      const dueDate = task.due_date || new Date().toISOString().split("T")[0];
      updates = { 
        due_date: dueDate,
        is_completed: 0 
      };
    } else if (column === "done") {
      if (task.is_completed) {
        setDraggedTaskId(null);
        setDragOverColumn(null);
        return;
      }
      updates = { 
        is_completed: 1,
        completed_at: new Date().toISOString()
      };
    }

    // Lock sync to prevent prop updates from overwriting our optimistic state
    lockSync(3000);

    // OPTIMISTIC UPDATE: Update local state immediately
    setLocalTasks(prev => prev.map(t => 
      t.id === taskToMove ? { ...t, ...updates } : t
    ));

    // Clear drag state immediately
    setDraggedTaskId(null);
    setDragOverColumn(null);

    // Sync with API in background - don't await or handle errors that would revert
    onUpdate(taskToMove, updates).catch(error => {
      console.error("Failed to update task:", error);
      // Optionally could unlock and refetch here, but for now keep the optimistic state
    });
  };

  const handleTaskFocus = useCallback((taskId: number, column: ColumnType) => {
    setFocusedTaskId(taskId);
    setFocusedColumn(column);
  }, []);

  return (
    <div className="space-y-4">
      <div 
        className="grid md:grid-cols-3 gap-6"
        role="region"
        aria-label="Kanban board"
      >
        <Column
          columnType="todo"
          title="To Do"
          description="Unscheduled tasks"
          tasks={todoTasks}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragEnter={setDragOverColumn}
          onDelete={handleDelete}
          selectedTaskId={selectedTaskId}
          draggedTaskId={draggedTaskId}
          isDropTarget={dragOverColumn === "todo"}
          color="gray"
          taskRefs={taskRefs}
          onTaskFocus={handleTaskFocus}
          focusedTaskId={focusedTaskId}
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
          onDelete={handleDelete}
          selectedTaskId={selectedTaskId}
          draggedTaskId={draggedTaskId}
          isDropTarget={dragOverColumn === "scheduled"}
          color="blue"
          taskRefs={taskRefs}
          onTaskFocus={handleTaskFocus}
          focusedTaskId={focusedTaskId}
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
          onDelete={handleDelete}
          selectedTaskId={selectedTaskId}
          draggedTaskId={draggedTaskId}
          isDropTarget={dragOverColumn === "done"}
          color="green"
          taskRefs={taskRefs}
          onTaskFocus={handleTaskFocus}
          focusedTaskId={focusedTaskId}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
        <p>Keyboard shortcuts: ↑↓ Navigate • ←→ Switch columns • D Delete • Enter/Space Move to next column</p>
      </div>
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
  color,
  taskRefs,
  onTaskFocus,
  focusedTaskId
}: {
  columnType: ColumnType;
  title: string;
  description: string;
  tasks: Task[];
  onDrop: (column: ColumnType, taskId?: number) => void;
  onDragStart: (taskId: number) => void;
  onDragEnd: () => void;
  onDragEnter: (column: ColumnType) => void;
  onDelete: (id: number) => Promise<void>;
  selectedTaskId?: number;
  draggedTaskId: number | null;
  isDropTarget: boolean;
  color: "gray" | "blue" | "green";
  taskRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  onTaskFocus: (taskId: number, column: ColumnType) => void;
  focusedTaskId: number | null;
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
            ref={(el) => {
              if (el) {
                taskRefs.current.set(task.id, el);
              } else {
                taskRefs.current.delete(task.id);
              }
            }}
            tabIndex={0}
            draggable={true}
            onDragStart={(e) => {
              e.stopPropagation();
              onDragStart(task.id);
            }}
            onDragEnd={(e) => {
              e.stopPropagation();
              onDragEnd();
            }}
            onFocus={() => onTaskFocus(task.id, columnType)}
            onClick={() => onTaskFocus(task.id, columnType)}
            className={`bg-white dark:bg-gray-900 border-2 rounded-xl p-3 transition-all hover:shadow-lg select-none focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:ring-offset-2 ${
              draggedTaskId === task.id 
                ? 'opacity-50 cursor-grabbing scale-95 border-[#E50914]' 
                : 'cursor-grab active:cursor-grabbing'
            } ${
              selectedTaskId === task.id 
                ? "border-[#E50914] shadow-lg shadow-[#E50914]/20" 
                : focusedTaskId === task.id
                ? "border-blue-500 shadow-md"
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
