// Stub de "next/navigation" — a bancada não navega, só registra.
export function useRouter() {
  return {
    push: (url: string) => console.log("[bancada] router.push", url),
    replace: (url: string) => console.log("[bancada] router.replace", url),
    refresh: () => console.log("[bancada] router.refresh"),
    back: () => console.log("[bancada] router.back"),
  };
}
