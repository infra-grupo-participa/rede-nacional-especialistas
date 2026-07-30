import { C, F } from "@/lib/tokens";
import { tintaCapa } from "@/lib/utils";

/* Capa de artigo — cópia fiel do MVP (App.jsx 831). Imagem quando existe; senão
   gradiente determinístico (tintaCapa) com a inicial. Alturas e raios por variante. */

export function Capa2({
  titulo,
  capa,
  variante = "default",
}: {
  titulo: string;
  capa?: string;
  variante?: "miniatura" | "baixa" | "destaque" | "alta" | "default";
}) {
  const miniatura = variante === "miniatura";
  const baixa = variante === "baixa";
  const destaque = variante === "destaque";
  const alta = variante === "alta";

  const altura = miniatura ? 76 : baixa ? 118 : destaque ? 186 : alta ? 200 : 132;
  const raio = miniatura ? 12 : destaque ? 0 : 16;

  if (capa) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={capa}
        alt=""
        className="w-full object-cover"
        style={{ height: altura, borderRadius: raio, display: "block" }}
      />
    );
  }

  const [de, para, letra] = tintaCapa(titulo || "artigo");
  return (
    <div
      className="flex w-full items-center justify-center"
      style={{ height: altura, borderRadius: raio, background: `linear-gradient(135deg, ${de}, ${para})` }}
      aria-hidden="true"
    >
      <span
        style={{
          fontFamily: F.serif,
          fontWeight: 600,
          fontSize: miniatura ? 28 : alta || destaque ? 56 : 38,
          color: letra,
          opacity: 0.7,
        }}
      >
        {(titulo || "A").trim()[0]?.toUpperCase()}
      </span>
    </div>
  );
}
