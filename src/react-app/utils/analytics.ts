// Simple analytics utility for tracking user interactions
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private enabled: boolean = true;

  // Track an event
  track(name: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    
    // Store events in localStorage for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }

    // In production, you would send this to your analytics service
    this.sendToAnalyticsService(event);
  }

  // Track user actions for product insights
  trackUserAction(action: string, context?: Record<string, any>) {
    this.track('user_action', {
      action,
      ...context,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, properties?: Record<string, any>) {
    this.track('feature_usage', {
      feature,
      ...properties,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.track('performance', {
      metric,
      value,
      unit,
    });
  }

  // Get recent events (for debugging)
  getRecentEvents(limit: number = 10): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  // Clear events
  clear() {
    this.events = [];
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private sendToAnalyticsService(event: AnalyticsEvent) {
    // In a real app, you would send events to your analytics service
    // For now, we'll just store them locally
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      storedEvents.push(event);
      
      // Keep only the last 100 events
      if (storedEvents.length > 100) {
        storedEvents.splice(0, storedEvents.length - 100);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(storedEvents));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Common tracking functions
export const trackPageView = (page: string) => {
  analytics.track('page_view', { page });
};

export const trackTaskCreated = (task: { title: string; hasDescription: boolean; priority: number }) => {
  analytics.trackUserAction('task_created', {
    has_description: task.hasDescription,
    priority: task.priority,
  });
};

export const trackFocusSessionStarted = (mode: string, taskId?: number) => {
  analytics.trackUserAction('focus_session_started', {
    timer_mode: mode,
    has_task: !!taskId,
  });
};

export const trackFocusSessionCompleted = (duration: number, mode: string) => {
  analytics.trackUserAction('focus_session_completed', {
    duration_minutes: duration,
    timer_mode: mode,
  });
};

export const trackFeatureDiscovered = (feature: string, source: string) => {
  analytics.trackFeatureUsage('feature_discovered', {
    feature,
    source,
  });
};

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    getRecentEvents: analytics.getRecentEvents.bind(analytics),
  };
}
