/**
 * Authentication Provider Interface (MVP with Local Fake Server)
 * 
 * This module provides an interface for email/password authentication.
 * For MVP, it uses a fake local server that simulates auth operations.
 * The interface is designed so that a real backend implementation can be
 * swapped in later without changing consuming components.
 * 
 * To wire up a real backend:
 * 1. Replace LocalAuthProvider with RealAuthProvider
 * 2. Implement actual API calls to your auth service
 * 3. Handle proper error responses and validation
 */

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthProvider {
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  register(email: string, password: string, name: string): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
  verifyToken(token: string): Promise<User>;
  getCurrentUser(): User | null;
  isAuthenticated(): boolean;
}

/**
 * Local Auth Provider (MVP with Fake Server)
 * 
 * Simulates authentication using localStorage for user storage.
 * Provides realistic delays and validation for testing.
 * Replace with real backend implementation later.
 */
class LocalAuthProvider implements AuthProvider {
  private readonly USERS_KEY = "focusflow-fake-users";
  private readonly TOKEN_KEY = "focusflow-auth-token";
  private currentUser: User | null = null;

  constructor() {
    this.loadCurrentUser();
  }

  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateToken(): string {
    return btoa(JSON.stringify({
      id: this.generateId(),
      issued: Date.now(),
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    }));
  }

  private getStoredUsers(): Record<string, { password: string; user: User }> {
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error reading users from localStorage:", error);
      return {};
    }
  }

  private saveUsers(users: Record<string, { password: string; user: User }>): void {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users to localStorage:", error);
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  private loadCurrentUser(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (token) {
        const tokenData = JSON.parse(atob(token));
        if (tokenData.expires > Date.now()) {
          const users = this.getStoredUsers();
          const userEntry = Object.values(users).find(entry => 
            entry.user.id === tokenData.userId
          );
          if (userEntry) {
            this.currentUser = userEntry.user;
          }
        } else {
          localStorage.removeItem(this.TOKEN_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading current user:", error);
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    console.log("🔐 [Auth MVP] Attempting login for:", email);
    
    await this.delay();

    if (!this.validateEmail(email)) {
      throw new Error("Invalid email format");
    }

    if (!password) {
      throw new Error("Password is required");
    }

    const users = this.getStoredUsers();
    const userEntry = users[email.toLowerCase()];

    if (!userEntry || userEntry.password !== password) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateToken();
    const tokenData = JSON.parse(atob(token));
    tokenData.userId = userEntry.user.id;
    const finalToken = btoa(JSON.stringify(tokenData));

    localStorage.setItem(this.TOKEN_KEY, finalToken);
    this.currentUser = userEntry.user;

    return { user: userEntry.user, token: finalToken };
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    console.log("📝 [Auth MVP] Attempting registration for:", email);
    
    await this.delay();

    if (!this.validateEmail(email)) {
      throw new Error("Invalid email format");
    }

    if (!this.validatePassword(password)) {
      throw new Error("Password must be at least 6 characters long");
    }

    if (!name.trim()) {
      throw new Error("Name is required");
    }

    const users = this.getStoredUsers();
    const emailKey = email.toLowerCase();

    if (users[emailKey]) {
      throw new Error("An account with this email already exists");
    }

    const user: User = {
      id: this.generateId(),
      email: email.toLowerCase(),
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    users[emailKey] = { password, user };
    this.saveUsers(users);

    const token = this.generateToken();
    const tokenData = JSON.parse(atob(token));
    tokenData.userId = user.id;
    const finalToken = btoa(JSON.stringify(tokenData));

    localStorage.setItem(this.TOKEN_KEY, finalToken);
    this.currentUser = user;

    return { user, token: finalToken };
  }

  async logout(): Promise<void> {
    console.log("👋 [Auth MVP] Logging out");
    
    await this.delay(200);
    
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser = null;
  }

  async verifyToken(token: string): Promise<User> {
    await this.delay(200);

    try {
      const tokenData = JSON.parse(atob(token));
      
      if (tokenData.expires <= Date.now()) {
        throw new Error("Token expired");
      }

      const users = this.getStoredUsers();
      const userEntry = Object.values(users).find(entry => 
        entry.user.id === tokenData.userId
      );

      if (!userEntry) {
        throw new Error("User not found");
      }

      return userEntry.user;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

/**
 * Get the current auth provider instance
 * 
 * For MVP, returns LocalAuthProvider.
 * Replace with a factory that can switch between local and real providers.
 */
export function getAuthProvider(): AuthProvider {
  return new LocalAuthProvider();
}

/**
 * Real Auth Provider (stub for future implementation)
 * 
 * This would implement actual API calls to your authentication service.
 */
export class RealAuthProvider implements AuthProvider {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // TODO: Implement real API call
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    // TODO: Implement real API call
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    return response.json();
  }

  async logout(): Promise<void> {
    // TODO: Implement real API call
    await fetch("/api/auth/logout", { method: "POST" });
  }

  async verifyToken(token: string): Promise<User> {
    // TODO: Implement real API call
    const response = await fetch("/api/auth/verify", {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Token verification failed");
    }

    return response.json();
  }

  getCurrentUser(): User | null {
    // TODO: Implement user persistence
    return null;
  }

  isAuthenticated(): boolean {
    // TODO: Implement authentication check
    return false;
  }
}
