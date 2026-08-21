"use client";

import { useSyncExternalStore } from "react";

interface TemaOpcao {
  id: string;
  nome: string;
  subtitulo: string;
  descricao: string;
  fundoPreview: string;
  cardPreview: string;
  acentoPreview: string;
  gradienteHero: string;
  tag: string;
  corTextoPreview: string;
}

const TEMAS: TemaOpcao[] = [
  {
    id: "ouro",
    nome: "Obsidian Ouro",
    subtitulo: "Spartan Gold",
    descricao: "Luxo espartano e assinatura clássica do LASTRO.",
    fundoPreview: "#07090D",
    cardPreview: "#0E1218",
    acentoPreview: "#D4AF37",
    gradienteHero: "linear-gradient(135deg, #E6C86E 0%, #D4AF37 50%, #A67C1E 100%)",
    tag: "Padrão",
    corTextoPreview: "#F8FAFC",
  },
  {
    id: "branco-ouro",
    nome: "Marfim & Ouro Imperial",
    subtitulo: "Light Luxury",
    descricao: "Modo claro refinado com superfícies de mármore e acento em ouro nobre.",
    fundoPreview: "#F6F7F9",
    cardPreview: "#FFFFFF",
    acentoPreview: "#B8860B",
    gradienteHero: "linear-gradient(135deg, #E6C86E 0%, #D4AF37 50%, #B8860B 100%)",
    tag: "Claro",
    corTextoPreview: "#0F172A",
  },
  {
    id: "areia",
    nome: "Duna Areia & Âmbar",
    subtitulo: "Sandstone Warmth",
    descricao: "Tons minerais de linho e areia do deserto em fundo carvão quente.",
    fundoPreview: "#090807",
    cardPreview: "#12100D",
    acentoPreview: "#D9C3A5",
    gradienteHero: "linear-gradient(135deg, #E8D3B8 0%, #D4BA95 50%, #B3956E 100%)",
    tag: "Orgânico",
    corTextoPreview: "#F8FAFC",
  },
  {
    id: "clean",
    nome: "Clean Monolith",
    subtitulo: "Pure Platinum",
    descricao: "Minimalismo brutalista de alto contraste com platina pura e ônix fosco.",
    fundoPreview: "#08090A",
    cardPreview: "#101214",
    acentoPreview: "#FFFFFF",
    gradienteHero: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 60%, #CBD5E1 100%)",
    tag: "Minimalista",
    corTextoPreview: "#F8FAFC",
  },
  {
    id: "petroleo",
    nome: "Slate Petróleo & Ouro Antigo",
    subtitulo: "Equinox Luxury",
    descricao: "Grafite petróleo profundo com detalhes em ouro antigo escovado.",
    fundoPreview: "#080D12",
    cardPreview: "#0E161F",
    acentoPreview: "#DFC19B",
    gradienteHero: "linear-gradient(135deg, #EBD5B9 0%, #C5A880 50%, #9C7E54 100%)",
    tag: "Exclusivo",
    corTextoPreview: "#F8FAFC",
  },
  {
    id: "moka",
    nome: "Café Moka & Caramelo",
    subtitulo: "Leica Craft",
    descricao: "Tons terrosos de espresso escuro e caramelo tostado.",
    fundoPreview: "#0D0B0A",
    cardPreview: "#171311",
    acentoPreview: "#E5A93C",
    gradienteHero: "linear-gradient(135deg, #FBD38D 0%, #E5A93C 50%, #B7791F 100%)",
    tag: "Quente",
    corTextoPreview: "#F8FAFC",
  },
  {
    id: "oliva",
    nome: "Oliva Tático",
    subtitulo: "Forest Stealth",
    descricao: "Verde sálvia militar sóbrio em grafite floresta.",
    fundoPreview: "#070908",
    cardPreview: "#0F1310",
    acentoPreview: "#84A98C",
    gradienteHero: "linear-gradient(135deg, #A3B18A 0%, #84A98C 50%, #588157 100%)",
    tag: "Stealth",
    corTextoPreview: "#F8FAFC",
  },
];

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("lastro_tema_mudou", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("lastro_tema_mudou", callback);
  };
}

function getSnapshot(): string {
  try {
    return localStorage.getItem("lastro_tema") || "ouro";
  } catch {
    return "ouro";
  }
}

function getServerSnapshot(): string {
  return "ouro";
}

export default function SeletorTemas() {
  const temaAtivo = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function selecionarTema(id: string) {
    try {
      localStorage.setItem("lastro_tema", id);
      if (id === "ouro") {
        document.documentElement.removeAttribute("data-tema");
      } else {
        document.documentElement.setAttribute("data-tema", id);
      }
      window.dispatchEvent(new Event("lastro_tema_mudou"));
    } catch {
      // no-op
    }
  }

  return (
    <div className="seletor-temas-container">
      <div className="seletor-temas-grid">
        {TEMAS.map((t) => {
          const estaAtivo = temaAtivo === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selecionarTema(t.id)}
              className={`seletor-tema-card ${estaAtivo ? "seletor-tema-card--ativo" : ""}`}
            >
              {/* Amostra Visual do Tema */}
              <div
                className="seletor-tema-card__preview"
                style={{ background: t.fundoPreview, color: t.corTextoPreview }}
              >
                <div className="seletor-tema-card__preview-topo">
                  <span className="seletor-tema-card__tag">{t.tag}</span>
                  {estaAtivo && (
                    <span className="seletor-tema-card__badge-ativo">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Ativo
                    </span>
                  )}
                </div>

                {/* Mini Botão Amostra */}
                <div
                  className="seletor-tema-card__mini-btn"
                  style={{
                    background: t.gradienteHero,
                    color: t.id === "branco-ouro" || t.id === "clean" ? "#0F172A" : "#07090D",
                  }}
                >
                  <span className="seletor-tema-card__mini-btn-dot" style={{ background: t.acentoPreview }} />
                  Exemplo de Botão
                </div>

                {/* Swatches de Cores */}
                <div className="seletor-tema-card__swatches">
                  <span className="seletor-tema-card__swatch" style={{ background: t.fundoPreview }} title="Fundo" />
                  <span className="seletor-tema-card__swatch" style={{ background: t.cardPreview }} title="Superfície" />
                  <span className="seletor-tema-card__swatch" style={{ background: t.acentoPreview }} title="Acento" />
                </div>
              </div>

              {/* Informações do Tema */}
              <div className="seletor-tema-card__info">
                <div className="seletor-tema-card__header-info">
                  <h3 className="seletor-tema-card__nome">{t.nome}</h3>
                  <span className="seletor-tema-card__subtitulo">{t.subtitulo}</span>
                </div>
                <p className="seletor-tema-card__descricao">{t.descricao}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
