-- Migration 0002: guard de campos privilegiados no perfil.
-- No UPDATE feito pelo próprio dono (não-admin), congela papel/qualificacao/
-- status/xp/nivel_gam. RLS WITH CHECK não compara OLD vs NEW; o trigger sim.

create or replace function rede.guard_perfil_update()
returns trigger language plpgsql security definer set search_path = rede, public as $$
begin
  -- Admin e service_role (auth.uid() null) podem tudo.
  if rede.is_rede_admin() or auth.uid() is null then
    return new;
  end if;

  -- Dono comum: não pode mexer em papel, qualificação, status, xp, nivel_gam.
  if new.papel        is distinct from old.papel        then new.papel        := old.papel;        end if;
  if new.qualificacao is distinct from old.qualificacao then new.qualificacao := old.qualificacao; end if;
  if new.status       is distinct from old.status       then new.status       := old.status;       end if;
  if new.xp           is distinct from old.xp           then new.xp           := old.xp;           end if;
  if new.nivel_gam    is distinct from old.nivel_gam    then new.nivel_gam    := old.nivel_gam;    end if;

  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_perfil_update on rede.perfis;
create trigger trg_guard_perfil_update
  before update on rede.perfis
  for each row execute function rede.guard_perfil_update();
