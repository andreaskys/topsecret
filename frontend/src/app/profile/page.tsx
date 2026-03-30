"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get<User>("/users/me");
      setProfile(response.data);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser) fetchProfile();
    else if (!authLoading) setLoading(false);
  }, [authUser, authLoading, fetchProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post<User>("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(response.data);
      updateUser({ avatarUrl: response.data.avatarUrl });
    } catch {
      alert("Erro ao fazer upload do avatar.");
    } finally {
      setUploading(false);
    }
  };

  if (!authLoading && !authUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <div className="mt-20">
            <p className="text-gray-500 text-lg mb-4">Faça login para ver seu perfil.</p>
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Fazer login</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 pb-16 max-w-2xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Meu Perfil</h1>

          {loading ? (
            <div className="animate-pulse bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gray-200 rounded-full" />
                <div>
                  <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-56" />
                </div>
              </div>
            </div>
          ) : profile && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 bg-brand-600 text-white rounded-full flex items-center justify-center text-2xl font-medium">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors">
                    {uploading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{profile.fullName}</h2>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Telefone</span>
                  <span className="text-sm font-medium text-gray-900">{profile.phoneNumber}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Conta</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{profile.role?.toLowerCase()}</span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <Link href="/my-listings" className="text-center py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Meus Anúncios
                </Link>
                <Link href="/my-bookings" className="text-center py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Minhas Reservas
                </Link>
                <Link href="/favorites" className="text-center py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Favoritos
                </Link>
                <Link href="/notifications" className="text-center py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Notificações
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
