"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { Listing, PaginatedResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<Listing>>("/favorites", {
        params: { size: 50, sort: "createdAt,desc" },
      });
      setListings(response.data.content);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchFavorites();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading, fetchFavorites]);

  const removeFavorite = async (listingId: number) => {
    try {
      await api.post(`/favorites/${listingId}`);
      setListings(listings.filter((l) => l.id !== listingId));
    } catch {}
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <div className="mt-20">
            <p className="text-gray-500 text-lg mb-4">Faça login para ver seus favoritos.</p>
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Fazer login</Link>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Favoritos</h1>
          <p className="text-gray-500 mb-8">Espaços que você salvou.</p>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-400 text-lg mb-4">Nenhum favorito ainda</p>
              <Link href="/spaces" className="text-brand-600 text-sm font-medium hover:underline">Explorar espaços</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="relative"
                >
                  <button
                    onClick={() => removeFavorite(listing.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-white shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  <Link href={`/spaces/${listing.id}`} className="group block">
                    <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-4 overflow-hidden">
                      {listing.media.length > 0 ? (
                        <img src={listing.media[0].url} alt={listing.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">{listing.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{listing.location}</p>
                    <p className="mt-2 text-sm"><span className="font-semibold">R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span><span className="text-gray-500"> / evento</span></p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
