import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Rubik } from "next/font/google";
import "./globals.css";

// Las letras del rótulo se sirven desde la app: en el lugar de la demo puede no haber red.
const rotulo = Alfa_Slab_One({ weight: "400", subsets: ["latin"], variable: "--font-rotulo", display: "swap" });
const letra = Rubik({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-letra", display: "swap" });

export const metadata: Metadata = {
  title: "Llakta",
  description: "Cuéntale un problema de tu comunidad a un equipo de agentes y sal con plan, equipo y seguimiento.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#8c3b22" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${rotulo.variable} ${letra.variable}`}>
      <body>{children}</body>
    </html>
  );
}
