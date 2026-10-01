-- ============================================================================
-- Rede Nacional de Especialistas — Migration 0008: perfil verificado
--
-- Selo laranja com check preto ao lado do nome (pedido do Iromar, 01/10/2026).
-- É um atestado da coordenação: só admin liga e desliga. Não confundir com
-- `certificado` (formado pelo Espaço de Instrução) nem com a qualificação.
--
-- Aditiva. O código antigo não conhece a coluna e segue funcionando.
--
-- Aplicar como UM lote (uma transação): o lock_timeout abaixo e o "tudo ou
-- nada" dependem disso. Reaplicável.
--
-- De passagem, fecha pontas que a revisão de segurança apontou:
--   * o dono do perfil ainda conseguia gravar certificado/thb_id/plano_thb;
--   * perfil sem login não pode ter selo (quem cadastrar aquele e-mail herdaria);
--   * sync_alunos_thb() estava executável por anon/authenticated via RPC;
--   * liga o Realtime nas tabelas da rede (em produção nenhuma estava ligada).
-- ============================================================================

select set_config('lock_timeout', '5s', true);

alter table rede.perfis add column if not exists verificado boolean not null default false;

-- Poucos perfis são verificados: índice parcial para a lista de ids que a
-- vitrine e o ranking consultam (as views de lá não trazem a coluna).
create index if not exists perfis_verificado_idx on rede.perfis (id) where verificado;

-- ---- UPDATE: o dono não se autoverifica ------------------------------------
-- Mesma função de produção (lida em 30/09/2026) + a linha do `verificado`.
create or replace function rede.guard_perfil_update()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  -- Selo exige conta: perfil espelhado da base (sem login) é assumido por quem
  -- cadastrar aquele e-mail, e não pode entregar o selo junto. Vale para todos,
  -- inclusive admin e sistema.
  if new.auth_id is null then new.verificado := false; end if;
  if rede.is_rede_admin() or auth.uid() is null then return new; end if;
  if new.papel        is distinct from old.papel        then new.papel        := old.papel;        end if;
  if new.qualificacao is distinct from old.qualificacao then new.qualificacao := old.qualificacao; end if;
  if new.status       is distinct from old.status       then new.status       := old.status;       end if;
  if new.xp           is distinct from old.xp           then new.xp           := old.xp;           end if;
  if new.nivel_gam    is distinct from old.nivel_gam    then new.nivel_gam    := old.nivel_gam;    end if;
  if new.auth_id      is distinct from old.auth_id      then new.auth_id      := old.auth_id;      end if;
  if new.origem_thb   is distinct from old.origem_thb   then new.origem_thb   := old.origem_thb;   end if;
  if new.verificado   is distinct from old.verificado   then new.verificado   := old.verificado;   end if;
  -- atestados e vínculo comercial: só a coordenação e o sync mexem
  if new.certificado     is distinct from old.certificado     then new.certificado     := old.certificado;     end if;
  if new.thb_id          is distinct from old.thb_id          then new.thb_id          := old.thb_id;          end if;
  if new.plano_thb       is distinct from old.plano_thb       then new.plano_thb       := old.plano_thb;       end if;
  if new.aluno_thb_email is distinct from old.aluno_thb_email then new.aluno_thb_email := old.aluno_thb_email; end if;
  new.atualizado_em := now();
  return new;
end;
$$;

revoke all on function rede.guard_perfil_update() from public, anon, authenticated;

-- ---- INSERT: perfil criado pelo próprio usuário nunca nasce verificado -----
-- A política perfis_insert_self confere papel/status/qualificação, mas não
-- conhece a coluna nova. Um gatilho resolve sem mexer na política.
create or replace function rede.guard_perfil_insert()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  if new.auth_id is null then new.verificado := false; end if;
  if not (rede.is_rede_admin() or auth.uid() is null) then
    new.verificado      := false;
    new.certificado     := false;
    new.xp              := 0;
    new.nivel_gam       := 1;
    new.origem_thb      := false;
    new.thb_id          := null;
    new.plano_thb       := null;
    new.aluno_thb_email := null;
  end if;
  return new;
end;
$$;

revoke all on function rede.guard_perfil_insert() from public, anon, authenticated;

