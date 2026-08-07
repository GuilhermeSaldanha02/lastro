// lastro · PROGRESS.md pendência 4 — foto ou iniciais na barra de topo.
// Server component: só recebe dado já resolvido, sem estado próprio.
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export default function Avatar({
  nome,
  avatarUrl,
}: {
  nome: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- projeto não usa next/image em nenhum outro lugar (sem remotePatterns configurado).
    return <img src={avatarUrl} alt="" className="avatar" />;
  }
  return (
    <span className="avatar avatar--iniciais" aria-hidden="true">
      {iniciais(nome)}
    </span>
  );
}
