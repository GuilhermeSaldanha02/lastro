# 07 — Ajustes, Anilhas, Modelos (incl. folhas `@modal`)

## `/ajustes`

- [ ] **AJU-01** Acessar `/ajustes` logado. Esperado: atalho pro perfil (nome + "Editar perfil"), links "Coach"/"Modelos"/"Anilhas", botão "Sair", `ExcluirConta`.
- [ ] **AJU-02** Clicar "Sair" (Server Action). Esperado: sessão encerra, redireciona pra fora de rota privada (checar pra onde exatamente).
- [ ] **AJU-03** `ExcluirConta` — clicar "Excluir conta". Esperado: confirmação inline com o texto exato listando perfil/treinos/séries/modelos/anilhas, "Cancelar" funciona sem excluir nada.
- [ ] **AJU-04** **Não executar a exclusão de conta de verdade no usuário de teste principal** (ele ainda tem trabalho pela frente na auditoria) — se quiser provar o caminho feliz de exclusão, criar um 2º usuário de teste isolado só pra esse item, seedado com o mínimo, e confirmar a limpeza em cascata por contagem depois.

## `/ajustes/anilhas` (rota completa) e folha `(.)ajustes/anilhas`

- [ ] **AJU-05** Navegar via `Link` (clique) a partir de `/ajustes` → "Anilhas". Esperado: abre como **folha** (`role="dialog"`), não navegação de página cheia.
- [ ] **AJU-06** Acessar `/ajustes/anilhas` direto pela URL (ou F5 dentro da folha). Esperado: renderiza como página completa normal (sem folha) — intercepting route só ativa em navegação client-side.
- [ ] **AJU-07** Peso da barra: digitar negativo. Esperado: `min=0` do input bloqueia nativamente ou a validação de "Salvar" pega — documentar qual dos dois.
- [ ] **AJU-08** Adicionar anilha com peso 0 ou negativo. Esperado: erro "Peso da anilha precisa ser um número positivo."
- [ ] **AJU-09** Adicionar anilha com peso que já existe na lista. Esperado: campo limpa silenciosamente, sem duplicar, sem mensagem de erro (comportamento documentado como intencional — confirmar que é isso mesmo que acontece).
- [ ] **AJU-10** Ativar modo de edição das anilhas, remover uma (lixeira, sem confirmação). Esperado: some da grade local imediatamente, mas **não persiste** até clicar "Salvar configuração" — recarregar sem salvar deve trazer a anilha de volta.
- [ ] **AJU-11** Clicar "Salvar configuração" com peso da barra vazio/inválido. Esperado: erro "Peso da barra precisa ser um número positivo.", não salva.
- [ ] **AJU-12** Salvar configuração válida. Esperado: "Configuração salva." (`aria-live="polite"` — checar que um leitor de tela seria notificado, ou ao menos que o texto aparece sem precisar de foco).
- [ ] **AJU-13** Calculadora: peso alvo que bate exato com a barra + combinação de anilhas. Esperado: "De cada lado: ... Total: {alvo} kg" sem a nota de aproximação.
- [ ] **AJU-14** Calculadora: peso alvo que não bate exato. Esperado: mesma saída + nota "(mais próximo do alvo com as anilhas que você tem)".
- [ ] **AJU-15** Calculadora: peso alvo igual ao peso da barra (sem anilha necessária). Esperado: "Só a barra, sem anilha de cada lado."
- [ ] **AJU-16** Calculadora: peso alvo menor que o peso da barra. Esperado: documentar o comportamento real (não há trava óbvia no código mapeado — pode gerar resultado estranho, é candidato a achado se ficar visivelmente errado).

## `/ajustes/modelos`, `/ajustes/modelos/novo` e folha

- [ ] **AJU-17** `/ajustes/modelos` vazio (sem modelo criado ainda pro usuário de teste). Esperado: "Nenhum modelo criado ainda."
- [ ] **AJU-18** Criar modelo via "+ Criar modelo" (folha, `naFolha=true`): passo 1 grupo muscular (chip), passo 2 lista de exercícios (checkbox) + nome. Submeter sem nome. Esperado: "Dê um nome ao modelo."
- [ ] **AJU-19** Submeter sem nenhum exercício marcado. Esperado: "Escolha pelo menos um exercício."
- [ ] **AJU-20** Criar modelo válido dentro da folha. Esperado: ao salvar, fecha com `router.back()` (não `push` — checar que não empilha uma rota nova; voltar do navegador depois não deveria cair de novo na folha de criação, ver `DECISIONS.md` 2026-08-16 H1).
- [ ] **AJU-21** Repetir AJU-18/19/20 acessando `/ajustes/modelos/novo` **direto pela URL** (fora da folha, `naFolha=false`). Esperado: ao salvar, `router.push("/ajustes/modelos")` em vez de `back()`.
- [ ] **AJU-22** Modo de edição em `/ajustes/modelos`, excluir um modelo. Esperado: confirmação com nome do modelo no texto, "os treinos já registrados a partir dela não são afetados" — confirmar que treinos antigos continuam intactos depois.

## Folhas em geral (`Folha`)

- [ ] **AJU-23** Abrir qualquer folha, clicar no fundo (fora do conteúdo). Esperado: fecha (`router.back()`).
- [ ] **AJU-24** Abrir folha, tecla `Escape`. Esperado: fecha.
- [ ] **AJU-25** Abrir folha, arrastar pra baixo além do limiar (~96px). Esperado: fecha. Arrastar menos que isso. Esperado: volta pro lugar, não fecha.
