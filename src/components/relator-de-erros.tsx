"use client";

// lastro · PU-07 — pega o que escapa dos limites de erro do React: exceção
// solta em handler de clique e promessa rejeitada sem tratamento. Sem UI.
import { useEffect } from "react";
import { relatarErroCliente } from "@/lib/monitoramento/relatar-erro-cliente";

export default function RelatorDeErros() {
  useEffect(() => {
    const aoErrar = (evento: ErrorEvent) =>
      relatarErroCliente(evento.error ?? evento.message);
    const aoRejeitar = (evento: PromiseRejectionEvent) =>
      relatarErroCliente(evento.reason);
    window.addEventListener("error", aoErrar);
    window.addEventListener("unhandledrejection", aoRejeitar);
    return () => {
      window.removeEventListener("error", aoErrar);
      window.removeEventListener("unhandledrejection", aoRejeitar);
    };
  }, []);
  return null;
}
