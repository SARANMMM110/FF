import type { Task } from "@/shared/types";
import { defaultStorageProvider } from "./storageProvider";

// Single source of truth for task state management
class TaskStateManager {
  private tasks: Task[] = [];
  private listeners: Array<(tasks: Task[]) => void> = [];

  // Subscribe to task updates
  subscribe(listener: (tasks: Task[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notify() {
    this.listeners.forEach(listener => listener([...this.tasks]));
  }

  // Load tasks from storage
  async loadTasks(): Promise<Task[]> {
    try {
      const stored = await defaultStorageProvider.getTasks();
      this.tasks = stored;
      this.notify();
      return this.tasks;
    } catch (error) {
      console.error("Failed to load tasks:", error);
      return this.tasks;
    }
  }

  // Save tasks to storage
  private async saveTasks(): Promise<void> {
    try {
      await defaultStorageProvider.setTasks(this.tasks);
    } catch (error) {
      console.error("Failed to save tasks:", error);
    }
  }

  // Get current tasks
  getTasks(): Task[] {
    return [...this.tasks];
  }

  // Set tasks (used by API sync)
  setTasks(tasks: Task[]) {
    this.tasks = tasks;
    this.saveTasks();
    this.notify();
  }

  // Toggle task completion status
  async toggleTaskDone(id: number): Promise<boolean> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return false;

    const task = this.tasks[taskIndex];
    const wasCompleted = task.is_completed;
    
    // Prepare the update for API
    const updates = {
      is_completed: wasCompleted ? false : true,
      completed_at: wasCompleted ? null : new Date().toISOString(),
    };

    try {
      // Call API first to ensure server sync
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task on server");
      }
      
      const updatedTask = await response.json();
      
      // Update local state only after API success
      this.tasks[taskIndex] = updatedTask;
      await this.saveTasks();
      this.notify();
      return true;
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
      return false;
    }
  }

  // Mark task as complete (always sets to complete, no toggle)
  async completeTask(id: number): Promise<boolean> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return false;

    const task = this.tasks[taskIndex];
    if (task.is_completed) return true; // Already complete

    const updates = {
      is_completed: true,
      completed_at: new Date().toISOString(),
    };

    try {
      // Call API first to ensure server sync
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task on server");
      }
      
      const updatedTask = await response.json();
      
      // Update local state only after API success
      this.tasks[taskIndex] = updatedTask;
      await this.saveTasks();
      this.notify();
      return true;
    } catch (error) {
      console.error("Failed to complete task:", error);
      return false;
    }
  }

  // Update a task
  async updateTask(id: number, updates: Partial<Task>): Promise<boolean> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return false;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    await this.saveTasks();
    this.notify();
    return true;
  }

  // Add a task
  async addTask(task: Task): Promise<void> {
    this.tasks.unshift(task);
    await this.saveTasks();
    this.notify();
  }

  // Remove a task
  async removeTask(id: number): Promise<boolean> {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== id);
    
    if (this.tasks.length !== initialLength) {
      await this.saveTasks();
      this.notify();
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const taskStateManager = new TaskStateManager();

// Export convenience functions
export const { toggleTaskDone, completeTask } = taskStateManager;
