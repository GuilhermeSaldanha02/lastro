// lastro · DESIGN.md §6.3/§6.4, peça 3 (M4) — marca visualmente que a
// linha navega. Decorativa: o `<Link>` em volta já é o alvo acessível,
// por isso `aria-hidden`, nunca um segundo alvo de toque.
export default function SetaNavegacao() {
  return (
    <svg
      className="item__seta"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
