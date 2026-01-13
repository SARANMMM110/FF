import { Calendar, CalendarDays, Inbox } from "lucide-react";

interface TaskSchedulerProps {
  selectedTaskIds: number[];
  onSchedule: (dueDate: string | null) => Promise<void>;
  onClear: () => void;
}

export default function TaskScheduler({ selectedTaskIds, onSchedule, onClear }: TaskSchedulerProps) {
  if (selectedTaskIds.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const handleSchedule = async (dueDate: string | null) => {
    await onSchedule(dueDate);
    onClear();
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-semibold">
            {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={onClear}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleSchedule(today)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-lg font-semibold text-sm text-black hover:shadow-lg transition-all hover:scale-105"
          >
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <button
            onClick={() => handleSchedule(tomorrow)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg font-semibold text-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Tomorrow
          </button>
          <button
            onClick={() => handleSchedule(nextWeek)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg font-semibold text-sm transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Next Week
          </button>
          <button
            onClick={() => handleSchedule(null)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg font-semibold text-sm transition-colors"
          >
            <Inbox className="w-4 h-4" />
            Inbox
          </button>
        </div>
      </div>
    </div>
  );
}
