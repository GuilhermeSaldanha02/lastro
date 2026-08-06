// lastro · DESIGN.md §4 — a aba inferior fica ao alcance do polegar (D2) e
// usa vidro porque o conteúdo rola por baixo dela. O item ativo se marca
// por PESO além da cor: cor nunca é o único canal.
//
// Só as seções que EXISTEM entram aqui. O catálogo de exercícios e o coach
// 24h (PRD §4.4, §4.5) ainda não têm rota — entram quando existirem, não
// como item morto.
import Link from "next/link";

type Secao = "bancada" | "analise";

export default function AbaInferior({ ativa }: { ativa: Secao }) {
  return (
    <nav className="nav" aria-label="Seções do app">
      <Link href="/treino" aria-current={ativa === "bancada" ? "page" : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 8v8M20 8v8M8 6v12M16 6v12M8 12h8" />
        </svg>
        Bancada
      </Link>
      <Link href="/analise" aria-current={ativa === "analise" ? "page" : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
        </svg>
        Análise
      </Link>
    </nav>
  );
}
