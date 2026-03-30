import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Anuncio",
  description: "Anuncie seu espaco no EventHub e comece a receber reservas.",
};

export default function CreateListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
