/* Capa do grupo. Não há foto: é um desenho (SVG) no espírito da capa do grupo
   no Facebook: preto quente, faixas de luz laranja cruzando a tela e o logo do
   Time Holding Brasil grande no centro. É escura nos dois temas, de propósito.

   O desenho mede 1250 x 463 (proporção do desktop). No celular a capa fica
   2:1 e o SVG corta as pontas (slice), mantendo o logo no meio. Sem "use
   client": serve em componente de servidor e de navegador. */

/* Faixa principal: desce do alto à esquerda, passa por trás do logo e sai
   embaixo à direita. Faixa secundária: sobe de baixo à esquerda para o alto à
   direita. As duas se cruzam atrás do logo. */
const FAIXA_A =
  "M-60 -14C140 -34 330 36 470 166C600 288 760 398 930 358C1070 326 1150 248 1310 258L1310 384C1180 352 1090 440 940 452C740 468 560 380 430 262C310 152 140 88 -60 110Z";
const BORDA_A = "M-60 -14C140 -34 330 36 470 166C600 288 760 398 930 358C1070 326 1150 248 1310 258";
const FUNDO_A = "M1310 384C1180 352 1090 440 940 452C740 468 560 380 430 262C310 152 140 88 -60 110";
const FAIXA_B =
  "M-60 306C90 254 230 334 380 332C560 330 640 150 800 108C960 66 1100 118 1310 26L1310 92C1110 172 980 122 830 162C680 202 600 402 390 394C240 388 110 322 -60 376Z";
const BORDA_B = "M-60 306C90 254 230 334 380 332C560 330 640 150 800 108C960 66 1100 118 1310 26";
const FUNDO_B = "M1310 92C1110 172 980 122 830 162C680 202 600 402 390 394C240 388 110 322 -60 376";
/* Fios de luz soltos, paralelos às faixas. */
const FIOS = [
  "M-60 196C120 152 300 192 440 300C560 394 700 470 900 484",
  "M520 -30C620 62 790 252 975 250C1100 248 1180 182 1310 172",
  "M-60 446C110 404 250 438 410 480",
  "M880 -24C980 30 1110 16 1310 -70",
];

