# Bancada visual

Renderiza peças reais do app **fora do Next** — sem servidor, sem banco,
sem `.env.local`. Nasceu em 2026-09-03 porque a pergunta "o visual do
parecer incomoda?" não tinha como ser respondida no abstrato, e subir o
app inteiro exigia credencial que a sessão não tinha.

```bash
npx vite --config vite.preview.config.mts
# http://localhost:4321/?cena=parecer-prosa
```

Cenas: `parecer-prosa`, `parecer-fallback`, `acoes-rascunho`,
`acoes-salvo`. Sem `?cena=`, mostra todas.

## O que ela garante, e o que não

**Garante:** os componentes são os reais (`@/components/...`), o CSS é o
real (`globals.css` → `tokens.css` + `sistema.css`), e as três famílias
são as mesmas que o `next/font` resolve no `layout.tsx`. `.tela` não tem
padding e nenhuma media query toca `.evidencia`, então **a largura medida
aqui é a largura do app** — foi assim que se mediu o corpo do bloco de
evidência espremido a 73px, que virou o commit `7e38a4d`.

**Não garante:** `CabecalhoPro` e `AbaInferior` não entram; Server
Actions e `next/navigation` são stubs (`stubs/`) que só logam no console.
Nada aqui substitui a verificação no app real — mas pega layout e
tipografia antes de gastar um deploy.

## Dado

`dados.ts` traz a evidência e o texto de fallback **reais** do parecer
`4dc6bcbf…` (conta do dono). A única parte sintética é
`textoProsaExemplo`, marcada como tal no arquivo: a Gemini deu 503 na
semana e não existe prosa real no banco para exercitar o veredito.
