import Link from "next/link";
import { IcoRC } from "@/comunidade/components/icones";

/* Perfil que não existe (endereço errado, membro que saiu ou ainda não foi
   aprovado): o aviso aparece dentro do grupo, com o caminho de volta. */
export default function MembroNaoEncontrado() {
  return (
    <main className="rc-pg">
      <div className="rc-pg-coluna">
        <section className="rc-cartao rc-pg-bloco">
          <div className="rc-pg-vazio">
            <IcoRC.pessoas />
            <strong>Membro não encontrado</strong>
            <p>O endereço pode estar errado, ou essa pessoa não faz parte da comunidade.</p>
            <Link href="/comunidade/membros" className="rc-btn rc-btn-neutro" style={{ marginTop: 16 }}>
              Ver os membros
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
