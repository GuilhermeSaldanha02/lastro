/**
 * Grupos que quase ninguém treina direto — só entram em
 * `grupos_sem_estimulo` para quem já os treinou alguma vez (decisão do
 * dono, 2026-09-23, ao criar o antebraço no catálogo). Chave do BANCO
 * (`grupo_muscular.id`): quem carrega o catálogo marca `grupoAcessorio`
 * antes de traduzir o nome do grupo.
 */
export const GRUPOS_ACESSORIOS: ReadonlySet<string> = new Set(["antebraco"]);

export function ehGrupoAcessorio(grupoId: string): boolean {
  return GRUPOS_ACESSORIOS.has(grupoId);
}
