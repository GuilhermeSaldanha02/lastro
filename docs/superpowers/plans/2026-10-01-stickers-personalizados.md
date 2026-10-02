# Stickers personalizados — plano de implementação

> Execução na sessão atual com subagent-driven-development, tarefas separadas por arquivo e revisão de integração. Escopo e nove direções visuais aprovados pelo dono em 2026-10-01.

**Objetivo:** compartilhar nove stickers com símbolo/nome oficiais e grupos principais efetivamente registrados, escolhidos em miniaturas.

**Arquitetura:** métricas calculam grupos apenas de séries valendo. Um renderizador SVG produz os nove modelos; a mesma imagem alimenta prévia e PNG. Mapa frontal/posterior identifica os mesmos grupos. Não altera banco nem lógica de registro offline.

**Stack:** React, TypeScript, SVG, Canvas somente para conversão de SVG em PNG, Vitest, Playwright para verificação local sem banco.

## Tarefas

- [x] Métricas (`src/lib/dados/metricas-treino.ts`, testes): reproduzir aquecimento contaminando foco; testar grupos únicos, desconhecidos, aquecimento isolado, braços separados, lista vazia; coletar IDs reais em `gruposMuscularesTreinados`, substituir classificações genéricas por nomes específicos, manter contrato de opções e duração. Não inferir músculos secundários nem grupo por nome de exercício.
- [x] Renderizador (`src/lib/stickers/`): implementar os nove modelos aprovados (números, lateral, minimalista, placa, bilhete, arco, etiqueta, editorial, anatômico). Exportar `MODELOS_STICKER` e `gerarSvgSticker(modelo, metricas, idioma, logoDataUrl, tema)`. Medidas em tokens dedicados; cores/fontes recebidas dos tokens CSS. Quebrar listas longas sem truncar grupos. Sem rede ou React neste módulo. Testar escape de XML, todos os modelos com marca, dimensões, plurais, grupos longos e regiões anatômicas.
- [x] Marca: conferir `public/logo-lastro.png`, preservar asset oficial fornecido e sua transparência; usar o mesmo asset em todos os modelos.
- [x] Integração (`src/components/relatorio-pos-treino.tsx`, estilos/tokens, i18n): remover desenhos separados HTML/Canvas; renderizar SVG convertido em URL tanto para miniaturas quanto prévia, gerar PNG com mesma proporção e sem espaços externos. Seletor acessível com nome e estado selecionado; salvar último modelo em localStorage com falhas toleradas. Desabilitar compartilhar enquanto prévia não estiver pronta; manter feedback/fallbacks existentes.
- [x] Verificação: testes focados antes/depois, `tsc`, suíte unitária, lint, i18n, build; verificação mobile local com dados sintéticos claramente de teste, sem tocar banco/conta do dono. Testar troca, persistência, exportação e títulos longos; guardar print/console/rede como ALEGADO.
- [x] Revisão independente: verificar requisitos, qualidade e regressões; corrigir achados. Atualizar manual, documentação/estado e commitar com `Agente: codex`. Não mergear/publicar sem decisão do dono.
