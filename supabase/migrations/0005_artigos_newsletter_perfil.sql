-- ============================================================================
-- Rede Nacional de Especialistas — Migration 0005
-- Fundação p/ o novo front: colunas de perfil, ARTIGOS (newsletter) + fila de
-- aprovação, comentários de artigo, newsletter. Bucket `artigos` (Storage).
-- ============================================================================

-- ---- 1. perfis: campos que o novo perfil usa --------------------------------

alter table rede.perfis add column if not exists espaco       text default '';   -- Espaço de Instrução
alter table rede.perfis add column if not exists certificado  boolean not null default false;
alter table rede.perfis add column if not exists telefone     text default '';   -- separado do whatsapp

-- ---- 2. artigos -------------------------------------------------------------
-- Ciclo: rascunho → em_analise → publicado ; ramo em_analise → ajustes (motivo).

do $$ begin
  create type rede.status_artigo as enum ('rascunho','em_analise','publicado','ajustes');
exception when duplicate_object then null; end $$;

create table if not exists rede.artigos (
  id            uuid primary key default gen_random_uuid(),
  autor_id      uuid not null references rede.perfis(id) on delete cascade,
  slug          text unique,
  titulo        text not null default '',
  chapeu        text default '',          -- rótulo editorial curto
  resumo        text default '',
  capa          text default '',          -- URL da capa (bucket artigos)
  blocos        jsonb not null default '[]'::jsonb,  -- [{id,tipo,texto?,url?,legenda?}]
  status        rede.status_artigo not null default 'rascunho',
  motivo        text default '',          -- devolutiva da coordenação (status=ajustes)
  leituras      integer not null default 0,
  criado_em     timestamptz not null default now(),
  enviado_em    timestamptz,
  publicado_em  timestamptz,
  atualizado_em timestamptz not null default now()
);

create index if not exists artigos_autor_idx  on rede.artigos (autor_id);
create index if not exists artigos_status_idx on rede.artigos (status);
create index if not exists artigos_pub_idx     on rede.artigos (status, publicado_em desc);
create index if not exists artigos_lidos_idx   on rede.artigos (status, leituras desc);

-- incrementa leituras (SECURITY DEFINER: contador público, sem abrir UPDATE geral)
create or replace function rede.incrementar_leitura(p_artigo uuid)
returns void language sql security definer set search_path = rede, public as $$
  update rede.artigos set leituras = leituras + 1
   where id = p_artigo and status = 'publicado';
$$;
grant execute on function rede.incrementar_leitura(uuid) to anon, authenticated, service_role;

-- ---- 3. comentários de artigo -----------------------------------------------
-- (rede.comentarios da 0004 é de POSTS; artigo tem tabela própria.)

create table if not exists rede.artigo_comentarios (
  id         uuid primary key default gen_random_uuid(),
  artigo_id  uuid not null references rede.artigos(id)  on delete cascade,
  autor_id   uuid not null references rede.perfis(id)   on delete cascade,
  texto      text not null check (char_length(trim(texto)) between 2 and 1500),
  criado_em  timestamptz not null default now()
);
create index if not exists artcom_artigo_idx on rede.artigo_comentarios (artigo_id, criado_em desc);

-- ---- 4. newsletter (inscrições) ---------------------------------------------

create table if not exists rede.newsletter_inscritos (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  criado_em  timestamptz not null default now()
);
create unique index if not exists newsletter_email_uidx
  on rede.newsletter_inscritos (lower(email));

-- ---- 5. RLS -----------------------------------------------------------------

alter table rede.artigos             enable row level security;
alter table rede.artigo_comentarios  enable row level security;
alter table rede.newsletter_inscritos enable row level security;

-- artigos: publicado é público; autor vê/edita os seus; admin vê/modera tudo.
drop policy if exists artigos_select on rede.artigos;
create policy artigos_select on rede.artigos
  for select using (
    status = 'publicado' or autor_id = rede.meu_perfil_id() or rede.is_rede_admin()
  );

