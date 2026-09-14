"use client";

// lastro · SDD.md §5.1 — formulário de registro de série.
//
// D6 (Fase 2): a gravação em si (fila offline + atualização otimista da
// lista) é responsabilidade do pai (`treino-detalhe.tsx`), que é quem tem
// o estado da lista de séries. Este componente só valida a entrada e
// entrega um objeto pronto — não sabe nada sobre rede nem sobre a fila.
//
// `unilateral` é atributo do exercício, lido do catálogo — a tela só
// mostra um indicador de texto, sem controle (o dono não re-declara isso
// a cada série). Já `pesoPorLado` é um interruptor de verdade, por
// SÉRIE (D3.5, migração 0011): o catálogo só fornece o valor-padrão que
// pré-marca o interruptor quando o exercício escolhido é um halter
// conhecido — a lista de exercícios de halter é fixa demais para cobrir
// todo uso real (achado do dono, 2026-08-24), então quem decide de fato é
// a pessoa, série a série, igual "peso corporal incluso" decidia antes.
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Exercicio, SerieHistorica } from "@/lib/dados/treino";
import { historicoDoExercicio } from "@/lib/dados/treino";
import { ehRecorde } from "@/lib/analise/recorde-serie";
import { RIR_MINIMO, RIR_MAXIMO, validarNumerosDaSerie } from "@/lib/dados/limites-serie";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export type DadosNovaSerie = {
  exercicioId: string;
  tipo: "aquecimento" | "valendo";
  reps: number;
  peso: number;
  rir: number | null;
  /** Peso desta série é de UM lado/implemento (D3.5) — interruptor do formulário. */
  pesoPorLado: boolean;
  /** Calculado aqui (não no pai) porque é aqui que o histórico já foi
   * buscado — evita uma segunda consulta pra mesma informação (C4). */
  ehRecordePessoal: boolean;
};

