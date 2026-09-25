import { beforeEach, describe, expect, it, vi } from "vitest";
import { PASSOS_ALUNO, PASSOS_PERSONAL } from "./conteudo";
import { SECOES_GUIA, SECOES_GUIA_PERSONAL } from "./manual";
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
  const manual = [...SECOES_GUIA, ...SECOES_GUIA_PERSONAL];
  const textos = [
    ...[...PASSOS_ALUNO, ...PASSOS_PERSONAL].flatMap((p) => [p.titulo, ...p.paragrafos]),
    ...manual.flatMap((p) => [p.titulo, ...p.paragrafos, ...(p.link ? [p.link.rotulo] : [])]),
  ];

  it("todo texto tem tradução em inglês e espanhol (senão a tela mistura idiomas)", () => {
    for (const texto of textos) {
      expect(t(texto, "en"), `sem tradução en: ${texto}`).not.toBe(texto);
      // "Abrir X" é igual em espanhol quando X não muda (Abrir Coach, Abrir Perfil).
      if (!texto.startsWith("Abrir ")) {
        expect(t(texto, "es"), `sem tradução es: ${texto}`).not.toBe(texto);
      }
    }
  });

  it("ids dos passos e das seções do manual são únicos", () => {
    // Únicos DENTRO de cada lista: o índice do manual usa o id como âncora.
    for (const lista of [[...PASSOS_ALUNO, ...PASSOS_PERSONAL], manual]) {
      const ids = lista.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("todo link do manual aponta para uma rota do app", () => {
    for (const secao of manual) {
      if (secao.link) expect(secao.link.href, secao.id).toMatch(/^\/[a-z]/);
    }
  });
});