export function CapaGrupo() {
  return (
    <div className="rc-capa" role="img" aria-label="Capa do grupo: Time Holding Brasil">
      <svg viewBox="0 0 1250 463" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          {/* corpo das faixas: laranja ao longo do caminho */}
          <linearGradient id="rc-capa-corpo-a" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1250" y2="463">
            <stop offset="0" stopColor="#FF6B1A" />
            <stop offset="0.2" stopColor="#FF8A3D" />
            <stop offset="0.45" stopColor="#FF6B1A" />
            <stop offset="0.72" stopColor="#FF8A3D" />
            <stop offset="1" stopColor="#FF6B1A" />
          </linearGradient>
          <linearGradient id="rc-capa-corpo-b" gradientUnits="userSpaceOnUse" x1="0" y1="463" x2="1250" y2="0">
            <stop offset="0" stopColor="#B8451E" />
            <stop offset="0.3" stopColor="#FF6B1A" />
            <stop offset="0.55" stopColor="#B8451E" />
            <stop offset="0.8" stopColor="#FF6B1A" />
            <stop offset="1" stopColor="#FF8A3D" />
          </linearGradient>
          {/* volume: a faixa é recortada e a borda de baixo some no preto */}
          <clipPath id="rc-capa-recorte-a">
            <path d={FAIXA_A} />
          </clipPath>
          <clipPath id="rc-capa-recorte-b">
            <path d={FAIXA_B} />
          </clipPath>
          {/* fio de luz: acende no meio e apaga nas pontas */}
          <linearGradient id="rc-capa-fio" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1250" y2="0">
            <stop offset="0" stopColor="#FF6B1A" stopOpacity="0" />
            <stop offset="0.14" stopColor="#FF8A3D" />
            <stop offset="0.36" stopColor="#FFD9BC" />
            <stop offset="0.5" stopColor="#FF8A3D" />
            <stop offset="0.68" stopColor="#FFE6D2" />
            <stop offset="0.88" stopColor="#FF8A3D" />
            <stop offset="1" stopColor="#FF6B1A" stopOpacity="0" />
          </linearGradient>
          {/* calor no centro e escuro nas pontas */}
          <radialGradient id="rc-capa-calor" gradientUnits="userSpaceOnUse" cx="625" cy="232" r="620">
            <stop offset="0" stopColor="#B8451E" stopOpacity="0.3" />
            <stop offset="0.45" stopColor="#B8451E" stopOpacity="0.08" />
            <stop offset="1" stopColor="#B8451E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rc-capa-sombra" gradientUnits="userSpaceOnUse" cx="625" cy="232" r="720">
            <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.7" />
          </radialGradient>
          {/* halo atrás do logo */}
          <radialGradient id="rc-capa-halo" gradientUnits="userSpaceOnUse" cx="625" cy="232" r="290">
            <stop offset="0.56" stopColor="#FF8A3D" stopOpacity="0.85" />
            <stop offset="0.72" stopColor="#FF6B1A" stopOpacity="0.34" />
            <stop offset="1" stopColor="#FF6B1A" stopOpacity="0" />
          </radialGradient>
          {/* clarão na borda do logo */}
          <radialGradient id="rc-capa-clarao">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.16" stopColor="#FFE6D2" stopOpacity="0.92" />
            <stop offset="0.42" stopColor="#FF8A3D" stopOpacity="0.4" />
            <stop offset="1" stopColor="#FF6B1A" stopOpacity="0" />
          </radialGradient>
          <filter id="rc-capa-difuso" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id="rc-capa-brilho" x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="rc-capa-sombreado" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="23" />
          </filter>
          <filter id="rc-capa-quente" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <rect width="1250" height="463" fill="#0E0E0E" />
        <rect width="1250" height="463" fill="url(#rc-capa-calor)" />

        {/* luz espalhada das faixas (o brilho em volta delas) */}
        <g filter="url(#rc-capa-difuso)" opacity="0.42">
          <path d={FAIXA_A} fill="#FF6B1A" />
          <path d={FAIXA_B} fill="#B8451E" />
        </g>

        {/* fios de luz soltos */}
        <g fill="none" stroke="url(#rc-capa-fio)" strokeLinecap="round">
          <g filter="url(#rc-capa-brilho)" opacity="0.75">
            {FIOS.map((d) => (
              <path key={d} d={d} strokeWidth="6" />
            ))}
          </g>
          {FIOS.map((d) => (
            <path key={d} d={d} strokeWidth="1.6" />
          ))}
        </g>

        {/* faixa secundária */}
        <path d={FAIXA_B} fill="url(#rc-capa-corpo-b)" />
        <g clipPath="url(#rc-capa-recorte-b)">
          <path d={FUNDO_B} fill="none" stroke="#0E0E0E" strokeWidth="54" filter="url(#rc-capa-sombreado)" opacity="0.97" />
          <path d={BORDA_B} fill="none" stroke="#FFC79E" strokeWidth="16" filter="url(#rc-capa-quente)" opacity="0.5" />
        </g>
        <g fill="none" stroke="url(#rc-capa-fio)" strokeLinecap="round">
          <path d={BORDA_B} strokeWidth="9" filter="url(#rc-capa-brilho)" opacity="0.8" />
          <path d={BORDA_B} strokeWidth="2.4" />
        </g>

        {/* faixa principal */}
        <path d={FAIXA_A} fill="url(#rc-capa-corpo-a)" />
        <g clipPath="url(#rc-capa-recorte-a)">
          <path d={FUNDO_A} fill="none" stroke="#0E0E0E" strokeWidth="98" filter="url(#rc-capa-sombreado)" opacity="0.97" />
          <path d={BORDA_A} fill="none" stroke="#FFC79E" strokeWidth="26" filter="url(#rc-capa-quente)" opacity="0.6" />
        </g>
        <g fill="none" stroke="url(#rc-capa-fio)" strokeLinecap="round">
          <path d={BORDA_A} strokeWidth="12" filter="url(#rc-capa-brilho)" opacity="0.9" />
          <path d={BORDA_A} strokeWidth="3" />
        </g>

        <rect width="1250" height="463" fill="url(#rc-capa-sombra)" />

        {/* logo: o disco tem ~78% da altura da capa, com halo atrás */}
        <circle cx="625" cy="232" r="290" fill="url(#rc-capa-halo)" />
        <image href="/thb-logo-720.png" x="412.5" y="28" width="445" height="435" preserveAspectRatio="xMidYMid meet" />

        {/* clarão no alto, à direita do disco */}
        <g transform="translate(752 100)">
          <ellipse rx="150" ry="2.4" fill="url(#rc-capa-clarao)" transform="rotate(-24)" />
          <ellipse rx="96" ry="2" fill="url(#rc-capa-clarao)" transform="rotate(62)" />
          <circle r="54" fill="url(#rc-capa-clarao)" />
        </g>
      </svg>
    </div>
  );
}
