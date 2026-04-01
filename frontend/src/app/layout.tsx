import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ServiceWorkerRegistration } from "@/components/layout/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "EventHub - Encontre o Espaco Perfeito para seu Evento",
    template: "%s | EventHub",
  },
  description:
    "Descubra e alugue espacos unicos para seus eventos. Festas, casamentos, corporativos, festivais e muito mais.",
  keywords: ["eventos", "aluguel de espacos", "festas", "casamentos", "corporativo", "EventHub"],
  manifest: "/manifest.json",
  openGraph: {
    title: "EventHub - Encontre o Espaco Perfeito para seu Evento",
    description: "Descubra e alugue espacos unicos para seus eventos.",
    type: "website",
    locale: "pt_BR",
    siteName: "EventHub",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EventHub",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>
          {children}
          <ServiceWorkerRegistration />
        </AuthProvider>
      </body>
    </html>
  );
}
