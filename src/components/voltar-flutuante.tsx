import Link from "next/link";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

// lastro · DECISIONS.md 2026-08-15, D5/D6 (M9) — sem barra fixa, o botão de
// voltar vira um alvo circular flutuante sobre o conteúdo. Fica no topo, não
// na metade inferior: é navegação, não a ação primária que D2 protege.
export default function VoltarFlutuante({
  href,
  rotulo,
  idioma,
}: {
  href: string;
  rotulo: string;
  idioma: Idioma;
}) {
  return (
    <Link href={href} className="voltar-flutuante" aria-label={`${t("Voltar para", idioma)} ${rotulo}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}
