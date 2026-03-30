"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import api from "@/lib/api";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { unreadCount: wsUnread } = useWebSocket();

  // Fetch initial unread count from API
  useEffect(() => {
    if (!user) return;
    api.get<{ count: number }>("/notifications/unread-count")
      .then((r) => setUnreadCount(r.data.count))
      .catch(() => {});
  }, [user]);

  // Merge WebSocket real-time count with initial count
  const totalUnread = unreadCount + wsUnread;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
          Event<span className="text-brand-600">Hub</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <Link href="/spaces" className="hover:text-gray-900 transition-colors">Explorar</Link>
          {user && (
            <>
              <Link href="/create-listing" className="hover:text-gray-900 transition-colors">Anunciar</Link>
              <Link href="/my-listings" className="hover:text-gray-900 transition-colors">Meus Anuncios</Link>
              <Link href="/my-bookings" className="hover:text-gray-900 transition-colors">Reservas</Link>
              <Link href="/favorites" className="hover:text-gray-900 transition-colors">Favoritos</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notification bell */}
          {user && (
            <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop user menu */}
          {!isLoading && (
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 px-3 py-2 rounded-full"
                  >
                    <span className="w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                    <span>{user.fullName.split(" ")[0]}</span>
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2"
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Perfil</Link>
                        <Link href="/notifications" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Notificacoes {totalUnread > 0 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
                        </Link>
                        <button
                          onClick={() => { setMenuOpen(false); logout(); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Sair
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Entrar</Link>
                  <Link href="/register" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">Cadastrar</Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white border-b border-gray-100"
          >
            <div className="px-6 py-4 space-y-3">
              <Link href="/spaces" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 hover:text-gray-900">Explorar</Link>
              {user ? (
                <>
                  <Link href="/create-listing" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 hover:text-gray-900">Anunciar Espaco</Link>
                  <Link href="/my-listings" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 hover:text-gray-900">Meus Anuncios</Link>
                  <Link href="/my-bookings" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 hover:text-gray-900">Reservas</Link>
                  <Link href="/favorites" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 hover:text-gray-900">Favoritos</Link>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 hover:text-gray-900">Perfil</Link>
                  <hr className="border-gray-100" />
                  <button onClick={() => { setMobileOpen(false); logout(); }} className="block text-sm text-red-600">Sair</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 hover:text-gray-900">Entrar</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="block text-sm bg-gray-900 text-white text-center py-2 rounded-lg">Cadastrar</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
