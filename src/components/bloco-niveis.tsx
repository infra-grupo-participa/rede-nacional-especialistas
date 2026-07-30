import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { Eyebrow } from "@/components/atoms";
import { IconeNivel } from "@/components/niveis";
import { NIVEIS_ORDENADOS } from "@/lib/qualificacoes";

/* Grade dos níveis de faturamento na home; cada card leva ao diretório do nível.
   Mostra só os 4 níveis com selo (ouro/platina/diamante/vermelho); o base THB
   não entra (decisão Marcio). */
export function BlocoNiveis() {
  const niveis = NIVEIS_ORDENADOS.filter((n) => n.icone !== null);
  return (
    <div>
      <Eyebrow>Nível de faturamento</Eyebrow>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {niveis.map((n) => (
          <Link
            key={n.key}
            href={`/nivel/${n.key}`}
            className="flex flex-col gap-1.5 rounded-2xl p-3.5"
            style={{ background: C.surface, border: `1px solid ${C.line}`, minHeight: 100 }}
          >
            <IconeNivel q={n.key} size={26} />
            <span className="text-[15px] font-semibold" style={{ color: C.ink }}>
              {n.rotulo}
            </span>
            <span className="text-[12px]" style={{ color: C.muted, fontFamily: F.mono }}>
              {n.faixa}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
