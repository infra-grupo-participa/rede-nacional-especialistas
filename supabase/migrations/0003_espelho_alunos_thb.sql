-- ============================================================================
-- Rede Nacional de Especialistas (Comunidade THB) — schema `rede`
-- Migration 0003: espelho da base real de alunos (public.vw_aluno_360).
--
-- Decisões (Marcio, 2026-07-30):
--  - A base de alunos é a view public.vw_aluno_360 (~1764).
--  - Qualificação vem do campo `plano`: aluno→thb, aurum→aurum, platina→platina,
--    diamante→diamante, super_diamante→diamante_vermelho.
--  - Espelho em rede.perfis com PK PRÓPRIA (não mais 1:1 com auth.users).
--    auth_id (nullable) é preenchido quando o aluno loga (vínculo por e-mail).
--  - Alunos espelhados entram como status='aprovado' → aparecem na vitrine na hora.
--  - Vitrine mostra todos; quem não quiser aparecer usa `oculto=true` após logar.
-- ============================================================================

-- ---- 1. perfis: desacoplar identidade do auth --------------------------------
-- Hoje: id uuid PK references auth.users(id). Só 83/1764 alunos têm auth.users,
-- então a identidade do perfil passa a ser própria e o vínculo com auth vira
-- opcional (auth_id), reconciliado por e-mail no login.

alter table rede.perfis add column if not exists auth_id          uuid;
alter table rede.perfis add column if not exists origem_thb       boolean not null default false;
alter table rede.perfis add column if not exists aluno_thb_email  text;
alter table rede.perfis add column if not exists oculto           boolean not null default false;
alter table rede.perfis add column if not exists thb_id           uuid;      -- vw_aluno_360.id (reconciliação idempotente)
alter table rede.perfis add column if not exists plano_thb        text;      -- valor bruto de origem (auditoria)

-- Perfis pré-existentes (os 30 de teste) tinham id = auth.users.id: preserva o vínculo.
update rede.perfis set auth_id = id where auth_id is null;

-- Solta a FK id→auth.users (o nome padrão do Postgres é <tabela>_<coluna>_fkey).
alter table rede.perfis drop constraint if exists perfis_id_fkey;

-- id passa a ter identidade própria para novas linhas (espelho sem auth).
alter table rede.perfis alter column id set default gen_random_uuid();

-- auth_id é único (1 login = 1 perfil) e liga em auth.users.
do $$ begin
  alter table rede.perfis
    add constraint perfis_auth_id_fkey foreign key (auth_id)
    references auth.users(id) on delete set null;
exception when duplicate_object then null; end $$;

create unique index if not exists perfis_auth_id_uidx
  on rede.perfis (auth_id) where auth_id is not null;

-- e-mail único por perfil (chave de reconciliação; case-insensitive).
create unique index if not exists perfis_email_uidx
  on rede.perfis (lower(email)) where email is not null;

create index if not exists perfis_thb_id_idx  on rede.perfis (thb_id);
create index if not exists perfis_oculto_idx  on rede.perfis (oculto);

-- ---- 2. helpers: casar por auth_id, não por id -------------------------------

create or replace function rede.is_rede_admin()
returns boolean language sql stable security definer set search_path = rede, public as $$
  select exists (
    select 1 from rede.perfis p
    where p.auth_id = auth.uid() and p.papel = 'admin' and p.status = 'aprovado'
  );
$$;

create or replace function rede.is_rede_aprovado()
returns boolean language sql stable security definer set search_path = rede, public as $$
  select exists (
    select 1 from rede.perfis p
    where p.auth_id = auth.uid() and p.status = 'aprovado'
  );
$$;

-- perfil do usuário logado (conveniência p/ app).
create or replace function rede.meu_perfil_id()
returns uuid language sql stable security definer set search_path = rede, public as $$
  select p.id from rede.perfis p where p.auth_id = auth.uid() limit 1;
$$;

grant execute on function rede.is_rede_admin()   to anon, authenticated, service_role;
grant execute on function rede.is_rede_aprovado() to anon, authenticated, service_role;
grant execute on function rede.meu_perfil_id()   to anon, authenticated, service_role;

-- ---- 3. trigger de novo usuário: reconciliar em vez de duplicar --------------
-- Quando alguém loga/cadastra com origem='rede', se já existe perfil espelhado
-- com aquele e-mail (auth_id null), apenas VINCULA o auth_id. Senão, cria novo
-- perfil pendente (auto-cadastro clássico).

