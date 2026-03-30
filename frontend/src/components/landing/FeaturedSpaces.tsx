"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { Listing, PaginatedResponse } from "@/types";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

export function FeaturedSpaces() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PaginatedResponse<Listing>>("/listings", { params: { size: 3, sort: "avgRating,desc" } })
      .then((res) => setListings(res.data.content))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nenhum espaço disponível ainda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {listings.map((listing, i) => (
        <motion.div
          key={listing.id}
          custom={i}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={cardVariants}
          whileHover={{ y: -6 }}
          className="group cursor-pointer"
        >
          <Link href={`/spaces/${listing.id}`}>
            <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-4 overflow-hidden relative">
              {listing.media.length > 0 ? (
                <img
                  src={listing.media[0].url}
                  alt={listing.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm text-gray-500 mt-1">{listing.location}</p>
              </div>
              {listing.ratingCount > 0 && (
                <div className="flex items-center gap-1 text-sm ml-3 shrink-0">
                  <span className="text-yellow-500">&#9733;</span>
                  <span className="font-medium">{listing.avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <p className="mt-2 text-sm">
              <span className="font-semibold">
                R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-gray-500"> / evento</span>
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
