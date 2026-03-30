"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { User, PaginatedResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface Stats {
  totalUsers: number;
  totalListings: number;
  totalBookings: number;
  totalReviews: number;
}

export default function AdminPage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get<Stats>("/admin/stats"),
        api.get<PaginatedResponse<User>>("/admin/users", { params: { size: 50 } }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.content);
    } catch {
      setError("Acesso negado ou erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser) fetchData();
    else if (!authLoading) setLoading(false);
  }, [authUser, authLoading, fetchData]);

  const toggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      alert("Erro ao atualizar role.");
    }
  };

  if (!authLoading && !authUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <div className="mt-20">
            <p className="text-gray-500 text-lg mb-4">Faça login para acessar o painel admin.</p>
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Fazer login</Link>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <div className="mt-20">
            <p className="text-red-500 text-lg">{error}</p>
            <Link href="/" className="mt-4 inline-block text-brand-600 text-sm font-medium hover:underline">Voltar</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Painel Administrativo</h1>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl p-6 border border-gray-200">
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Usuários", value: stats.totalUsers, color: "bg-blue-50 text-blue-700" },
                    { label: "Anúncios", value: stats.totalListings, color: "bg-green-50 text-green-700" },
                    { label: "Reservas", value: stats.totalBookings, color: "bg-purple-50 text-purple-700" },
                    { label: "Avaliações", value: stats.totalReviews, color: "bg-yellow-50 text-yellow-700" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
                      <p className={`text-3xl font-bold ${stat.color} inline-block px-3 py-1 rounded-lg`}>{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Users table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Usuários</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left">Usuário</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">Telefone</th>
                        <th className="px-6 py-3 text-left">Role</th>
                        <th className="px-6 py-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-medium">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{u.fullName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{u.phoneNumber}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleRole(u.id, u.role || "USER")}
                              className="text-xs text-brand-600 hover:underline"
                            >
                              {u.role === "ADMIN" ? "Remover Admin" : "Tornar Admin"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
