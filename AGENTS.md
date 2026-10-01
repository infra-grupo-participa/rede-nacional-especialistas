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

## Rede de Especialistas (v2): tudo sob `/comunidade`
Entre 30/09 e 01/10/2026 a gestão da comunidade (feed fechado, questionário de
entrada, moderação, relatório por aluno, arquivos, selo de verificado, trava de
comentários ao vivo) foi publicada por engano em cima do blog. O PO queria uma
**v2 separada**: a Rede de Especialistas é um produto diferente do blog, "um
Facebook do THB". Em 01/10/2026 o blog voltou ao que era em 04/08 (`482c88f`) e
a comunidade passou a morar em `/comunidade`, neste mesmo app.

- **Não publicar nada de comunidade fora de `/comunidade`**, e não usar a
  navegação do blog (`TopNav`) lá dentro. O branch `v2` (`c5c2bbd`) guarda a
  versão antiga, com as rotas na raiz, só como histórico.
- **Onde está o código:** rotas em `src/app/comunidade/**`; componentes, ações
  e consultas em `src/comunidade/{components,acoes,lib}/**`; estilos com prefixo
  `.rc-` em `src/app/comunidade/comunidade.css`.
- **Entrada** (referência: telas do Facebook, com a identidade THB):
  `/comunidade/entrar` (desktop claro em duas colunas, celular escuro),
  `/comunidade/criar-conta` (no celular começa pelo convite), `/comunidade/recuperar`
  e `/comunidade/nova-senha`. A conta fica lembrada no aparelho
  (`lib/conta-salva.ts`: só nome, foto e e-mail no localStorage, nunca senha)
  e a entrada oferece "Continuar" ou "Usar outro perfil".
- **Depois do login** a pessoa cai em `/comunidade`: barra do topo, cabeçalho do
  grupo (capa, "Grupo privado · N membros", abas) e a Discussão. O grupo
  `(membros)` exige membro aprovado (`exigirMembro()`); quem não é aprovado vai
  para `/comunidade/aguardando` (questionário). A coordenação é uma aba do grupo.
- **Banco:** migrations 0006, 0007 e 0008 aplicadas (arquivos em
  `supabase/migrations/`). Posts e comentários só são lidos por membro aprovado
  (o `/feed` antigo do blog aparece vazio para visitante), o dono do perfil não
  grava `certificado`/`thb_id`/`plano_thb`, e o Realtime está ligado em
  `rede.posts`, `rede.comentarios` e `rede.artigo_comentarios`.
- **Dois pontos compartilhados com o blog:** `lib/supabase/middleware.ts`
  registra o acesso (`registrar_acesso`) só em rota `/comunidade`; e
  `/auth/confirmar` manda o link de nova senha para `/comunidade/nova-senha`
  quando encontra o cookie `rede_volta` (posto pelas ações da comunidade).
  Atrás do Passenger o `request.url` vem como `https://0.0.0.0:3000`: nunca
  montar URL absoluta a partir dele (ver `origemPublica`).
- Pendente na v2: perfil do membro dentro da comunidade (os nomes ainda levam
  para `/especialista/...`, que é página do blog) e a aba de membros.

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
Push na main → Node App Hostinger (auto-deploy, padrão gps-thb/central-de-projetos), no ar em
`blog.timeholdingbrasil.com.br`. **O build é webpack** (`next build --webpack`): o Turbopack
quebra na Hostinger desde 29/09/2026 e build com falha mantém o site antigo em silêncio.
Sempre confirme no ar depois do push (ver `DEPLOY.md`). Migration nova vai para o Supabase
ANTES do merge.

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
