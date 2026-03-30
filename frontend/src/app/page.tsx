"use client";

import { motion } from "framer-motion";
import { HeroCarousel } from "@/components/landing/HeroCarousel";
import { Navbar } from "@/components/layout/Navbar";
import { FeaturedSpaces } from "@/components/landing/FeaturedSpaces";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <HeroCarousel />

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-24"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Espaços em Destaque
        </h2>
        <p className="text-gray-500 mb-12">
          Os lugares mais bem avaliados para o seu próximo evento
        </p>
        <FeaturedSpaces />
      </motion.section>

      <HowItWorks />

      <Footer />
    </main>
  );
}
