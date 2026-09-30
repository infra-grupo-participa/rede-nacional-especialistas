import Link from "next/link";
import { C, F } from "@/lib/tokens";
import { exigirAdminPagina } from "@/lib/admin";
import { configComunidade, contadoresCoordenacao } from "@/lib/gestao";
import { CabecalhoCoordenacao } from "@/components/coordenacao/cabecalho";
import { FormConfig } from "@/components/coordenacao/form-config";

export const dynamic = "force-dynamic";

export default async function RegrasCoordenacaoPage() {
  await exigirAdminPagina();
  const [config, contadores] = await Promise.all([configComunidade(), contadoresCoordenacao()]);
  return (
    <main style={{ minHeight: "100dvh", background: C.fundo, color: C.ink }}>
      <CabecalhoCoordenacao ativa="regras" contadores={contadores} />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <h1 className="text-[28px] leading-tight" style={{ fontFamily: F.serif, fontWeight: 700 }}>
          Regras e entrada
        </h1>
        <p className="mb-5 mt-1 text-[14px]" style={{ color: C.muted }}>
          O que a pessoa aceita para entrar e o que a moderação usa para agir.{" "}
          <Link href="/regras" target="_blank" className="font-semibold" style={{ color: C.petrolDeep }}>
            Ver como os membros enxergam
          </Link>
        </p>
        <FormConfig config={config} />
      </div>
    </main>
  );
}
