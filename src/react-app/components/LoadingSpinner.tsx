import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
  color?: "primary" | "secondary" | "white";
}

export default function LoadingSpinner({ 
  size = "md", 
  text, 
  fullScreen = false,
  color = "primary" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colorClasses = {
    primary: "text-[#E50914]",
    secondary: "text-gray-500",
    white: "text-white",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} />
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Loading overlay for components
export function LoadingOverlay({ 
  isLoading, 
  children, 
  text = "Loading..." 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}

// Skeleton loader for cards and content
export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

// Skeleton for dashboard widgets
export function DashboardWidgetSkeleton() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <SkeletonLoader className="w-8 h-8 rounded-lg" />
        <SkeletonLoader className="h-4 w-24" />
      </div>
      <SkeletonLoader className="h-8 w-16 mb-2" />
      <SkeletonLoader className="h-3 w-32" />
    </div>
  );
}
