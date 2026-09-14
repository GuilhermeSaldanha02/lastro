"use client";

// lastro · A fila de trabalho do personal — PRD §11.4.5 e §11.4.7.
//
// Componente de cliente por UM motivo só: registrar o acionamento do
// alerta no clique (§11.7, "o clique acontece dentro do lastro e é
// registrável"). Todo o resto — cálculo, priorização, texto — já veio
// pronto do servidor.
import { useState } from "react";
import { registrarAcionamentoAlerta } from "@/lib/dados/personal-acoes";
import type { ItemDaFila } from "@/lib/dados/personal";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import { apresentarErroPersonal } from "@/lib/texto/erro-personal";

export default function FilaPersonal({ itens, idioma }: { itens: ItemDaFila[]; idioma: Idioma }) {
  // Marca otimista: o botão é um link de verdade (ver abaixo), então a
  // navegação já aconteceu quando a resposta do servidor chega.
  const [acionados, setAcionados] = useState<Set<string>>(
    new Set(itens.filter((i) => i.acionadoEm).map((i) => i.alertaId)),
  );
  const [erro, setErro] = useState<string | null>(null);

  function registrarAcionamento(alertaId: string) {
    void registrarAcionamentoAlerta(alertaId)
      .then((resultado) => {
        if (!resultado.ok) setErro(apresentarErroPersonal(resultado.erro, idioma));
      })
      .catch(() => setErro(apresentarErroPersonal("Não foi possível registrar o acionamento.", idioma)));
  }

  return (
    <div className="fila-personal">
      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
      {itens.map((item) => {
        const acionado = acionados.has(item.alertaId);
        return (
          <article
            key={item.alertaId}
            className={
              item.alerta.tipo === "grupo_sem_estimulo"
                ? "alerta-personal alerta-personal--abandono"
                : "alerta-personal"
            }
          >
            <div className="alerta-personal__topo">
              <span className="alerta-personal__aluno">{item.aluno.nome}</span>
              {/* "Há quanto tempo" em texto, não só na cor da barra. */}
              <span className="alerta-personal__tempo">
                {item.conteudo.haQuantoTempo.replace(/\.$/, "")}
              </span>
            </div>

            <h2 className="alerta-personal__titulo">{item.conteudo.titulo}</h2>

            <p className="alerta-personal__linha">{item.conteudo.oQueAconteceu}</p>
            <p className="alerta-personal__linha">
              <strong>{item.conteudo.evidencia}</strong>
            </p>
            <p className="alerta-personal__linha">{item.conteudo.possivelCausa}</p>
            <p className="alerta-personal__investigar">
              {item.conteudo.oQueInvestigar}
            </p>

            <div className="alerta-personal__acao">
              {item.linkWhatsApp ? (
                // ÂNCORA, não `window.open` depois de `await`: abrir janela
                // após uma espera assíncrona é bloqueado por navegador como
                // popup, e o registro da medida NUNCA pode custar a ação
                // (§11.4.7 — agir é o objetivo). A navegação é nativa; o
                // registro vai junto, sem ser esperado.
                <a
                  className="botao-primario botao-com-icone"
                  href={item.linkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setAcionados((atual) => new Set(atual).add(item.alertaId));
                    registrarAcionamento(item.alertaId);
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  {/* Rótulo curto de propósito: o botão precisa caber numa
                      linha ao lado do ícone em 375px. */}
                  <span>{acionado ? t("Abrir novamente", idioma) : t("Enviar pelo WhatsApp", idioma)}</span>
                </a>
              ) : (
                // Sem telefone não há ação de um clique, e a tela precisa
                // dizer POR QUE em vez de mostrar um botão morto. O número
                // é do aluno e só ele pode informar (§11.4.3).
                <p className="alerta-personal__linha">
                  {t("Sem telefone cadastrado", idioma)}: {item.aluno.nome.split(" ")[0]}.
                </p>
              )}
              {acionado && (
                <p className="alerta-personal__marca-acionado" aria-live="polite">
                  {t("Mensagem aberta", idioma)}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
