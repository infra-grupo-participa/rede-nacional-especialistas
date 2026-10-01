-- ============================================================================
-- 0011_guarda_campos_post.sql  (aplicar no projeto principal mbvybujpkwuorhtdzcde)
--
-- Fecha o que o autor ainda conseguia regravar no próprio post por UPDATE
-- direto na API: a data de criação e a de última atividade (o post ficaria
-- preso no topo das duas ordens da Discussão, o que só a coordenação faz ao
-- fixar), a contagem de comentários, as hashtags, o tipo e o autor.
--
--   n_comentarios e ultima_atividade_em: só os gatilhos dos comentários gravam
--     (mesmo sinal 'rede.recalculando' que já protege score e reacoes);
--   criado_em, tipo, autor_id e hashtags: só a coordenação muda. As hashtags
--     continuam sendo recalculadas pelo gatilho de moderação quando o título
--     ou o texto mudam (ele roda depois deste).
--
-- Também serializa a contagem de reações: duas reações ao mesmo post no mesmo
-- instante podiam gravar a contagem sem uma delas.
--
-- Não muda tabela nem política. Idempotente.
-- ============================================================================

create or replace function rede.guard_post_update()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  -- campos do sistema: só os gatilhos de votos e de comentários gravam
  if coalesce(current_setting('rede.recalculando', true), '') <> '1' then
    new.score               := old.score;
    new.reacoes             := old.reacoes;
    new.n_comentarios       := old.n_comentarios;
    new.ultima_atividade_em := old.ultima_atividade_em;
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
  new.criado_em            := old.criado_em;
  new.tipo                 := old.tipo;
  new.autor_id             := old.autor_id;
  new.hashtags             := old.hashtags;
  return new;
end;
$$;

create or replace function rede.recalc_n_comentarios()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare v_post uuid := coalesce(new.post_id, old.post_id);
begin
  perform set_config('rede.recalculando', '1', true);
  update rede.posts p
     set n_comentarios = (select count(*) from rede.comentarios c where c.post_id = v_post)
   where p.id = v_post;
  perform set_config('rede.recalculando', '', true);
  return null;
end;
$$;

create or replace function rede.subir_atividade_post()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  perform set_config('rede.recalculando', '1', true);
  update rede.posts set ultima_atividade_em = greatest(ultima_atividade_em, new.criado_em)
   where id = new.post_id;
  perform set_config('rede.recalculando', '', true);
  return null;
end;
$$;

create or replace function rede.recalc_score()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare
  v_post uuid := coalesce(new.post_id, old.post_id);
begin
  -- Trava a linha do post ANTES de contar: duas reações simultâneas passam uma
  -- de cada vez e a segunda já enxerga o voto da primeira. É a mesma trava do
  -- UPDATE abaixo (não conflita com a da chave estrangeira de votos).
  perform 1 from rede.posts p where p.id = v_post for no key update;
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

-- As funções de gatilho não são chamáveis pela API.
revoke all on function rede.guard_post_update()    from public, anon, authenticated;
revoke all on function rede.recalc_n_comentarios() from public, anon, authenticated;
revoke all on function rede.subir_atividade_post() from public, anon, authenticated;
revoke all on function rede.recalc_score()         from public, anon, authenticated;
