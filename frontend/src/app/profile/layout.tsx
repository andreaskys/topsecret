import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meu Perfil",
  description: "Gerencie seu perfil e configuracoes no EventHub.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
