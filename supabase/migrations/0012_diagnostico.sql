-- Diagnóstico de Holding Familiar. Aplicada em produção (mbvybujpkwuorhtdzcde) em 08/10/2026.
-- A pontuação é calculada por calcular() no servidor Next; não vem do navegador.
-- A RPC autenticada valida e recalcula no banco, sem chave de serviço no app.

begin;

create table rede.diagnosticos (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  whatsapp text not null default '',
  respostas jsonb not null default '{}'::jsonb,
  pontos_total integer,
  pontos_tecnica integer,
  pontos_comercial integer,
  faixa text,
  mql boolean not null default false,
  convidado_live boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint diagnostico_respostas_objeto check (jsonb_typeof(respostas) = 'object'),
  constraint diagnostico_pontos_validos check (
    (pontos_total is null and pontos_tecnica is null and pontos_comercial is null and faixa is null
      and mql = false and convidado_live = false)
    or (pontos_total is not null and pontos_tecnica is not null and pontos_comercial is not null
      and faixa is not null and pontos_tecnica between 0 and 40 and pontos_comercial between 0 and 60
      and pontos_total = pontos_tecnica + pontos_comercial
      and faixa = case when pontos_total >= 80 then 'excelentes' when pontos_total >= 60 then 'grandes'
        when pontos_total >= 40 then 'razoaveis' else 'pequenas' end
      and convidado_live = (pontos_total >= 60))
  )
);

alter table rede.diagnosticos enable row level security;

-- A migration 0001 concede privilégios padrão amplos. Revogar explicitamente.
revoke all on table rede.diagnosticos from public, anon, authenticated;
grant select on table rede.diagnosticos to authenticated;
-- Nenhuma escrita direta por authenticated. A RPC é a única entrada.
grant all on table rede.diagnosticos to service_role;

create policy diagnosticos_select_dono on rede.diagnosticos
  for select to authenticated using ((select auth.uid()) = auth_id);

create function rede.diagnostico_atualizar_data()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;
revoke all on function rede.diagnostico_atualizar_data() from public, anon, authenticated;

create trigger diagnosticos_atualizar_data before update on rede.diagnosticos
  for each row execute function rede.diagnostico_atualizar_data();

comment on table rede.diagnosticos is 'Diagnóstico privado por conta. Somente o dono lê; servidor grava respostas e classificação.';
comment on column rede.diagnosticos.convidado_live is 'Elegível para o convite no resultado, não comprova envio ou participação na live.';

-- Mapa derivado de src/comunidade/lib/diagnostico.ts.
-- supabase/tests/diagnostico-paridade.mjs compara todas as opções com a fonte TS.
create function rede.salvar_diagnostico(p_respostas jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_auth_id uuid := auth.uid();
  v_mapa constant jsonb := '{
    "formacao":{"eixo":"tecnica","opcoes":{"advogado":20,"contador":20,"bacharel":20,"estudante":17,"outra_facilidade":6,"outra":0}},
    "objetivo":{"eixo":"tecnica","opcoes":{"viver":20,"servico":17,"academico":6,"propria":2}},
    "carteira":{"eixo":"comercial","opcoes":{"potenciais":15,"nao_sei":11,"nenhum":3}},
    "contatos_1mi":{"eixo":"comercial","opcoes":{"0":0,"1-5":2,"6-15":5,"16-30":8,"30+":10}},
    "cli_inventario":{"eixo":"comercial","opcoes":{"0":0,"1-5":1,"6-10":2,"11-15":4,"16+":5}},
    "cli_protecao":{"eixo":"comercial","opcoes":{"0":0,"1-5":1,"6-10":2,"11-15":4,"16+":5}},
    "cli_legado":{"eixo":"comercial","opcoes":{"0":0,"1-5":1,"6-10":2,"11-15":4,"16+":5}},
    "cli_imoveis":{"eixo":"comercial","opcoes":{"0":0,"1-5":1,"6-10":2,"11-15":4,"16+":5}},
    "cli_controle":{"eixo":"comercial","opcoes":{"0":0,"1-5":1,"6-10":2,"11-15":4,"16+":5}},
    "cli_presumido":{"eixo":"comercial","opcoes":{"0":0,"1-5":1,"6-10":2,"11-15":4,"16+":5}},
    "cli_dividendos":{"eixo":"comercial","opcoes":{"0":0,"1-5":1,"6-10":2,"11-15":4,"16+":5}},
    "idade":{"eixo":"perfil","opcoes":{"ate-34":0,"35-44":0,"45-54":0,"55+":0}}
  }'::jsonb;
  v_pergunta record;
  v_opcao text;
  v_pontos integer;
  v_tecnica integer := 0;
  v_comercial integer := 0;
  v_total integer;
  v_faixa text;
  v_mql boolean;
  v_nome text;
  v_whatsapp text;
  v_email text;
  v_meta jsonb;
  v_perfil_nome text;
  v_perfil_whatsapp text;
