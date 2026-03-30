"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default function CreateListingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    maxGuests: "",
  });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setFiles((prev) => [...prev, ...selected]);
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
      files.forEach((file) => formData.append("files", file));

      await api.post("/listings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.push("/my-listings");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar anúncio.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-24 pb-16 max-w-7xl mx-auto px-6 text-center">
          <div className="mt-20">
            <p className="text-gray-500 text-lg mb-4">Você precisa estar logado para anunciar um espaço.</p>
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
      <main className="pt-24 pb-16 max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Anunciar Espaço</h1>
          <p className="text-gray-500 mb-8">Preencha as informações do seu espaço para eventos.</p>

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
                  placeholder="Ex: Salão de Festas Villa Garden"
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
                  placeholder="Descreva o espaço, estrutura disponível, diferenciais..."
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
                    placeholder="3500.00"
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
                    placeholder="200"
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
                  placeholder="Rua das Flores, 123 - São Paulo, SP"
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
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-brand-500 hover:bg-brand-50/30 transition-all">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm text-gray-500">Clique para selecionar imagens</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {previews.map((preview, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Publicando..." : "Publicar Anúncio"}
            </button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
