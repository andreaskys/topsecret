"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Busque",
    description: "Encontre espaços filtrados por localização, tipo de evento e capacidade.",
  },
  {
    number: "02",
    title: "Reserve",
    description: "Escolha a data, confirme os detalhes e faça sua reserva de forma segura.",
  },
  {
    number: "03",
    title: "Celebre",
    description: "Aproveite o espaço perfeito e depois avalie sua experiência.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Como Funciona
          </h2>
          <p className="text-gray-500">Simples, rápido e seguro</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <span className="text-5xl font-bold text-brand-200">
                {step.number}
              </span>
              <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
