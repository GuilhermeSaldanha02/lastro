---
name: padrao-engenharia
description: Carregar ao escrever, corrigir ou refatorar código neste projeto, e ao decidir o tamanho de uma fase de trabalho. Define estilo, comentários, tratamento de dado faltante e quando parar para perguntar.
---

# Engenharia

- **E1 — Estilo segue o projeto.** Formatter/linter bloqueantes no pré-commit. Economia de token vem de contexto enxuto, não de código espremido.
- **E2 — Comentários com propósito.** Permitido: restrição não óbvia, workaround com motivo, invariante. Proibido: narração do que a linha faz.
- **E3 — Conteúdo nunca inventado.** Dado de negócio faltante = `TODO` visível + pergunta. Nunca preencher lacuna com ficção plausível. **Neste projeto isso é especialmente sério:** dica de execução de exercício e faixa de referência de volume são assunto de saúde e exigem fonte primária, não memória.
- **E4 — Fases pequenas, sem covardia macro.** Não emendar tudo numa tacada. Mas se o pedido é estrutural, a fase 1 é desenhar a estrutura **inteira** e só depois fatiar. Fatiar pedido global em retoques que nunca somam estrutura é falha, não prudência.
- **E5 — Regra que vale 100% das vezes vira hook.** Texto é conselho (ignorável sob pressão de contexto); hook é determinístico.
- **E6 — Corrigir cedo e pouco.** Mesmo erro 2 vezes → **não corrija a 3ª**: registre a lição no `KNOWLEDGE.md` §5, limpe a sessão e reescreva o prompt incorporando o aprendizado.
- **E7 — Interpretação na medida do pedido.** Não interpretar sistematicamente para baixo. Ambiguidade entre "retoque" e "reestruturar" → **perguntar**.
- **E8 — Review é alegação, não verdade.** Verificar recomendação de reviewer antes de aplicar. Nem aceitar cego, nem descartar sem checar.
- **E9 — Verificar no motor do navegador do público.** Propriedade exclusiva de um motor passa despercebida na leitura de código.
- **E10 — Fonte única para comportamento repetido.** Helper central, tokens centralizados em `DESIGN.md`. Nada montado à mão em 6 arquivos.
- **E11 — Rejeitado é deletado**, não comentado "por via das dúvidas". O git guarda a história.
- **E12 — Doc vigente vence memória de treino.** API, framework ou lib versionada: consultar a documentação atual (MCP de docs, ex.: Context7) **antes** de escrever. Assinatura que mudou depois do corte de treino não dá erro de leitura — dá bug plausível. Vale especialmente para `@google/genai` e para o SDK do Supabase.

**Spikes com timebox** e decisão final `adotar` / `adaptar` / `descartar`. Pesquisa sem limite não vira feature automaticamente.

## Invariantes de código deste projeto

Escreveu código que viola uma destas? Pare — a spec está errada, mesmo que compile.

1. `@google/genai` só existe sob `src/app/api/`.
2. `src/lib/analise/` não importa rede, HTTP nem Supabase. É matemática pura.
3. Toda função de métrica filtra `tipo = valendo` antes de somar.
4. RIR ausente é ausência de informação, não RIR alto.
5. Gravar série não tem `await` de rede no caminho crítico.
6. Cor, espaçamento e fonte vêm de `DESIGN.md` — de lugar nenhum mais.
