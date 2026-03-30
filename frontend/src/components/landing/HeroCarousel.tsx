"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    title: "Encontre o espaço perfeito para seu evento",
    subtitle: "De festas infantis a grandes casamentos",
    gradient: "from-brand-950 to-brand-700",
  },
  {
    title: "Espaços exclusivos para momentos únicos",
    subtitle: "Lugares verificados e avaliados pela comunidade",
    gradient: "from-gray-900 to-gray-700",
  },
  {
    title: "Anuncie seu espaço e comece a lucrar",
    subtitle: "Milhares de pessoas procurando locais como o seu",
    gradient: "from-brand-900 to-brand-600",
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  return (
    <section className="relative h-[85vh] overflow-hidden pt-16">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7 }}
          className={`absolute inset-0 bg-gradient-to-br ${slides[current].gradient} flex items-center justify-center`}
        >
          <div className="text-center px-6 max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6"
            >
              {slides[current].title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl text-white/80 mb-10"
            >
              {slides[current].subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a
                href="/spaces"
                className="bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Explorar Espaços
              </a>
              <a
                href="/register"
                className="border border-white/40 text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-colors"
              >
                Criar Conta
              </a>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === current ? "bg-white w-8" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
