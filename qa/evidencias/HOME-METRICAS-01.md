# HOME-METRICAS-01 — 2026-10-02

Escopo: quadro da Home, abas Check-in/Volume/Séries/Grupos. Branch `feat/home-checkin-metricas`, base `baa8193`.

## Reprodução

1. `npx vite --config vite.home.config.mts`
2. `node scripts/qa-home-metricas.mjs`

Bancada importa componentes e CSS reais. Apenas dados sintéticos claramente rotulados; backend do check-in substituído por stub. Nenhuma conta, `.env` ou banco de produção. PNGs regeneráveis ignorados pelo Git em `qa/evidencias/home-*.png`.

## Evidências

- **ALEGADO pelo implementador:** 1.045 testes/95 arquivos, build, tsc, i18n; lint sem erros, 19 avisos anteriores fora dos arquivos alterados.
- **PASSOU em revisão independente (`revisao_home`):** script visual reexecutado com saída 0; screenshots check-in, volume, grupos e todos os grupos a 320px/espanhol inspecionados. Nenhum achado substantivo restante.
- Revisão encontrou contagem de grupos incorreta ao trocar para volume zero e datas desalinhadas em histórico de duas sessões. Ambos corrigidos e cobertos na bancada.
- Check-in inicialmente selecionado e quatro respostas; abas por teclado; folha Editar abre/fecha; grupos alternam vista/métrica; 10/17 séries = 58,8%; sem carga mantém contagem dos grupos; gráficos vazios não inventam dados; datas alinhadas; idiomas PT/EN/ES e temas ouro/branco-ouro, sem overflow/colisão a 320px.
- A primeira captura com todos os músculos colidia. Fonte geométrica ampliada e entrelinha ajustada; captura final e asserção de colisão passaram.

## Limites

Persistência remota e autenticação não exercitadas nesta bancada. Carregadores/registro offline sem mudança; testes existentes verdes. Deploy não executado nem solicitado para esta entrega. Confirmar no aparelho real após publicação autorizada.

## Ajuste após avaliação do dono
Cabeçalho de Grupos compacto; largura do mapa limitada; canvas reduzido para poucos grupos, mantendo espaço com muitos. Bancada completa e TypeScript passaram novamente; 7 testes de métricas verdes e lint restrito sem erros. Revisor independente inspecionou diff e capturas atualizadas sem cortes, colisões ou outros achados.