begin
  if v_auth_id is null then
    raise exception using errcode = '28000', message = 'Sessão autenticada obrigatória.';
  end if;
  if p_respostas is null or jsonb_typeof(p_respostas) <> 'object' then
    raise exception using errcode = '22023', message = 'Respostas inválidas.';
  end if;
  if (select count(*) from jsonb_object_keys(p_respostas)) <> 12 then
    raise exception using errcode = '22023', message = 'Responda às 12 perguntas.';
  end if;
  for v_pergunta in select key, value from jsonb_each(v_mapa) loop
    v_opcao := p_respostas ->> v_pergunta.key;
    if jsonb_typeof(p_respostas -> v_pergunta.key) is distinct from 'string'
      or v_opcao is null or not ((v_pergunta.value -> 'opcoes') ? v_opcao) then
      raise exception using errcode = '22023', message = 'Opção de resposta inválida.';
    end if;
    v_pontos := (v_pergunta.value -> 'opcoes' ->> v_opcao)::integer;
    if v_pergunta.value ->> 'eixo' = 'tecnica' then
      v_tecnica := v_tecnica + v_pontos;
    elsif v_pergunta.value ->> 'eixo' = 'comercial' then
      v_comercial := v_comercial + v_pontos;
    end if;
  end loop;
  v_total := v_tecnica + v_comercial;
  v_faixa := case when v_total >= 80 then 'excelentes' when v_total >= 60 then 'grandes'
    when v_total >= 40 then 'razoaveis' else 'pequenas' end;
  v_mql := p_respostas ->> 'formacao' = 'advogado' and p_respostas ->> 'idade' <> '55+';

  select u.email, u.raw_user_meta_data into v_email, v_meta
    from auth.users u where u.id = v_auth_id;
  if not found then
    raise exception using errcode = '28000', message = 'Conta autenticada não encontrada.';
  end if;
  v_nome := coalesce(v_meta ->> 'nome', v_meta ->> 'full_name', '');
  v_whatsapp := coalesce(v_meta ->> 'whatsapp', '');
  select p.nome, p.whatsapp into v_perfil_nome, v_perfil_whatsapp
    from rede.perfis p where p.auth_id = v_auth_id;
  if found and coalesce(v_meta ->> 'origem', '') <> 'diagnostico' then
    v_nome := coalesce(nullif(v_perfil_nome, ''), v_nome);
    v_whatsapp := coalesce(nullif(v_perfil_whatsapp, ''), v_whatsapp);
  end if;

  insert into rede.diagnosticos (auth_id, nome, email, whatsapp, respostas,
    pontos_total, pontos_tecnica, pontos_comercial, faixa, mql, convidado_live)
  values (v_auth_id, left(v_nome, 201), coalesce(v_email, ''),
    left(regexp_replace(v_whatsapp, '[^0-9]', '', 'g'), 15), p_respostas,
    v_total, v_tecnica, v_comercial, v_faixa, v_mql, v_total >= 60)
  on conflict (auth_id) do update set
    nome = excluded.nome, email = excluded.email, whatsapp = excluded.whatsapp,
    respostas = excluded.respostas, pontos_total = excluded.pontos_total,
    pontos_tecnica = excluded.pontos_tecnica, pontos_comercial = excluded.pontos_comercial,
    faixa = excluded.faixa, mql = excluded.mql, convidado_live = excluded.convidado_live;

  return jsonb_build_object('pontos_total', v_total, 'pontos_tecnica', v_tecnica,
    'pontos_comercial', v_comercial, 'faixa', v_faixa, 'mql', v_mql,
    'convidado_live', v_total >= 60);
end;
$$;
revoke all on function rede.salvar_diagnostico(jsonb) from public, anon, authenticated;
grant execute on function rede.salvar_diagnostico(jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
