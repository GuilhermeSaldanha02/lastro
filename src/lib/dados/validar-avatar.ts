// lastro · validação pura do arquivo de foto de perfil — sem dependência
// de Next.js/Supabase, pra poder ser testada isoladamente (`vitest.config.ts`
// não resolve o alias `@/`, então qualquer import de `next/headers` no
// mesmo arquivo quebraria o teste) e importada tanto pelo componente
// cliente (feedback imediato) quanto pela ação de servidor (defesa contra
// cliente adulterado).
const TIPOS_ACEITOS = new Set(["image/jpeg", "image/png"]);
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

export type ValidacaoAvatar = { ok: true } | { ok: false; erro: string };

export function validarArquivoAvatar(arquivo: File): ValidacaoAvatar {
  if (!TIPOS_ACEITOS.has(arquivo.type)) {
    return { ok: false, erro: "Envie uma foto em JPEG ou PNG." };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { ok: false, erro: "A foto precisa ter até 5 MB." };
  }
  return { ok: true };
}
