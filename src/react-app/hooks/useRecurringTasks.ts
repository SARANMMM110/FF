import { useEffect } from "react";
import { apiFetch } from "@/react-app/utils/api";

/**
 * Hook to automatically process recurring tasks when the app loads
 * This ensures recurring tasks are generated even if the user hasn't opened the app
 */
export function useRecurringTasks() {
  useEffect(() => {
    const processRecurringTasks = async () => {
      try {
        const response = await apiFetch("api/recurring-tasks/process", {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.created > 0) {
            console.log(`✅ Generated ${data.created} recurring task instance(s)`);
          }
        }
      } catch (error) {
        console.error("Failed to process recurring tasks:", error);
      }
    };

    // Process immediately on mount
    processRecurringTasks();

    // Also process every 5 minutes while app is open
    const interval = setInterval(processRecurringTasks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
