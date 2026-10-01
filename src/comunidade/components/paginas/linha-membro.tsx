import Link from "next/link";
import { Avatar, SeloVerificado, TagNivel } from "@/comunidade/components/atoms";
import { ondeEoQue } from "@/comunidade/components/paginas/textos";
import { hrefMembro, type MembroResumo } from "@/comunidade/lib/grupo-tipos";

/* Linha de membro das listas (aba Membros): foto, nome com o selo e a tag de
   nível, e embaixo "profissão · cidade/UF". A linha inteira leva ao perfil.
   Nunca mostra e-mail, WhatsApp nem telefone. */
export function LinhaMembro({ membro }: { membro: MembroResumo }) {
  const sub = ondeEoQue(membro);
  return (
    <li>
      <Link href={hrefMembro(membro)} className="rc-pg-membro">
        <Avatar nome={membro.nome} foto={membro.avatar_url} size={48} />
        <span className="rc-pg-membro-texto">
          <span className="rc-pg-membro-nome">
            <span className="rc-pg-membro-quem">
              <span>{membro.nome}</span>
              {membro.verificado && <SeloVerificado size="sm" />}
            </span>
            <TagNivel qualificacao={membro.qualificacao} size="sm" />
          </span>
          {sub && <span className="rc-pg-membro-sub">{sub}</span>}
        </span>
      </Link>
    </li>
  );
}
