import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import RegistrarServiceWorker from "@/components/registrar-service-worker";
import ForcarInicioNoLancamento from "@/components/forcar-inicio-no-lancamento";
import "./globals.css";

// DESIGN.md §3.3 — duas famílias. Sans para tudo que se lê; Mono para
// número, unidade, metadado e rótulo de sistema. É a troca de família que
// destaca o dado, não a cor.
const plexSans = IBM_Plex_Sans({
  variable: "--fonte-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--fonte-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
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
  // A cor da barra do sistema acompanha a barra de topo do app
  // (--lastro-barra-a). Valor literal exigido pelo formato do manifesto:
  // metadata do Next não aceita `var()`.
  themeColor: "#17414F",
  // A aba inferior é fixa e vai até a borda da tela (2026-08-06, "100%
  // mobile"). Sem `cover`, o iPhone não estende o conteúdo sob a barra de
  // gestos e `env(safe-area-inset-bottom)` (sistema.css) sempre mede 0 —
  // a barra fica encostada na borda física, sem folga da barra de gestos.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <RegistrarServiceWorker />
        <ForcarInicioNoLancamento />
        {children}
      </body>
    </html>
  );
}
