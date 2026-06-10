import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/contexts/LangContext";

export const metadata: Metadata = {
  title: "Porra del Mundial 2026 · Twinco Capital",
  description: "Tablero en vivo de la porra del Mundial 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
