import type { CSSProperties, ReactNode } from "react";

/* Ícones da comunidade (traço, 24x24, cor herdada). Sem "use client": servem
   em componente de servidor e de navegador. Tamanho pela classe/estilo de quem
   usa (as classes .rc-btn, .rc-icone-btn e .rc-menu-item já dimensionam). */

type P = { className?: string; style?: CSSProperties };

function Svg({ children, cheio, ...p }: P & { children: ReactNode; cheio?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={cheio ? "currentColor" : "none"}
      stroke={cheio ? "none" : "currentColor"}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IcoRC = {
  casa: (p: P) => (
    <Svg {...p}>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </Svg>
  ),
  pessoas: (p: P) => (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.7.8 2.7 2.5 3 5.2" />
    </Svg>
  ),
  imagem: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m4 18 5.5-5.5 3.5 3.5 2.5-2.5L20 18" />
    </Svg>
  ),
  pasta: (p: P) => (
    <Svg {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  ),
  escudo: (p: P) => (
    <Svg {...p}>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </Svg>
  ),
  busca: (p: P) => (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Svg>
  ),
  pontos: (p: P) => (
    <Svg {...p} cheio>
      <circle cx="5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19" cy="12" r="1.9" />
    </Svg>
  ),
  cadeado: (p: P) => (
    <Svg {...p} cheio>
      <path d="M17 9V7A5 5 0 0 0 7 7v2a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3zM9 7a3 3 0 0 1 6 0v2H9z" />
    </Svg>
  ),
  olho: (p: P) => (
    <Svg {...p}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  relogio: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.3 2" />
    </Svg>
  ),
  curtir: (p: P) => (
    <Svg {...p}>
      <path d="M7 10.5V20H4.5A1.5 1.5 0 0 1 3 18.5V12a1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M7 10.5 10.8 3.6a1 1 0 0 1 .9-.5c1.3 0 2.3 1.1 2.1 2.4L13.2 9.5h5.3a2.3 2.3 0 0 1 2.3 2.7l-1 5.7A2.5 2.5 0 0 1 17.3 20H7" />
    </Svg>
  ),
  curtido: (p: P) => (
    <Svg {...p} cheio>
      <path d="M2 12a1.5 1.5 0 0 1 1.5-1.5H6.5V21H3.5A1.5 1.5 0 0 1 2 19.5zM8 10.3l3.9-7.1a1 1 0 0 1 .9-.5c1.4 0 2.5 1.3 2.2 2.7l-.7 4.1h4.9a2.5 2.5 0 0 1 2.5 2.9l-1 5.7A2.8 2.8 0 0 1 17.9 21H8z" />
    </Svg>
  ),
  comentar: (p: P) => (
    <Svg {...p}>
      <path d="M12 3.5c-5 0-9 3.5-9 7.8 0 2.4 1.2 4.5 3.2 6l-.7 3.7 4-2.1c.8.2 1.6.3 2.5.3 5 0 9-3.5 9-7.9s-4-7.8-9-7.8z" />
    </Svg>
  ),
  compartilhar: (p: P) => (
    <Svg {...p}>
      <path d="M13.5 4.5 21 11.5l-7.5 7v-4.3C8.3 14.2 5 15.8 3 19c.4-5.6 3.6-10 10.5-10.5z" />
    </Svg>
  ),
  mais: (p: P) => (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  setaBaixo: (p: P) => (
    <Svg {...p} cheio>
      <path d="M6 9.5h12l-6 6.5z" />
    </Svg>
  ),
  chevronBaixo: (p: P) => (
    <Svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  ),
  chevronCima: (p: P) => (
    <Svg {...p}>
      <path d="m6 15 6-6 6 6" />
    </Svg>
  ),
  chevronDireita: (p: P) => (
    <Svg {...p}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  ),
  voltar: (p: P) => (
    <Svg {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  ),
  x: (p: P) => (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
  sair: (p: P) => (
    <Svg {...p}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />
    </Svg>
  ),
  lua: (p: P) => (
    <Svg {...p} cheio>
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
    </Svg>
  ),
  engrenagem: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  ),
  lapis: (p: P) => (
    <Svg {...p}>
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="m14.5 7.5 3 3" />
    </Svg>
  ),
  link: (p: P) => (
    <Svg {...p}>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </Svg>
  ),
  whatsapp: (p: P) => (
    <Svg {...p}>
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 20.5 11.7z" />
      <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a4 4 0 0 1-2.3-2.3l.8-1-1-2z" />
    </Svg>
  ),
  pin: (p: P) => (
    <Svg {...p}>
      <path d="m14.5 3 6.5 6.5-3 .5-3.5 3.5.5 4.5-2 2-4-4-5 5v-1.5l4.5-4.5-4-4 2-2 4.5.5L14 6z" />
    </Svg>
  ),
  hashtag: (p: P) => (
    <Svg {...p}>
      <path d="M9.5 3 7.5 21M16.5 3l-2 18M4 8.5h17M3 15.5h17" />
    </Svg>
  ),
  conteudo: (p: P) => (
    <Svg {...p}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 4v-4h-1A1.5 1.5 0 0 1 4 14.5z" />
      <path d="M8 8.5h8M8 11.5h5" />
    </Svg>
  ),
  entrou: (p: P) => (
    <Svg {...p}>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M2.5 19c.5-3.2 2.8-5 6-5 1.2 0 2.2.2 3.1.7" />
      <path d="m14 17.5 2.5 2.5 5-5.5" />
    </Svg>
  ),
  externo: (p: P) => (
    <Svg {...p}>
      <path d="M14 4h6v6M20 4l-9 9M18 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5.5" />
    </Svg>
  ),
  email: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7.5 8 6 8-6" />
    </Svg>
  ),
  lixo: (p: P) => (
    <Svg {...p}>
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
    </Svg>
  ),
  balaoTravado: (p: P) => (
    <Svg {...p}>
      <path d="M12 3.5c-5 0-9 3.5-9 7.8 0 2.4 1.2 4.5 3.2 6l-.7 3.7 4-2.1c.8.2 1.6.3 2.5.3 5 0 9-3.5 9-7.9s-4-7.8-9-7.8z" />
      <path d="m9 9 6 5M15 9l-6 5" />
    </Svg>
  ),
  responder: (p: P) => (
    <Svg {...p}>
      <path d="M9 7 4 12l5 5M4 12h9a7 7 0 0 1 7 7" />
    </Svg>
  ),
  info: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.1" />
    </Svg>
  ),
  enviar: (p: P) => (
    <Svg {...p} cheio>
      <path d="M3.4 20.4 21.6 12.6a.65.65 0 0 0 0-1.2L3.4 3.6a.5.5 0 0 0-.7.6l2.2 6.1 8.6 1.7-8.6 1.7-2.2 6.1a.5.5 0 0 0 .7.6z" />
    </Svg>
  ),
  marcado: (p: P) => (
    <Svg {...p}>
      <path d="M5 12.5 10 17.5 19.5 7" />
    </Svg>
  ),
  /* Frente C: abas Sobre, Mídia e Arquivos */
  calendario: (p: P) => (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Svg>
  ),
  documento: (p: P) => (
    <Svg {...p}>
      <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
      <path d="M13.5 3v5.5H19M9 13h6M9 16.5h6" />
    </Svg>
  ),
  video: (p: P) => (
    <Svg {...p} cheio>
      <path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l11-6.8a.8.8 0 0 0 0-1.4l-11-6.8A.8.8 0 0 0 8 5.2z" />
    </Svg>
  ),
  local: (p: P) => (
    <Svg {...p}>
      <path d="M12 21.5s7-6.3 7-11.5a7 7 0 1 0-14 0c0 5.2 7 11.5 7 11.5z" />
      <circle cx="12" cy="10" r="2.600" />
    </Svg>
  ),
  /* Frente A: casco e cabeçalho do grupo */
  regras: (p: P) => (
    <Svg {...p}>
      <rect x="4.5" y="4" width="15" height="17" rx="2.5" />
      <path d="M9 4V3h6v1M8.5 10l1.3 1.3L12 9M8.5 15.5l1.3 1.3L12 14.5M14.5 10.5h2M14.5 16h2" />
    </Svg>
  ),
  camera: (p: P) => (
    <Svg {...p}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.4" />
    </Svg>
  ),
  maleta: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3 13h18" />
    </Svg>
  ),
  pessoa: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20c.8-4 3.7-6 7.5-6s6.7 2 7.5 6" />
    </Svg>
  ),
  telefone: (p: P) => (
    <Svg {...p}>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
    </Svg>
  ),
  estrela: (p: P) => (
    <Svg {...p}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />
    </Svg>
  ),
  mao: (p: P) => (
    <Svg {...p}>
      <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V5.5a1.5 1.5 0 0 1 3 0V13M8 11.5 6.3 9.8a1.5 1.5 0 0 0-2.3 1.9l3.3 5.6A6 6 0 0 0 12.5 20.5h.5a5 5 0 0 0 5-5V8.5a1.5 1.5 0 0 0-1-1.4" />
    </Svg>
  ),
};
