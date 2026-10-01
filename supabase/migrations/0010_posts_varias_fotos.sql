-- ============================================================================
-- 0010_posts_varias_fotos.sql  (aplicar no projeto principal mbvybujpkwuorhtdzcde)
--
-- Várias fotos por post (até 10), como no Facebook. A lista fica em
-- posts.imagens; posts.imagem_url continua existindo e é sempre a PRIMEIRA
-- foto, para o que já lê essa coluna (feed antigo do blog, mídia recente)
-- seguir funcionando. Um gatilho mantém as duas em acordo.
--
-- Aditiva e idempotente.
-- ============================================================================

select set_config('lock_timeout', '5s', true);

alter table rede.posts
  add column if not exists imagens text[] not null default '{}'::text[];

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_imagens_max' and conrelid = 'rede.posts'::regclass) then
    alter table rede.posts
      add constraint posts_imagens_max check (coalesce(array_length(imagens, 1), 0) <= 10);
  end if;
end $$;

comment on column rede.posts.imagens is 'Fotos do post, na ordem (até 10). imagem_url é sempre a primeira.';

-- imagens e imagem_url andam juntas:
--   veio a lista      -> imagem_url vira a primeira foto;
--   veio só a antiga  -> a lista passa a ter essa foto (quem grava pelo feed do blog);
--   nenhuma das duas  -> as duas vazias.
create or replace function rede.posts_sincronizar_imagens()
returns trigger language plpgsql set search_path = rede, public as $$
declare
  v_lista text[] := array(select btrim(x) from unnest(coalesce(new.imagens, '{}'::text[])) x where btrim(coalesce(x, '')) <> '');
  v_uma   text   := btrim(coalesce(new.imagem_url, ''));
begin
  if tg_op = 'UPDATE' and new.imagens is not distinct from old.imagens and new.imagem_url is distinct from old.imagem_url then
    -- mudou só a coluna antiga: ela manda
    v_lista := case when v_uma = '' then '{}'::text[] else array[v_uma] end;
  elsif tg_op = 'UPDATE' and new.imagens is distinct from old.imagens and new.imagem_url is not distinct from old.imagem_url then
    -- mudou só a lista: ela manda, mesmo vazia (tirar todas as fotos)
    v_uma := '';
  end if;

  if coalesce(array_length(v_lista, 1), 0) > 0 then
    new.imagens    := v_lista;
    new.imagem_url := v_lista[1];
  elsif v_uma <> '' then
    new.imagens    := array[v_uma];
    new.imagem_url := v_uma;
  else
    new.imagens    := '{}'::text[];
    new.imagem_url := '';
  end if;
  return new;
end;
$$;

revoke all on function rede.posts_sincronizar_imagens() from public, anon, authenticated;

drop trigger if exists trg_posts_c_imagens on rede.posts;
create trigger trg_posts_c_imagens
  before insert or update of imagens, imagem_url on rede.posts
  for each row execute function rede.posts_sincronizar_imagens();

-- posts que já tinham uma foto ganham a lista com ela
update rede.posts
   set imagens = array[btrim(imagem_url)]
 where btrim(coalesce(imagem_url, '')) <> ''
   and coalesce(array_length(imagens, 1), 0) = 0;

notify pgrst, 'reload schema';
