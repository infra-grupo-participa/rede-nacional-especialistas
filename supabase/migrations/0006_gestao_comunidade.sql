-- ============================================================================
-- Rede Nacional de Especialistas — Migration 0006: gestão da comunidade
--
-- Origem: documento "Comunidade THB no Facebook: mapeamento de funcionalidades
-- e necessidades" (30/09/2026). A rede passa a entregar o que o grupo do
-- Facebook entrega e o que ele não consegue entregar:
--
--   Já existia no grupo (e precisa continuar):
--     filtro de feed (novos posts × atividade recente) · trava de comentários
--     por publicação · questionário de entrada (3 perguntas) + aprovação ·
--     regras do grupo · posts fixados · palavras-chave que mandam o post para
--     aprovação · aba de arquivos e mídias · registro de atividades dos admins ·
--     insights do grupo
--
--   Faltava (ficha por aluno):
--     relatório de participação por membro · posts · comentários · reações ·
--     primeiro e último acesso (inclusive de quem só lê) · tag de nível ·
--     lista de inativos · exportação · cruzamento com a base de alunos
--
-- Tudo aditivo. Nenhuma coluna existente muda de tipo e nenhuma linha é
-- apagada. As exceções, conscientes, são duas políticas de leitura (posts e
-- comentários passam a ser só de membros aprovados, como num grupo privado).
--
-- Convenções desta migration:
--   * Toda função nova nasce PÚBLICA neste schema (default privileges da 0001).
--     Por isso cada função recebe REVOKE de public/anon e GRANT explícito.
--   * "Dia" é sempre o dia civil de São Paulo (America/Sao_Paulo).
--   * search_path inclui `extensions` porque é lá que o Supabase instala o
--     unaccent; sem isso a normalização de texto quebra dentro das funções.
-- ============================================================================


-- ============================================================================
-- 0. Utilitários de texto
-- ============================================================================

-- Texto normalizado para comparação: minúsculo, sem acento, só [a-z0-9] e
-- espaços simples. "Pix!!" e "PIX" viram "pix"; "É golpe?" vira "e golpe".
create or replace function rede.normalizar(t text)
returns text language sql immutable set search_path = rede, public, extensions as $$
  select trim(regexp_replace(lower(unaccent(coalesce(t, ''))), '[^a-z0-9]+', ' ', 'g'));
$$;

-- Hashtags de um texto, normalizadas e sem o "#": "#Dúvida #caso" → {duvida,caso}.
create or replace function rede.extrair_hashtags(t text)
returns text[] language sql immutable set search_path = rede, public, extensions as $$
  select coalesce(array_agg(distinct h), '{}')
  from (
    select rede.normalizar(m[1]) as h
    from regexp_matches(coalesce(t, ''), '#([[:alnum:]_À-ÿ]+)', 'g') as m
  ) x
  where h <> '';
$$;

-- Telefone canônico para casar cadastros: só DDD + 8 dígitos. Tira o DDI 55
-- e o nono dígito, que aparecem ou somem conforme o sistema de origem.
--   "+55 (11) 98765-4321" → "1187654321"   "11987654321" → "1187654321"
create or replace function rede.fone_canonico(t text)
returns text language sql immutable as $$
  select case
    when length(d) = 11 and substr(d, 3, 1) = '9' then substr(d, 1, 2) || substr(d, 4)
    when length(d) = 10 then d
    else null
  end
  from (
    select case
      when length(x) in (12, 13) and x like '55%' then substr(x, 3)
      else x
    end as d
    from (select regexp_replace(coalesce(t, ''), '\D', '', 'g') as x) a
  ) b;
$$;

revoke all on function rede.normalizar(text)        from public, anon;
revoke all on function rede.extrair_hashtags(text)  from public, anon;
revoke all on function rede.fone_canonico(text)     from public, anon;
grant execute on function rede.normalizar(text)       to authenticated, service_role;
grant execute on function rede.extrair_hashtags(text) to authenticated, service_role;
grant execute on function rede.fone_canonico(text)    to authenticated, service_role;


-- ============================================================================
-- 1. Registro de atividades da moderação (auditoria)
--    Criado primeiro porque os gatilhos das seções seguintes escrevem nele.
-- ============================================================================

create table if not exists rede.log_moderacao (
  id          bigint generated always as identity primary key,
  ator_id     uuid references rede.perfis(id) on delete set null,
  ator_nome   text not null default '',
  acao        text not null,
  alvo_tipo   text not null default '',
  alvo_id     uuid,
  alvo_rotulo text not null default '',
  detalhes    jsonb not null default '{}'::jsonb,
  criado_em   timestamptz not null default now()
);

create index if not exists log_mod_criado_idx on rede.log_moderacao (criado_em desc);
create index if not exists log_mod_ator_idx   on rede.log_moderacao (ator_id, criado_em desc);
create index if not exists log_mod_acao_idx   on rede.log_moderacao (acao, criado_em desc);

alter table rede.log_moderacao enable row level security;

-- Só admin lê. Ninguém insere, altera ou apaga pela API: o registro é imutável
-- e só nasce pelas funções abaixo (SECURITY DEFINER).
drop policy if exists log_mod_select on rede.log_moderacao;
create policy log_mod_select on rede.log_moderacao
  for select using (rede.is_rede_admin());

