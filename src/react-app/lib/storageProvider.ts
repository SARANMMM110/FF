// Storage provider interface for sessions cache and tasks
export interface StorageProvider {
  getSessions(): Promise<any[]>;
  setSessions(sessions: any[]): Promise<void>;
  addSession(session: any): Promise<void>;
  clearSessions(): Promise<void>;
  getTasks(): Promise<any[]>;
  setTasks(tasks: any[]): Promise<void>;
}

// LocalStorage implementation (default)
export class LocalStorageProvider implements StorageProvider {
  private readonly sessionKey = "focusflow-sessions-cache";
  private readonly taskKey = "focusflow-tasks-cache";
  private readonly maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

  async getSessions(): Promise<any[]> {
    try {
      const data = localStorage.getItem(this.sessionKey);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      const now = Date.now();
      
      // Filter out sessions older than 30 days
      const filtered = parsed.filter((session: any) => {
        const sessionTime = new Date(session.start_time).getTime();
        return now - sessionTime <= this.maxAge;
      });
      
      if (filtered.length !== parsed.length) {
        await this.setSessions(filtered);
      }
      
      return filtered;
    } catch (error) {
      console.error("Error reading sessions from localStorage:", error);
      return [];
    }
  }

  async setSessions(sessions: any[]): Promise<void> {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error writing sessions to localStorage:", error);
    }
  }

  async addSession(session: any): Promise<void> {
    const sessions = await this.getSessions();
    sessions.unshift(session);
    await this.setSessions(sessions);
  }

  async clearSessions(): Promise<void> {
    localStorage.removeItem(this.sessionKey);
  }

  async getTasks(): Promise<any[]> {
    try {
      const data = localStorage.getItem(this.taskKey);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading tasks from localStorage:", error);
      return [];
    }
  }

  async setTasks(tasks: any[]): Promise<void> {
    try {
      localStorage.setItem(this.taskKey, JSON.stringify(tasks));
    } catch (error) {
      console.error("Error writing tasks to localStorage:", error);
    }
  }
}

// Firestore stub for future implementation
export class FirestoreProvider implements StorageProvider {
  async getSessions(): Promise<any[]> {
    // TODO: Implement Firestore integration
    console.warn("FirestoreProvider not implemented yet");
    return [];
  }

  async setSessions(_sessions: any[]): Promise<void> {
    console.warn("FirestoreProvider not implemented yet");
  }

  async addSession(_session: any): Promise<void> {
    console.warn("FirestoreProvider not implemented yet");
  }

  async clearSessions(): Promise<void> {
    console.warn("FirestoreProvider not implemented yet");
  }

  async getTasks(): Promise<any[]> {
    console.warn("FirestoreProvider not implemented yet");
    return [];
  }

  async setTasks(_tasks: any[]): Promise<void> {
    console.warn("FirestoreProvider not implemented yet");
  }
}

// Default storage provider
export const defaultStorageProvider = new LocalStorageProvider();
