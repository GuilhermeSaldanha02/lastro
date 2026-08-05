import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import RegistrarServiceWorker from "@/components/registrar-service-worker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lastro",
  description: "Registro de treino e leitura semanal com IA — app pessoal.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    // Safari/iOS não lê SVG para "adicionar à tela de início" — sem isso,
    // o ícone vira uma miniatura da página em vez da marca (2.4).
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <RegistrarServiceWorker />
        {children}
      </body>
    </html>
  );
}