create or replace function rede.handle_new_user()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare
  v_origem text := coalesce(new.raw_user_meta_data->>'origem', '');
  v_nome   text := coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
  v_vinc   int;
begin
  if v_origem <> 'rede' then
    return new;  -- não é do nosso produto; outros handlers cuidam
  end if;

  -- 1) tenta reconciliar com um perfil espelhado (aluno THB sem login ainda).
  update rede.perfis
     set auth_id = new.id,
         atualizado_em = now()
   where auth_id is null
     and email is not null
     and lower(email) = lower(new.email);
  get diagnostics v_vinc = row_count;

  if v_vinc > 0 then
    return new;  -- assumiu um perfil pré-cadastrado
  end if;

  -- 2) auto-cadastro novo (não é aluno espelhado): perfil pendente.
  insert into rede.perfis (auth_id, nome, email, status, papel, origem_thb)
  values (new.id, v_nome, new.email, 'pendente', 'aluno', false)
  on conflict do nothing;

  return new;
end;
$$;

-- (trigger on_auth_user_created_rede já existe da 0001 e aponta p/ esta função)

-- ---- 4. RLS: id→auth_id ------------------------------------------------------

drop policy if exists perfis_select_public on rede.perfis;
create policy perfis_select_public on rede.perfis
  for select using (
    status = 'aprovado' or auth_id = auth.uid() or rede.is_rede_admin()
  );

drop policy if exists perfis_insert_self on rede.perfis;
create policy perfis_insert_self on rede.perfis
  for insert with check (
    auth_id = auth.uid()
    and papel = 'aluno'
    and status = 'pendente'
    and qualificacao = 'thb'
  );

drop policy if exists perfis_update_self on rede.perfis;
create policy perfis_update_self on rede.perfis
  for update using (auth_id = auth.uid() or rede.is_rede_admin())
  with check (auth_id = auth.uid() or rede.is_rede_admin());

drop policy if exists perfis_delete_admin on rede.perfis;
create policy perfis_delete_admin on rede.perfis
  for delete using (rede.is_rede_admin());

-- guard: dono comum não mexe em campos privilegiados (identifica por auth_id).
create or replace function rede.guard_perfil_update()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  if rede.is_rede_admin() or auth.uid() is null then
    return new;
  end if;
  if new.papel        is distinct from old.papel        then new.papel        := old.papel;        end if;
  if new.qualificacao is distinct from old.qualificacao then new.qualificacao := old.qualificacao; end if;
  if new.status       is distinct from old.status       then new.status       := old.status;       end if;
  if new.xp           is distinct from old.xp           then new.xp           := old.xp;           end if;
  if new.nivel_gam    is distinct from old.nivel_gam    then new.nivel_gam    := old.nivel_gam;    end if;
  if new.auth_id      is distinct from old.auth_id      then new.auth_id      := old.auth_id;      end if;
  if new.origem_thb   is distinct from old.origem_thb   then new.origem_thb   := old.origem_thb;   end if;
  new.atualizado_em := now();
  return new;
end;
$$;

-- ---- 5. mapeamento plano → qualificação --------------------------------------

create or replace function rede.plano_para_qualificacao(p text)
returns rede.qualificacao language sql immutable as $$
  select case lower(coalesce(p,''))
    when 'aurum'          then 'aurum'
    when 'platina'        then 'platina'
    when 'diamante'       then 'diamante'
    when 'super_diamante' then 'diamante_vermelho'
    else 'thb'
  end::rede.qualificacao;
$$;

-- UF válida (27 unidades federativas). Fora disso → null (cai em "sem localização").
create or replace function rede.uf_valida(u text)
returns char(2) language sql immutable as $$
  select case when upper(trim(coalesce(u,''))) in (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
    'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ) then upper(trim(u))::char(2) else null end;
$$;

-- slug base a partir do nome (sem acento, kebab-case).
create or replace function rede.slugify(txt text)
returns text language sql immutable as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(
        lower(unaccent(coalesce(txt,''))),
        '[^a-z0-9]+', '-', 'g'
      ), '-{2,}', '-', 'g'
    )
  );
$$;

-- ---- 6. função de sincronização (idempotente) -------------------------------
-- Espelha public.vw_aluno_360 → rede.perfis. Reconcilia por thb_id (id do aluno)
-- e por e-mail. Só admin/service_role deve rodar. Retorna quantos inseriu/atualizou.

