"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { Booking, PaginatedResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmada", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-700" },
};

export default function MyBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<Booking>>("/bookings/my-bookings", {
        params: { size: 50, sort: "createdAt,desc" },
      });
      setBookings(response.data.content);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading, fetchBookings]);

  const cancelBooking = async (id: number) => {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;
    try {
      await api.patch(`/bookings/${id}/status`, { status: "CANCELLED" });
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)));
    } catch {
      alert("Erro ao cancelar reserva.");
    }
  };

  const payBooking = async (bookingId: number) => {
    try {
      await api.post("/payments", { bookingId, paymentMethod: "CREDIT_CARD" });
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: "CONFIRMED" } : b)));
      alert("Pagamento realizado com sucesso!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao processar pagamento.");
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <div className="mt-20">
            <p className="text-gray-500 text-lg mb-4">Faça login para ver suas reservas.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Reservas</h1>
          <p className="text-gray-500 mb-8">Acompanhe suas reservas de espaços.</p>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl p-6 border border-gray-200">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-400 text-lg mb-4">Nenhuma reserva ainda</p>
              <Link href="/spaces" className="text-brand-600 text-sm font-medium hover:underline">Explorar espaços</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, i) => {
                const status = statusMap[booking.status] || { label: booking.status, color: "bg-gray-100 text-gray-700" };
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <Link href={`/spaces/${booking.listingId}`} className="text-lg font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                            {booking.listingName}
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                        </div>
                        <p className="text-sm text-gray-500">{booking.listingLocation}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                          <span>Data: <strong>{new Date(booking.eventDate).toLocaleDateString("pt-BR")}</strong></span>
                          <span>Convidados: <strong>{booking.guestCount}</strong></span>
                          <span>Total: <strong>R$ {booking.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                        {booking.notes && <p className="text-sm text-gray-400 mt-2 italic">{booking.notes}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {booking.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => payBooking(booking.id)}
                              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                            >
                              Pagar
                            </button>
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
