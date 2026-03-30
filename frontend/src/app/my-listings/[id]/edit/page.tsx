"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Listing } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    maxGuests: "",
  });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ id: number; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchListing = useCallback(async () => {
    try {
      const response = await api.get<Listing>(`/listings/${id}`);
      const listing = response.data;
      setForm({
        name: listing.name,
        description: listing.description,
        price: listing.price.toString(),
        location: listing.location,
        maxGuests: listing.maxGuests.toString(),
      });
      setAmenities(listing.amenities);
      setExistingMedia(listing.media.map((m) => ({ id: m.id, url: m.url })));
    } catch {
      setError("Erro ao carregar anúncio.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) fetchListing();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading, fetchListing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addAmenity = () => {
    const trimmed = amenityInput.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
      setAmenityInput("");
    }
  };

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setNewFiles((prev) => [...prev, ...selected]);
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const listingData = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        location: form.location,
        maxGuests: parseInt(form.maxGuests),
        amenities,
      };

      const formData = new FormData();
      formData.append(
        "listing",
        new Blob([JSON.stringify(listingData)], { type: "application/json" })
      );
      newFiles.forEach((file) => formData.append("files", file));

      await api.put(`/listings/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.push("/my-listings");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao atualizar anúncio.");
    } finally {
      setSaving(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <div className="mt-20">
            <p className="text-gray-500 text-lg mb-4">Você precisa estar logado.</p>
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Fazer login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-3xl mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 pb-16 max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Link href="/my-listings" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Editar Anúncio</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do espaço</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço (R$)</label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacidade máxima</label>
                  <input
                    type="number"
                    name="maxGuests"
                    value={form.maxGuests}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Localização</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Comodidades</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAmenity();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="Ex: Estacionamento, Wi-Fi, Cozinha..."
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Adicionar
                </button>
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(i)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Fotos</h2>

              {existingMedia.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Fotos atuais</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {existingMedia.map((media) => (
                      <div key={media.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={media.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-brand-500 hover:bg-brand-50/30 transition-all">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm text-gray-500">Adicionar novas fotos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {newPreviews.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Novas fotos</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {newPreviews.map((preview, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewFile(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href="/my-listings"
                className="flex-1 text-center border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