-- criar: aluno aprovado publica como ele mesmo (nasce rascunho/em_analise).
drop policy if exists artigos_insert on rede.artigos;
create policy artigos_insert on rede.artigos
  for insert with check (
    autor_id = rede.meu_perfil_id() and rede.is_rede_aprovado()
  );

-- update: o autor mexe nos seus (rascunho/ajustes → reenvio) OU o admin (aprovar/pedir ajustes).
drop policy if exists artigos_update on rede.artigos;
create policy artigos_update on rede.artigos
  for update using (autor_id = rede.meu_perfil_id() or rede.is_rede_admin())
  with check (autor_id = rede.meu_perfil_id() or rede.is_rede_admin());

drop policy if exists artigos_delete on rede.artigos;
create policy artigos_delete on rede.artigos
  for delete using (autor_id = rede.meu_perfil_id() or rede.is_rede_admin());

-- comentários de artigo: leitura pública em artigo publicado; escreve aprovado; apaga o próprio/admin.
drop policy if exists artcom_select on rede.artigo_comentarios;
create policy artcom_select on rede.artigo_comentarios
  for select using (
    exists (select 1 from rede.artigos a where a.id = artigo_id and a.status = 'publicado')
    or autor_id = rede.meu_perfil_id() or rede.is_rede_admin()
  );
drop policy if exists artcom_insert on rede.artigo_comentarios;
create policy artcom_insert on rede.artigo_comentarios
  for insert with check (autor_id = rede.meu_perfil_id() and rede.is_rede_aprovado());
drop policy if exists artcom_delete on rede.artigo_comentarios;
create policy artcom_delete on rede.artigo_comentarios
  for delete using (autor_id = rede.meu_perfil_id() or rede.is_rede_admin());

-- newsletter: qualquer um se inscreve; ninguém lê a lista (só admin).
drop policy if exists news_insert on rede.newsletter_inscritos;
create policy news_insert on rede.newsletter_inscritos
  for insert with check (true);
drop policy if exists news_select on rede.newsletter_inscritos;
create policy news_select on rede.newsletter_inscritos
  for select using (rede.is_rede_admin());

-- ---- 6. guard de status (autor não se auto-publica) -------------------------
-- Autor comum só pode deixar seus artigos em rascunho/em_analise. Só admin
-- move para publicado/ajustes. (RLS não compara OLD×NEW; trigger sim.)

create or replace function rede.guard_artigo_status()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  if rede.is_rede_admin() or auth.uid() is null then
    return new;
  end if;
  -- autor comum: não pode publicar nem marcar ajustes por conta própria
  if new.status in ('publicado','ajustes')
     and new.status is distinct from old.status then
    new.status := old.status;
  end if;
  -- carimba enviado_em ao entrar em análise
  if new.status = 'em_analise' and (old.status is distinct from 'em_analise') then
    new.enviado_em := now();
  end if;
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_artigo_status on rede.artigos;
create trigger trg_guard_artigo_status
  before update on rede.artigos
  for each row execute function rede.guard_artigo_status();

-- carimba publicado_em quando o admin publica
create or replace function rede.stamp_artigo_publicado()
returns trigger language plpgsql set search_path = rede, public as $$
begin
  if new.status = 'publicado' and (old.status is distinct from 'publicado') then
    new.publicado_em := coalesce(new.publicado_em, now());
  end if;
  return new;
end;
$$;
drop trigger if exists trg_stamp_artigo_pub on rede.artigos;
create trigger trg_stamp_artigo_pub
  before update on rede.artigos
  for each row execute function rede.stamp_artigo_publicado();

-- ---- 7. realtime ------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table rede.artigo_comentarios;
exception when duplicate_object then null; end $$;

comment on table rede.artigos is 'Artigos (newsletter) da Rede THB. Fila de aprovação: rascunho→em_analise→publicado/ajustes.';
