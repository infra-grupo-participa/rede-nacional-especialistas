import { NIVEIS_ORDENADOS } from "@/comunidade/lib/qualificacoes";

/* Ilustração das telas de entrada: uma colagem feita com as peças da própria
   comunidade (post, comentários, post em destaque, tags de nível, selo de
   verificado, hashtag do tema). É decorativa; as medidas internas usam cqw
   para a arte inteira escalar com a largura da caixa. */
export function ArteRede() {
  return (
    <div className="rc-arte" aria-hidden="true">
      {/* cartão de trás: as tags de nível */}
      <div className="rc-arte-cartao rc-arte-niveis">
        {NIVEIS_ORDENADOS.map((n) => (
          <span key={n.key} className="rc-arte-pilula" style={{ background: n.cor, color: n.texto, border: `1px solid ${n.brilho}` }}>
            {n.rotulo}
          </span>
        ))}
      </div>

      {/* cartão alto: um post */}
      <div className="rc-arte-cartao rc-arte-alto">
        <div className="rc-arte-progresso">
          <i />
        </div>
        <div className="rc-arte-autor">
          <span className="rc-arte-bolinha" style={{ background: "#FF6B1A", color: "#0E0E0E" }}>
            TH
          </span>
          <span style={{ flex: 1, display: "grid", gap: "1.4cqw" }}>
            <span className="rc-arte-barra" style={{ width: "62%" }} />
            <span className="rc-arte-barra" style={{ width: "38%", opacity: 0.6 }} />
          </span>
        </div>
        <p className="rc-arte-frase">
          Holding se aprende <b>trocando ideia.</b>
        </p>
        <div className="rc-arte-quadro">
          <span style={{ height: "38%" }} />
          <span style={{ height: "62%" }} />
          <span style={{ height: "50%" }} />
          <span style={{ height: "88%" }} />
        </div>
        <div className="rc-arte-acoes">
          <span style={{ flex: 1 }} />
          <span style={{ width: "5.6cqw" }} />
          <span style={{ width: "5.6cqw" }} />
        </div>
      </div>

      {/* cartão da frente: post em destaque com comentários */}
      <div className="rc-arte-cartao rc-arte-post">
        <span className="rc-arte-fixado">
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "2.8cqw", height: "2.8cqw" }}>
            <path d="M16 3l5 5-3 1-4 4 1 5-2 2-4-5-5 5v-1l4-5-5-4 2-2 5 1 4-4z" />
          </svg>
          Em destaque
        </span>
        <span className="rc-arte-barra clara" style={{ width: "92%" }} />
        <span className="rc-arte-barra clara" style={{ width: "70%" }} />
        <span className="rc-arte-comentario" style={{ marginTop: "1.4cqw" }}>
          <span className="rc-arte-bolinha" style={{ background: "#141210", color: "#fff" }}>
            AM
          </span>
          <span className="rc-arte-barra clara" style={{ flex: 1 }} />
        </span>
        <span className="rc-arte-comentario">
          <span className="rc-arte-bolinha" style={{ background: "#FFE2CC", color: "#B8451E" }}>
            RC
          </span>
          <span className="rc-arte-barra clara" style={{ width: "58%" }} />
        </span>
      </div>

      {/* círculo com a marca */}
      <div className="rc-arte-rosto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/thb-logo.png" alt="" />
      </div>

      {/* peças soltas: voto, selo de verificado e hashtag */}
      <div className="rc-arte-voto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </div>
      <div className="rc-arte-selo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <div className="rc-arte-hashtag">#holding</div>
    </div>
  );
}
