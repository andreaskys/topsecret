import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel Administrativo",
  description: "Painel de administracao do EventHub.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
