import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock mínimo do @supabase/ssr: cada teste decide se `getUser()` volta
// usuário ou nulo, e captura o `setAll` de cookies para confirmar que
// um cookie sujo (ex.: refresh token inválido) chega no redirect.
const getUserMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    opts: { cookies: { setAll: (c: unknown[]) => void } },
  ) => {
    // Simula o SDK "limpando" um cookie de sessão morta, do jeito que o
    // comentário original do proxy.ts descreve.
    opts.cookies.setAll([
      { name: "sb-teste-auth-token", value: "", options: {} },
    ]);
    return { auth: { getUser: getUserMock } };
  },
}));

async function chamarProxy(caminho: string) {
  const { proxy } = await import("./proxy");
  const req = new NextRequest(new URL(caminho, "http://localhost:3002"));
  return proxy(req);
}

describe("proxy — PREFIXOS_PRIVADOS", () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it.each([
    "/perfil",
    "/ajustes",
    "/ajustes/modelos",
    "/ajustes/modelos/novo",
    "/ajustes/anilhas",
    "/treino",
    "/analise",
    "/catalogo",
    "/coach",
  ])("redireciona %s para /login sem sessão", async (caminho) => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const resposta = await chamarProxy(caminho);
    expect(resposta.status).toBe(307);
    const destino = new URL(resposta.headers.get("location")!);
    expect(destino.pathname).toBe("/login");
    expect(destino.searchParams.get("proximo")).toBe(caminho);
  });

  it("carrega os cookies que o SDK atualizou no redirect", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const resposta = await chamarProxy("/ajustes");
    // O cookie que o mock "limpou" via setAll precisa sobreviver ao
    // redirect — é o que impede o navegador repetir o mesmo erro de
    // refresh indefinidamente (comentário original do proxy.ts).
    expect(resposta.cookies.get("sb-teste-auth-token")).toBeDefined();
  });

  it("passa direto, sem redirect, quando há usuário autenticado", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const resposta = await chamarProxy("/ajustes/modelos");
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("location")).toBeNull();
  });

  it("não redireciona rota pública mesmo sem sessão", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const resposta = await chamarProxy("/login");
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("location")).toBeNull();
  });
});