drop trigger if exists trg_guard_perfil_insert on rede.perfis;
create trigger trg_guard_perfil_insert
  before insert on rede.perfis
  for each row execute function rede.guard_perfil_insert();

-- ---- Registro: verificar/desverificar é ato da coordenação -----------------
create or replace function rede.log_perfis()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  if not rede.ator_admin() then
    return new;
  end if;
  if new.status is distinct from old.status then
    perform rede.registrar_log('membro.status', 'membro', new.id, new.nome,
      jsonb_build_object('de', old.status, 'para', new.status));
  end if;
  if new.qualificacao is distinct from old.qualificacao then
    perform rede.registrar_log('membro.nivel', 'membro', new.id, new.nome,
      jsonb_build_object('de', old.qualificacao, 'para', new.qualificacao));
  end if;
  if new.papel is distinct from old.papel then
    perform rede.registrar_log('membro.papel', 'membro', new.id, new.nome,
      jsonb_build_object('de', old.papel, 'para', new.papel));
  end if;
  if new.verificado is distinct from old.verificado then
    perform rede.registrar_log(case when new.verificado then 'membro.verificado' else 'membro.desverificado' end,
      'membro', new.id, new.nome);
  end if;
  if new.oculto is distinct from old.oculto and new.auth_id is distinct from auth.uid() then
    perform rede.registrar_log('membro.visibilidade', 'membro', new.id, new.nome,
      jsonb_build_object('oculto', new.oculto));
  end if;
  return new;
end;
$$;

-- ---- Vínculo com a base: o selo acompanha a pessoa -------------------------
-- vincular_a_base() apaga o perfil de origem; sem isto o selo se perderia.
create or replace function rede.vincular_a_base(p_perfil uuid, p_perfil_base uuid)
returns uuid language plpgsql security definer set search_path = rede, public as $$
declare
  v_de   rede.perfis;
  v_base rede.perfis;
  v_auth uuid;
  v_slug text;
