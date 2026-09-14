"use client";

// lastro · A escolha do tipo de conta depois do primeiro login pelo Google
// (PRD §11, emenda 2026-09-13).
//
// Mesma cápsula USUÁRIO / PERSONAL do cadastro por e-mail, e a mesma linha
// de consequência embaixo: é a mesma decisão, só chega por outra porta.
// Com PERSONAL, CREF e WhatsApp aparecem e são obrigatórios — o botão só
// libera com os dois válidos. A validação que vale é a do banco
// (`escolher_tipo_conta`); esta é cortesia.
import { useState } from "react";
import { escolherTipoConta } from "@/lib/dados/personal-acoes";
import { crefValido, AVISO_CREF_NAO_VERIFICADO } from "@/lib/texto/cref";
import DicaInfo from "./dica-info";

export default function EscolhaTipoConta() {
  const [tipo, setTipo] = useState<"aluno" | "personal">("aluno");
  const [cref, setCref] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function continuar() {
    setErro(null);
    setEnviando(true);
    // Sucesso não volta: a ação redireciona para a casa da conta.
    const resultado = await escolherTipoConta(tipo, cref, telefone);
    setEnviando(false);
    if (resultado && !resultado.ok) setErro(resultado.erro);
  }

  const personal = tipo === "personal";
  const crefIncompleto = cref.trim() !== "" && !crefValido(cref);
  const bloqueado = enviando || (personal && (!crefValido(cref) || telefone.trim() === ""));

  return (
    <section className="card-obsidian">
      <span className="card-obsidian__titulo">Que conta é esta?</span>
      <p className="campo__nota">
        A escolha é feita uma vez e não muda depois.
      </p>

      <div className="seletor-conta" role="radiogroup" aria-label="Tipo de conta">
        {(["aluno", "personal"] as const).map((opcao) => (
          <button
            key={opcao}
            type="button"
            role="radio"
            aria-checked={tipo === opcao}
            className={`seletor-conta__opcao${tipo === opcao ? " seletor-conta__opcao--ativa" : ""}`}
            onClick={() => setTipo(opcao)}
            disabled={enviando}
          >
            {opcao === "aluno" ? "USUÁRIO" : "PERSONAL"}
          </button>
        ))}
      </div>

      <p className="seletor-conta__nota">
        {personal
          ? "Abre na fila de alunos. Seu próprio treino fica na mesma conta, a um toque em Ajustes."
          : "Registra seus treinos e recebe a análise semanal."}
      </p>

      {personal && (
        <>
          <div className="campo">
            <div className="campo__rotulo-linha">
              <label className="campo__rotulo" htmlFor="cref_escolha">
                CREF
              </label>
              <DicaInfo titulo="CREF">{AVISO_CREF_NAO_VERIFICADO}</DicaInfo>
            </div>
            <input
              id="cref_escolha"
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
                Formato esperado: 123456-G/PB — seis dígitos, categoria G ou
                P, e a UF.
              </p>
            )}
          </div>

          <div className="campo">
            <label className="campo__rotulo" htmlFor="telefone_escolha">
              Seu WhatsApp, com DDD
            </label>
            <input
              id="telefone_escolha"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="83 99999-8888"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
        </>
      )}

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <button type="button" className="botao-primario" onClick={continuar} disabled={bloqueado}>
        {enviando ? "Salvando…" : "Continuar"}
      </button>
    </section>
  );
}
