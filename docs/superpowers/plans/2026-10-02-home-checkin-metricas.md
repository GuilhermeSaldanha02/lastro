# Home: check-in e métricas no mesmo quadro

**Objetivo:** aplicar a lista compacta aprovada, com abas Check-in, Volume, Séries e Grupos; mostrar distribuição muscular em corpo com setas e percentuais.

**Arquitetura:** manter carregadores/dados e registro offline existentes; compor o check-in como conteúdo sempre montado no seletor para preservar folha automática e histórico. Novos gráficos SVG acessíveis usam apenas registros reais; nenhuma inferência de saúde ou músculos secundários. Tokens de UI em tokens.css. Percentuais em função pura e testada: participação no total dos grupos da métrica selecionada, arredondamento a uma casa, zero sem divisão por zero.

**Direção autorizada:** tema atual claro/escuro, lista de quatro respostas legíveis com ícones pequenos; Check-in primeira aba e inicialmente selecionada. Volume: linha sem suavização artificial e pontos por sessão, detalhes selecionáveis; Séries: colunas proporcionais com valores, em ambos legenda separando total semanal e últimas sessões. Grupos: frente/costas selecionáveis, corpo central e chamadas em duas colunas, sem sobrepor rótulos; grupos fora da vista permanecem na distribuição e ficam acessíveis ao trocar a vista. Grupos desconhecidos aparecem em lista sem apontar região inventada.

- [x] Check-in: substituir barras por lista nome/resposta; modo embutido sem segundo card; preservar formulário/histórico e toda lógica de salvar.
- [x] Grupos: cálculo puro de percentuais com testes (zero, mistura de caixa, somatório, escolha séries/volume); SVG com chamadas e tabela acessível, anatomia reaproveitada dos stickers sem duplicar desenho.
- [x] Integração: mover CartaoCheckin para slot no seletor, primeira aba, teclado acessível; novos gráficos de volume/séries com datas e detalhes reais.
- [x] Validar tipos/testes/lint/i18n/build e bancada mobile 320/390px em claro/escuro com zero, um e vários treinos; revisão independente.
- [x] Atualizar manual, DESIGN, QA e PROGRESS; commit na branch da tarefa. Publicação desta mudança ainda não solicitada.
