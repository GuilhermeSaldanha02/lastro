import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import RegistrarServiceWorker from "@/components/registrar-service-worker";
import "./globals.css";

// Pedido do dono (2026-08-07) — abrir o app instalado (ícone na tela
// inicial) deve sempre levar pra "Início", nunca reabrir onde a última
// sessão parou. O Chrome/Android costuma restaurar a última página do
// PWA em vez de navegar pro `start_url` do manifesto — não é bug do app,
// é comportamento da plataforma, mas o dono prefere sempre abrir do zero
// na Início, mesmo perdendo a conveniência de retomar um treino direto.
//
// Trilha A, item A3 — a checagem rodava num `useEffect`, que só executa
// DEPOIS da primeira pintura: no PWA instalado, a tela errada aparecia
// por um instante antes do salto.
//
// A primeira tentativa usou `<Script strategy="beforeInteractive">` (a
// API dedicada do Next pra isso) e a doc dela parecia bater: "injetado no
// HTML… executado antes de qualquer hidratação". Só que inspecionar o
// runtime (node_modules/next/dist/client/app-bootstrap.js) mostrou que
// "antes da hidratação" não é "antes da pintura" — o `<Script>` vira uma
// fila (`self.__next_s.push`) processada por um bundle carregado com
// `async`, e o `<main>` da SSR pode pintar antes desse bundle terminar de
// baixar. A doc que resolve isso de verdade é outra:
// node_modules/next/dist/docs/01-app/02-guides/
// preventing-flash-before-hydration.md — usar `<script>` cru com
// `dangerouslySetInnerHTML`, não o componente `<Script>`. É essa
// diferença que garante "antes da pintura": o parser do navegador
// executa um `<script>` inline de verdade de forma síncrona, ao
// encontrá-lo, e só então segue pro resto do `<body>`.
//
// `display-mode: standalone` só é legível no cliente (não há header nem
// user-agent confiável pra isso no servidor) — por isso continua sendo
// JavaScript no navegador, não uma checagem no servidor.
const ROTAS_ISENTAS_DE_FORCAR_INICIO = ["/", "/login", "/auth/callback"];

// DESIGN.md §3.3 — Sans para tudo que se lê; Mono para número, unidade,
// metadado e rótulo de sistema. É a troca de família que destaca o dado,
// não a cor. (Terceira família, Serif, abaixo — uso único: o veredito.)
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

// DESIGN.md §3.3 — terceira família, uso ÚNICO: o veredito do parecer
// (.doc__veredito). Mesma superfamília IBM Plex, mesma licença SIL OFL —
// "documento emitido" ganha voz própria só onde já é a peça-assinatura,
// sem virar uma 4ª família espalhada pelo resto do app (C4, aprovado
// 2026-08-08, implementado 2026-08-10 — ficou pendente na tarefa 4).
const plexSerif = IBM_Plex_Serif({
  variable: "--fonte-plex-serif",
  weight: ["600"],
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
    <html
      lang="pt-BR"
      className={`${plexSans.variable} ${plexMono.variable} ${plexSerif.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              try {
                var ROTAS_ISENTAS = ${JSON.stringify(ROTAS_ISENTAS_DE_FORCAR_INICIO)};
                var emPwaInstalado = window.matchMedia("(display-mode: standalone)").matches;
                if (emPwaInstalado && ROTAS_ISENTAS.indexOf(window.location.pathname) === -1) {
                  window.location.replace("/");
                }
              } catch (erro) {}
            })();`,
          }}
        />
      </head>
      <body>
        <RegistrarServiceWorker />
        {children}
      </body>
    </html>
  );
}
