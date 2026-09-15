"use client";

// lastro · SDD.md §10.3 — lista de pareceres salvos (opt-in), dentro de
// /ajustes/relatorios. Cada item abre sua PRÓPRIA rota
// (/ajustes/relatorios/parecer/[id], parecer-detalhe-acoes.tsx) — não
// expande inline aqui. Decisão de 2026-09-02: a expansão inline exigia
// sincronizar o back-arrow do cabeçalho com o estado local de "aberto"
// pra não empilhar dois controles de voltar; uma rota de verdade resolve
// isso de graça (back nativo do navegador já funciona sozinho).
import Link from "next/link";
import type { ParecerSalvo } from "@/lib/dados/parecer";
import { formatarDataCurta } from "@/lib/tempo";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function PareceresSalvos({
  pareceres,
  idioma,
}: {
  pareceres: ParecerSalvo[];
  idioma: Idioma;
}) {
  const rascunho = pareceres.find((p) => !p.confirmado) ?? null;
  const confirmados = pareceres.filter((p) => p.confirmado);

  return (
    <div className="pilha">
      {rascunho && rascunho.status === "gerando" && (
        <div className="card-relatorio-item">
          <p className="card-relatorio-item__id-curto">{rascunho.perguntaTexto}</p>
          <p className="vazio">{t("Gerando…", idioma)}</p>
        </div>
      )}

      {rascunho && rascunho.status === "pronto" && (
        // Compacto, mesmo padrão dos pareceres já confirmados abaixo — não
        // despeja o parecer inteiro na lista (achado do dono: com vários
        // treinos no histórico, o rascunho sumia rolando a tela pra baixo
        // dentro de um bloco de texto grande demais).
        <div className="card-relatorio-item">
          <div className="card-relatorio-item__cabecalho">
            <div className="card-relatorio-item__data-bloco">
              <span
                className="card-relatorio-item__data-rotulo"
                style={{ color: "var(--lastro-ouro)" }}
              >
                {t("Rascunho", idioma)}
              </span>
            </div>
          </div>
          <p className="card-relatorio-item__id-curto">{rascunho.perguntaTexto}</p>
          <Link href={`/ajustes/relatorios/parecer/${rascunho.id}`} className="botao-acao-relatorio">
            {t("Revisar e salvar", idioma)}
          </Link>
        </div>
      )}

      {confirmados.map((parecer) => (
        <div key={parecer.id} className="card-relatorio-item">
          <div className="card-relatorio-item__cabecalho">
            <div className="card-relatorio-item__data-bloco">
              <span className="card-relatorio-item__data-rotulo">
                {formatarDataCurta(parecer.criadoEm.slice(0, 10), idioma).toUpperCase()}
              </span>
            </div>
          </div>
          <p className="card-relatorio-item__id-curto">{parecer.perguntaTexto}</p>
          <Link href={`/ajustes/relatorios/parecer/${parecer.id}`} className="botao-acao-relatorio">
            {t("Ver parecer", idioma)}
          </Link>
        </div>
      ))}
    </div>
  );
}
