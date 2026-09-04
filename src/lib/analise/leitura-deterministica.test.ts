// lastro · a leitura determinística é o que o dono vê quando a Gemini não
// responde — e ela não responde com frequência real (503 em 3 dias
// distintos, medição de 2026-09-04). Estes testes fixam as duas coisas que
// o template anterior não tinha: PROSA que se lê, e a Regra da Presença
// (nada de "0 exercícios em queda").
import { describe, expect, it } from "vitest";
import { leituraDeterministica } from "./leitura-deterministica";
import type { ResumoCompacto } from "./tipos";

/** Resumo mínimo válido; cada teste liga só o que precisa. */
function resumo(sobrescreve: Partial<ResumoCompacto> = {}): ResumoCompacto {
  return {
    versao: 1,
    periodo: {
      semana_atual_inicio: "2026-08-24",
      semanas_com_dados: 4,
      janela_semanas: 4,
    },
    faixa_referencia_series: [10, 20],
    volume_semanal: [],
    volume_por_grupo_muscular: [],
    volume_por_exercicio: [],
    tendencia_e1rm: [],
    frequencia: { treinos_semana_atual: 5, grupos_sem_estimulo: [] },
    estagnacoes: [],
    prs: [],
    ...sobrescreve,
  };
}

function e1rm(exercicio: string, delta_pct: number) {
  return {
    exercicio,
    grupo_muscular: "Tríceps",
    e1rm_atual: 55,
    e1rm_inicial: 33,
    delta_pct,
    sessoes: 4,
  };
}

