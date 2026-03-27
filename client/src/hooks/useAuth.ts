import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createElement } from "react";
import type {
  PublicUser,
  AuthResponse,
  LoginInput,
  RegisterInput,
} from "@shared/types";
import { setAccessToken, clearAccessToken, silentRefresh } from "../lib/auth";
import { api } from "../lib/api";

interface AuthState {
  user: PublicUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent refresh on mount
  useEffect(() => {
    silentRefresh()
      .then((result) => {
        if (result) {
          // Fetch user info from a refresh — we need to decode
          // For now, do another call or trust the token
          // The refresh endpoint returns accessToken, we need user data
          api
            .fetch<AuthResponse>("/api/auth/refresh", { method: "POST" })
            .then((data) => setUser(data.user))
            .catch(() => setUser(null));
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await api.fetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: input,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await api.fetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: input,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear local state even if server call fails
    }
    clearAccessToken();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: PublicUser) => {
    setUser(updated);
  }, []);

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      },
    },
    children
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
