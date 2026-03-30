import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Entre na sua conta EventHub para gerenciar seus espacos e reservas.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
