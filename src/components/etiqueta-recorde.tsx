// lastro · DESIGN.md §6.5, peça 6 (M5) — recorde é um dos três estados
// que a peça nomeia (progressão, platô, recorde); a palavra + cor já
// existiam, faltava o ícone — terceiro canal, nunca só cor (§3.2 nota E).
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function EtiquetaRecorde({ idioma = "pt-BR" }: { idioma?: Idioma }) {
  return (
    <span className="marca marca--recorde">
      <span aria-hidden="true">★</span> {t("recorde", idioma)}
    </span>
  );
}
