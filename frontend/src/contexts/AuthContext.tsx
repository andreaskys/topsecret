"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AuthResponse } from "@/types";

interface AuthUser {
  email: string;
  fullName: string;
  role?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  birthDate: string;
  cpf: string;
  phoneNumber: string;
}

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  const scheduleAutoLogout = useCallback(
    (jwt: string) => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      const exp = parseJwtExp(jwt);
      if (!exp) return;
      const ms = exp - Date.now() - 60000; // logout 1min before expiry
      if (ms <= 0) {
        clearSession();
        return;
      }
      refreshTimer.current = setTimeout(() => {
        clearSession();
        router.push("/login");
      }, ms);
    },
    [clearSession, router]
  );

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      const exp = parseJwtExp(savedToken);
      if (exp && exp > Date.now()) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        scheduleAutoLogout(savedToken);
      } else {
        clearSession();
      }
    }
    setIsLoading(false);
  }, [clearSession, scheduleAutoLogout]);

  const handleAuth = useCallback(
    (data: AuthResponse) => {
      setToken(data.token);
      const userData: AuthUser = { email: data.email, fullName: data.fullName };
      setUser(userData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));
      scheduleAutoLogout(data.token);
    },
    [scheduleAutoLogout]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<AuthResponse>("/auth/login", { email, password });
      handleAuth(response.data);
      router.push("/");
    },
    [handleAuth, router]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await api.post<AuthResponse>("/auth/register", data);
      handleAuth(response.data);
      router.push("/");
    },
    [handleAuth, router]
  );

  const logout = useCallback(() => {
    clearSession();
    router.push("/");
  }, [clearSession, router]);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