-- Grava uma linha em nome de quem está logado. Uso interno (gatilhos e RPCs).
create or replace function rede.registrar_log(
  p_acao        text,
  p_alvo_tipo   text,
  p_alvo_id     uuid,
  p_alvo_rotulo text,
  p_detalhes    jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = rede, public as $$
declare
  v_ator uuid := rede.meu_perfil_id();
  v_nome text;
begin
  select nome into v_nome from rede.perfis where id = v_ator;
  insert into rede.log_moderacao (ator_id, ator_nome, acao, alvo_tipo, alvo_id, alvo_rotulo, detalhes)
  values (v_ator, coalesce(v_nome, case when auth.uid() is null then 'Sistema' else '' end),
          p_acao, coalesce(p_alvo_tipo, ''), p_alvo_id, left(coalesce(p_alvo_rotulo, ''), 200),
          coalesce(p_detalhes, '{}'::jsonb));
end;
$$;

revoke all on function rede.registrar_log(text, text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function rede.registrar_log(text, text, uuid, text, jsonb) to service_role;

-- true quando quem dispara é um admin humano (não o service_role nem um cron).
create or replace function rede.ator_admin()
returns boolean language sql stable security definer set search_path = rede, public as $$
  select auth.uid() is not null and rede.is_rede_admin();
$$;
revoke all on function rede.ator_admin() from public, anon;
grant execute on function rede.ator_admin() to authenticated, service_role;

comment on table rede.log_moderacao is
  'Auditoria da moderação: quem (admin) fez o quê, em quem, quando. Imutável; só nasce por gatilho/RPC.';


-- ============================================================================
-- 2. Configuração da comunidade: regras, perguntas de entrada, hashtags
-- ============================================================================

create table if not exists rede.config_comunidade (
  id              smallint primary key default 1 check (id = 1),
  regras          text   not null default '',
  -- As perguntas obrigatórias do pedido de entrada, em ordem: ["...", "...", "..."].
  perguntas       jsonb  not null default '[]'::jsonb,
  -- Hashtags aceitas (normalizadas, sem "#"). Vazio = qualquer hashtag vale.
  hashtags        text[] not null default '{}',
  -- Liga a "regra da #": post sem hashtag válida nasce com os comentários travados.
  exigir_hashtag  boolean not null default false,
  -- Quando o rastreio de acesso entrou no ar. Primeiro acesso anterior a isso
  -- é reconstruído da atividade antiga e sai marcado como estimado.
  rastreio_desde  timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  atualizado_por  uuid references rede.perfis(id) on delete set null
);

insert into rede.config_comunidade (id, regras, perguntas)
values (
  1,
  $regras$1. Respeito sempre. Discorde da ideia, nunca da pessoa.
2. Comece o post com a hashtag do tema. Post fora da regra da # pode ter os comentários travados.
3. Nada de venda, divulgação de serviço ou captação de clientes em posts e comentários.
4. Não exponha dados de clientes. Casos reais só com nomes e valores trocados.
5. Aulas, materiais e modelos do THB são exclusivos dos alunos. Não compartilhe fora da comunidade.
6. A moderação pode reter, travar ou remover publicações que fujam destas regras.$regras$,
  jsonb_build_array(
    'Com qual e-mail ou telefone você comprou seu produto do Time Holding Brasil?',
    'De qual programa do THB você participa? (ex.: Aurum, Platina, Diamante, Diamante Vermelho, Imersão, Curso)',
    'Qual a sua profissão e em qual cidade você atua?'
  )
)
on conflict (id) do nothing;

alter table rede.config_comunidade add column if not exists rastreio_desde timestamptz not null default now();

alter table rede.config_comunidade enable row level security;

-- Regras e perguntas são lidas antes da aprovação (e até sem login, na tela
-- de cadastro). Não há nada sensível aqui: as palavras-chave de moderação
-- ficam em outra tabela, fechada.
drop policy if exists config_select on rede.config_comunidade;
create policy config_select on rede.config_comunidade
  for select using (true);

drop policy if exists config_update on rede.config_comunidade;
create policy config_update on rede.config_comunidade
  for update using (rede.is_rede_admin()) with check (rede.is_rede_admin());

create or replace function rede.log_config()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare v_campos text[] := '{}';
begin
  new.atualizado_em := now();
  new.atualizado_por := rede.meu_perfil_id();
  if new.regras         is distinct from old.regras         then v_campos := array_append(v_campos, 'regras'); end if;
  if new.perguntas      is distinct from old.perguntas      then v_campos := array_append(v_campos, 'perguntas'); end if;
  if new.hashtags       is distinct from old.hashtags       then v_campos := array_append(v_campos, 'hashtags'); end if;
  if new.exigir_hashtag is distinct from old.exigir_hashtag then v_campos := array_append(v_campos, 'exigir_hashtag'); end if;
  if array_length(v_campos, 1) > 0 and rede.ator_admin() then
    perform rede.registrar_log('config.alterada', 'config', null, array_to_string(v_campos, ', '),
      jsonb_build_object('campos', v_campos,
                         'hashtags', new.hashtags,
                         'exigir_hashtag', new.exigir_hashtag));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_config on rede.config_comunidade;
create trigger trg_log_config
  before update on rede.config_comunidade
  for each row execute function rede.log_config();


-- ============================================================================
-- 3. Palavras-chave que mandam o post para aprovação
-- ============================================================================

create table if not exists rede.palavras_moderacao (
  id          uuid primary key default gen_random_uuid(),
  termo       text not null check (char_length(trim(termo)) between 2 and 80),
  criado_em   timestamptz not null default now(),
  criado_por  uuid references rede.perfis(id) on delete set null
);

create unique index if not exists palavras_termo_uidx
  on rede.palavras_moderacao (rede.normalizar(termo));

alter table rede.palavras_moderacao enable row level security;

-- Fechada para todos menos admin: se a lista fosse pública, bastaria ler para
-- escrever a palavra de um jeito que escapa do filtro.
drop policy if exists palavras_admin on rede.palavras_moderacao;
create policy palavras_admin on rede.palavras_moderacao
  for all using (rede.is_rede_admin()) with check (rede.is_rede_admin());

create or replace function rede.log_palavras()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  if not rede.ator_admin() then
    return coalesce(new, old);
  end if;
  if tg_op = 'INSERT' then
    perform rede.registrar_log('palavra.adicionada', 'palavra', new.id, new.termo);
  elsif tg_op = 'DELETE' then
    perform rede.registrar_log('palavra.removida', 'palavra', old.id, old.termo);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_log_palavras on rede.palavras_moderacao;
create trigger trg_log_palavras
  after insert or delete on rede.palavras_moderacao
  for each row execute function rede.log_palavras();

-- Termos da lista que aparecem no texto (casamento por palavra inteira, sem
-- acento e sem caixa: "pix" pega "PIX" e "Pix!", mas não "pixel").
create or replace function rede.termos_retidos(p_texto text)
returns text[] language sql stable security definer set search_path = rede, public, extensions as $$
  select coalesce(array_agg(pm.termo order by pm.termo), '{}')
  from rede.palavras_moderacao pm
  where (' ' || rede.normalizar(p_texto) || ' ') like ('% ' || rede.normalizar(pm.termo) || ' %');
$$;
revoke all on function rede.termos_retidos(text) from public, anon, authenticated;
grant execute on function rede.termos_retidos(text) to service_role;


-- ============================================================================
-- 4. Posts: fixados, trava de comentários, hashtags, retenção, atividade
-- ============================================================================

alter table rede.posts add column if not exists fixado               boolean     not null default false;
alter table rede.posts add column if not exists fixado_em            timestamptz;
alter table rede.posts add column if not exists comentarios_travados boolean     not null default false;
alter table rede.posts add column if not exists travado_motivo       text        not null default '';
alter table rede.posts add column if not exists hashtags             text[]      not null default '{}';
alter table rede.posts add column if not exists retido_por           text[]     not null default '{}';
alter table rede.posts add column if not exists moderado_em          timestamptz;
alter table rede.posts add column if not exists ultima_atividade_em  timestamptz;

-- "Atividade recente" do Facebook: o post sobe quando alguém comenta nele.
update rede.posts p
   set ultima_atividade_em = greatest(
         p.criado_em,
         coalesce((select max(c.criado_em) from rede.comentarios c where c.post_id = p.id), p.criado_em))
 where p.ultima_atividade_em is null;
alter table rede.posts alter column ultima_atividade_em set default now();
alter table rede.posts alter column ultima_atividade_em set not null;

update rede.posts
   set hashtags = rede.extrair_hashtags(coalesce(titulo, '') || ' ' || coalesce(corpo, ''))
 where hashtags = '{}';

create index if not exists posts_atividade_idx on rede.posts (status, ultima_atividade_em desc);
create index if not exists posts_fixado_idx    on rede.posts (fixado_em desc) where fixado;
create index if not exists posts_pendente_idx  on rede.posts (criado_em) where status = 'pendente';

-- Guard (roda PRIMEIRO, pela ordem alfabética do nome do gatilho): o autor
-- comum não mexe em campos de moderação nem no próprio status. Não congela
-- score, n_comentarios nem ultima_atividade_em: esses são reescritos pelos
-- gatilhos de voto e de comentário com o auth.uid() de quem votou/comentou.
create or replace function rede.guard_post_update()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
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

drop trigger if exists trg_posts_a_guard on rede.posts;
create trigger trg_posts_a_guard
  before update on rede.posts
  for each row execute function rede.guard_post_update();

-- Moderação automática (roda DEPOIS do guard): extrai hashtags, retém o post
-- que tem palavra-chave da lista e aplica a regra da #. Admin e sistema não
-- passam pelo filtro.
create or replace function rede.moderar_post()
returns trigger language plpgsql security definer set search_path = rede, public, extensions as $$
declare
  v_texto  text := coalesce(new.titulo, '') || ' ' || coalesce(new.corpo, '');
  v_termos text[];
  v_cfg    rede.config_comunidade;
begin
  new.hashtags := rede.extrair_hashtags(v_texto);

  if rede.is_rede_admin() or auth.uid() is null then
    return new;
  end if;

  v_termos := rede.termos_retidos(v_texto);
  if coalesce(array_length(v_termos, 1), 0) > 0 and new.status = 'publicado' then
    new.status     := 'pendente';
    new.retido_por := v_termos;
  end if;

  if tg_op = 'INSERT' then
    select * into v_cfg from rede.config_comunidade where id = 1;
    if coalesce(v_cfg.exigir_hashtag, false) then
      if coalesce(array_length(new.hashtags, 1), 0) = 0
         or (coalesce(array_length(v_cfg.hashtags, 1), 0) > 0 and not (new.hashtags && v_cfg.hashtags)) then
        new.comentarios_travados := true;
        new.travado_motivo       := 'Post sem a hashtag do tema (regra da #).';
      end if;
    end if;
  end if;

  new.ultima_atividade_em := coalesce(new.ultima_atividade_em, now());
  return new;
end;
$$;

drop trigger if exists trg_posts_b_moderar on rede.posts;
create trigger trg_posts_b_moderar
  before insert or update of titulo, corpo on rede.posts
  for each row execute function rede.moderar_post();

-- Auditoria de posts: aprovação/recusa da fila, remoção, fixar, travar.
create or replace function rede.log_posts()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare
  v_rotulo text;
  v_autor  text;
begin
  if not rede.ator_admin() then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.autor_id is distinct from rede.meu_perfil_id() then
      select nome into v_autor from rede.perfis where id = old.autor_id;
      perform rede.registrar_log('post.apagado', 'post', old.id,
        coalesce(nullif(old.titulo, ''), left(old.corpo, 80)),
        jsonb_build_object('autor_id', old.autor_id, 'autor', v_autor,
                           'trecho', left(old.corpo, 300), 'status', old.status));
    end if;
    return old;
  end if;

  v_rotulo := coalesce(nullif(new.titulo, ''), left(new.corpo, 80));

  if new.status is distinct from old.status then
    perform rede.registrar_log(
      case
        when old.status = 'pendente' and new.status = 'publicado' then 'post.aprovado'
        when new.status = 'recusado' then 'post.recusado'
        when new.status = 'removido' then 'post.removido'
        when new.status = 'publicado' then 'post.restaurado'
        else 'post.status'
      end,
      'post', new.id, v_rotulo,
      jsonb_build_object('de', old.status, 'para', new.status, 'autor_id', new.autor_id,
                         'retido_por', new.retido_por));
  end if;

  if new.fixado is distinct from old.fixado then
    perform rede.registrar_log(case when new.fixado then 'post.fixado' else 'post.desafixado' end,
      'post', new.id, v_rotulo, jsonb_build_object('autor_id', new.autor_id));
  end if;

  if new.comentarios_travados is distinct from old.comentarios_travados then
    perform rede.registrar_log(
      case when new.comentarios_travados then 'post.comentarios_travados' else 'post.comentarios_liberados' end,
      'post', new.id, v_rotulo,
      jsonb_build_object('autor_id', new.autor_id, 'motivo', new.travado_motivo));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_log_posts on rede.posts;
create trigger trg_log_posts
  after update or delete on rede.posts
  for each row execute function rede.log_posts();


-- ============================================================================
-- 5. Comentários: trava, post precisa estar publicado, sobe a atividade
-- ============================================================================

create or replace function rede.checar_comentario()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare
  v_status rede.status_conteudo;
  v_trav   boolean;
begin
  if rede.is_rede_admin() or auth.uid() is null then
    return new;
  end if;
  select status, comentarios_travados into v_status, v_trav from rede.posts where id = new.post_id;
  if v_status is distinct from 'publicado' then
    raise exception 'post_indisponivel' using errcode = 'P0001',
      hint = 'O post não está publicado.';
  end if;
  if v_trav then
    raise exception 'comentarios_travados' using errcode = 'P0001',
      hint = 'A moderação travou os comentários deste post.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_coment_checar on rede.comentarios;
create trigger trg_coment_checar
  before insert on rede.comentarios
  for each row execute function rede.checar_comentario();

create or replace function rede.subir_atividade_post()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  update rede.posts set ultima_atividade_em = greatest(ultima_atividade_em, new.criado_em)
   where id = new.post_id;
  return null;
end;
$$;

drop trigger if exists trg_coment_atividade on rede.comentarios;
create trigger trg_coment_atividade
  after insert on rede.comentarios
  for each row execute function rede.subir_atividade_post();

create or replace function rede.log_comentarios()
returns trigger language plpgsql security definer set search_path = rede, public as $$
declare v_autor text;
begin
  if rede.ator_admin() and old.autor_id is distinct from rede.meu_perfil_id() then
    select nome into v_autor from rede.perfis where id = old.autor_id;
    perform rede.registrar_log(
      case when tg_table_name = 'artigo_comentarios' then 'comentario_artigo.apagado' else 'comentario.apagado' end,
      'comentario', old.id, left(coalesce(to_jsonb(old)->>'corpo', to_jsonb(old)->>'texto', ''), 80),
      jsonb_build_object('autor_id', old.autor_id, 'autor', v_autor,
                         'trecho', left(coalesce(to_jsonb(old)->>'corpo', to_jsonb(old)->>'texto', ''), 300)));
  end if;
  return old;
end;
$$;

drop trigger if exists trg_log_comentarios on rede.comentarios;
create trigger trg_log_comentarios
  after delete on rede.comentarios
  for each row execute function rede.log_comentarios();

drop trigger if exists trg_log_artigo_comentarios on rede.artigo_comentarios;
create trigger trg_log_artigo_comentarios
  after delete on rede.artigo_comentarios
  for each row execute function rede.log_comentarios();


-- ============================================================================
-- 6. Leitura de posts e comentários só para membros (grupo privado)
--    Antes: qualquer visitante lia o feed. O grupo do Facebook é privado, e o
--    questionário de entrada só faz sentido se o conteúdo for fechado.
--    Artigos (newsletter) e vitrine continuam públicos.
-- ============================================================================

drop policy if exists posts_select on rede.posts;
create policy posts_select on rede.posts
  for select using (
    (status = 'publicado' and rede.is_rede_aprovado())
    or autor_id = rede.meu_perfil_id()
    or rede.is_rede_admin()
  );

drop policy if exists coment_select on rede.comentarios;
create policy coment_select on rede.comentarios
  for select using (
    (rede.is_rede_aprovado()
      and exists (select 1 from rede.posts p where p.id = post_id and p.status = 'publicado'))
    or autor_id = rede.meu_perfil_id()
    or rede.is_rede_admin()
  );


-- ============================================================================
-- 7. Auditoria de membros e artigos
-- ============================================================================

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
  if new.oculto is distinct from old.oculto and new.auth_id is distinct from auth.uid() then
    perform rede.registrar_log('membro.visibilidade', 'membro', new.id, new.nome,
      jsonb_build_object('oculto', new.oculto));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_perfis on rede.perfis;
create trigger trg_log_perfis
  after update on rede.perfis
  for each row execute function rede.log_perfis();

create or replace function rede.log_artigos()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  if not rede.ator_admin() then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    if old.autor_id is distinct from rede.meu_perfil_id() then
      perform rede.registrar_log('artigo.apagado', 'artigo', old.id, old.titulo,
        jsonb_build_object('autor_id', old.autor_id, 'status', old.status));
    end if;
    return old;
  end if;
  if new.status is distinct from old.status and new.status in ('publicado', 'ajustes') then
    perform rede.registrar_log(case when new.status = 'publicado' then 'artigo.publicado' else 'artigo.ajustes' end,
      'artigo', new.id, new.titulo,
      jsonb_build_object('autor_id', new.autor_id, 'motivo', new.motivo));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_artigos on rede.artigos;
create trigger trg_log_artigos
  after update or delete on rede.artigos
  for each row execute function rede.log_artigos();


-- ============================================================================
-- 8. Acessos: primeiro e último acesso, inclusive de quem só lê
--    O Facebook não mostra quem abriu o grupo sem interagir. Aqui cada
--    navegação logada registra o dia (o app chama registrar_acesso() no
--    máximo 1 vez a cada 10 minutos por pessoa).
-- ============================================================================

create table if not exists rede.acessos_diarios (
  perfil_id   uuid not null references rede.perfis(id) on delete cascade,
  dia         date not null,
  n           integer not null default 1,        -- sessões (pings espaçados de 10 min)
  primeiro_em timestamptz not null default now(),
  ultimo_em   timestamptz not null default now(),
  -- true = dia reconstruído de atividade antiga (antes do rastreio existir).
  estimado    boolean not null default false,
  primary key (perfil_id, dia)
);

create index if not exists acessos_dia_idx on rede.acessos_diarios (dia);

alter table rede.acessos_diarios enable row level security;

drop policy if exists acessos_select on rede.acessos_diarios;
create policy acessos_select on rede.acessos_diarios
  for select using (perfil_id = rede.meu_perfil_id() or rede.is_rede_admin());
-- Sem política de escrita: só registrar_acesso() grava.

create or replace function rede.registrar_acesso()
returns void language plpgsql security definer set search_path = rede, public as $$
declare
  v_id  uuid := rede.meu_perfil_id();
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_id is null then
    return;
  end if;
  insert into rede.acessos_diarios as a (perfil_id, dia)
  values (v_id, v_dia)
  on conflict (perfil_id, dia) do update
    set n = a.n + 1,
        ultimo_em = now(),
        estimado = false;
end;
$$;

revoke all on function rede.registrar_acesso() from public, anon;
grant execute on function rede.registrar_acesso() to authenticated, service_role;

-- Reconstrução do passado: cada dia em que o membro postou, comentou, votou
-- ou escreveu artigo conta como acesso (estimado), e o último login conhecido
-- pelo Supabase Auth também. É o melhor retrato possível antes do rastreio.
insert into rede.acessos_diarios (perfil_id, dia, n, primeiro_em, ultimo_em, estimado)
select perfil_id,
       (quando at time zone 'America/Sao_Paulo')::date,
       count(*),
       min(quando),
       max(quando),
       true
from (
  select autor_id  as perfil_id, criado_em as quando from rede.posts
  union all select autor_id,  criado_em from rede.comentarios
  union all select perfil_id, criado_em from rede.votos
  union all select autor_id,  criado_em from rede.artigos
  union all select autor_id,  criado_em from rede.artigo_comentarios
  union all
  select p.id, u.last_sign_in_at
  from rede.perfis p
  join auth.users u on u.id = p.auth_id
  where u.last_sign_in_at is not null
) x
where quando is not null
group by perfil_id, (quando at time zone 'America/Sao_Paulo')::date
on conflict (perfil_id, dia) do nothing;


-- ============================================================================
-- 9. Pedido de entrada (questionário de 3 perguntas + aceite das regras)
-- ============================================================================

create table if not exists rede.pedidos_entrada (
  id              uuid primary key default gen_random_uuid(),
  perfil_id       uuid not null references rede.perfis(id) on delete cascade,
  -- [{"pergunta": "...", "resposta": "..."}], na ordem da config no momento do envio.
  respostas       jsonb not null default '[]'::jsonb,
  aceitou_regras  boolean not null default false,
  status          text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  motivo          text not null default '',
  criado_em       timestamptz not null default now(),
  decidido_em     timestamptz,
  decidido_por    uuid references rede.perfis(id) on delete set null
);

create unique index if not exists pedidos_um_pendente_uidx
  on rede.pedidos_entrada (perfil_id) where status = 'pendente';
create index if not exists pedidos_status_idx on rede.pedidos_entrada (status, criado_em);

alter table rede.pedidos_entrada enable row level security;

drop policy if exists pedidos_select on rede.pedidos_entrada;
create policy pedidos_select on rede.pedidos_entrada
  for select using (perfil_id = rede.meu_perfil_id() or rede.is_rede_admin());
-- Escrita só pelas RPCs abaixo.

-- O candidato envia (ou reenvia, enquanto pendente) as respostas.
create or replace function rede.enviar_pedido_entrada(p_respostas jsonb, p_aceitou_regras boolean)
returns uuid language plpgsql security definer set search_path = rede, public as $$
declare
  v_perfil    rede.perfis;
  v_perguntas jsonb;
  v_n         int;
  v_limpas    jsonb := '[]'::jsonb;
  v_resp      text;
  v_id        uuid;
  i           int;
begin
  select * into v_perfil from rede.perfis where auth_id = auth.uid();
  if v_perfil.id is null then
    raise exception 'sem_perfil' using errcode = 'P0001';
  end if;
  if v_perfil.status <> 'pendente' then
    raise exception 'perfil_nao_pendente' using errcode = 'P0001';
  end if;
  if not coalesce(p_aceitou_regras, false) then
    raise exception 'regras_nao_aceitas' using errcode = 'P0001';
  end if;

  select perguntas into v_perguntas from rede.config_comunidade where id = 1;
  v_n := jsonb_array_length(coalesce(v_perguntas, '[]'::jsonb));
  if jsonb_typeof(p_respostas) is distinct from 'array' or jsonb_array_length(p_respostas) < v_n then
    raise exception 'respostas_incompletas' using errcode = 'P0001';
  end if;

  for i in 0 .. v_n - 1 loop
    v_resp := trim(coalesce(p_respostas->>i, ''));
    if char_length(v_resp) < 2 then
      raise exception 'respostas_incompletas' using errcode = 'P0001';
    end if;
    v_limpas := v_limpas || jsonb_build_array(jsonb_build_object(
      'pergunta', v_perguntas->>i,
      'resposta', left(v_resp, 1000)));
  end loop;

  update rede.pedidos_entrada
     set respostas = v_limpas, aceitou_regras = true, criado_em = now()
   where perfil_id = v_perfil.id and status = 'pendente'
  returning id into v_id;

  if v_id is null then
    insert into rede.pedidos_entrada (perfil_id, respostas, aceitou_regras)
    values (v_perfil.id, v_limpas, true)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

revoke all on function rede.enviar_pedido_entrada(jsonb, boolean) from public, anon;
grant execute on function rede.enviar_pedido_entrada(jsonb, boolean) to authenticated;

-- Admin aprova ou recusa. Na aprovação pode já definir o nível (tag).
create or replace function rede.decidir_pedido(
  p_pedido       uuid,
  p_aprovar      boolean,
  p_motivo       text default '',
  p_qualificacao rede.qualificacao default null
)
returns void language plpgsql security definer set search_path = rede, public as $$
declare
  v_ped    rede.pedidos_entrada;
  v_perfil rede.perfis;
begin
  if not rede.is_rede_admin() then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;
  select * into v_ped from rede.pedidos_entrada where id = p_pedido for update;
  if v_ped.id is null or v_ped.status <> 'pendente' then
    raise exception 'pedido_indisponivel' using errcode = 'P0001';
  end if;

  update rede.pedidos_entrada
     set status = case when p_aprovar then 'aprovado' else 'recusado' end,
         motivo = coalesce(p_motivo, ''),
         decidido_em = now(),
         decidido_por = rede.meu_perfil_id()
   where id = p_pedido;

  update rede.perfis
     set status = case when p_aprovar then 'aprovado'::rede.status_perfil else 'recusado'::rede.status_perfil end,
         qualificacao = coalesce(p_qualificacao, qualificacao)
   where id = v_ped.perfil_id
  returning * into v_perfil;

  perform rede.registrar_log(case when p_aprovar then 'entrada.aprovada' else 'entrada.recusada' end,
    'membro', v_perfil.id, v_perfil.nome,
    jsonb_build_object('pedido_id', p_pedido, 'motivo', coalesce(p_motivo, ''),
                       'qualificacao', v_perfil.qualificacao));
end;
$$;

revoke all on function rede.decidir_pedido(uuid, boolean, text, rede.qualificacao) from public, anon;
grant execute on function rede.decidir_pedido(uuid, boolean, text, rede.qualificacao) to authenticated;


-- ============================================================================
-- 10. Cruzamento com a base de alunos (e-mail ou telefone da compra)
--     O espelho da base (sync_alunos_thb, migration 0003) já cria um perfil por
--     aluno e casa por e-mail no login. O que faltava: quem entra com e-mail
--     diferente do da compra vira um perfil novo, sem nível. Aqui o admin vê os
--     candidatos da base (por e-mail, telefone ou nome) e une os dois perfis.
-- ============================================================================

-- Candidatos da base para um membro: perfis espelhados ainda sem login.
create or replace function rede.candidatos_base(p_perfil uuid)
returns table (
  perfil_id    uuid,
  nome         text,
  email        text,
  whatsapp     text,
  cidade       text,
  uf           text,
  qualificacao rede.qualificacao,
  plano_thb    text,
  motivos      text[]
)
language sql stable security definer set search_path = rede, public, extensions as $$
  with alvo as (
    select p.id, lower(coalesce(p.email, '')) as email, rede.normalizar(p.nome) as nome_n,
           array_remove(array[rede.fone_canonico(p.whatsapp), rede.fone_canonico(p.telefone)], null) as fones,
           coalesce((select string_agg(r->>'resposta', ' ')
                       from rede.pedidos_entrada pe, jsonb_array_elements(pe.respostas) r
                      where pe.perfil_id = p.id), '') as respostas
    from rede.perfis p
    where p.id = p_perfil and (select rede.is_rede_admin())
  ),
  ext as (
    select a.*,
           coalesce((select array_agg(distinct lower(m[1]))
                       from regexp_matches(a.respostas, '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})', 'g') m), '{}')
             || array[a.email] as emails,
           a.fones || coalesce((select array_agg(distinct rede.fone_canonico(m[1]))
                                  from regexp_matches(a.respostas, '(\+?[0-9][0-9 ().-]{8,}[0-9])', 'g') m
                                 where rede.fone_canonico(m[1]) is not null), '{}') as todos_fones
    from alvo a
  )
  select * from (
  select b.id, b.nome, b.email, b.whatsapp, b.cidade, b.uf::text, b.qualificacao, b.plano_thb,
         array_remove(array[
           case when lower(coalesce(b.email, '')) = any(e.emails) and coalesce(b.email, '') <> '' then 'e-mail' end,
           case when rede.fone_canonico(b.whatsapp) = any(e.todos_fones)
                  or rede.fone_canonico(b.telefone) = any(e.todos_fones) then 'telefone' end,
           case when e.nome_n <> '' and rede.normalizar(b.nome) = e.nome_n then 'nome' end
         ], null) as motivos
  from ext e
  join rede.perfis b
    on b.id <> e.id
   and b.origem_thb
   and b.auth_id is null
   and (
        (coalesce(b.email, '') <> '' and lower(b.email) = any(e.emails))
     or rede.fone_canonico(b.whatsapp) = any(e.todos_fones)
     or rede.fone_canonico(b.telefone) = any(e.todos_fones)
     or (e.nome_n <> '' and rede.normalizar(b.nome) = e.nome_n)
   )
  ) c
  -- mais motivos primeiro (e-mail + telefone vence só nome)
  order by cardinality(c.motivos) desc, c.nome
  limit 10;
$$;

revoke all on function rede.candidatos_base(uuid) from public, anon;
grant execute on function rede.candidatos_base(uuid) to authenticated;

-- Une o membro ao perfil da base: o login, o conteúdo e os campos que o
-- membro preencheu passam para o perfil espelhado (que tem o nível certo e o
-- vínculo thb_id). O perfil de origem é apagado no fim. Se havia pedido de
-- entrada pendente, ele é aprovado junto.
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
  update rede.perfis set auth_id = null, slug = null where id = v_de.id;

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
    oculto     = v_de.oculto or b.oculto
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

-- Conserto da 0003: slugify() chama unaccent() sem schema e sem search_path.
-- Chamada de dentro do sync (search_path = rede, public) ela não acha a
-- extensão quando o unaccent mora em `extensions` (padrão do Supabase), e o
-- sync quebra justo ao inserir aluno novo. Inofensivo se ele estiver em public.
alter function rede.slugify(text) set search_path = public, extensions;

-- Botão "sincronizar agora" da coordenação: roda o espelho da base (0003).
create or replace function rede.admin_sincronizar_base()
returns table (inseridos int, atualizados int)
language plpgsql security definer set search_path = rede, public as $$
declare r record;
begin
  if not rede.is_rede_admin() then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;
  select * into r from rede.sync_alunos_thb();
  perform rede.registrar_log('base.sincronizada', 'base', null, 'vw_aluno_360',
    jsonb_build_object('inseridos', r.inseridos, 'atualizados', r.atualizados));
  inseridos := r.inseridos;
  atualizados := r.atualizados;
  return next;
end;
$$;

revoke all on function rede.admin_sincronizar_base() from public, anon;
grant execute on function rede.admin_sincronizar_base() to authenticated;

-- Sincronização diária automática (03:00 de Brasília), se o pg_cron existir.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'rede-sync-alunos-thb') then
      perform cron.schedule('rede-sync-alunos-thb', '0 6 * * *', 'select rede.sync_alunos_thb();');
    end if;
  end if;
end $$;


-- ============================================================================
-- 11. Arquivos e mídias
-- ============================================================================

create table if not exists rede.arquivos (
  id             uuid primary key default gen_random_uuid(),
  autor_id       uuid not null references rede.perfis(id) on delete cascade,
  titulo         text not null check (char_length(trim(titulo)) between 2 and 160),
  descricao      text not null default '',
  tipo           text not null check (tipo in ('documento', 'imagem', 'video', 'link')),
  caminho        text,                 -- objeto no bucket rede-arquivos
  url            text,                 -- link externo (YouTube, Drive, Vimeo...)
  mime           text not null default '',
  tamanho_bytes  bigint not null default 0,
  fixado         boolean not null default false,
  criado_em      timestamptz not null default now(),
  check (caminho is not null or url is not null)
);

create index if not exists arquivos_criado_idx on rede.arquivos (criado_em desc);
create index if not exists arquivos_autor_idx  on rede.arquivos (autor_id);

alter table rede.arquivos enable row level security;

drop policy if exists arquivos_select on rede.arquivos;
create policy arquivos_select on rede.arquivos
  for select using (rede.is_rede_aprovado() or rede.is_rede_admin());

drop policy if exists arquivos_insert on rede.arquivos;
create policy arquivos_insert on rede.arquivos
  for insert with check (autor_id = rede.meu_perfil_id() and rede.is_rede_aprovado() and not fixado);

drop policy if exists arquivos_update on rede.arquivos;
create policy arquivos_update on rede.arquivos
  for update using (rede.is_rede_admin()) with check (rede.is_rede_admin());

drop policy if exists arquivos_delete on rede.arquivos;
create policy arquivos_delete on rede.arquivos
  for delete using (autor_id = rede.meu_perfil_id() or rede.is_rede_admin());

create or replace function rede.log_arquivos()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  if not rede.ator_admin() then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    if old.autor_id is distinct from rede.meu_perfil_id() then
      perform rede.registrar_log('arquivo.apagado', 'arquivo', old.id, old.titulo,
        jsonb_build_object('autor_id', old.autor_id, 'tipo', old.tipo));
    end if;
    return old;
  end if;
  if new.fixado is distinct from old.fixado then
    perform rede.registrar_log(case when new.fixado then 'arquivo.fixado' else 'arquivo.desafixado' end,
      'arquivo', new.id, new.titulo);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_arquivos on rede.arquivos;
create trigger trg_log_arquivos
  after update or delete on rede.arquivos
  for each row execute function rede.log_arquivos();

-- Bucket PRIVADO: o download sai por URL assinada de curta duração, gerada só
-- para membro aprovado. 50 MB por arquivo (teto padrão do Supabase).
insert into storage.buckets (id, name, public, file_size_limit)
values ('rede-arquivos', 'rede-arquivos', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "rede_arquivos_select" on storage.objects;
create policy "rede_arquivos_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'rede-arquivos' and (rede.is_rede_aprovado() or rede.is_rede_admin()));

-- Cada membro sobe só dentro da própria pasta: <perfil_id>/<arquivo>.
drop policy if exists "rede_arquivos_insert" on storage.objects;
create policy "rede_arquivos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'rede-arquivos'
    and rede.is_rede_aprovado()
    and (storage.foldername(name))[1] = rede.meu_perfil_id()::text
  );

drop policy if exists "rede_arquivos_delete" on storage.objects;
create policy "rede_arquivos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'rede-arquivos'
    and ((storage.foldername(name))[1] = rede.meu_perfil_id()::text or rede.is_rede_admin())
  );


