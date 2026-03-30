import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Seus espacos favoritos salvos no EventHub.",
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
