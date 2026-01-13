import { useState, useEffect, useCallback } from "react";
import type { Subtask } from "@/shared/types";

export function useSubtasks(taskId: number) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubtasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${taskId}/subtasks`);
      if (!response.ok) throw new Error("Failed to fetch subtasks");
      const data = await response.json();
      setSubtasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const createSubtask = async (subtask: { title: string; estimated_minutes?: number; position?: number }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtask),
      });
      if (!response.ok) throw new Error("Failed to create subtask");
      const newSubtask = await response.json();
      setSubtasks((prev) => [...prev, newSubtask]);
      return newSubtask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const updateSubtask = async (id: number, updates: Partial<Subtask>) => {
    try {
      const response = await fetch(`/api/subtasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update subtask");
      const updatedSubtask = await response.json();
      setSubtasks((prev) => prev.map((st) => (st.id === id ? updatedSubtask : st)));
      return updatedSubtask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const deleteSubtask = async (id: number) => {
    try {
      const response = await fetch(`/api/subtasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete subtask");
      setSubtasks((prev) => prev.filter((st) => st.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  return {
    subtasks,
    loading,
    error,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    refetch: fetchSubtasks,
  };
}