-- ============================================================================
-- 12. Relatório de participação por membro (uma linha por aluno)
--     Período em dias civis de São Paulo, [p_inicio, p_fim] inclusivo.
--     Só admin recebe linhas (a cláusula is_rede_admin() zera para os demais).
-- ============================================================================

drop function if exists rede.relatorio_participacao(date, date);
create or replace function rede.relatorio_participacao(p_inicio date, p_fim date)
returns table (
  perfil_id               uuid,
  slug                    text,
  nome                    text,
  email                   text,
  whatsapp                text,
  profissao               text,
  cidade                  text,
  uf                      text,
  qualificacao            rede.qualificacao,
  status                  rede.status_perfil,
  papel                   rede.papel,
  tem_conta               boolean,
  vinculado_base          boolean,
  membro_desde            timestamptz,
  posts_periodo           int,
  posts_total             int,
  comentarios_periodo     int,
  comentarios_total       int,
  reacoes_periodo         int,
  reacoes_total           int,
  reacoes_recebidas_total int,
  artigos_total           int,
  primeiro_acesso         timestamptz,
  ultimo_acesso           timestamptz,
  primeiro_acesso_estimado boolean,
  dias_ativos_periodo     int,
  dias_sem_acesso         int
)
language sql stable security definer set search_path = rede, public as $$
  with lim as (
    select (p_inicio::timestamp       at time zone 'America/Sao_Paulo') as t0,
           ((p_fim + 1)::timestamp    at time zone 'America/Sao_Paulo') as t1,
           (now() at time zone 'America/Sao_Paulo')::date                as hoje
  ),
  po as (
    select autor_id as pid,
           count(*) filter (where criado_em >= lim.t0 and criado_em < lim.t1) as per,
           count(*) as tot
    from rede.posts, lim
    where status in ('publicado', 'pendente')
    group by autor_id
  ),
  co as (
    select pid, count(*) filter (where criado_em >= lim.t0 and criado_em < lim.t1) as per, count(*) as tot
    from (
      select autor_id as pid, criado_em from rede.comentarios
      union all
      select autor_id, criado_em from rede.artigo_comentarios
    ) c, lim
    group by pid
  ),
  vo as (
    select perfil_id as pid,
           count(*) filter (where criado_em >= lim.t0 and criado_em < lim.t1) as per,
           count(*) as tot
    from rede.votos, lim
    group by perfil_id
  ),
  vr as (
    select p.autor_id as pid, count(*) as tot
    from rede.votos v join rede.posts p on p.id = v.post_id
    where v.perfil_id <> p.autor_id
    group by p.autor_id
  ),
  ar as (
    select autor_id as pid, count(*) as tot from rede.artigos where status = 'publicado' group by autor_id
  ),
  -- Presença = acesso registrado OU interação (quem posta, comenta ou reage
  -- esteve lá). Mantém o relatório coerente com os insights.
  ev as (
    select perfil_id as pid, dia, primeiro_em as t0, ultimo_em as t1 from rede.acessos_diarios
    union all
    select autor_id, (criado_em at time zone 'America/Sao_Paulo')::date, criado_em, criado_em from rede.posts
    union all
    select autor_id, (criado_em at time zone 'America/Sao_Paulo')::date, criado_em, criado_em from rede.comentarios
    union all
    select autor_id, (criado_em at time zone 'America/Sao_Paulo')::date, criado_em, criado_em from rede.artigo_comentarios
    union all
    select perfil_id, (criado_em at time zone 'America/Sao_Paulo')::date, criado_em, criado_em from rede.votos
  ),
  ac as (
    select pid,
           min(t0) as primeiro,
           max(t1) as ultimo,
           count(distinct dia) filter (where dia between p_inicio and p_fim) as dias
    from ev
    group by pid
  ),
  marco as (select rastreio_desde from rede.config_comunidade where id = 1)
  select p.id, p.slug, p.nome, p.email, p.whatsapp, p.profissao, p.cidade, p.uf::text,
         p.qualificacao, p.status, p.papel,
         p.auth_id is not null,
         p.thb_id is not null,
         p.criado_em,
         coalesce(po.per, 0)::int, coalesce(po.tot, 0)::int,
         coalesce(co.per, 0)::int, coalesce(co.tot, 0)::int,
         coalesce(vo.per, 0)::int, coalesce(vo.tot, 0)::int,
         coalesce(vr.tot, 0)::int,
         coalesce(ar.tot, 0)::int,
         ac.primeiro, ac.ultimo, coalesce(ac.primeiro < (select rastreio_desde from marco), false),
         coalesce(ac.dias, 0)::int,
         case when ac.ultimo is null then null
              else (lim.hoje - (ac.ultimo at time zone 'America/Sao_Paulo')::date)::int end
  from rede.perfis p
  cross join lim
  left join po on po.pid = p.id
  left join co on co.pid = p.id
  left join vo on vo.pid = p.id
  left join vr on vr.pid = p.id
  left join ar on ar.pid = p.id
  left join ac on ac.pid = p.id
  where (select rede.is_rede_admin());
