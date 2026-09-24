"use client";

// lastro · aviso de fim de descanso fora do app (pedido do dono, 2026-09-23).
// Mora em Ajustes, não na barra do timer: a barra não tem espaço a 375px e o
// iPhone só mostra o pedido de permissão se ele nascer de um toque.
import { useState, useSyncExternalStore } from "react";
import {
  assinarAvisoDescanso,
  desligarAvisoDescanso,
  estadoAvisoDescanso,
  ligarAvisoDescanso,
  type EstadoAvisoDescanso,
} from "@/lib/push/cliente";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function AvisoDescansoForm({ idioma }: { idioma: Idioma }) {
  const estado = useSyncExternalStore<EstadoAvisoDescanso | null>(
    assinarAvisoDescanso,
    estadoAvisoDescanso,
    () => null,
  );
  const [ocupado, setOcupado] = useState(false);
  const [falhou, setFalhou] = useState(false);

  // Recurso dormente (sem chave configurada) ou ainda no servidor: não mostra nada.
  if (estado === null || estado === "sem-chave") return null;

  function ligar() {
    setFalhou(false);
    setOcupado(true);
    // Sem `await` antes: o pedido de permissão precisa nascer deste toque.
    ligarAvisoDescanso()
      .then((final) => setFalhou(final === "desligado"))
      .catch(() => setFalhou(true))
      .finally(() => setOcupado(false));
  }

  function desligar() {
    setOcupado(true);
    void desligarAvisoDescanso().finally(() => setOcupado(false));
  }

  return (
    <section className="card-obsidian">
      <span className="card-obsidian__titulo">{t("Aviso de fim do descanso", idioma)}</span>
      <p className="campo__nota">
        {t("Quando o descanso acabar, o celular avisa mesmo com o lastro fechado.", idioma)}
      </p>

      {estado === "sem-suporte" && (
        <p className="campo__nota">
          {t(
            "No iPhone, o aviso só funciona com o lastro instalado na tela de início (Compartilhar → Adicionar à Tela de Início).",
            idioma,
          )}
        </p>
      )}

      {estado === "negado" && (
        <p className="campo__nota">
          {t(
            "As notificações do lastro estão bloqueadas. Libere nos ajustes do celular, em Notificações.",
            idioma,
          )}
        </p>
      )}

      {estado === "desligado" && (
        <button type="button" className="botao-primario" onClick={ligar} disabled={ocupado}>
          {ocupado ? t("Ativando…", idioma) : t("Ativar aviso", idioma)}
        </button>
      )}

      {estado === "ligado" && (
        <>
          <p className="campo__nota">{t("Ligado neste aparelho.", idioma)}</p>
          <button type="button" className="botao-secundario" onClick={desligar} disabled={ocupado}>
            {t("Desligar", idioma)}
          </button>
        </>
      )}

      {falhou && (
        <p className="aviso-erro" role="status">
          {t("Não foi possível ativar. Tente de novo.", idioma)}
        </p>
      )}
    </section>
  );
}
