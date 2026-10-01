"use client";

/* Rede de segurança da área de membros: um erro inesperado numa tela mostra
   este recado no lugar dela, com o casco do grupo ainda de pé, em vez de
   derrubar a página inteira. */
export default function ErroDaComunidade({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="rc-cartao rc-vazio rc-erro-tela" role="alert">
      <h1 className="rc-cartao-titulo">Algo deu errado</h1>
      <p>Não foi possível mostrar esta tela. Tente de novo; se continuar, avise a coordenação.</p>
      <button type="button" className="rc-btn rc-btn-primario" onClick={() => reset()}>
        Tentar de novo
      </button>
    </section>
  );
}
