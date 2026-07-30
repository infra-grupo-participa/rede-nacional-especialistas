-- ============================================================================
-- Rede Nacional de Especialistas (Comunidade THB) — schema `rede`
-- Migration 0001: fundação (schema, enums, perfis, helpers, RLS, trigger)
-- Projeto principal mbvybujpkwuorhtdzcde. auth.users compartilhado → origem='rede'.
--
-- IMPORTANTE: depois de aplicar em um projeto novo, exponha o schema no PostgREST:
--   alter role authenticator set pgrst.db_schemas = '<lista atual>, rede';
--   notify pgrst, 'reload config';
--   notify pgrst, 'reload schema';
-- ============================================================================

create schema if not exists rede;

grant usage on schema rede to anon, authenticated, service_role;
alter default privileges in schema rede grant all on tables to anon, authenticated, service_role;
alter default privileges in schema rede grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema rede grant all on functions to anon, authenticated, service_role;

-- ---- enums --------------------------------------------------------------

-- Qualificação comercial (tag no nome). Ordem base → topo.
do $$ begin
  create type rede.qualificacao as enum ('thb', 'aurum', 'platina', 'diamante', 'diamante_vermelho');
exception when duplicate_object then null; end $$;

-- Papel dentro da rede.
do $$ begin
  create type rede.papel as enum ('aluno', 'admin');
exception when duplicate_object then null; end $$;

-- Status do cadastro (auto-cadastro + aprovação admin).
do $$ begin
  create type rede.status_perfil as enum ('pendente', 'aprovado', 'recusado', 'suspenso');
exception when duplicate_object then null; end $$;

-- ---- perfis -------------------------------------------------------------
-- 1:1 com auth.users. id = auth.users.id.

create table if not exists rede.perfis (
  id             uuid primary key references auth.users(id) on delete cascade,
  slug           text unique,
  nome           text not null default '',
  profissao      text default '',
  bio            text default '',
  cidade         text default '',
  uf             char(2),
  whatsapp       text default '',
  email          text,
  avatar_url     text default '',
  capa_url       text default '',
  instagram      text default '',
  linkedin       text default '',
  site           text default '',
  qualificacao   rede.qualificacao not null default 'thb',
  papel          rede.papel        not null default 'aluno',
  status         rede.status_perfil not null default 'pendente',
  xp             integer not null default 0,
  nivel_gam      integer not null default 1,
  atualizado_em  timestamptz not null default now(),
  criado_em      timestamptz not null default now()
);

create index if not exists perfis_uf_idx     on rede.perfis (uf);
create index if not exists perfis_status_idx on rede.perfis (status);
create index if not exists perfis_qual_idx   on rede.perfis (qualificacao);

-- ---- helpers (SECURITY DEFINER, sem recursão de RLS) --------------------

create or replace function rede.is_rede_admin()
returns boolean language sql stable security definer set search_path = rede, public as $$
  select exists (
    select 1 from rede.perfis p
    where p.id = auth.uid() and p.papel = 'admin' and p.status = 'aprovado'
  );
$$;

create or replace function rede.is_rede_aprovado()
returns boolean language sql stable security definer set search_path = rede, public as $$
  select exists (
    select 1 from rede.perfis p
    where p.id = auth.uid() and p.status = 'aprovado'
  );
$$;

grant execute on function rede.is_rede_admin() to anon, authenticated, service_role;
grant execute on function rede.is_rede_aprovado() to anon, authenticated, service_role;

-- ---- trigger de novo usuário -------------------------------------------
-- auth.users é compartilhado por todos os sistemas do projeto. Só criamos
-- perfil `rede` quando o cadastro veio DESTE produto (origem='rede').

create or replace function rede.handle_new_user()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare
  v_origem text := coalesce(new.raw_user_meta_data->>'origem', '');
  v_nome   text := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
begin
  if v_origem <> 'rede' then
    return new;  -- não é do nosso produto; outros handlers cuidam
  end if;

  insert into rede.perfis (id, nome, email, status, papel)
  values (new.id, v_nome, new.email, 'pendente', 'aluno')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rede on auth.users;
create trigger on_auth_user_created_rede
  after insert on auth.users
  for each row execute function rede.handle_new_user();

-- ---- RLS ----------------------------------------------------------------

alter table rede.perfis enable row level security;

drop policy if exists perfis_select_public on rede.perfis;
create policy perfis_select_public on rede.perfis
  for select using (
    status = 'aprovado' or id = auth.uid() or rede.is_rede_admin()
  );

drop policy if exists perfis_insert_self on rede.perfis;
create policy perfis_insert_self on rede.perfis
  for insert with check (
    id = auth.uid()
    and papel = 'aluno'
    and status = 'pendente'
    and qualificacao = 'thb'
  );

drop policy if exists perfis_update_self on rede.perfis;
create policy perfis_update_self on rede.perfis
  for update using (id = auth.uid() or rede.is_rede_admin())
  with check (id = auth.uid() or rede.is_rede_admin());

drop policy if exists perfis_delete_admin on rede.perfis;
create policy perfis_delete_admin on rede.perfis
  for delete using (rede.is_rede_admin());

comment on table rede.perfis is 'Perfis da Rede Nacional de Especialistas (Comunidade THB). 1:1 com auth.users via origem=rede.';
comment on column rede.perfis.qualificacao is 'Qualificação COMERCIAL (tag no nome): thb<aurum<platina<diamante<diamante_vermelho. Só admin altera.';
comment on column rede.perfis.xp is 'XP de gamificação por interação — SEPARADO da qualificação.';
