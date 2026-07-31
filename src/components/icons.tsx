import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

/* Ícones inline portados do MVP .jsx. currentColor herda a cor do contexto. */
export const Ico = {
  chevron: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18l6-6-6-6" /></svg>
  ),
  back: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
  ),
  busca: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
  ),
  x: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>
  ),
  wa: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" /><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.13h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.82c0 4.54-3.7 8.23-8.24 8.23z" /></svg>
  ),
  tel: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 1.9.6 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.1a2 2 0 012.1-.5c.9.3 1.8.5 2.8.6a2 2 0 011.7 2z" /></svg>
  ),
  mail: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 6 10-6" /></svg>
  ),
  ig: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
  ),
  li: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M4.98 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.19 1.45-2.19 2.96V21H9z" /></svg>
  ),
  site: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18 15 15 0 010-18z" /></svg>
  ),
  doc: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
  ),
  filtro: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
  ),
  check: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6L9 17l-5-5" /></svg>
  ),
  selo: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 1.8l2.4 1.9 3-.4 1 2.9 2.6 1.6-1 2.9 1 2.9-2.6 1.6-1 2.9-3-.4L12 22.2l-2.4-1.9-3 .4-1-2.9L3 16.2l1-2.9-1-2.9 2.6-1.6 1-2.9 3 .4z" opacity=".18" /><path d="M10.7 15.4l-3-3 1.3-1.3 1.7 1.7 4.3-4.3 1.3 1.3z" /></svg>
  ),
  mais: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14" /></svg>
  ),
  cima: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 15l-6-6-6 6" /></svg>
  ),
  baixo: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9l6 6 6-6" /></svg>
  ),
  lixo: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
  ),
  escudo: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" /><path d="M9 12l2 2 4-4" /></svg>
  ),
  share: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v13M8 7l4-4 4 4" /><path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" /></svg>
  ),
  lapis: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
  ),
  seta: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  ),
  olho: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  olhoOff: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.6 6.2A9.9 9.9 0 0112 6c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.7A17 17 0 002 13s3.6 7 10 7a9.7 9.7 0 004.8-1.2" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /><path d="M3 3l18 18" /></svg>
  ),
  // votação estilo Reddit
  setaCima: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
  ),
  setaBaixo: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
  ),
  balao: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
  ),
  raio: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" /></svg>
  ),
  mapa: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" /><path d="M9 3v15M15 6v15" /></svg>
  ),
  youtube: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M23 12s0-3.5-.4-5.2c-.2-.9-.9-1.6-1.8-1.9C19 4.5 12 4.5 12 4.5s-7 0-8.8.4c-.9.3-1.6 1-1.8 1.9C1 8.5 1 12 1 12s0 3.5.4 5.2c.2.9.9 1.6 1.8 1.9 1.8.4 8.8.4 8.8.4s7 0 8.8-.4c.9-.3 1.6-1 1.8-1.9.4-1.7.4-5.2.4-5.2zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" /></svg>
  ),
  tiktok: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M16.6 5.8a4.3 4.3 0 01-1-2.8h-3.2v12.9a2.3 2.3 0 11-2.3-2.3c.2 0 .4 0 .6.1V10.4a5.6 5.6 0 00-.6 0 5.5 5.5 0 105.5 5.5V9.3a7.5 7.5 0 004.3 1.4V7.5a4.3 4.3 0 01-3.3-1.7z" /></svg>
  ),
  facebook: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.4l-.5 3.5h-2.9v8.4A12 12 0 0024 12z" /></svg>
  ),
  raio2: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
  ),
  troféu: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9a6 6 0 0012 0V4H6v5z" /><path d="M6 5H3v2a3 3 0 003 3M18 5h3v2a3 3 0 01-3 3M9 21h6M12 15v6" /></svg>
  ),
  estrela: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2.5l2.95 6.2 6.85.63-5.18 4.6 1.55 6.72L12 16.98l-6.17 3.67 1.55-6.72-5.18-4.6 6.85-.63L12 2.5z" /></svg>
  ),
  livro: (p: P) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 4h9a3 3 0 013 3v13a2.5 2.5 0 00-2.5-2.5H4zM20 4h-2a3 3 0 00-3 3v13a2.5 2.5 0 012.5-2.5H20z" /></svg>
  ),
} as const;
