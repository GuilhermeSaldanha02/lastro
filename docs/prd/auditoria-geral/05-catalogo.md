# 05 — Catálogo, `/catalogo` e `/catalogo/[id]`

- [ ] **CAT-01** Acessar `/catalogo`. Esperado: exercícios agrupados por grupo muscular, ordem alfabética pt-BR.
- [ ] **CAT-02** Aviso de dicas faltantes no topo, se `semDica > 0`. Esperado: texto exato "{N} de {total} exercício(s) está(ão) sem dica. Elas são escritas e revisadas por pessoa, nunca geradas — por isso o campo fica vazio até você preencher." — conferir os números N/total batem com a contagem real.
- [ ] **CAT-03** Clicar num exercício sem dica. Esperado: ficha em `/catalogo/[id]` sem seção de dica (ou seção vazia — documentar o que realmente aparece), sem texto gerado.
- [ ] **CAT-04** Clicar num exercício com dica curada. Esperado: dica aparece na ficha.
- [ ] **CAT-05** Ficha de exercício com histórico (Supino reto com barra, tem 15 registros da seed). Esperado: lista mais-recente-primeiro, `reps × peso kg` batendo com o que foi seedado.
- [ ] **CAT-06** Ficha de exercício com recorde no histórico. Esperado: etiqueta de Recorde no item correto (o de maior peso na série "valendo"), calculado cronologicamente (não é sempre o mais recente).
- [ ] **CAT-07** Ficha de exercício **sem** nenhuma série valendo registrada ainda (escolher um do catálogo fora da seed). Esperado: `<p className="vazio">` "Nenhuma série valendo registrada ainda para {exercicio.nome}."
- [ ] **CAT-08** Clicar num item do histórico na ficha do exercício. Esperado: navega para `/treino/{treinoId}` correto (o treino daquele registro específico).
- [ ] **CAT-09** Rodapé fixo do catálogo. Esperado: texto "As dicas deste catálogo não substituem acompanhamento profissional. Dor, limitação ou lesão são assunto de fisioterapeuta ou médico." sempre visível.
- [ ] **CAT-10** Acessar `/catalogo/{uuid-inexistente}`. Esperado: `notFound()` → 404.
