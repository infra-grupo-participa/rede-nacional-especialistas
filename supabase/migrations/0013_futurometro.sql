-- Futurômetro Jurídico (2ª isca da Black do Marcio, pedido do Iromar em 11/10/2026).
-- Uma linha por conta (a mesma conta do checkup). O navegador manda só as respostas; o banco deriva o dono
-- de auth.uid() e calcula valor por caso e processos necessários. Somente o dono lê a própria linha.

create table if not exists rede.futurometros (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  whatsapp text not null default '',
  casos_ativos integer not null check (casos_ativos between 1 and 100000),
  honorario_mensal numeric(14,2) not null check (honorario_mensal > 0 and honorario_mensal <= 100000000),
  satisfeito boolean not null,
  valor_desejado numeric(14,2) check (valor_desejado is null or (valor_desejado > 0 and valor_desejado <= 100000000)),
  valor_por_caso numeric(14,2) not null,
  processos_necessarios integer,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint futurometro_desejado check ((satisfeito and valor_desejado is null) or (not satisfeito and valor_desejado is not null))
);

alter table rede.futurometros enable row level security;
revoke all on table rede.futurometros from public, anon, authenticated;
grant select on table rede.futurometros to authenticated;
grant all on table rede.futurometros to service_role;

drop policy if exists futurometros_select_dono on rede.futurometros;
create policy futurometros_select_dono on rede.futurometros
  for select to authenticated using ((select auth.uid()) = auth_id);

drop trigger if exists futurometros_atualizar_data on rede.futurometros;
create trigger futurometros_atualizar_data before update on rede.futurometros
  for each row execute function rede.diagnostico_atualizar_data();

comment on table rede.futurometros is 'Futurômetro Jurídico por conta. Somente o dono lê; a RPC salvar_futurometro grava e calcula.';

create or replace function rede.salvar_futurometro(p_casos integer, p_honorario numeric, p_satisfeito boolean, p_desejado numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_auth_id uuid := auth.uid();
  v_email text;
  v_meta jsonb;
  v_por_caso numeric(14,2);
  v_necessarios integer;
  v_desejado numeric(14,2);
begin
  if v_auth_id is null then
    raise exception using errcode = '28000', message = 'Sessão autenticada obrigatória.';
  end if;
  if p_casos is null or p_casos < 1 or p_casos > 100000 then
    raise exception using errcode = '22023', message = 'Número de casos inválido.';
  end if;
  if p_honorario is null or p_honorario <= 0 or p_honorario > 100000000 then
    raise exception using errcode = '22023', message = 'Honorário inválido.';
  end if;
  if p_satisfeito is null then
    raise exception using errcode = '22023', message = 'Resposta de satisfação obrigatória.';
  end if;
  if not p_satisfeito and (p_desejado is null or p_desejado <= 0 or p_desejado > 100000000) then
    raise exception using errcode = '22023', message = 'Valor desejado inválido.';
  end if;

  v_por_caso := round(p_honorario / p_casos, 2);
  v_desejado := case when p_satisfeito then null else round(p_desejado, 2) end;
  -- Processos para chegar ao valor desejado: valor desejado dividido pelo valor de cada caso, arredondado para cima.
  v_necessarios := case when p_satisfeito then null else ceil(v_desejado / (p_honorario / p_casos))::integer end;

  select u.email, u.raw_user_meta_data into v_email, v_meta from auth.users u where u.id = v_auth_id;
  if not found then
    raise exception using errcode = '28000', message = 'Conta autenticada não encontrada.';
  end if;

  insert into rede.futurometros (auth_id, nome, email, whatsapp, casos_ativos, honorario_mensal, satisfeito,
    valor_desejado, valor_por_caso, processos_necessarios)
  values (v_auth_id, left(coalesce(v_meta ->> 'nome', v_meta ->> 'full_name', ''), 201), coalesce(v_email, ''),
    left(regexp_replace(coalesce(v_meta ->> 'whatsapp', ''), '[^0-9]', '', 'g'), 15),
    p_casos, round(p_honorario, 2), p_satisfeito, v_desejado, v_por_caso, v_necessarios)
  on conflict (auth_id) do update set
    nome = excluded.nome, email = excluded.email, whatsapp = excluded.whatsapp,
    casos_ativos = excluded.casos_ativos, honorario_mensal = excluded.honorario_mensal,
    satisfeito = excluded.satisfeito, valor_desejado = excluded.valor_desejado,
    valor_por_caso = excluded.valor_por_caso, processos_necessarios = excluded.processos_necessarios;

  return jsonb_build_object('valor_por_caso', v_por_caso, 'processos_necessarios', v_necessarios);
end;
$$;

revoke all on function rede.salvar_futurometro(integer, numeric, boolean, numeric) from public, anon;
grant execute on function rede.salvar_futurometro(integer, numeric, boolean, numeric) to authenticated;
