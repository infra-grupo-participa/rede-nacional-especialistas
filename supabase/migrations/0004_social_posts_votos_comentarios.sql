-- ============================================================================
-- Rede Nacional de Especialistas — Migration 0004: camada social
-- Feed de posts + voto (upvote/downvote estilo Reddit) + comentários realtime.
--
-- Autoria por perfil (rede.perfis.id), não por auth.uid() direto: a identidade
-- social é o perfil. Só perfis logados (auth_id) e aprovados criam conteúdo.
-- score é desnormalizado em posts e mantido por trigger sobre votos.
-- ============================================================================

-- ---- enums ------------------------------------------------------------------

do $$ begin
  create type rede.tipo_conteudo as enum ('post', 'artigo', 'pesquisa');
exception when duplicate_object then null; end $$;

-- Status editorial: post publica direto; artigo passa por fila (fase 4).
do $$ begin
  create type rede.status_conteudo as enum ('publicado', 'pendente', 'recusado', 'removido');
exception when duplicate_object then null; end $$;

-- ---- posts ------------------------------------------------------------------

create table if not exists rede.posts (
  id            uuid primary key default gen_random_uuid(),
  autor_id      uuid not null references rede.perfis(id) on delete cascade,
  tipo          rede.tipo_conteudo   not null default 'post',
  status        rede.status_conteudo not null default 'publicado',
  titulo        text default '',            -- vazio p/ post curto; usado em artigo
  corpo         text not null default '',
  score         integer not null default 0, -- upvotes - downvotes (desnormalizado)
  n_comentarios integer not null default 0, -- desnormalizado
  atualizado_em timestamptz not null default now(),
  criado_em     timestamptz not null default now()
);

create index if not exists posts_autor_idx  on rede.posts (autor_id);
create index if not exists posts_status_idx on rede.posts (status);
create index if not exists posts_feed_idx    on rede.posts (status, criado_em desc);
create index if not exists posts_top_idx     on rede.posts (status, score desc, criado_em desc);

-- ---- votos ------------------------------------------------------------------
-- 1 voto por (post, perfil); valor +1 (up) ou -1 (down). Trocar de lado é UPDATE.

create table if not exists rede.votos (
  post_id    uuid not null references rede.posts(id)  on delete cascade,
  perfil_id  uuid not null references rede.perfis(id) on delete cascade,
  valor      smallint not null check (valor in (-1, 1)),
  criado_em  timestamptz not null default now(),
  primary key (post_id, perfil_id)
);

create index if not exists votos_perfil_idx on rede.votos (perfil_id);

-- trigger: mantém posts.score em sincronia com votos.
create or replace function rede.recalc_score()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare v_post uuid := coalesce(new.post_id, old.post_id);
begin
  update rede.posts p
     set score = coalesce((select sum(valor) from rede.votos v where v.post_id = v_post), 0)
   where p.id = v_post;
  return null;
end;
$$;

drop trigger if exists trg_votos_score on rede.votos;
create trigger trg_votos_score
  after insert or update or delete on rede.votos
  for each row execute function rede.recalc_score();

-- ---- comentários ------------------------------------------------------------

create table if not exists rede.comentarios (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references rede.posts(id)  on delete cascade,
  autor_id   uuid not null references rede.perfis(id) on delete cascade,
  parent_id  uuid references rede.comentarios(id) on delete cascade, -- thread (1 nível)
  corpo      text not null default '',
  criado_em  timestamptz not null default now()
);

create index if not exists coment_post_idx  on rede.comentarios (post_id, criado_em);
create index if not exists coment_autor_idx on rede.comentarios (autor_id);

-- trigger: mantém posts.n_comentarios.
create or replace function rede.recalc_n_comentarios()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare v_post uuid := coalesce(new.post_id, old.post_id);
begin
  update rede.posts p
     set n_comentarios = (select count(*) from rede.comentarios c where c.post_id = v_post)
   where p.id = v_post;
  return null;
end;
$$;

drop trigger if exists trg_coment_conta on rede.comentarios;
create trigger trg_coment_conta
  after insert or delete on rede.comentarios
  for each row execute function rede.recalc_n_comentarios();

-- ---- RLS --------------------------------------------------------------------

alter table rede.posts       enable row level security;
alter table rede.votos       enable row level security;
alter table rede.comentarios enable row level security;

-- posts: leitura pública dos publicados (ou do próprio autor / admin).
drop policy if exists posts_select on rede.posts;
create policy posts_select on rede.posts
  for select using (
    status = 'publicado'
    or autor_id = rede.meu_perfil_id()
    or rede.is_rede_admin()
  );

-- criar: só perfil aprovado logado, publicando como ele mesmo.
drop policy if exists posts_insert on rede.posts;
create policy posts_insert on rede.posts
  for insert with check (
    autor_id = rede.meu_perfil_id() and rede.is_rede_aprovado()
  );

drop policy if exists posts_update on rede.posts;
create policy posts_update on rede.posts
  for update using (autor_id = rede.meu_perfil_id() or rede.is_rede_admin())
  with check (autor_id = rede.meu_perfil_id() or rede.is_rede_admin());

drop policy if exists posts_delete on rede.posts;
create policy posts_delete on rede.posts
  for delete using (autor_id = rede.meu_perfil_id() or rede.is_rede_admin());

-- votos: qualquer aprovado lê; cada um gerencia o seu.
drop policy if exists votos_select on rede.votos;
create policy votos_select on rede.votos
  for select using (rede.is_rede_aprovado() or rede.is_rede_admin());

drop policy if exists votos_upsert on rede.votos;
create policy votos_upsert on rede.votos
  for insert with check (perfil_id = rede.meu_perfil_id() and rede.is_rede_aprovado());

drop policy if exists votos_update on rede.votos;
create policy votos_update on rede.votos
  for update using (perfil_id = rede.meu_perfil_id())
  with check (perfil_id = rede.meu_perfil_id());

drop policy if exists votos_delete on rede.votos;
create policy votos_delete on rede.votos
  for delete using (perfil_id = rede.meu_perfil_id());

-- comentários: leitura pública em post publicado; escreve o dono aprovado.
drop policy if exists coment_select on rede.comentarios;
create policy coment_select on rede.comentarios
  for select using (
    exists (select 1 from rede.posts p where p.id = post_id and p.status = 'publicado')
    or autor_id = rede.meu_perfil_id()
    or rede.is_rede_admin()
  );

drop policy if exists coment_insert on rede.comentarios;
create policy coment_insert on rede.comentarios
  for insert with check (
    autor_id = rede.meu_perfil_id() and rede.is_rede_aprovado()
  );

drop policy if exists coment_delete on rede.comentarios;
create policy coment_delete on rede.comentarios
  for delete using (autor_id = rede.meu_perfil_id() or rede.is_rede_admin());

-- ---- realtime ---------------------------------------------------------------
-- Publica as 3 tabelas na publication do Realtime (idempotente).

do $$ begin
  alter publication supabase_realtime add table rede.posts;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table rede.votos;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table rede.comentarios;
exception when duplicate_object then null; end $$;

comment on table rede.posts is 'Feed social da Rede THB. tipo=post publica direto; artigo/pesquisa têm fluxo próprio.';
comment on column rede.posts.score is 'upvotes - downvotes. Desnormalizado, mantido por trigger sobre rede.votos.';