export default function FormularioSerie({
  exercicios,
  onRegistrar,
  preenchimento,
  idioma,
}: {
  exercicios: Exercicio[];
  onRegistrar: (dados: DadosNovaSerie) => void | Promise<void>;
  /**
   * Abre o formulário JÁ preenchido (ADR-010) — usado pelo `+` do
   * exercício vindo de modelo. Quem chama monta o valor: plano do modelo
   * quando existe, última série do histórico quando o plano é `null`.
   *
   * Aplicado por `defaultValue`, e o componente é remontado por `key` na
   * chamada. É o que permite preencher sem `setState` dentro de efeito —
   * o padrão que já custou um erro de lint e um de hidratação neste
   * projeto (ver `timer-topo.tsx`).
   */
  preenchimento?: { exercicioId: string; reps: number; peso: number } | null;
  idioma: Idioma;
}) {
  // Começa em branco de propósito — a pessoa escolhe o exercício e o tipo,
  // nenhum dos dois vem pré-marcado. Com o catálogo crescendo, pré-marcar
  // `exercicios[0]` viraria "o primeiro em ordem alfabética", que não tem
  // relação nenhuma com o que a pessoa vai treinar (achado do dono, 2026-08-07).
  const [exercicioId, setExercicioId] = useState(preenchimento?.exercicioId ?? "");
  // Vindo do `+`, o tipo já é "valendo": é o que a pessoa vai fazer.
  const [tipo, setTipo] = useState<"aquecimento" | "valendo" | "">(
    preenchimento ? "valendo" : "",
  );
  const [erro, setErro] = useState<string | null>(null);
  // Histórico do exercício escolhido — fonte única pra "última vez" (C1),
  // "repetir por exercício" (C2) e detecção de PR (C4). `null` = ainda não
  // buscado ou a busca falhou; a UI degrada em silêncio nos dois casos —
  // sem rede (D6, elevador sem sinal) isto não pode virar erro visível.
  const [historico, setHistorico] = useState<SerieHistorica[] | null>(null);
  // Interruptor "peso é de cada lado" (D3.5) — controlado, não lido do
  // FormData: pré-marcado pelo valor-padrão do catálogo quando o exercício
  // muda, mas a pessoa pode ligar/desligar por série.
  const [pesoPorLado, setPesoPorLado] = useState(false);
  const repsRef = useRef<HTMLInputElement>(null);
  const pesoRef = useRef<HTMLInputElement>(null);

  const exercicioSelecionado = exercicios.find((e) => e.id === exercicioId);

  // Ajuste de estado durante a renderização (padrão recomendado pelo React
  // para "resetar estado quando uma prop muda"), não num efeito — troca de
  // exercício reseta o interruptor para o padrão do catálogo deste
  // exercício, nunca herda o valor do exercício anterior.
  const [exercicioIdAnterior, setExercicioIdAnterior] = useState(exercicioId);
  if (exercicioId !== exercicioIdAnterior) {
    setExercicioIdAnterior(exercicioId);
    setPesoPorLado(exercicioSelecionado?.pesoPorLado ?? false);
  }

  useEffect(() => {
    let cancelado = false;
    const buscar = exercicioId
      ? historicoDoExercicio(exercicioId)
      : Promise.resolve(null);
    buscar
      .then((dados) => {
        if (!cancelado) setHistorico(dados);
      })
      .catch(() => {
        if (!cancelado) setHistorico(null);
      });
    return () => {
      cancelado = true;
    };
  }, [exercicioId]);

  const ultimaDoHistorico = historico?.[0] ?? null;

  function usarUltimosValores() {
    if (!ultimaDoHistorico) return;
    setTipo("valendo");
    if (repsRef.current) repsRef.current.value = String(ultimaDoHistorico.reps);
    if (pesoRef.current) pesoRef.current.value = String(ultimaDoHistorico.peso);
    setPesoPorLado(ultimaDoHistorico.pesoPorLado);
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const formulario = evento.currentTarget;
    const formData = new FormData(formulario);

    if (!exercicioId) {
      setErro(t("Exercício é obrigatório.", idioma));
      return;
    }
    if (tipo === "") {
      setErro(t("Escolha o tipo: aquecimento ou valendo.", idioma));
      return;
    }

    // Os mesmos limites da tabela `serie` (achados A1/OF-08, 2026-09-13):
    // o que passar daqui aparece registrado antes de a rede confirmar.
    const numeros = validarNumerosDaSerie({
      tipo,
      reps: formData.get("reps"),
      peso: formData.get("peso"),
      rir: formData.get("rir"),
    });
    if (!numeros.ok) {
      setErro(t(numeros.erro, idioma));
      return;
    }
    const { reps, peso, rir } = numeros;

    // PR só existe pra série valendo (FF4) e só compara contra séries
    // elegíveis a e1RM do próprio exercício (backlog C4).
    const ehRecordePessoal =
      tipo === "valendo" &&
      ehRecorde({ reps, peso }, historico ?? []);

    await onRegistrar({
      exercicioId,
      tipo: tipo as "aquecimento" | "valendo",
      reps,
      peso,
      rir,
      pesoPorLado,
      ehRecordePessoal,
    });
    formulario.reset();
  }

  // noValidate: os campos abaixo mantêm required/min/max (semântica pra
  // leitor de tela e teclado numérico do mobile), mas sem isto o browser
  // intercepta o submit e mostra seu próprio balão antes de `aoEnviar`
  // rodar — as mensagens deste componente ("Exercício é obrigatório." etc.)
  // nunca apareciam (achado real da auditoria, REG-06 a REG-11, 2026-08-17).
  return (
    <form className="formulario" onSubmit={aoEnviar} noValidate style={{ display: "flex", flexDirection: "column", gap: "var(--lastro-e-3)" }}>
      <div className="campo">
        <label className="campo__rotulo" htmlFor="exercicio_id">
          {t("Exercício", idioma)}
        </label>
        <select
          id="exercicio_id"
          name="exercicio_id"
          value={exercicioId}
          onChange={(e) => setExercicioId(e.target.value)}
          required
        >
          <option value="" disabled>
            {t("Selecione o exercício", idioma)}
          </option>
          {exercicios.map((exercicio) => (
            <option key={exercicio.id} value={exercicio.id}>
              {exercicio.nome}
            </option>
          ))}
        </select>
      </div>

      {exercicioSelecionado?.unilateral && (
        <span className="tag-unilateral" style={{ alignSelf: "flex-start" }}>
          {t("Unilateral · reps contam por lado", idioma)}
        </span>
      )}

      {ultimaDoHistorico && (
        <div style={{ background: "var(--lastro-sup-2)", border: "1px solid var(--lastro-linha)", borderRadius: "var(--lastro-raio-2)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "var(--lastro-papel-rotulo)", color: "var(--lastro-txt-2)", margin: 0 }}>
            {t("Última vez:", idioma)} <strong style={{ color: "var(--lastro-ouro)", fontFamily: "var(--lastro-fonte-num)" }}>{ultimaDoHistorico.reps} × {ultimaDoHistorico.peso} kg</strong>
          </p>
          <button type="button" className="botao-textual" onClick={usarUltimosValores} style={{ color: "var(--lastro-ouro)", fontWeight: "bold" }}>
            {t("Usar valores", idioma)}
          </button>
        </div>
      )}

      <div className="campo">
        <label className="campo__rotulo" htmlFor="tipo">
          {t("Tipo de Série", idioma)}
        </label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "aquecimento" | "valendo" | "")}
          required
        >
          <option value="" disabled>
            {t("Selecione o tipo", idioma)}
          </option>
          <option value="valendo">{t("Valendo", idioma)}</option>
          <option value="aquecimento">{t("Aquecimento", idioma)}</option>
        </select>
      </div>

      <div className="dupla">
        <div className="campo">
          <label className="campo__rotulo" htmlFor="reps">
            {t("Reps", idioma)}
          </label>
          <input
            ref={repsRef}
            id="reps"
            name="reps"
            defaultValue={preenchimento?.reps ?? ""}
            type="number"
            inputMode="numeric"
            placeholder="0"
            min={1}
            max={200}
            required
          />
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="peso">
            {t("Peso (kg)", idioma)}
          </label>
          <input
            ref={pesoRef}
            id="peso"
            name="peso"
            defaultValue={preenchimento?.peso ?? ""}
            type="number"
            inputMode="decimal"
            placeholder="0.0"
            min={0}
            max={1000}
            step="0.01"
            required
          />
        </div>
      </div>

      {tipo === "valendo" && (
        <div className="campo">
          <label className="campo__rotulo" htmlFor="rir">
            {t("RIR (Repetições na Reserva — Opcional)", idioma)}
          </label>
          <input id="rir" name="rir" type="number" inputMode="numeric" placeholder={t("Ex: 2", idioma)} min={RIR_MINIMO} max={RIR_MAXIMO} />
        </div>
      )}

      <label className="interruptor" htmlFor="peso_por_lado">
        <input
          id="peso_por_lado"
          className="interruptor__entrada"
          type="checkbox"
          checked={pesoPorLado}
          onChange={(e) => setPesoPorLado(e.target.checked)}
        />
        <span className="interruptor__trilho">
          <span className="interruptor__bolinha" />
        </span>
        {t("Peso é de cada lado (ex.: um halter em cada mão)", idioma)}
      </label>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="botao-primario" style={{ marginTop: "var(--lastro-e-2)" }}>
        {t("Registrar série", idioma)}
      </button>
    </form>
  );
}
