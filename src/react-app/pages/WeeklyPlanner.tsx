import Layout from "@/react-app/components/Layout";
import { useTasks } from "@/react-app/hooks/useTasks";
import { Plus, Calendar, Clock, CheckCircle2, Circle } from "lucide-react";
import type { Task } from "@/shared/types";
import { useState } from "react";
import CreateTaskModal from "@/react-app/components/CreateTaskModal";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

function getWeekDates() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  
  return DAYS_OF_WEEK.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      ...day,
      date: date.toISOString().split('T')[0],
      dayNumber: date.getDate(),
    };
  });
}

function getTasksForDay(tasks: Task[], date: string) {
  return tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date).toISOString().split('T')[0];
    return taskDate === date;
  });
}

function TaskCard({ task, onToggleComplete }: { task: Task; onToggleComplete: (id: number) => void }) {
  const isCompleted = task.is_completed === 1;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-2 hover:shadow-md transition-shadow ${
      isCompleted ? "opacity-60" : ""
    }`}>
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
          className="mt-0.5 text-gray-400 hover:text-blue-500 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium text-gray-900 dark:text-white ${
            isCompleted ? "line-through" : ""
          }`}>
            {task.title}
          </h3>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-300">
            {task.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimated_minutes}m
              </span>
            )}
            {task.project && (
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                {task.project}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ 
  day, 
  tasks, 
  onToggleComplete, 
  onQuickAdd 
}: { 
  day: any; 
  tasks: Task[]; 
  onToggleComplete: (id: number) => void;
  onQuickAdd: (date: string) => void;
}) {
  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);
  const totalEstimated = tasks.reduce((sum, task) => sum + (task.estimated_minutes || 0), 0);
  const completedEstimated = completedTasks.reduce((sum, task) => sum + (task.estimated_minutes || 0), 0);
  const progress = totalEstimated > 0 ? (completedEstimated / totalEstimated) * 100 : 0;
  
  const isToday = day.date === new Date().toISOString().split('T')[0];
  
  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg border-2 ${
      isToday ? "border-blue-300 dark:border-blue-600" : "border-gray-200 dark:border-gray-700"
    } p-4 h-full flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className={`font-semibold text-sm ${
            isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
          }`}>
            {day.short}
          </h2>
          <div className={`text-lg font-bold ${
            isToday ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"
          }`}>
            {day.dayNumber}
          </div>
        </div>
        
        <button
          onClick={() => onQuickAdd(day.date)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {totalEstimated > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mb-1">
            <span>{completedEstimated}m</span>
            <span>{totalEstimated}m</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {/* Active Tasks */}
        {activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
          />
        ))}
        
        {/* Completed Tasks (Collapsed) */}
        {completedTasks.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-400 dark:text-gray-300 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {completedTasks.length} completed
            </div>
            {completedTasks.slice(0, 2).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
              />
            ))}
            {completedTasks.length > 2 && (
              <div className="text-xs text-gray-400 dark:text-gray-300 text-center py-1">
                +{completedTasks.length - 2} more
              </div>
            )}
          </div>
        )}
        
        {tasks.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-300 text-sm py-8">
            <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
            No tasks scheduled
          </div>
        )}
      </div>
    </div>
  );
}

export default function WeeklyPlannerPage() {
  const { tasks, toggleTaskDone, createTask } = useTasks();
  const weekDates = getWeekDates();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [prefilledDueDate, setPrefilledDueDate] = useState<string | undefined>();

  const handleQuickAdd = (date: string) => {
    setPrefilledDueDate(date);
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async (taskData: any) => {
    await createTask({
      ...taskData,
      due_date: taskData.due_date || prefilledDueDate,
    });
    setIsCreateModalOpen(false);
    setPrefilledDueDate(undefined);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Weekly Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Organize your tasks across the week
          </p>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 h-[calc(100vh-12rem)]">
          {weekDates.map((day) => {
            const dayTasks = getTasksForDay(tasks, day.date);
            
            return (
              <DayColumn
                key={day.key}
                day={day}
                tasks={dayTasks}
                onToggleComplete={toggleTaskDone}
                onQuickAdd={handleQuickAdd}
              />
            );
          })}
        </div>
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPrefilledDueDate(undefined);
        }}
        onCreate={handleCreateTask}
        initialDueDate={prefilledDueDate}
      />
    </Layout>
  );
}
