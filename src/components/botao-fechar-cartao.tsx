"use client";

// lastro · TR-12 (QA.md, 2026-09-23) — enquanto o formulário de série está
// aberto, a área de ações fixa sai de cena para o formulário caber na tela;
// o "Fechar" que morava lá passa a viver no cabeçalho do próprio cartão.
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function BotaoFecharCartao({
  onClick,
  idioma,
}: {
  onClick: () => void;
  idioma: Idioma;
}) {
  return (
    <button type="button" className="botao-icone" aria-label={t("Fechar", idioma)} onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

/** Rola suave, exceto para quem pediu menos movimento ao sistema. */
export function comportamentoDeRolagem(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
