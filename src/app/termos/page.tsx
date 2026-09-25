// lastro · PU-06 — Termos de Uso. Rota pública: quem ainda não tem conta
// precisa poder ler antes de aceitar (não entra em PREFIXOS_PRIVADOS).
import type { Metadata } from "next";
import DocumentoLegal from "@/components/documento-legal";
import { TERMOS } from "@/lib/legal/documentos";

export const metadata: Metadata = { title: "Termos de Uso · lastro" };

export default function PaginaTermos() {
  return <DocumentoLegal documento={TERMOS} />;
}
