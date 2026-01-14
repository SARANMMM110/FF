import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '@/react-app/utils/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  google_user_data?: {
    name?: string;
    email?: string;
    picture?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isPending: boolean;
  isAuthenticated: boolean;
  redirectToLogin: () => Promise<void>;
  logout: () => Promise<void>;
  exchangeCodeForSessionToken: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiFetch('api/users/me');

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // 401 is expected when not logged in - not an error
        if (response.status !== 401) {
          console.warn('Auth check returned status:', response.status);
        }
        setUser(null);
      }
    } catch (error) {
      // Only log if it's not a network error (backend might not be running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Backend not reachable - make sure backend server is running on port 3000');
      } else {
        console.error('Auth check failed:', error);
      }
      setUser(null);
    } finally {
      setIsPending(false);
    }
  };

  const redirectToLogin = async () => {
    try {
      // Get OAuth redirect URL from backend
      const response = await apiFetch('api/oauth/google/redirect_url');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get OAuth URL');
      }

      const { redirectUrl } = await response.json();
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Failed to redirect to login:', error);
      throw error;
    }
  };

  const exchangeCodeForSessionToken = async (code: string) => {
    try {
      const response = await apiFetch('api/sessions', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to exchange code');
      }

      // Refresh user data after successful login
      await checkAuth();
    } catch (error) {
      console.error('Failed to exchange code:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiFetch('api/logout', {
        method: 'GET',
      });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user even if request fails
      setUser(null);
      window.location.href = '/';
    }
  };

  const value: AuthContextType = {
    user,
    isPending,
    isAuthenticated: !!user,
    redirectToLogin,
    logout,
    exchangeCodeForSessionToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

