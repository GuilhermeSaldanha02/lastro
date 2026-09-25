// lastro · PU-06 — Política de Privacidade. Rota pública, como /termos.
import type { Metadata } from "next";
import DocumentoLegal from "@/components/documento-legal";
import { PRIVACIDADE } from "@/lib/legal/documentos";

export const metadata: Metadata = { title: "Política de Privacidade · lastro" };

export default function PaginaPrivacidade() {
  return <DocumentoLegal documento={PRIVACIDADE} />;
}
