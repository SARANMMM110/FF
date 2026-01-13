import { useState, useEffect } from "react";
import type { Task } from "@/shared/types";
import { taskStateManager } from "@/react-app/lib/taskStateManager";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage first for immediate UI update
      const localTasks = await taskStateManager.loadTasks();
      setTasks(localTasks);
      
      // Then sync with API
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const apiTasks = await response.json();
      
      // Update both state manager and local state
      taskStateManager.setTasks(apiTasks);
      setTasks(apiTasks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // If API fails, still show localStorage tasks
      const localTasks = await taskStateManager.loadTasks();
      setTasks(localTasks);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task: { 
    title: string; 
    description?: string; 
    priority?: number; 
    estimated_minutes?: number;
    project?: string;
    due_date?: string;
    tags?: string[];
  }) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error("Failed to create task");
      const newTask = await response.json();
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    try {
      // Sync with API first
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update task");
      const updatedTask = await response.json();
      
      // Only update localStorage after API success
      await taskStateManager.updateTask(id, updatedTask);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to task state changes
    const unsubscribe = taskStateManager.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
    });
    
    return unsubscribe;
  }, []);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
    toggleTaskDone: taskStateManager.toggleTaskDone.bind(taskStateManager),
    completeTask: taskStateManager.completeTask.bind(taskStateManager),
  };
}
