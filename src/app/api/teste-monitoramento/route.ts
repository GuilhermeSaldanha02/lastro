// TEMPORÁRIO (PU-07): prova a gravação de `erro_app` em produção. Removido na PR seguinte.
export function GET() {
  throw new Error("teste-monitoramento PU-07 (proposital)");
}
