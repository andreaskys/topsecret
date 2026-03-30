import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Conta",
  description: "Crie sua conta no EventHub e comece a anunciar ou reservar espacos para eventos.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