$$;

revoke all on function rede.relatorio_participacao(date, date) from public, anon;
grant execute on function rede.relatorio_participacao(date, date) to authenticated;

-- Exportar dado pessoal é ato auditável (jurídico usa esse relatório).
create or replace function rede.registrar_exportacao(p_filtros jsonb, p_linhas int)
returns void language plpgsql security definer set search_path = rede, public as $$
begin
  if not rede.is_rede_admin() then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;
  perform rede.registrar_log('relatorio.exportado', 'relatorio', null, 'Participação por membro',
    coalesce(p_filtros, '{}'::jsonb) || jsonb_build_object('linhas', p_linhas));
end;
$$;

revoke all on function rede.registrar_exportacao(jsonb, int) from public, anon;
grant execute on function rede.registrar_exportacao(jsonb, int) to authenticated;


-- ============================================================================
-- 13. Insights (o equivalente ao "Insights do grupo", sem o limite de 28 dias)
-- ============================================================================

create or replace function rede.insights(p_inicio date, p_fim date)
returns jsonb language plpgsql stable security definer set search_path = rede, public as $$
declare
  t0 timestamptz := p_inicio::timestamp at time zone 'America/Sao_Paulo';
  t1 timestamptz := (p_fim + 1)::timestamp at time zone 'America/Sao_Paulo';
  v  jsonb;
