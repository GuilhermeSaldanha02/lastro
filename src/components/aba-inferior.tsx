// lastro · DESIGN.md §4 — a aba inferior fica ao alcance do polegar (D2) e
// usa vidro porque o conteúdo rola por baixo dela. O item ativo se marca
// por PESO além da cor: cor nunca é o único canal.
import Link from "next/link";

type Secao = "bancada" | "analise" | "catalogo" | "coach";

const SECOES: {
  id: Secao;
  href: string;
  rotulo: string;
  /** Traçado, nunca preenchido — regra do padrão. */
  caminho: string;
}[] = [
  {
    id: "bancada",
    href: "/treino",
    rotulo: "Bancada",
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
    id: "coach",
    href: "/coach",
    rotulo: "Coach",
    caminho: "M20 12a8 8 0 01-11.6 7.1L4 20l1-4.2A8 8 0 1120 12z",
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
