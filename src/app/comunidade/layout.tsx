import type { Metadata } from "next";
import "./comunidade.css";
import "./base.css";
import "./casco.css";
import "./feed.css";
import "./reacoes.css";
import "./paginas.css";
import "./perfil.css";
import "./diagnostico.css";

/* Rede de Especialistas (v2). Mora em /comunidade, separada do blog: tela de
   entrada própria e, depois do login, a comunidade com cara de grupo. Nada
   aqui dentro usa a navegação do blog. */
export const metadata: Metadata = {
  title: {
    default: "Rede de Especialistas | Time Holding Brasil",
    template: "%s | Rede de Especialistas",
  },
  description: "A comunidade fechada dos alunos do Time Holding Brasil.",
  robots: { index: false, follow: false },
};

export default function ComunidadeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
