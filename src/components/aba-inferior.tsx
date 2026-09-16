// lastro · DESIGN.md §4 — a aba inferior fica ao alcance do polegar (D2) e
// usa vidro porque o conteúdo rola por baixo dela. O item ativo se marca
// por PESO além da cor: cor nunca é o único canal.
import Link from "next/link";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

type Secao =
  | "inicio"
  | "bancada"
  | "analise"
  | "catalogo"
  | "ajustes"
  // Seções que só existem na casca do personal (PRD §11, direção "Com o
  // catálogo junto", escolhida pelo dono no gate visual de 2026-09-11).
  | "fila"
  | "alunos";

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

/**
 * A barra do PERSONAL. Não é a de usuário com itens escondidos: é outra
 * lista, e a diferença é o ponto da decisão do dono — conta de personal
 * não treina, então "Início", "Treinos" e "Análise" não somem por
 * discrição, elas não existem. As três pressupõem quem treina.
 *
 * O catálogo FICA, e foi a escolha entre as direções A e B do gate: é o
 * único acervo do produto que serve ao profissional sem adaptação
 * nenhuma — demonstração de execução curada por pessoa (PRD §4.5). Tirar
 * seria descartar trabalho curado por simetria, e mandar o personal
 * procurar execução fora do app.
 */
const SECOES_PERSONAL: typeof SECOES = [
  {
    id: "fila",
    href: "/personal",
    rotulo: "Fila",
    // Caixa de entrada: o alerta ESPERA (§11.4.5), não chega.
    caminho: "M4 13h4l2 3h4l2-3h4M4 13l2.5-7h11L20 13v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z",
  },
  {
    id: "alunos",
    href: "/personal/alunos",
    rotulo: "Alunos",
    caminho:
      "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 108 0 4 4 0 10-8 0M22 21v-2a4 4 0 00-3-3.87",
  },
  SECOES[3], // Catálogo — a mesma entrada, não uma cópia que pode divergir.
  SECOES[4], // Ajustes
];

export default function AbaInferior({
  ativa,
  idioma,
  tipoConta = "aluno",
}: {
  ativa: Secao;
  idioma: Idioma;
  /** Decide QUAL barra aparece. Vem do perfil, que toda tela já carrega. */
  tipoConta?: "aluno" | "personal";
}) {
  const secoes = tipoConta === "personal" ? SECOES_PERSONAL : SECOES;
  return (
    <nav className="nav" aria-label={t("Seções do app", idioma)}>
      {secoes.map((secao) => (
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
          {t(secao.rotulo, idioma)}
        </Link>
      ))}
    </nav>
  );
}
