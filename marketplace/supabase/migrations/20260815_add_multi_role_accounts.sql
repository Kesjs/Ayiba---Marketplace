-- A customer account can also operate a shop and/or deliver orders.
alter table public.users
  add column if not exists account_roles text[] not null default array['client']::text[];

update public.users
set account_roles = case
  when role = 'admin' then array['admin']::text[]
  when role = 'vendeur' then array['client', 'vendeur']::text[]
  when role = 'livreur' then array['client', 'livreur']::text[]
  else array['client']::text[]
end
where account_roles = array['client']::text[] or account_roles is null;

alter table public.users drop constraint if exists users_account_roles_valid;
alter table public.users add constraint users_account_roles_valid check (
  account_roles <@ array['client', 'vendeur', 'livreur', 'admin']::text[]
  and cardinality(account_roles) > 0
  and (role = 'admin' or 'client' = any(account_roles))
);

-- `role` reste le rôle principal historique, utilisé par quelques écrans et
-- intégrations existantes. Les droits cumulés vivent dans `account_roles`.
-- Un utilisateur ne doit jamais pouvoir s'ajouter lui-même un droit depuis
-- le navigateur : comme role/statut, ce champ est réservé aux routes serveur
-- et au service_role.
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
    if new.account_roles is distinct from old.account_roles then
      new.account_roles := old.account_roles;
    end if;
  end if;
  return new;
end;
$$;

-- Les nouveaux comptes doivent recevoir leurs droits cumulés dès le trigger
-- Auth. Sans ceci, un inscrit vendeur/livreur aurait role='vendeur' mais
-- account_roles=['client'] et serait refusé par le proxy avant son KYC.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
declare
  chosen_role text;
  initial_roles text[];
begin
  chosen_role := coalesce(new.raw_user_meta_data->>'role', 'client');
  if chosen_role not in ('client', 'vendeur', 'livreur') then
    chosen_role := 'client';
  end if;
  initial_roles := case
    when chosen_role = 'vendeur' then array['client', 'vendeur']::text[]
    when chosen_role = 'livreur' then array['client', 'livreur']::text[]
    else array['client']::text[]
  end;

  insert into public.users (id, email, role, account_roles)
  values (new.id, new.email, chosen_role, initial_roles);

  if chosen_role = 'vendeur' then
    insert into public.vendeurs (id, statut) values (new.id, null);
  end if;
  return new;
end;
$function$;