describe("leituraDeterministica", () => {
  it("abre dizendo a cobertura da janela", () => {
    expect(leituraDeterministica(resumo(), "pt-BR")).toContain(
      "4 de 4 semanas da janela com dados",
    );
  });

  // O que separa leitura de extrato: ordenar e nomear o líder.
  it("diz quantos subiram e QUEM liderou", () => {
    const texto = leituraDeterministica(
      resumo({
        tendencia_e1rm: [
          e1rm("Puxada pegada supinada", 25),
          e1rm("Tríceps pulley (corda)", 66.7),
          e1rm("Tríceps francês com halter", 10),
        ],
      }),
      "pt-BR",
    );
    expect(texto).toContain("3 dos 3 exercícios acompanhados subiram");
    expect(texto).toContain("Tríceps pulley (corda) liderou com +66,7%");
  });

  it("usa a frase de singular quando só um subiu", () => {
    const texto = leituraDeterministica(
      resumo({ tendencia_e1rm: [e1rm("Supino reto", 12), e1rm("Agachamento", 0)] }),
      "pt-BR",
    );
    expect(texto).toContain("Só o Supino reto subiu de e1RM");
    expect(texto).not.toContain("dos 2 exercícios acompanhados subiram");
  });

  it("não confunde platô com queda — a zona-morta de 1% vale aqui também", () => {
    const texto = leituraDeterministica(
      resumo({ tendencia_e1rm: [e1rm("Leg press 45 graus", -0.4)] }),
      "pt-BR",
    );
    expect(texto).toContain("Nenhum exercício acompanhado subiu");
    expect(texto).not.toContain("Em queda real");
  });

  // Ordem revelada ao olhar o render com os números reais do dono: numa
  // lista de quedas, a pior é a que importa primeiro.
  it("lista as quedas da PIOR para a menos pior", () => {
    const texto = leituraDeterministica(
      resumo({
        tendencia_e1rm: [
          e1rm("Cadeira extensora", -9.3),
          e1rm("Supino fechado", -29.8),
        ],
      }),
      "pt-BR",
    );
    expect(texto).toContain("Supino fechado (-29,8%) e Cadeira extensora (-9,3%)");
  });

  it("separa quem caiu de verdade, com o número", () => {
    const texto = leituraDeterministica(
      resumo({ tendencia_e1rm: [e1rm("Supino fechado", -29.8), e1rm("Remada", 20)] }),
      "pt-BR",
    );
    expect(texto).toContain("Em queda real: Supino fechado (-29,8%)");
  });

  // Regra da Presença: o template antigo listava tudo, inclusive vazio.
  it("omite a frase inteira quando não há o dado", () => {
    const texto = leituraDeterministica(resumo(), "pt-BR");
    expect(texto).not.toContain("Em queda real");
    expect(texto).not.toContain("Parados sem novo máximo");
    expect(texto).not.toContain("Acima da faixa");
    expect(texto).not.toContain("Sem nenhum estímulo");
    expect(texto).not.toContain("Recorde pessoal");
  });

  it("junta lista com vírgula e 'e', não com vírgula solta", () => {
    const texto = leituraDeterministica(
      resumo({
        estagnacoes: [
          { exercicio: "Leg press", semanas_sem_progresso: 4 },
          { exercicio: "Rosca concentrada", semanas_sem_progresso: 4 },
        ],
      }),
      "pt-BR",
    );
    expect(texto).toContain("Leg press (há 4 semanas) e Rosca concentrada (há 4 semanas)");
  });

  it("usa singular de semana quando é uma só", () => {
    const texto = leituraDeterministica(
      resumo({ estagnacoes: [{ exercicio: "Remada", semanas_sem_progresso: 1 }] }),
      "pt-BR",
    );
    expect(texto).toContain("(há 1 semana)");
    expect(texto).not.toContain("(há 1 semanas)");
  });

  it("cita volume acima e abaixo da faixa com a contagem de séries", () => {
    const texto = leituraDeterministica(
      resumo({
        volume_por_grupo_muscular: [
          { grupo_muscular: "Costas", series_valendo: 23, volume: 15685, posicao_na_faixa: "acima" },
          { grupo_muscular: "Ombro", series_valendo: 9, volume: 5520, posicao_na_faixa: "abaixo" },
          { grupo_muscular: "Peito", series_valendo: 14, volume: 6584, posicao_na_faixa: "dentro" },
        ],
      }),
      "pt-BR",
    );
    expect(texto).toContain("Acima da faixa de referência de séries: Costas (23)");
    expect(texto).toContain("Abaixo da faixa: Ombro (9)");
    expect(texto).not.toContain("Peito");
  });

  it("compara a frequência com a média quando ela existe, e omite quando não", () => {
    expect(
      leituraDeterministica(
        resumo({
          frequencia: {
            treinos_semana_atual: 5,
            media_semanas_anteriores: 3.5,
            grupos_sem_estimulo: [],
          },
        }),
        "pt-BR",
      ),
    ).toContain("5 treinos na semana, contra média de 3,5");

    expect(leituraDeterministica(resumo(), "pt-BR")).toContain("Foram 5 treinos na semana.");
  });

  // Lição da PR #184: número com separador decimal errado em pt-BR.
  it("formata número na convenção do idioma", () => {
    const dados = resumo({ tendencia_e1rm: [e1rm("Supino", 12.5)] });
    expect(leituraDeterministica(dados, "pt-BR")).toContain("+12,5%");
    expect(leituraDeterministica(dados, "en")).toContain("+12.5%");
    expect(leituraDeterministica(dados, "es")).toContain("+12,5%");
  });

  it("responde nos três idiomas", () => {
    const dados = resumo({ estagnacoes: [{ exercicio: "Leg press", semanas_sem_progresso: 4 }] });
    expect(leituraDeterministica(dados, "pt-BR")).toContain("Parados sem novo máximo");
    expect(leituraDeterministica(dados, "en")).toContain("Stalled with no new max");
    expect(leituraDeterministica(dados, "es")).toContain("Estancados sin nuevo máximo");
  });

  // Não é prescrição — PRD §5 proíbe plano gerado automaticamente, e o §11
  // põe a prescrição na mão do humano. Regra não atravessa essa linha.
  it("não prescreve: nenhum verbo de comando no texto", () => {
    const texto = leituraDeterministica(
      resumo({
        tendencia_e1rm: [e1rm("Supino fechado", -29.8)],
        estagnacoes: [{ exercicio: "Leg press", semanas_sem_progresso: 4 }],
        volume_por_grupo_muscular: [
          { grupo_muscular: "Ombro", series_valendo: 9, volume: 5520, posicao_na_faixa: "abaixo" },
        ],
      }),
      "pt-BR",
    );
    for (const proibido of ["aumente", "reduza", "troque", "adicione", "faça", "deveria"]) {
      expect(texto.toLowerCase()).not.toContain(proibido);
    }
  });

  it("quebra em parágrafos, não em uma linha por fato", () => {
    const texto = leituraDeterministica(
      resumo({
        tendencia_e1rm: [e1rm("Supino", 12)],
        volume_por_grupo_muscular: [
          { grupo_muscular: "Costas", series_valendo: 23, volume: 15685, posicao_na_faixa: "acima" },
        ],
      }),
      "pt-BR",
    );
    expect(texto).toContain("\n\n");
    // O extrato antigo tinha uma quebra simples por fato; esta não tem.
    expect(texto.replace(/\n\n/g, "")).not.toContain("\n");
  });
});
