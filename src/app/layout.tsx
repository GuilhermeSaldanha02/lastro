import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Archivo, Fraunces } from "next/font/google";
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

// Trilha B, item E1 (D1, DESIGN.md §6.1) — substitui a família IBM Plex
// inteira. As três permanecem nos MESMOS papéis de antes: Bricolage é
// corpo (tudo que se lê no dia a dia), Archivo é dado (número, unidade,
// rótulo de sistema — a troca de família que destaca o dado, não a cor),
// Fraunces é a terceira família, uso único: o veredito do parecer
// (.doc__veredito), C4 aprovado 2026-08-08. Nenhuma marcação muda — só o
// token de fonte que cada papel resolve (§6.1: "só token"). O ALCANCE de
// onde a Fraunces pode aparecer não muda aqui; ele cresce quando a peça 9
// (§6.5) for implementada — ver a nota em DESIGN.md §6.5.
const bricolage = Bricolage_Grotesque({
  variable: "--fonte-bricolage",
  weight: "variable",
  axes: ["opsz", "wdth"],
  subsets: ["latin"],
  display: "swap",
});

// Condensada, substitui a Mono. A garantia de coluna alinhada que a Mono
// dava por ser monoespaçada não existe numa condensada proporcional —
// por isso todo seletor de número em sistema.css precisa de
// `font-variant-numeric: tabular-nums` explícito (§6.1, DESIGN.md §3.3
// documentava isso como "reforço oportunista"; agora é obrigatório).
const archivo = Archivo({
  variable: "--fonte-archivo",
  weight: "variable",
  axes: ["wdth"],
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--fonte-fraunces",
  weight: "variable",
  axes: ["SOFT", "WONK", "opsz"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "lastro",
  description: "Registro de treino e leitura semanal com IA — app pessoal.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo-lastro.png",
    apple: "/logo-lastro.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090D",
  viewportFit: "cover",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${archivo.variable} ${fraunces.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              try {
                var tema = localStorage.getItem("lastro_tema");
                if (tema) {
                  document.documentElement.setAttribute("data-tema", tema);
                }
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
        {modal}
      </body>
    </html>
  );
}
