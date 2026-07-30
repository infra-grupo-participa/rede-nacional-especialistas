import { C, F } from "@/lib/tokens";
import { tintaCapa } from "@/lib/utils";

/* Capa de artigo. Usa a imagem quando existe; senão, gradiente determinístico
   (tintaCapa) com a inicial do título grande. Variantes controlam altura/raio. */

const ALTURA: Record<string, number> = {
  miniatura: 76,
  baixa: 118,
  destaque: 186,
  alta: 200,
  default: 132,
};
const RAIO: Record<string, number> = {
  miniatura: 12,
  baixa: 14,
  destaque: 0,
  alta: 16,
  default: 14,
};

export function Capa2({
  titulo,
  capa,
  variante = "default",
}: {
  titulo: string;
  capa?: string;
  variante?: "miniatura" | "baixa" | "destaque" | "alta" | "default";
}) {
  const h = ALTURA[variante] ?? ALTURA.default;
  const raio = RAIO[variante] ?? RAIO.default;

  if (capa) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={capa}
        alt={titulo || ""}
        style={{
          width: "100%",
          height: h,
          objectFit: "cover",
          borderRadius: raio,
          display: "block",
        }}
      />
    );
  }

  const [a, b, tinta] = tintaCapa(titulo || "Artigo");
  const inicial = (titulo || "A").trim().charAt(0).toUpperCase();
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "100%",
        height: h,
        borderRadius: raio,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        color: tinta,
      }}
      aria-hidden="true"
    >
      <span
        style={{
          fontFamily: F.serif,
          fontWeight: 700,
          fontSize: Math.round(h * 0.42),
          opacity: 0.9,
        }}
      >
        {inicial}
      </span>
    </div>
  );
}
