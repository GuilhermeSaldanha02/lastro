// lastro · DESIGN.md §4 — a aba inferior fica ao alcance do polegar (D2) e
// usa vidro porque o conteúdo rola por baixo dela. O item ativo se marca
// por PESO além da cor: cor nunca é o único canal.
import Link from "next/link";

type Secao = "inicio" | "bancada" | "analise" | "catalogo" | "ajustes";

const SECOES: {
  id: Secao;
  href: string;
  rotulo: string;
  /** Traçado, nunca preenchido — regra do padrão. */
  caminho: string;
}[] = [
  {
    id: "inicio",
    href: "/",
    rotulo: "Início",
    caminho: "M3 11l9-8 9 8M5 10v10h14V10",
  },
  {
    // id interno continua "bancada" (Modo Bancada, DESIGN.md §3.5) —
    // só o rótulo visível mudou pra bater com a barra de topo (A3, 2026-08-13).
    id: "bancada",
    href: "/treino",
    rotulo: "Treinos",
    caminho: "M4 8v8M20 8v8M8 6v12M16 6v12M8 12h8",
  },
  {
    id: "analise",
    href: "/analise",
    rotulo: "Análise",
    caminho: "M4 19V9M10 19V5M16 19v-7M22 19H2",
  },
  {
    id: "catalogo",
    href: "/catalogo",
    rotulo: "Catálogo",
    caminho: "M5 4h11a2 2 0 012 2v14H7a2 2 0 01-2-2V4zM9 8h6M9 12h6",
  },
  {
    id: "ajustes",
    href: "/ajustes",
    rotulo: "Ajustes",
    caminho:
      "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1zM12 9a3 3 0 100 6 3 3 0 000-6z",
  },
];

export default function AbaInferior({ ativa }: { ativa: Secao }) {
  return (
    <nav className="nav" aria-label="Seções do app">
      {SECOES.map((secao) => (
        <Link
          key={secao.id}
          href={secao.href}
          aria-current={ativa === secao.id ? "page" : undefined}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={secao.caminho} />
          </svg>
          {secao.rotulo}
        </Link>
      ))}
    </nav>
  );
}
