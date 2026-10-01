import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiClient } from '../../services/api-client';
import { authApi } from '../../services/auth.service';
import type { AuthUser } from '../../types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    isLoading: true,
    isAuthenticated: false,
    sessionExpired: false,
  });

  // Listen for session expiry from API client
  useEffect(() => {
    const unsubscribe = apiClient.onSessionExpired(() => {
      setState((prev) => {
        // Only set sessionExpired banner if the user was actually logged in previously
        const wasAuthenticated = prev.status === 'authenticated' || prev.isAuthenticated;
        return {
          status: 'unauthenticated',
          user: null,
          isLoading: false,
          isAuthenticated: false,
          sessionExpired: wasAuthenticated,
        };
      });
    });

    return unsubscribe;
  }, []);

  // On mount, restore session via HTTP-only refresh cookie
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const token = await apiClient.refreshAuthToken();
        if (!token || !mounted) {
          if (mounted) {
            setState((prev) => ({
              ...prev,
              status: 'unauthenticated',
              user: null,
              isLoading: false,
              isAuthenticated: false,
            }));
          }
          return;
        }

        const user = await authApi.me();
        if (!mounted) return;

        if (user) {
          setState((prev) => ({
            ...prev,
            status: 'authenticated',
            user,
            isLoading: false,
            isAuthenticated: true,
            sessionExpired: false,
          }));
        } else {
          apiClient.setAccessToken(null);
          setState((prev) => ({
            ...prev,
            status: 'unauthenticated',
            user: null,
            isLoading: false,
            isAuthenticated: false,
          }));
        }
      } catch {
        if (mounted) {
          setState((prev) => ({
            ...prev,
            status: 'unauthenticated',
            user: null,
            isLoading: false,
            isAuthenticated: false,
          }));
        }
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { accessToken } = await authApi.login({ email, password });
    apiClient.setAccessToken(accessToken);
    const user = await authApi.me();
    if (!user) throw new Error('Failed to fetch user after login');
    setState({
      status: 'authenticated',
      user,
      isLoading: false,
      isAuthenticated: true,
      sessionExpired: false,
    });
    return user;
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const { accessToken } = await authApi.register({ email, password, displayName });
    apiClient.setAccessToken(accessToken);
    const user = await authApi.me();
    if (!user) throw new Error('Failed to fetch user after registration');
    setState({
      status: 'authenticated',
      user,
      isLoading: false,
      isAuthenticated: true,
      sessionExpired: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      apiClient.setAccessToken(null);
      setState({
        status: 'unauthenticated',
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionExpired: false,
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await authApi.me();
    if (user) {
      setState((prev) => ({ ...prev, user }));
    }
  }, []);

  const clearSessionExpired = useCallback(() => {
    setState((prev) => ({ ...prev, sessionExpired: false }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
