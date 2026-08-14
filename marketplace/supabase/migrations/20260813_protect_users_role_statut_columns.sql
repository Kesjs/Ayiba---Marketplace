-- La policy RLS "Users can update own data" (auth.uid() = id) autorisait un
-- utilisateur connecté à modifier N'IMPORTE QUELLE colonne de sa propre ligne,
-- y compris role et statut, sans aucun garde-fou : un client pouvait
-- s'auto-promouvoir admin depuis la console du navigateur. RLS ne permet pas
-- de restreindre des colonnes précises dans une policy, donc on verrouille
-- via un trigger BEFORE UPDATE (même schéma que protect_kyc_moderation_fields_*) :
-- bypass pour is_admin() et pour service_role (routes API admin/serveur),
-- sinon on annule silencieusement tout changement de role/statut.
create or replace function public.protect_users_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() and auth.role() != 'service_role' then
    if new.role is distinct from old.role then
      new.role := old.role;
    end if;
    if new.statut is distinct from old.statut then
      new.statut := old.statut;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_users_privileged_fields on public.users;
create trigger protect_users_privileged_fields
before update on public.users
for each row
execute function public.protect_users_privileged_fields();
