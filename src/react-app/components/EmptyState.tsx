import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="px-6 py-3 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-semibold text-black hover:shadow-xl hover:shadow-[#E50914]/50 transition-all duration-300 hover:scale-105"
            >
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl font-semibold transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Specific empty states for common scenarios
export function NoTasksEmptyState({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>}
      title="No tasks yet"
      description="Create your first task to start organizing your work and tracking progress."
      action={{
        label: "Create Task",
        onClick: onCreateTask,
      }}
    />
  );
}

export function NoFocusSessionsEmptyState({ onStartFocus }: { onStartFocus: () => void }) {
  return (
    <EmptyState
      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>}
      title="No focus sessions yet"
      description="Start your first focus session to begin tracking your productivity and building better work habits."
      action={{
        label: "Start Focus Session",
        onClick: onStartFocus,
      }}
    />
  );
}

export function NoAnalyticsDataEmptyState({ onStartFocus }: { onStartFocus: () => void }) {
  return (
    <EmptyState
      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>}
      title="No data to analyze yet"
      description="Complete some focus sessions and tasks to see your productivity analytics and insights."
      action={{
        label: "Start Focusing",
        onClick: onStartFocus,
      }}
    />
  );
}
