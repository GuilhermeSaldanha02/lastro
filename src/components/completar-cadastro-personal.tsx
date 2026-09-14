"use client";

// lastro · O formulário que fecha a obrigatoriedade do CREF para conta de
// personal criada pelo Google (PRD §11, emenda de 2026-09-11).
//
// Client Component por um motivo só: o aviso de formato precisa aparecer
// enquanto a pessoa digita. A validação de verdade acontece no servidor,
// com a MESMA `crefValido` — o que está aqui é cortesia, não trava.
import { useState } from "react";
import { completarCadastroPersonal } from "@/lib/dados/personal-acoes";
import { crefValido, AVISO_CREF_NAO_VERIFICADO } from "@/lib/texto/cref";
import DicaInfo from "./dica-info";

export default function CompletarCadastroPersonal() {
  const [cref, setCref] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setErro(null);
    setEnviando(true);
    const resultado = await completarCadastroPersonal(cref, telefone);
    setEnviando(false);
    // Sucesso não volta: a ação redireciona para a fila. Só o erro chega.
    if (resultado && !resultado.ok) setErro(resultado.erro);
  }

  const crefIncompleto = cref.trim() !== "" && !crefValido(cref);

  return (
    <section className="card-obsidian">
      <div className="campo">
        <div className="campo__rotulo-linha">
          <label className="campo__rotulo" htmlFor="cref_completar">
            CREF
          </label>
          <DicaInfo titulo="CREF">{AVISO_CREF_NAO_VERIFICADO}</DicaInfo>
        </div>
        <input
          id="cref_completar"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="123456-G/PB"
          value={cref}
          onChange={(e) => setCref(e.target.value.toUpperCase())}
        />
        {crefIncompleto && (
          <p className="campo__nota campo__nota--alerta" role="status">
            Formato esperado: 123456-G/PB — seis dígitos, categoria G ou P, e
            a UF.
          </p>
        )}
      </div>

      <div className="campo">
        <label className="campo__rotulo" htmlFor="telefone_completar">
          Seu WhatsApp, com DDD
        </label>
        <input
          id="telefone_completar"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="83 99999-8888"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </div>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <button
        type="button"
        className="botao-primario"
        onClick={salvar}
        disabled={enviando || !crefValido(cref) || telefone.trim() === ""}
      >
        {enviando ? "Salvando…" : "Abrir minha fila"}
      </button>
    </section>
  );
}
