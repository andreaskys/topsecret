"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { Listing, PaginatedResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MyListingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchMyListings = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<Listing>>("/listings/my-listings", {
        params: { size: 50, sort: "createdAt,desc" },
      });
      setListings(response.data.content);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchMyListings();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading, fetchMyListings]);

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este anúncio?")) return;
    setDeleting(id);
    try {
      await api.delete(`/listings/${id}`);
      setListings(listings.filter((l) => l.id !== id));
    } catch {
      alert("Erro ao remover anúncio.");
    } finally {
      setDeleting(null);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <div className="mt-20">
            <p className="text-gray-500 text-lg mb-4">Você precisa estar logado para ver seus anúncios.</p>
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Fazer login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meus Anúncios</h1>
              <p className="text-gray-500 mt-1">Gerencie seus espaços publicados.</p>
            </div>
            <Link
              href="/create-listing"
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              + Novo Anúncio
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex gap-4">
                    <div className="w-32 h-24 bg-gray-200 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500 text-lg mb-4">Você ainda não tem anúncios</p>
              <Link
                href="/create-listing"
                className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Criar primeiro anúncio
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-5">
                    <div className="w-36 h-28 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {listing.media.length > 0 ? (
                        <img
                          src={listing.media[0].url}
                          alt={listing.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/spaces/${listing.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-brand-600 transition-colors truncate block"
                          >
                            {listing.name}
                          </Link>
                          <p className="text-sm text-gray-500 mt-0.5">{listing.location}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-semibold text-gray-900">
                            R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400">por evento</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>Até {listing.maxGuests} convidados</span>
                        {listing.ratingCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-500">&#9733;</span>
                            {listing.avgRating.toFixed(1)} ({listing.ratingCount})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Link
                          href={`/my-listings/${listing.id}/edit`}
                          className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleting === listing.id}
                          className="px-4 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {deleting === listing.id ? "Removendo..." : "Remover"}
                        </button>
                      </div>
                    </div>
                  </div>
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
