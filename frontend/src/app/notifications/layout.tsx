import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notificacoes",
  description: "Suas notificacoes e atualizacoes no EventHub.",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
