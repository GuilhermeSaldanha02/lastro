---
name: padrao-documentos
description: Carregar ao criar ou editar qualquer documento de contrato deste projeto (PRD, ADR, SDD, ARCHITECTURE, PROGRESS, KNOWLEDGE, DECISIONS, DESIGN, CLAUDE), ao encontrar conflito entre eles, ou quando alguém propuser mudança de escopo.
---

# Documentos

**Hierarquia de memória:** contexto da sessão = **RAM** (volátil) · `CLAUDE.md` = **cache** (sempre carregado, por isso mínimo) · `PROGRESS.md` = **estado de trabalho** · `KNOWLEDGE.md` + `DECISIONS.md` = **HD** (append-only, nunca perde, carrega por seção).

| Arquivo | Papel | Regras |
|---|---|---|
| `CLAUDE.md` | Cache | < 200 linhas. Estável. Sem histórico. Teste de poda por linha. Nunca duplicar valores de outro arquivo |
| `PRD.md` | Contrato de produto | Critérios verificáveis. Congela após aprovação; mudança = protocolo Scope Change |
| `ADR.md` | Contrato de decisões | Stack decidida + descartadas, fitness functions, metodologia. Decisão nova = entrada nova, **nunca reescrever antiga** |
| `SDD.md` | Contrato técnico | Specs autocontidas: nomeiam arquivos e interfaces, dizem o que está FORA, terminam com verificação end-to-end |
| `ARCHITECTURE.md` | Snapshot vivo | Estado **ATUAL**. Toda mudança estrutural o atualiza junto com o `DECISIONS.md` |
| `PROGRESS.md` | Estado de trabalho | Atualizar é **ação final obrigatória** de toda tarefa. Registra abordagens que falharam e por quê. > ~300 linhas → arquivar concluídos em `PROGRESS-archive.md` |
| `KNOWLEDGE.md` | **HD** | Append-only: escreve-se, nunca se apaga nem se resume. Glossário, pesquisa, achados técnicos, links, lições. Índice no topo; **carregue POR SEÇÃO**. Tema grande → `knowledge/<tema>.md` com ponteiro no índice |
| `DECISIONS.md` | **HD** | Append-only. Por entrada: o que mudou, por quê, alternativa descartada, impacto, como reverter |
| `DESIGN.md` | Contrato visual | Fonte **ÚNICA** dos tokens. Verificar autoconsistência do próprio arquivo a cada edição |

**Nenhum contrato serve de disco permanente** — todos congelam, podam ou arquivam por design. O disco permanente é o `KNOWLEDGE.md`.

## Protocolos

**Conflito entre PRD / ADR / SDD** → nunca escolher um lado sozinho. Apresentar **Opção 1** (seguir A), **Opção 2** (seguir B) e **Opção 3** (híbrida — quase sempre existe conciliação), com a consequência de cada uma. Aguardar decisão. Registrar em `DECISIONS.md` e atualizar o documento perdedor.

**Mudança de escopo** → classificar:
- Complementa o MVP = **ADIÇÃO** → avaliar impacto em PRD → ADR → SDD → PROGRESS **antes** de implementar.
- Muda a direção do produto = **VERSÃO NOVA** → tratar como novo bootstrap a partir do ADR.

Registrar em `DECISIONS.md` nos dois casos. **Nunca expandir em silêncio.**

## Estado deste projeto

`PRD.md` está **congelado** desde 2026-08-04. `SDD.md` ainda **não existe** — nasce na Fase 1. `ARCHITECTURE.md` descreve **intenção, não realidade**, enquanto trouxer a nota de que nada foi construído.
