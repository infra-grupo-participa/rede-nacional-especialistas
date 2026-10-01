-- ============================================================================
-- 0009_reacoes.sql  (aplicar no projeto principal mbvybujpkwuorhtdzcde)
--
-- Reações nos posts, como no Facebook: Curtir, Amei, Risada, Uau, Triste e
-- Raiva. Cada membro tem UMA reação por post (a linha de rede.votos que já
-- existia); a reação é o tipo dela. O post guarda a contagem por tipo em
-- posts.reacoes, mantida pelo mesmo gatilho que já mantinha posts.score.
--
-- Aditiva e idempotente: coluna nova com padrão, gatilho recriado.
-- ============================================================================

select set_config('lock_timeout', '5s', true);

-- tipo da reação no voto (voto antigo vira "curtir")
alter table rede.votos
  add column if not exists reacao text not null default 'curtir';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'votos_reacao_check' and conrelid = 'rede.votos'::regclass) then
    alter table rede.votos
      add constraint votos_reacao_check check (reacao in ('curtir', 'amei', 'risada', 'uau', 'triste', 'raiva'));
  end if;
end $$;

-- contagem por tipo no post: {"curtir": 3, "amei": 1}
alter table rede.posts
  add column if not exists reacoes jsonb not null default '{}'::jsonb;

comment on column rede.votos.reacao is 'Tipo da reação (curtir, amei, risada, uau, triste, raiva). Uma por membro e por post.';
comment on column rede.posts.reacoes is 'Contagem de reações por tipo. Desnormalizado, mantido pelo gatilho de rede.votos.';

-- score e reacoes são do SISTEMA: só o gatilho de votos grava. O autor do post
-- (que pode editar título e corpo) não consegue alterar nenhum dos dois; antes
-- desta migration o score aceitava UPDATE direto do autor.
create or replace function rede.guard_post_update()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  if coalesce(current_setting('rede.recalculando', true), '') <> '1' then
    new.score   := old.score;
    new.reacoes := old.reacoes;
  end if;

  if rede.is_rede_admin() or auth.uid() is null then
    if new.fixado and not old.fixado then new.fixado_em := now(); end if;
    if not new.fixado then new.fixado_em := null; end if;
    if new.status is distinct from old.status and old.status = 'pendente' then
      new.moderado_em := now();
    end if;
    return new;
  end if;
  new.status               := old.status;
  new.fixado               := old.fixado;
  new.fixado_em            := old.fixado_em;
  new.comentarios_travados := old.comentarios_travados;
  new.travado_motivo       := old.travado_motivo;
  new.retido_por           := old.retido_por;
  new.moderado_em          := old.moderado_em;
  return new;
end;
$$;

-- gatilho de votos: recalcula o score e a contagem por tipo
create or replace function rede.recalc_score()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare
  v_post uuid := coalesce(new.post_id, old.post_id);
begin
  perform set_config('rede.recalculando', '1', true);
  update rede.posts p
     set score   = coalesce((select sum(v.valor) from rede.votos v where v.post_id = v_post), 0),
         reacoes = coalesce((
           select jsonb_object_agg(t.reacao, t.n)
             from (select v.reacao, count(*) as n
                     from rede.votos v
                    where v.post_id = v_post and v.valor > 0
                    group by v.reacao) t
         ), '{}'::jsonb)
   where p.id = v_post;
  perform set_config('rede.recalculando', '', true);
  return null;
end;
$$;

revoke all on function rede.recalc_score() from public, anon, authenticated;
revoke all on function rede.guard_post_update() from public, anon, authenticated;

-- contagem inicial dos posts que já têm voto (num bloco só: o sinal de
-- "recalculando" vale apenas dentro da transação)
do $$
begin
  perform set_config('rede.recalculando', '1', true);
  update rede.posts p
     set reacoes = coalesce((
       select jsonb_object_agg(t.reacao, t.n)
         from (select v.reacao, count(*) as n
                 from rede.votos v
                where v.post_id = p.id and v.valor > 0
                group by v.reacao) t
     ), '{}'::jsonb)
   where exists (select 1 from rede.votos v where v.post_id = p.id);
  perform set_config('rede.recalculando', '', true);
end $$;

-- unir conta nova ao cadastro da base: a reação vai junto com o voto
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
  insert into rede.votos (post_id, perfil_id, valor, reacao, criado_em)
    select post_id, v_base.id, valor, reacao, criado_em from rede.votos where perfil_id = v_de.id
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

notify pgrst, 'reload schema';
