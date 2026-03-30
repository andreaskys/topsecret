import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meus Anuncios",
  description: "Gerencie seus espacos anunciados no EventHub.",
};

export default function MyListingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
