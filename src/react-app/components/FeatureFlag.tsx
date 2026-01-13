import { ReactNode } from "react";
import { useUserPreferences } from "@/react-app/hooks/useLocalStorage";

interface FeatureFlagProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

// Simple feature flag system for gradual rollouts
export default function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const { preferences } = useUserPreferences();
  
  // Feature flags that are enabled by default
  const defaultEnabledFlags = [
    "enhanced-dashboard",
    "keyboard-shortcuts", 
    "improved-ui",
    "better-analytics",
    "quick-actions",
  ];

  // Check if feature is enabled
  const isEnabled = defaultEnabledFlags.includes(flag) || 
    (preferences as any)[`feature_${flag}`] === true;

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Hook for checking feature flags
export function useFeatureFlag(flag: string): boolean {
  const { preferences } = useUserPreferences();
  
  const defaultEnabledFlags = [
    "enhanced-dashboard",
    "keyboard-shortcuts",
    "improved-ui", 
    "better-analytics",
    "quick-actions",
  ];

  return defaultEnabledFlags.includes(flag) || 
    (preferences as any)[`feature_${flag}`] === true;
}
