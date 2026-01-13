import { useState, useEffect } from 'react';
import type { AnalyticsData } from '@/shared/types';

interface DashboardStats {
  today_focus_minutes: number;
  week_focus_minutes: number;
  completed_today: number;
  avg_session_minutes: number;
  longest_streak: number;
}

interface ModeData {
  timer_mode: string;
  session_count: number;
  total_minutes: number;
}

interface ProjectData {
  project: string | null;
  total_minutes: number;
}

interface UseAnalyticsOptions {
  dateRange: "week" | "month" | "all";
  enabled?: boolean;
}

export function useAnalytics({ dateRange, enabled = true }: UseAnalyticsOptions) {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [modeData, setModeData] = useState<ModeData[]>([]);
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        const now = new Date();
        
        if (dateRange === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          params.set("from", weekAgo.toISOString());
        } else if (dateRange === "month") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          params.set("from", monthAgo.toISOString());
        }

        const [analyticsRes, statsRes, modeRes, projectRes] = await Promise.all([
          fetch(`/api/analytics?${params}`, { credentials: 'include' }),
          fetch("/api/dashboard-stats", { credentials: 'include' }),
          fetch(`/api/analytics/by-mode?${params}`, { credentials: 'include' }),
          fetch(`/api/analytics/by-project?${params}`, { credentials: 'include' }),
        ]);

        // Handle each response
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        } else {
          console.error('Analytics fetch failed:', analyticsRes.status);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setDashboardStats(statsData);
        } else {
          console.error('Dashboard stats fetch failed:', statsRes.status);
        }

        if (modeRes.ok) {
          const modeDataResult = await modeRes.json();
          setModeData(modeDataResult);
        } else {
          console.error('Mode data fetch failed:', modeRes.status);
        }

        if (projectRes.ok) {
          const projectDataResult = await projectRes.json();
          setProjectData(projectDataResult);
        } else {
          console.error('Project data fetch failed:', projectRes.status);
        }

      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange, enabled]);

  return {
    analytics,
    dashboardStats,
    modeData,
    projectData,
    loading,
    error,
  };
}
