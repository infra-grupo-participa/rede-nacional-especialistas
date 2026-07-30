<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Notas já descobertas nesta base:
- A convenção `middleware` foi renomeada para **`proxy`**: o arquivo é `src/proxy.ts` e exporta `export async function proxy(request)`. O `export const config = { matcher }` continua igual.
<!-- END:nextjs-agent-rules -->

# Rede Nacional de Especialistas (Comunidade THB) — regras de agente

## O que é
Rede social + blog + newsletter que é a **home do Time Holding Brasil**. Alunos criam
posts/artigos/pesquisas, votam (upvote/downvote estilo Reddit), comentam, ganham XP.
Vitrine com mapa do Brasil → por estado lista alunos + WhatsApp direto.

## Stack
- **Next.js 16** (App Router, TypeScript, Tailwind v4). Node App na Hostinger (`output: standalone`).
- **Supabase** projeto principal `mbvybujpkwuorhtdzcde`, **schema `rede`**. `auth.users`
  compartilhado → cadastro marca `raw_user_meta_data.origem='rede'`. RLS por `is_rede_*()`.
- Fonts do sistema (sem next/font/google — build da Hostinger pode não ter rede).

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
- Paleta laranja fixa (`src/lib/tokens.ts`) — sem dark mode do SO.
- Componentes portados do MVP original `rede-nacional-especialistas.jsx`.
