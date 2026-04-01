"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AuthResponse } from "@/types";

interface AuthUser {
  email: string;
  fullName: string;
  userId: number;
  role?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state by calling /users/me
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get("/users/me");
        setUser({
          email: response.data.email,
          fullName: response.data.fullName,
          userId: response.data.id,
          role: response.data.role,
          avatarUrl: response.data.avatarUrl,
        });
      } catch {
        // Not authenticated or token expired — try refresh
        try {
          await api.post("/auth/refresh");
          const response = await api.get("/users/me");
          setUser({
            email: response.data.email,
            fullName: response.data.fullName,
            userId: response.data.id,
            role: response.data.role,
            avatarUrl: response.data.avatarUrl,
          });
        } catch {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleAuth = useCallback((data: AuthResponse) => {
    setUser({
      email: data.email,
      fullName: data.fullName,
      userId: data.userId,
      role: data.role,
    });
  }, []);

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

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
    router.push("/");
  }, [router]);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...data };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
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
