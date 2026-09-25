# CT-01 — Catálogo

**Resultado: REPROVADO PARCIAL** (busca e filtros OK; preview 3D não existe)

- `/catalogo` carrega 218 exercícios agrupados por músculo (ex.: Abdômen 23, Antebraço 5, Bíceps 20).
- Campo de busca "Buscar exercício ou músculo…" presente e clicável.
- Filtros de grupo muscular (tablist com 12 botões: Todos, Abdômen, Antebraço, Bíceps, Costas, Glúteos, Ombro, Panturrilha, Peito, Posterior de coxa, Quadríceps, Tríceps) funcionam — clique em "Peito" atualizou a URL para `?grupo=peito` e filtrou a lista.
- Abertos 2 exercícios distintos ("Abdominal canivete" e "Rosca 21"): em ambos a área de mídia mostra apenas um ÍCONE ESTÁTICO de barra + nome do exercício em texto — NÃO há preview 3D nem canvas/model-viewer. Confirmado também por busca no código-fonte do repo (sem referências a "canvas", "three", "model-viewer" em app/components) e por network requests (nenhum .glb/.gltf carregado).
- Critério "preview 3D de algum exercício abre" NÃO se confirma na produção atual.

Evidência: CT-01-catalogo.png, CT-01-exercicio-detalhe.png, CT-01-exercicio2.png
