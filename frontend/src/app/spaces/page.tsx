"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { Listing, PaginatedResponse } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const EVENT_TYPES = [
  { value: "", label: "Todos os tipos" },
  { value: "CASAMENTO", label: "Casamento" },
  { value: "ANIVERSARIO", label: "Aniversario" },
  { value: "CORPORATIVO", label: "Corporativo" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "INFANTIL", label: "Infantil" },
  { value: "CONFRATERNIZACAO", label: "Confraternizacao" },
  { value: "OUTRO", label: "Outro" },
];

export default function SpacesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [eventType, setEventType] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Applied filters (only update on submit)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    minGuests: "",
    eventType: "",
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        size: 9,
        sort: "createdAt,desc",
      };
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.minPrice) params.minPrice = appliedFilters.minPrice;
      if (appliedFilters.maxPrice) params.maxPrice = appliedFilters.maxPrice;
      if (appliedFilters.minGuests) params.minGuests = appliedFilters.minGuests;
      if (appliedFilters.eventType) params.eventType = appliedFilters.eventType;

      const response = await api.get<PaginatedResponse<Listing>>("/listings", { params });
      setListings(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setAppliedFilters({ search, minPrice, maxPrice, minGuests, eventType });
  };

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinGuests("");
    setEventType("");
    setPage(0);
    setAppliedFilters({ search: "", minPrice: "", maxPrice: "", minGuests: "", eventType: "" });
  };

  const hasActiveFilters =
    appliedFilters.search || appliedFilters.minPrice || appliedFilters.maxPrice || appliedFilters.minGuests || appliedFilters.eventType;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Explorar Espacos</h1>
          <p className="text-gray-500 mt-2">
            {totalElements} espaco{totalElements !== 1 ? "s" : ""} disponive{totalElements !== 1 ? "is" : "l"}
          </p>
        </div>

        {/* Search + Filters */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou localizacao..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-brand-600 rounded-full" />
              )}
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Buscar
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-5 mb-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Preco minimo (R$)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Preco maximo (R$)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Sem limite"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Convidados (min.)</label>
                  <input
                    type="number"
                    value={minGuests}
                    onChange={(e) => setMinGuests(e.target.value)}
                    placeholder="Qualquer"
                    min="1"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de evento</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-brand-600 font-medium hover:underline"
            >
              Limpar todos os filtros
            </button>
          )}
        </form>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Nenhum espaco encontrado</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-brand-600 text-sm font-medium hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <Link href={`/spaces/${listing.id}`} className="group block">
                    <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-4 overflow-hidden relative">
                      {listing.media.length > 0 ? (
                        <img
                          src={listing.media[0].url}
                          alt={listing.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                          {listing.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 truncate">{listing.location}</p>
                      </div>
                      {listing.ratingCount > 0 && (
                        <div className="flex items-center gap-1 text-sm ml-3 shrink-0">
                          <span className="text-yellow-500">&#9733;</span>
                          <span className="font-medium">{listing.avgRating.toFixed(1)}</span>
                          <span className="text-gray-400">({listing.ratingCount})</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span>
                        <span className="font-semibold">
                          R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-gray-500"> / evento</span>
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">Ate {listing.maxGuests} convidados</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (page < 4) {
                    pageNum = i;
                  } else if (page > totalPages - 5) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === page
                          ? "bg-gray-900 text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Proximo
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
