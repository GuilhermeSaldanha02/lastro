import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encontrarTextosSemI18n } from "./verificar-textos-i18n.mjs";

const CAMINHO = "src/components/fixture.tsx";

describe("encontrarTextosSemI18n", () => {
  it("reporta JSXText e atributo visível", () => {
    assert.deepEqual(encontrarTextosSemI18n('<button title="Salvar">Olá</button>', CAMINHO), [
      `${CAMINHO}:1: Salvar`,
      `${CAMINHO}:1: Olá`,
    ]);
  });

  it("aceita atributo booleano", () => {
    assert.deepEqual(encontrarTextosSemI18n("<input disabled />", CAMINHO), []);
  });

  it("reporta strings, templates e ambos os ramos de ternário visíveis", () => {
    const codigo = '<p>{"Pronto"}{`Olá ${nome} mundo`}{ok ? "Continuar" : "Aguarde"}</p>';

    assert.deepEqual(encontrarTextosSemI18n(codigo, CAMINHO), [
      `${CAMINHO}:1: Pronto`,
      `${CAMINHO}:1: Olá`,
      `${CAMINHO}:1: mundo`,
      `${CAMINHO}:1: Continuar`,
      `${CAMINHO}:1: Aguarde`,
    ]);
  });

  it("ignora strings, templates e ternários em className e href", () => {
    const codigos = [
      '<a className="ativo" href="/treino">Link</a>',
      '<a className={`status-${ok}`} href={`/treino/${id}`}>Link</a>',
      '<a className={ok ? "ativo" : "inativo"} href={ok ? "/treino" : "/inicio"}>Link</a>',
    ];

    for (const codigo of codigos) {
      assert.deepEqual(encontrarTextosSemI18n(codigo, CAMINHO), [`${CAMINHO}:1: Link`]);
    }
  });

  it("ignora conteúdo dentro de t", () => {
    const codigo = '<>{t(<span title="Título interno">Texto interno</span>)}</>';

    assert.deepEqual(encontrarTextosSemI18n(codigo, CAMINHO), []);
  });
});
