"use client";

// lastro · tarefa 2.4 — registra o service worker mínimo (public/sw.js) que
// torna o app instalável. Sem isso o Chrome não oferece "Instalar app".
import { useEffect } from "react";

export default function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return null;
}