begin
  if not rede.is_rede_admin() then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;

  with
  pp as (select id, autor_id, criado_em from rede.posts where status = 'publicado' and criado_em >= t0 and criado_em < t1),
  cc as (
    select autor_id, criado_em from rede.comentarios where criado_em >= t0 and criado_em < t1
    union all
    select autor_id, criado_em from rede.artigo_comentarios where criado_em >= t0 and criado_em < t1
  ),
  vv as (select perfil_id, criado_em from rede.votos where criado_em >= t0 and criado_em < t1),
  -- Ativo no dia = acessou OU interagiu (quem posta, comenta ou reage acessou,
  -- mesmo que o registro de acesso tenha falhado ou seja anterior ao rastreio).
  aa as (
    select perfil_id, dia from rede.acessos_diarios where dia between p_inicio and p_fim
    union select autor_id,  (criado_em at time zone 'America/Sao_Paulo')::date from pp
    union select autor_id,  (criado_em at time zone 'America/Sao_Paulo')::date from cc
    union select perfil_id, (criado_em at time zone 'America/Sao_Paulo')::date from vv
  ),
  prim as (
    select perfil_id, min(dia) as dia from (
      select perfil_id, dia from rede.acessos_diarios
      union all select autor_id,  (criado_em at time zone 'America/Sao_Paulo')::date from rede.posts
      union all select autor_id,  (criado_em at time zone 'America/Sao_Paulo')::date from rede.comentarios
      union all select perfil_id, (criado_em at time zone 'America/Sao_Paulo')::date from rede.votos
    ) x group by perfil_id
  ),
  interacoes as (
    select autor_id as pid, criado_em from pp
    union all select autor_id, criado_em from cc
  )
  select jsonb_build_object(
    'periodo', jsonb_build_object('inicio', p_inicio, 'fim', p_fim),
    'totais', jsonb_build_object(
      'membros_aprovados', (select count(*) from rede.perfis where status = 'aprovado'),
      'membros_com_conta', (select count(*) from rede.perfis where status = 'aprovado' and auth_id is not null),
      'novos_no_periodo',  (select count(*) from prim where dia between p_inicio and p_fim),
      'pedidos_pendentes', (select count(*) from rede.pedidos_entrada where status = 'pendente'),
      'posts_retidos',     (select count(*) from rede.posts where status = 'pendente'),
      'posts',             (select count(*) from pp),
      'comentarios',       (select count(*) from cc),
      'reacoes',           (select count(*) from vv),
      'ativos',            (select count(distinct perfil_id) from aa),
      'participantes',     (select count(distinct pid) from (
                              select autor_id as pid from pp
                              union select autor_id from cc
                              union select perfil_id from vv) x)
    ),
    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'dia', d::date,
               'posts', (select count(*) from pp where (criado_em at time zone 'America/Sao_Paulo')::date = d::date),
               'comentarios', (select count(*) from cc where (criado_em at time zone 'America/Sao_Paulo')::date = d::date),
               'reacoes', (select count(*) from vv where (criado_em at time zone 'America/Sao_Paulo')::date = d::date),
               'ativos', (select count(*) from aa where aa.dia = d::date),
               'novos', (select count(*) from prim where prim.dia = d::date)
             ) order by d), '[]'::jsonb)
      from generate_series(p_inicio::timestamp, p_fim::timestamp, interval '1 day') d
    ),
    'dias_semana', (
      select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'n', n) order by dow), '[]'::jsonb)
      from (
        select extract(dow from criado_em at time zone 'America/Sao_Paulo')::int as dow, count(*) as n
        from interacoes group by 1
      ) x
    ),
    'horas', (
      select coalesce(jsonb_agg(jsonb_build_object('hora', hora, 'n', n) order by hora), '[]'::jsonb)
      from (
        select extract(hour from criado_em at time zone 'America/Sao_Paulo')::int as hora, count(*) as n
        from interacoes group by 1
      ) x
    ),
    'top_posts', (
      select coalesce(jsonb_agg(t order by t.pontos desc, t.criado_em desc), '[]'::jsonb)
      from (
        select p.id, coalesce(nullif(p.titulo, ''), left(p.corpo, 120)) as titulo, p.score, p.n_comentarios,
               p.criado_em, p.score + 2 * p.n_comentarios as pontos,
               a.nome as autor, a.slug as autor_slug, a.qualificacao
        from rede.posts p join rede.perfis a on a.id = p.autor_id
        where p.status = 'publicado' and p.criado_em >= t0 and p.criado_em < t1
        order by p.score + 2 * p.n_comentarios desc, p.criado_em desc
        limit 10
      ) t
    ),
    'top_contribuidores', (
      select coalesce(jsonb_agg(t order by t.total desc, t.nome), '[]'::jsonb)
      from (
        select a.id, a.nome, a.slug, a.qualificacao,
               count(*) filter (where k = 'p') as posts,
               count(*) filter (where k = 'c') as comentarios,
               count(*) as total
        from (
          select autor_id as pid, 'p' as k from pp
          union all select autor_id, 'c' from cc
        ) x join rede.perfis a on a.id = x.pid
        group by a.id, a.nome, a.slug, a.qualificacao
        order by count(*) desc, a.nome
        limit 10
      ) t
    ),
    'por_nivel', (
      select coalesce(jsonb_agg(t order by t.qualificacao), '[]'::jsonb)
      from (
        select p.qualificacao,
               count(*) as membros,
               count(*) filter (where exists (select 1 from aa where aa.perfil_id = p.id)) as ativos,
               count(*) filter (where p.auth_id is null) as sem_conta
        from rede.perfis p
        where p.status = 'aprovado'
        group by p.qualificacao
      ) t
    )
  ) into v;

  return v;
end;
$$;

revoke all on function rede.insights(date, date) from public, anon;
grant execute on function rede.insights(date, date) to authenticated;


-- ============================================================================
-- 14. Realtime dos campos novos de post (trava e fixado chegam ao vivo)
-- ============================================================================
-- rede.posts já está na publication supabase_realtime (0004).

comment on column rede.posts.fixado               is 'Post em destaque no topo do feed (só admin).';
comment on column rede.posts.comentarios_travados is 'Moderação travou os comentários (só admin; ou regra da # na criação).';
comment on column rede.posts.retido_por           is 'Palavras-chave que mandaram o post para aprovação.';
comment on column rede.posts.ultima_atividade_em  is 'Criação ou último comentário. Ordena o filtro "atividade recente".';
comment on table  rede.acessos_diarios            is 'Um registro por membro por dia com acesso logado. Base do primeiro/último acesso e dos inativos.';
comment on table  rede.pedidos_entrada            is 'Questionário de entrada (perguntas da config) + aceite das regras. Aprovação pela coordenação.';
comment on table  rede.arquivos                   is 'Aba de arquivos: documentos, imagens, vídeos e links. Bucket privado rede-arquivos.';
