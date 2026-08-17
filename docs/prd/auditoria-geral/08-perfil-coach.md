# 08 — Perfil e Coach

## `/perfil` e folha `(.)perfil`

- [ ] **PERF-01** Acessar `/perfil` via `Link` a partir de `/ajustes`. Esperado: abre como folha, avatar + nome (nome **não editável**, só leitura).
- [ ] **PERF-02** Botão "Trocar foto" abre seletor de arquivo (input file oculto, `accept="image/jpeg,image/png"`).
- [ ] **PERF-03** Selecionar arquivo de tipo inválido (ex.: `.pdf` ou `.gif`, se der pra simular upload via ferramenta). Esperado: erro de `validarArquivoAvatar` mostrado, **sem** disparar upload de rede (checar aba de rede — nenhuma requisição de storage).
- [ ] **PERF-04** Selecionar imagem válida. Esperado: botão vira "Enviando…" `disabled`, depois avatar atualiza na tela com a nova URL, sem precisar recarregar.
- [ ] **PERF-05** Simular falha do upload (se possível forçar, ex. arquivo válido mas por acaso a rede falha) — senão documentar como não testável nesta rodada. Esperado, se testável: mensagem de erro do `resultado.erro`, avatar não muda.
- [ ] **PERF-06** Após um erro de arquivo (PERF-03), selecionar o **mesmo arquivo inválido de novo**. Esperado: dispara a validação de novo (o código reseta `value=""` do input pra permitir reselecionar o mesmo arquivo) — não fica "travado" achando que nada mudou.
- [ ] **PERF-07** Acessar `/perfil` direto pela URL (fora da folha). Esperado: página completa normal, sem "Entre para editar seu perfil" (usuário está logado).
- [ ] **PERF-08** Deslogar e acessar `/perfil`. Esperado: `<p className="vazio">Entre para editar seu perfil.</p>` (não redireciona — `/perfil` não está na lista de rotas privadas do proxy).

## `/coach`

- [ ] **COACH-01** Acessar `/coach` pela primeira vez na sessão. Esperado: histórico vazio, mensagem inicial "Pergunte o que quiser sobre treino. Execução de exercício fica no catálogo — é escrita por pessoa, não por IA."
- [ ] **COACH-02** Digitar pergunta e enviar. Esperado: fala do "dono" aparece otimisticamente antes da resposta; bolha "escrevendo…" aparece enquanto `carregando`.
- [ ] **COACH-03** Resposta chega com sucesso (200). Esperado: fala do "coach" aparece, rola automaticamente pro fim da conversa.
- [ ] **COACH-04** Tentar enviar com campo vazio (só espaços). Esperado: botão de enviar `disabled` (trim vazio), nenhuma requisição disparada.
- [ ] **COACH-05** Digitar pergunta maior que `LIMITE_PERGUNTA` caracteres (checar o valor real no código/UI, ex. colar texto longo). Esperado: `maxLength` do campo bloqueia digitação além do limite, ou se passar, backend retorna 400 "Pergunta vazia ou acima de {LIMITE_PERGUNTA} caracteres."
- [ ] **COACH-06** Deslogar e forçar `POST /api/coach` (ou recarregar `/coach` sem sessão e tentar enviar). Esperado: 401, UI mostra "Sessão expirada. Faça login novamente."
- [ ] **COACH-07** Recarregar `/coach` (F5) depois de ter conversa na tela. Esperado: histórico **limpa** (não persiste — comportamento intencional, documentar que não é bug).
- [ ] **COACH-08** Enviar 2-3 perguntas seguidas rapidamente (antes da resposta anterior chegar). Esperado: botão de enviar fica `disabled` enquanto `carregando`, impedindo múltiplas em voo — checar aba de rede pra confirmar que não há requisições sobrepostas.
