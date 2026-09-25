import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSOS_ALUNO, PASSOS_PERSONAL } from "./conteudo";
import { t } from "@/lib/texto/i18n";

const redirect = vi.fn((destino: string) => {
  throw new Error(`REDIRECT:${destino}`);
});
const cookieGet = vi.fn();

vi.mock("next/navigation", () => ({ redirect: (d: string) => redirect(d) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));

import { exigirOnboarding } from "@/lib/dados/casca";
import type { Perfil } from "@/lib/dados/perfil";

const perfil = (onboardingConcluido: boolean) => ({ onboardingConcluido }) as Perfil;

beforeEach(() => {
  redirect.mockClear();
  cookieGet.mockReset();
});

describe("exigirOnboarding (PU-08)", () => {
  it("manda a conta nova para /onboarding", async () => {
    cookieGet.mockReturnValue(undefined);
    await expect(exigirOnboarding(perfil(false))).rejects.toThrow("REDIRECT:/onboarding");
  });

  it("não faz nada com quem já concluiu", async () => {
    await exigirOnboarding(perfil(true));
    expect(redirect).not.toHaveBeenCalled();
  });

  it("não faz nada sem perfil (o login cuida)", async () => {
    await exigirOnboarding(null);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("respeita o cookie de reserva quando a gravação falhou", async () => {
    cookieGet.mockReturnValue({ value: "1" });
    await exigirOnboarding(perfil(false));
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("conteúdo do guia", () => {
  const textos = [...PASSOS_ALUNO, ...PASSOS_PERSONAL].flatMap((p) => [p.titulo, ...p.paragrafos]);

  it("todo texto tem tradução em inglês e espanhol (senão a tela mistura idiomas)", () => {
    for (const texto of textos) {
      expect(t(texto, "en"), `sem tradução en: ${texto}`).not.toBe(texto);
      expect(t(texto, "es"), `sem tradução es: ${texto}`).not.toBe(texto);
    }
  });

  it("ids dos passos são únicos", () => {
    const ids = [...PASSOS_ALUNO, ...PASSOS_PERSONAL].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
