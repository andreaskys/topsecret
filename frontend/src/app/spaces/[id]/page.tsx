"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { Listing, Review, PaginatedResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AvailabilityCalendar } from "@/components/listing/AvailabilityCalendar";

export default function SpaceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Favorite
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Booking form
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchListing = useCallback(async () => {
    try {
      const response = await api.get<Listing>(`/listings/${id}`);
      setListing(response.data);
    } catch {
      // handle error
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<Review>>(
        `/listings/${id}/reviews`,
        { params: { size: 50, sort: "createdAt,desc" } }
      );
      setReviews(response.data.content);
    } catch {
      // handle error
    }
  }, [id]);

  const checkFavorite = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get<boolean>(`/favorites/${id}/check`);
      setIsFavorited(response.data);
    } catch {
      // not favorited
    }
  }, [id, user]);

  useEffect(() => {
    Promise.all([fetchListing(), fetchReviews(), checkFavorite()]).finally(() =>
      setLoading(false)
    );
  }, [fetchListing, fetchReviews, checkFavorite]);

  const toggleFavorite = async () => {
    if (!user) return;
    setFavLoading(true);
    try {
      await api.post(`/favorites/${id}`);
      setIsFavorited(!isFavorited);
    } catch {
      // handle
    } finally {
      setFavLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setReviewLoading(true);
    try {
      await api.post(`/listings/${id}/reviews`, { rating, comment });
      setReviewSuccess(true);
      setComment("");
      setRating(5);
      await fetchReviews();
      await fetchListing();
    } catch (err: any) {
      setReviewError(err.response?.data?.message || "Erro ao enviar avaliacao.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");
    setBookingLoading(true);
    try {
      await api.post("/bookings", {
        listingId: Number(id),
        eventDate,
        guestCount: Number(guestCount),
        notes: notes || undefined,
      });
      setBookingSuccess(true);
      setEventDate("");
      setGuestCount("");
      setNotes("");
    } catch (err: any) {
      setBookingError(err.response?.data?.message || err.response?.data?.error || "Erro ao criar reserva.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Min date for booking (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="aspect-[16/9] bg-gray-200 rounded-2xl mb-8" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-lg mt-20">Espaco nao encontrado</p>
          <Link href="/spaces" className="mt-4 inline-block text-brand-600 text-sm font-medium hover:underline">
            Voltar para explorar
          </Link>
        </main>
      </div>
    );
  }

  const images = listing.media.filter((m) => m.mediaType === "IMAGE");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Image Gallery */}
          <div className="mb-8 relative">
            {/* Favorite button */}
            {user && (
              <button
                onClick={toggleFavorite}
                disabled={favLoading}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors disabled:opacity-50"
              >
                <svg
                  className={`w-5 h-5 transition-colors ${isFavorited ? "text-red-500" : "text-gray-600"}`}
                  fill={isFavorited ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            )}
            {images.length > 0 ? (
              <div>
                <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-200 mb-3">
                  <img
                    src={images[activeImage]?.url}
                    alt={listing.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(i)}
                        className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          i === activeImage ? "border-brand-600" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gray-200 rounded-2xl flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{listing.name}</h1>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre o espaco</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>

              {listing.amenities.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Comodidades</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Anunciante</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center font-medium">
                    {listing.owner.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{listing.owner.fullName}</p>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Avaliacoes
                  {listing.ratingCount > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      &#9733; {listing.avgRating.toFixed(1)} ({listing.ratingCount} avaliacao{listing.ratingCount !== 1 ? "es" : ""})
                    </span>
                  )}
                </h2>

                {user && !reviewSuccess && (
                  <form onSubmit={handleReviewSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Deixe sua avaliacao</h3>
                    {reviewError && (
                      <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-3 border border-red-100">
                        {reviewError}
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="block text-sm text-gray-600 mb-1.5">Nota</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl transition-colors ${
                              star <= rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            &#9733;
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm text-gray-600 mb-1.5">Comentario (opcional)</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                        placeholder="Conte sobre sua experiencia..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {reviewLoading ? "Enviando..." : "Enviar Avaliacao"}
                    </button>
                  </form>
                )}

                {reviewSuccess && (
                  <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100 mb-6">
                    Avaliacao enviada com sucesso!
                  </div>
                )}

                {!user && (
                  <div className="bg-gray-100 rounded-xl p-5 mb-6 text-center">
                    <p className="text-sm text-gray-600">
                      <Link href="/login" className="text-brand-600 font-medium hover:underline">
                        Faca login
                      </Link>{" "}
                      para avaliar este espaco.
                    </p>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhuma avaliacao ainda.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                              {review.user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{review.user.fullName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-200"}>
                                &#9733;
                              </span>
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Pricing + Booking */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Pricing Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-gray-500 mb-6">por evento</p>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-700">Ate <strong>{listing.maxGuests}</strong> convidados</span>
                    </div>
                    {listing.ratingCount > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-yellow-500 text-lg">&#9733;</span>
                        <span className="text-gray-700">
                          <strong>{listing.avgRating.toFixed(1)}</strong> ({listing.ratingCount} avaliacao{listing.ratingCount !== 1 ? "es" : ""})
                        </span>
                      </div>
                    )}
                  </div>

                  {user && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-500 mb-3">Entre em contato com o anunciante</p>
                      <a
                        href={`/messages?userId=${listing.owner.id}`}
                        className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        Enviar Mensagem
                      </a>
                    </div>
                  )}
                </div>

                {/* Availability Calendar */}
                <AvailabilityCalendar listingId={Number(id)} />

                {/* Booking Card */}
                {user && !bookingSuccess && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservar este espaco</h3>
                    {bookingError && (
                      <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4 border border-red-100">
                        {bookingError}
                      </div>
                    )}
                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Data do evento</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          min={minDate}
                          required
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Numero de convidados</label>
                        <input
                          type="number"
                          value={guestCount}
                          onChange={(e) => setGuestCount(e.target.value)}
                          min="1"
                          max={listing.maxGuests}
                          required
                          placeholder={`Ate ${listing.maxGuests}`}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Observacoes (opcional)</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                          placeholder="Detalhes sobre o evento..."
                        />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Total</span>
                          <span className="font-semibold text-gray-900">
                            R$ {listing.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                      >
                        {bookingLoading ? "Reservando..." : "Solicitar Reserva"}
                      </button>
                    </form>
                  </div>
                )}

                {bookingSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <svg className="w-10 h-10 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-700 font-medium mb-1">Reserva solicitada!</p>
                    <p className="text-green-600 text-sm mb-4">Acompanhe o status em suas reservas.</p>
                    <Link
                      href="/my-bookings"
                      className="text-sm text-brand-600 font-medium hover:underline"
                    >
                      Ver minhas reservas
                    </Link>
                  </div>
                )}

                {!user && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
                    <p className="text-gray-600 text-sm mb-3">Faca login para reservar este espaco</p>
                    <Link
                      href="/login"
                      className="block w-full text-center bg-brand-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                    >
                      Fazer login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