create or replace function rede.sync_alunos_thb()
returns table(inseridos int, atualizados int)
language plpgsql security definer set search_path = rede, public as $$
declare
  v_ins int := 0;
  v_upd int := 0;
begin
  -- Fonte deduplicada: 1 linha por e-mail (o registro mais recentemente atualizado).
  with fonte as (
    select distinct on (lower(v.email))
      v.id            as thb_id,
      nullif(trim(v.nome), '')            as nome,
      lower(nullif(trim(v.email), ''))    as email,
      coalesce(nullif(trim(v.telefone_e164), ''), nullif(trim(v.telefone), '')) as whatsapp,
      nullif(trim(v.profissao), '')       as profissao,
      nullif(trim(v.cidade), '')          as cidade,
      rede.uf_valida(v.estado)            as uf,
      v.plano                             as plano_thb,
      rede.plano_para_qualificacao(v.plano) as qualificacao,
      nullif(trim(v.instagram_url), '')   as instagram,
      nullif(trim(v.site_profissional), '') as site,
      nullif(trim(v.youtube_url), '')     as youtube
    from public.vw_aluno_360 v
    where nullif(trim(v.email), '') is not null
    order by lower(v.email), v.atualizado_em desc nulls last
  ),
  -- Reconcilia com perfis já existentes (por thb_id OU por e-mail).
  matched as (
    select f.*, p.id as perfil_id
    from fonte f
    left join rede.perfis p
      on p.thb_id = f.thb_id
      or (p.thb_id is null and p.email is not null and lower(p.email) = f.email)
  ),
  -- UPDATE dos que já existem. Não sobrescreve dados que o aluno editou:
  -- só reescreve qualificação (comercial, sempre da fonte) e campos ainda vazios.
  upd as (
    update rede.perfis p set
      qualificacao = m.qualificacao,          -- eixo comercial: fonte manda
      plano_thb    = m.plano_thb,
      thb_id       = m.thb_id,
      origem_thb   = true,
      aluno_thb_email = m.email,
      nome      = coalesce(nullif(p.nome, ''), m.nome, p.nome),
      whatsapp  = coalesce(nullif(p.whatsapp, ''), m.whatsapp, p.whatsapp),
      profissao = coalesce(nullif(p.profissao, ''), m.profissao, p.profissao),
      cidade    = coalesce(nullif(p.cidade, ''), m.cidade, p.cidade),
      uf        = coalesce(p.uf, m.uf),
      instagram = coalesce(nullif(p.instagram, ''), m.instagram, p.instagram),
      site      = coalesce(nullif(p.site, ''), m.site, p.site),
      atualizado_em = now()
    from matched m
    where p.id = m.perfil_id and m.perfil_id is not null
    returning 1
  ),
  -- INSERT dos novos (aluno espelhado sem perfil ainda). status=aprovado.
  ins as (
    insert into rede.perfis (
      nome, email, aluno_thb_email, whatsapp, profissao, cidade, uf,
      instagram, site, qualificacao, plano_thb, thb_id, origem_thb,
      papel, status, slug
    )
    select
      m.nome, m.email, m.email, m.whatsapp, m.profissao, m.cidade, m.uf,
      m.instagram, m.site, m.qualificacao, m.plano_thb, m.thb_id, true,
      'aluno', 'aprovado',
      -- slug único: base + sufixo curto do thb_id
      rede.slugify(coalesce(m.nome, split_part(m.email,'@',1))) || '-' ||
        substr(replace(m.thb_id::text,'-',''), 1, 6)
    from matched m
    where m.perfil_id is null
    returning 1
  )
  select (select count(*) from ins)::int, (select count(*) from upd)::int
    into v_ins, v_upd;

  inseridos := v_ins;
  atualizados := v_upd;
  return next;
end;
$$;

grant execute on function rede.sync_alunos_thb() to service_role;

comment on function rede.sync_alunos_thb() is
  'Espelha public.vw_aluno_360 → rede.perfis (idempotente). Qualificação via plano. Roda no deploy/cron.';
comment on column rede.perfis.auth_id is 'FK opcional p/ auth.users. Preenchida no login por e-mail. NULL = aluno espelhado ainda sem conta.';
comment on column rede.perfis.oculto is 'Opt-out: aluno pediu p/ não aparecer na vitrine pública.';
comment on column rede.perfis.origem_thb is 'true = veio do espelho da base THB (vw_aluno_360).';
