import React from "react";

interface DashboardWidgetProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export default function DashboardWidget({
  icon,
  title,
  value,
  subtitle,
  trend,
  gradient,
  onClick,
  isLoading = false,
}: DashboardWidgetProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} backdrop-blur-sm border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-all duration-300 ${
        onClick ? "hover:border-gray-300 dark:hover:border-gray-700 hover:scale-105 cursor-pointer" : ""
      } ${isLoading ? "animate-pulse" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-[#E50914] p-2 bg-white/20 rounded-lg">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-600 dark:text-gray-300 text-sm">
                {title}
              </h3>
              {trend && (
                <div className={`text-xs font-medium ${
                  trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}>
                  {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "---" : value}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </Component>
  );
}
