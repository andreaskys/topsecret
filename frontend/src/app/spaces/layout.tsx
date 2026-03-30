import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorar Espacos",
  description: "Encontre espacos perfeitos para festas, casamentos, eventos corporativos e muito mais.",
};

export default function SpacesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
