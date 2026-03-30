import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minhas Reservas",
  description: "Acompanhe suas reservas de espacos no EventHub.",
};

export default function MyBookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
