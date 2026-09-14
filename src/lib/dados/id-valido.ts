// lastro · id de URL é texto digitado por qualquer um.
//
// Achado B2 (QA, 2026-09-13): `/treino/abc`, `/catalogo/abc`,
// `/ajustes/relatorios/parecer/abc` e `/api/parecer/abc/pdf` respondiam 500.
// O id ia direto para o Postgres, que recusa texto que não é UUID com erro
// (`invalid input syntax for type uuid`) em vez de "nenhuma linha" — e a
// função de busca transformava esse erro em exceção. UUID que não existe já
// dava 404. As buscas por id checam o formato antes e respondem "não
// encontrado", que é a verdade para quem digitou o endereço.
//
// Módulo próprio, sem "use server": arquivo de Server Functions só pode
// exportar funções assíncronas.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `true` quando o texto tem o formato de um UUID (qualquer versão). */
export function ehUuid(valor: string): boolean {
  return UUID.test(valor);
}
