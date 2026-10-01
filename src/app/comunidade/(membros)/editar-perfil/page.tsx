import type { Metadata } from "next";
import Link from "next/link";
import { exigirMembro } from "@/comunidade/lib/sessao";
import { hrefMembro } from "@/comunidade/lib/grupo-tipos";
import { IcoRC } from "@/comunidade/components/icones";
import { EditorPerfil } from "@/components/perfil/editor-perfil";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar meu perfil" };

/* Editar o próprio perfil SEM sair da comunidade. O formulário é o mesmo do
   blog (um perfil só para os dois), mas a tela fica dentro do grupo e os
   caminhos de volta levam ao perfil do membro na comunidade. */
export default async function EditarPerfilPage() {
  const perfil = await exigirMembro();
  const meuPerfil = hrefMembro(perfil);

  return (
    <main className="rc-pg">
      <div className="rc-editar-cabeca">
        <div>
          <Link href={meuPerfil} className="rc-voltar">
            <IcoRC.chevronDireita /> Meu perfil
          </Link>
          <h1 className="rc-editar-titulo">Editar meu perfil</h1>
          <p className="rc-editar-sub">É assim que os colegas veem você na Rede. Foto, apresentação e especialidades ajudam a puxar conversa.</p>
        </div>
      </div>
      <div className="rc-editar-form">
        <EditorPerfil perfil={perfil} hrefPerfil={meuPerfil} />
      </div>
    </main>
  );
}
