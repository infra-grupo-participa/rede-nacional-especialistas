import { useId } from "react";

/* Capa do perfil de quem não escolheu uma foto: fundo preto quente com faixas
   de luz laranja cruzando, no espírito da capa do grupo. Escura nos dois
   temas, de propósito (como a capa do grupo). */
export function CapaPadrao() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const faixa = `${id}-faixa`;
  const brilho = `${id}-brilho`;
  const luz = `${id}-luz`;
  return (
    <svg viewBox="0 0 680 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={faixa} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B8451E" />
          <stop offset="0.45" stopColor="#FF6B1A" />
          <stop offset="1" stopColor="#FF8A3D" />
        </linearGradient>
        <radialGradient id={luz} cx="0.86" cy="0.1" r="0.7">
          <stop offset="0" stopColor="#FF8A3D" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FF8A3D" stopOpacity="0" />
        </radialGradient>
        <filter id={brilho} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <rect width="680" height="160" fill="#0E0E0E" />
      <rect width="680" height="160" fill={`url(#${luz})`} />
      {/* brilho por trás das faixas */}
      <g filter={`url(#${brilho})`} opacity="0.75" fill="none" stroke={`url(#${faixa})`} strokeLinecap="round">
        <path d="M-40 150 C 150 60, 300 190, 470 96 S 660 10, 740 44" strokeWidth="26" />
        <path d="M-40 60 C 120 150, 250 30, 420 150 S 640 150, 740 110" strokeWidth="14" />
      </g>
      {/* faixas */}
      <g fill="none" stroke={`url(#${faixa})`} strokeLinecap="round">
        <path d="M-40 150 C 150 60, 300 190, 470 96 S 660 10, 740 44" strokeWidth="16" />
        <path d="M-40 60 C 120 150, 250 30, 420 150 S 640 150, 740 110" strokeWidth="5" opacity="0.85" />
        <path d="M-40 172 C 160 84, 310 212, 482 118 S 668 32, 740 66" strokeWidth="2" opacity="0.6" />
      </g>
    </svg>
  );
}