begin
  if not rede.is_rede_admin() then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;

  select * into v_de   from rede.perfis where id = p_perfil      for update;
  select * into v_base from rede.perfis where id = p_perfil_base for update;
  if v_de.id is null or v_base.id is null or v_de.id = v_base.id then
    raise exception 'perfis_invalidos' using errcode = 'P0001';
  end if;
  if v_base.auth_id is not null then
    raise exception 'base_ja_tem_login' using errcode = 'P0001',
      hint = 'O perfil da base já está ligado a outra conta.';
  end if;
  if not v_base.origem_thb then
    raise exception 'destino_nao_e_da_base' using errcode = 'P0001';
  end if;

  v_auth := v_de.auth_id;
  -- Mantém o endereço público de quem já estava ativo na rede.
  v_slug := case when v_de.status = 'aprovado' and v_de.slug is not null then v_de.slug else v_base.slug end;

  -- Conteúdo e histórico mudam de dono.
  update rede.posts              set autor_id  = v_base.id where autor_id  = v_de.id;
  update rede.comentarios        set autor_id  = v_base.id where autor_id  = v_de.id;
  update rede.artigos            set autor_id  = v_base.id where autor_id  = v_de.id;
  update rede.artigo_comentarios set autor_id  = v_base.id where autor_id  = v_de.id;
  update rede.arquivos           set autor_id  = v_base.id where autor_id  = v_de.id;
  update rede.pedidos_entrada    set perfil_id = v_base.id where perfil_id = v_de.id;
  insert into rede.votos (post_id, perfil_id, valor, criado_em)
    select post_id, v_base.id, valor, criado_em from rede.votos where perfil_id = v_de.id
  on conflict (post_id, perfil_id) do nothing;
  delete from rede.votos where perfil_id = v_de.id;
  insert into rede.acessos_diarios as a (perfil_id, dia, n, primeiro_em, ultimo_em, estimado)
    select v_base.id, x.dia, x.n, x.primeiro_em, x.ultimo_em, x.estimado
      from rede.acessos_diarios x where x.perfil_id = v_de.id
  on conflict (perfil_id, dia) do update
    set n = a.n + excluded.n,
        primeiro_em = least(a.primeiro_em, excluded.primeiro_em),
        ultimo_em = greatest(a.ultimo_em, excluded.ultimo_em),
        estimado = a.estimado and excluded.estimado;
  delete from rede.acessos_diarios where perfil_id = v_de.id;

  -- Solta as chaves únicas do perfil de origem antes de passá-las adiante.
  -- O slug não pode ir para NULL: o gatilho perfil_slug_guard (produção) o
  -- regeneraria com a mesma fórmula e o slug colidiria logo abaixo.
  update rede.perfis set auth_id = null, slug = 'vinculado-' || replace(id::text, '-', '')
   where id = v_de.id;

  -- O que o membro preencheu vence o que veio da base; o nível e o vínculo
  -- comercial (qualificacao, thb_id, plano_thb) são sempre os da base.
  update rede.perfis b set
    auth_id    = v_auth,
    slug       = v_slug,
    status     = case when v_de.status = 'suspenso' then 'suspenso'::rede.status_perfil else 'aprovado'::rede.status_perfil end,
    papel      = case when v_de.papel = 'admin' then 'admin'::rede.papel else b.papel end,
    nome       = coalesce(nullif(v_de.nome, ''), b.nome),
    profissao  = coalesce(nullif(v_de.profissao, ''), b.profissao),
    bio        = coalesce(nullif(v_de.bio, ''), b.bio),
    cidade     = coalesce(nullif(v_de.cidade, ''), b.cidade),
    uf         = coalesce(v_de.uf, b.uf),
    whatsapp   = coalesce(nullif(v_de.whatsapp, ''), b.whatsapp),
    telefone   = coalesce(nullif(v_de.telefone, ''), b.telefone),
    avatar_url = coalesce(nullif(v_de.avatar_url, ''), b.avatar_url),
    capa_url   = coalesce(nullif(v_de.capa_url, ''), b.capa_url),
    instagram  = coalesce(nullif(v_de.instagram, ''), b.instagram),
    linkedin   = coalesce(nullif(v_de.linkedin, ''), b.linkedin),
    site       = coalesce(nullif(v_de.site, ''), b.site),
    xp         = greatest(b.xp, v_de.xp),
    oculto     = v_de.oculto or b.oculto,
    verificado = v_de.verificado or b.verificado
  where b.id = v_base.id;

  update rede.pedidos_entrada
     set status = 'aprovado', decidido_em = now(), decidido_por = rede.meu_perfil_id(),
         motivo = 'Vinculado ao cadastro da base de alunos.'
   where perfil_id = v_base.id and status = 'pendente';

  perform rede.registrar_log('membro.vinculado_base', 'membro', v_base.id, coalesce(nullif(v_de.nome, ''), v_base.nome),
    jsonb_build_object('perfil_origem', v_de.id, 'email_login', v_de.email,
                       'email_base', v_base.email, 'qualificacao', v_base.qualificacao));

  delete from rede.perfis where id = v_de.id;
  return v_base.id;
end;
$$;

revoke all on function rede.vincular_a_base(uuid, uuid) from public, anon;
grant execute on function rede.vincular_a_base(uuid, uuid) to authenticated;

-- ---- sync da base: só o dono (cron) e a coordenação (via admin_sincronizar_base) ----
revoke all on function rede.sync_alunos_thb() from public, anon, authenticated;
grant execute on function rede.sync_alunos_thb() to service_role;

-- ---- Realtime -----------------------------------------------------------------
-- Em produção (lido em 01/10/2026) a publication supabase_realtime só tinha
-- tabelas do schema `central`: os blocos da 0004/0005 nunca pegaram, e os
-- comentários ao vivo da rede nunca funcionaram. Liga as três tabelas que o
-- app escuta: comentários (novo comentário aparece), comentários de artigo e
-- posts (trava/liberação dos comentários ao vivo).
do $$
declare t text;
begin
  foreach t in array array['posts', 'comentarios', 'artigo_comentarios'] loop
    if not exists (select 1 from pg_publication_tables
                    where pubname = 'supabase_realtime' and schemaname = 'rede' and tablename = t) then
      execute format('alter publication supabase_realtime add table rede.%I', t);
    end if;
  end loop;
end $$;

comment on column rede.perfis.verificado is
  'Perfil verificado pela coordenação (selo laranja com check preto ao lado do nome). Só admin altera.';

notify pgrst, 'reload schema';
