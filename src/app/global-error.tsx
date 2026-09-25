"use client";

// lastro · PU-07 — última rede: erro no próprio layout raiz. Aqui não há
// CSS do app nem idioma; o texto é fixo, em português.
import { useEffect } from "react";
import { relatarErroCliente } from "@/lib/monitoramento/relatar-erro-cliente";

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    relatarErroCliente(error, error.digest);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ background: "#111", color: "#eee", fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1>Algo deu errado</h1>
        <p>Não foi possível abrir o lastro. Seus treinos salvos estão a salvo.</p>
        <button type="button" onClick={reset} style={{ padding: "12px 20px", fontSize: 16 }}>
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
