<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Notas já descobertas nesta base:
- A convenção `middleware` foi renomeada para **`proxy`**: o arquivo é `src/proxy.ts` e exporta `export async function proxy(request)`. O `export const config = { matcher }` continua igual.
<!-- END:nextjs-agent-rules -->

# Rede Nacional de Especialistas (Comunidade THB) — regras de agente

## O que é
Duas coisas no mesmo app:
1. **Landing institucional** em `/` — a cara pública do Time Holding Brasil.
2. **Rede social + blog + newsletter** atrás dela. Alunos criam posts/artigos/pesquisas,
   votam (upvote/downvote estilo Reddit), comentam, ganham XP. Vitrine com mapa do
   Brasil → por estado lista alunos + WhatsApp direto.

## Stack
- **Next.js 16** (App Router, TypeScript, Tailwind v4). Node App na Hostinger.
  `output: standalone` foi **removido** de propósito (conflita com o `server.js`
  custom do Passenger) — ver `DEPLOY.md`.
- **Supabase** projeto principal `mbvybujpkwuorhtdzcde`, **schema `rede`**. `auth.users`
  compartilhado → cadastro marca `raw_user_meta_data.origem='rede'`. RLS por `is_rede_*()`.
- Tipografia via **`next/font/google`** (Inter + Manrope) em `src/app/layout.tsx`.
  > Correção: este arquivo dizia "fonts do sistema, sem next/font/google". Era falso —
  > o `layout.tsx` sempre usou `next/font/google` e o build da Hostinger passa.
  > `src/lib/tokens.ts` mantém uma pilha de fontes do sistema como fallback.

## Landing institucional (`/`)
A home é composta em `src/app/page.tsx` a partir de seções independentes em
`src/components/home/` — cada uma revisável isoladamente (requisito do PO):
`cabecalho` · `hero-institucional` · `secao-quem-somos` · `secao-membros` ·
`secao-artigos` · `secao-redes` · `secao-eventos` · `rodape-institucional`.

- **Design system da LP**: `src/lib/landing.ts` (`LP`, `GRAD`, `TIPO`, `RITMO`,
  `BOTAO`, `CARD`, `MENU`, `CTA`). Fica **acima** de `tokens.ts` — `C`/`F`
  continuam sendo a fonte de cor e fonte do app inteiro.
- **Utilitários CSS** com prefixo `.lp-*` em `globals.css` para não vazarem no app logado.
- **Regras que não devem ser desfeitas sem custo:**
  - **Zero `box-shadow`.** Profundidade é cor sólida + fio de 1px + glow radial.
  - **Laranja `#FF6B1A` é fundo, não texto.** Sobre o off-white ele mede 2,6:1 e
    reprova em contraste. Acento de texto em fundo claro usa `C.petrolDeep`.
    O gradiente (`textoGradiente`) só vale sobre os blocos escuros.
  - **Sobre laranja, texto sempre preto.**
  - Onde existe `:hover`, a propriedade **não pode** sair em `style` inline —
    inline vence classe e o hover vira código morto.
  - Os ids das seções têm que bater com `MENU` (`src/lib/landing.ts`): o scrollspy
    do cabeçalho depende disso, e seção client-only/lazy não entra nele.
- **Agenda de eventos**: `src/lib/eventos.ts` é curado à mão (não há tabela no
  banco). Para migrar, criar `rede.eventos` com as mesmas colunas do tipo `Evento`
  e trocar a constante `AGENDA` por uma query — a UI só consome o tipo.

## Regras críticas
- **NUNCA** commitar `.env.local` nem service_role. Só `NEXT_PUBLIC_*` no cliente.
- supabase-js configurado com `db: { schema: 'rede' }` e `fetch` com `cache: 'no-store'`
  (Next cacheia o fetch → dados velhos; ver `src/lib/supabase/config.ts`).
- Schema novo no Supabase precisa ser exposto no PostgREST (`pgrst.db_schemas` + reload config+schema).
- Migrations versionadas em `supabase/migrations/NNNN_*.sql` — mantenha em dia.
- **Qualificação** (thb<aurum<platina<diamante<diamante_vermelho) é comercial, tag no nome,
  só admin altera. **XP/gamificação** é OUTRA coisa (interação). Não misturar.
- Campos privilegiados do perfil (papel/qualificacao/status/xp) são congelados por trigger
  no update do próprio dono (`guard_perfil_update`).

## Deploy
Push na main → Node App Hostinger (auto-deploy, padrão gps-thb/central-de-projetos). Domínio a definir.

## Convenções
- Português correto com acentuação em toda a UI e comentários.
- Paleta laranja fixa (`src/lib/tokens.ts`) — sem dark mode do SO. O toggle manual
  (`theme-toggle.tsx`) grava `data-theme` no `<html>`; a LP institucional não segue
  esse toggle nos blocos escuros, que são pretos nos dois temas de propósito.
- Estilo híbrido: classes Tailwind para layout/espaçamento + `style={{}}` inline
  com os objetos `C`/`F`/`LP`/`TIPO`. Sem CSS Modules, sem styled-components.
- Componentes portados do MVP original `rede-nacional-especialistas.jsx`.

## Dívidas conhecidas
- As views `catalogo_especialistas`, `ranking_autores` e `perfil_stats` são usadas
  em `src/lib/queries.ts` mas **não existem em nenhuma migration** — foram criadas
  direto no Supabase. Antes de mexer nelas, leia o schema real; o repo não é fonte.
- Não há testes automatizados nem CI. Validação é build + `tsc` + `eslint` + olho.
- `secao-redes.tsx` usa URLs de redes sociais **plausíveis, não confirmadas** pela
  equipe THB. Confirmar antes de divulgar a página.
- `rodape.tsx`, `linha-estado.tsx` e `busca-sugestoes.tsx` ficaram sem uso quando a
  home virou landing (eram do `vitrine.tsx`, removido). Reaproveitar ou apagar.
