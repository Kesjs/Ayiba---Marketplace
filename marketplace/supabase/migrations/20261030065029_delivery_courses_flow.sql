-- Ayiba Delivery : courses ponctuelles, séparées des commandes marketplace.
-- La table conserve le même vocabulaire métier (distance, commission, livreur,
-- paiement) mais ne force pas un vendeur fictif comme point de départ.

create table if not exists public.courses_delivery (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  client_id uuid not null references public.users(id),
  livreur_id uuid references public.livreurs(id),
  statut text not null default 'en_attente' check (statut in (
    'en_attente', 'attribuee', 'vers_retrait', 'recuperee',
    'vers_destination', 'arrivee', 'livree', 'annulee', 'litige'
  )),
  statut_paiement text not null default 'non_paye' check (statut_paiement in (
    'non_paye', 'en_attente', 'paye', 'echoue', 'rembourse'
  )),
  mode_paiement text check (mode_paiement in ('mobile_money', 'carte')),
  reseau text check (reseau in ('mtn', 'moov')),
  telephone_paiement text,
  depart_adresse text not null,
  depart_commune text,
  depart_latitude numeric(10,7) not null,
  depart_longitude numeric(10,7) not null,
  depart_nom text,
  depart_telephone text,
  destination_adresse text not null,
  destination_commune text,
  destination_latitude numeric(10,7) not null,
  destination_longitude numeric(10,7) not null,
  destination_nom text,
  destination_telephone text,
  type_colis text not null default 'colis',
  description_colis text,
  note_livreur text,
  distance_estimee_km numeric(10,2) not null default 0,
  distance_finale_km numeric(10,2),
  duree_estimee_min integer,
  montant_estime numeric(10,2) not null default 0,
  montant_final numeric(10,2),
  commission numeric(10,2) not null default 0,
  montant_net_livreur numeric(10,2),
  prime_prise_en_charge numeric(10,2) not null default 0,
  livreur_latitude numeric(10,7),
  livreur_longitude numeric(10,7),
  payment_intent_id uuid,
  transaction_reference text,
  assigned_at timestamptz,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  arrived_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_delivery_client on public.courses_delivery(client_id, created_at desc);
create index if not exists idx_courses_delivery_livreur on public.courses_delivery(livreur_id, statut, created_at desc);
create index if not exists idx_courses_delivery_dispatch on public.courses_delivery(statut, created_at asc);

create table if not exists public.courses_delivery_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses_delivery(id) on delete cascade,
  statut text not null,
  actor_id uuid references public.users(id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_courses_delivery_events_course on public.courses_delivery_events(course_id, created_at asc);

create table if not exists public.paiements_delivery_livreur (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null unique references public.courses_delivery(id),
  livreur_id uuid not null references public.livreurs(id),
  montant numeric(10,2) not null,
  commission numeric(10,2) not null default 0,
  montant_net numeric(10,2) not null,
  methode text,
  reference text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'paye', 'echoue', 'rembourse')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.delivery_payment_intents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null unique references public.courses_delivery(id),
  client_id uuid not null references public.users(id),
  montant numeric(10,2) not null,
  methode text not null check (methode in ('mobile_money', 'carte')),
  reseau text check (reseau in ('mtn', 'moov')),
  telephone text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'paye', 'echoue', 'annule')),
  transaction_reference text unique,
  payment_url text,
  raison_echec text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.courses_delivery enable row level security;
alter table public.courses_delivery_events enable row level security;
alter table public.paiements_delivery_livreur enable row level security;
alter table public.delivery_payment_intents enable row level security;

drop policy if exists "delivery course owner or operator" on public.courses_delivery;
create policy "delivery course owner or operator" on public.courses_delivery
  for select to authenticated
  using (
    client_id = (select auth.uid())
    or livreur_id = (select auth.uid())
    or public.is_admin()
    or (
      statut = 'en_attente'
      and exists (
        select 1 from public.livreurs l
        where l.id = (select auth.uid())
          and l.statut_verification = 'valide'
          and coalesce(l.en_pause, false) = false
      )
    )
  );

drop policy if exists "delivery course client insert" on public.courses_delivery;
create policy "delivery course client insert" on public.courses_delivery
  for insert to authenticated
  with check (client_id = (select auth.uid()));

drop policy if exists "delivery course controlled update" on public.courses_delivery;
create policy "delivery course controlled update" on public.courses_delivery
  for update to authenticated
  using (client_id = (select auth.uid()) or livreur_id = (select auth.uid()) or public.is_admin())
  with check (client_id = (select auth.uid()) or livreur_id = (select auth.uid()) or public.is_admin());

drop policy if exists "delivery events participants" on public.courses_delivery_events;
create policy "delivery events participants" on public.courses_delivery_events
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.courses_delivery c
      where c.id = course_id
        and (c.client_id = (select auth.uid()) or c.livreur_id = (select auth.uid()))
    )
  );

drop policy if exists "delivery driver payments owner or operator" on public.paiements_delivery_livreur;
create policy "delivery driver payments owner or operator" on public.paiements_delivery_livreur
  for select to authenticated
  using (livreur_id = (select auth.uid()) or public.is_admin());

drop policy if exists "delivery payment intent owner or operator" on public.delivery_payment_intents;
create policy "delivery payment intent owner or operator" on public.delivery_payment_intents
  for select to authenticated
  using (client_id = (select auth.uid()) or public.is_admin());

create or replace function public.delivery_log_event(
  p_course_id uuid,
  p_statut text,
  p_actor_id uuid default null,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.courses_delivery_events(course_id, statut, actor_id, note)
  values (p_course_id, p_statut, coalesce(p_actor_id, auth.uid()), p_note);
end;
$$;

create or replace function public.calculer_tarif_course(
  p_depart_latitude numeric,
  p_depart_longitude numeric,
  p_destination_latitude numeric,
  p_destination_longitude numeric,
  p_distance_route_km numeric default null
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_base numeric;
  v_prix_km numeric;
  v_distance numeric;
  v_commission_pct numeric;
  v_rayon_actif boolean;
  v_rayon_max numeric;
  v_montant numeric;
begin
  if p_depart_latitude is null or p_depart_longitude is null
     or p_destination_latitude is null or p_destination_longitude is null then
    raise exception 'Les coordonnées de départ et d’arrivée sont obligatoires';
  end if;

  select coalesce((valeur #>> '{}')::numeric, 300) into v_base
  from public.parametres_systeme where cle = 'frais_base_livraison';
  select coalesce((valeur #>> '{}')::numeric, 100) into v_prix_km
  from public.parametres_systeme where cle = 'prix_par_km';
  select coalesce((valeur #>> '{}')::numeric, 5) into v_commission_pct
  from public.parametres_systeme where cle = 'commission_pourcentage';
  select coalesce((valeur #>> '{}')::boolean, false) into v_rayon_actif
  from public.parametres_systeme where cle = 'rayon_livraison_actif';
  select coalesce((valeur #>> '{}')::numeric, 15) into v_rayon_max
  from public.parametres_systeme where cle = 'rayon_livraison_max_km';

  v_distance := coalesce(
    nullif(p_distance_route_km, 0),
    public.haversine_km(
      p_depart_latitude,
      p_depart_longitude,
      p_destination_latitude,
      p_destination_longitude
    )
  );
  v_montant := round(v_base + (v_distance * v_prix_km));

  return jsonb_build_object(
    'distance_km', round(v_distance, 2),
    'montant', v_montant,
    'commission', round(v_montant * v_commission_pct / 100, 2),
    'montant_net_livreur', round(v_montant * (1 - v_commission_pct / 100), 2),
    'disponible', (not v_rayon_actif or v_distance <= v_rayon_max),
    'rayon_max_km', v_rayon_max
  );
end;
$$;

create or replace function public.creer_course_delivery(
  p_depart_adresse text,
  p_depart_commune text,
  p_depart_latitude numeric,
  p_depart_longitude numeric,
  p_depart_nom text,
  p_depart_telephone text,
  p_destination_adresse text,
  p_destination_commune text,
  p_destination_latitude numeric,
  p_destination_longitude numeric,
  p_destination_nom text,
  p_destination_telephone text,
  p_type_colis text,
  p_description_colis text,
  p_note_livreur text,
  p_distance_route_km numeric default null
) returns public.courses_delivery
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote jsonb;
  v_course public.courses_delivery;
  v_numero text;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  if nullif(trim(p_depart_adresse), '') is null or nullif(trim(p_destination_adresse), '') is null then
    raise exception 'Les adresses de départ et de destination sont obligatoires';
  end if;

  v_quote := public.calculer_tarif_course(
    p_depart_latitude,
    p_depart_longitude,
    p_destination_latitude,
    p_destination_longitude,
    p_distance_route_km
  );

  if coalesce((v_quote->>'disponible')::boolean, true) = false then
    raise exception 'Cette distance dépasse la zone de livraison disponible';
  end if;

  v_numero := 'DLV-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.courses_delivery (
    numero, client_id, depart_adresse, depart_commune, depart_latitude, depart_longitude,
    depart_nom, depart_telephone, destination_adresse, destination_commune,
    destination_latitude, destination_longitude, destination_nom, destination_telephone,
    type_colis, description_colis, note_livreur, distance_estimee_km, duree_estimee_min,
    montant_estime, commission, montant_net_livreur
  ) values (
    v_numero, auth.uid(), trim(p_depart_adresse), nullif(trim(p_depart_commune), ''),
    p_depart_latitude, p_depart_longitude, nullif(trim(p_depart_nom), ''), nullif(trim(p_depart_telephone), ''),
    trim(p_destination_adresse), nullif(trim(p_destination_commune), ''), p_destination_latitude,
    p_destination_longitude, nullif(trim(p_destination_nom), ''), nullif(trim(p_destination_telephone), ''),
    coalesce(nullif(trim(p_type_colis), ''), 'colis'), nullif(trim(p_description_colis), ''),
    nullif(trim(p_note_livreur), ''), (v_quote->>'distance_km')::numeric,
    greatest(5, round(((v_quote->>'distance_km')::numeric / 25) * 60 + 3)),
    (v_quote->>'montant')::numeric, (v_quote->>'commission')::numeric, (v_quote->>'montant_net_livreur')::numeric
  ) returning * into v_course;

  perform public.delivery_log_event(v_course.id, v_course.statut, auth.uid(), 'Course créée');
  return v_course;
end;
$$;

create or replace function public.accepter_course_delivery(p_course_id uuid)
returns public.courses_delivery
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses_delivery;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  if not exists (
    select 1 from public.livreurs l
    where l.id = auth.uid() and l.statut_verification = 'valide' and coalesce(l.en_pause, false) = false
  ) then raise exception 'Livreur non disponible'; end if;

  update public.courses_delivery
  set livreur_id = auth.uid(), statut = 'attribuee', assigned_at = now(), accepted_at = now(), updated_at = now()
  where id = p_course_id and statut = 'en_attente' and livreur_id is null
  returning * into v_course;
  if not found then raise exception 'Cette course n’est plus disponible'; end if;

  perform public.delivery_log_event(v_course.id, v_course.statut, auth.uid(), 'Course acceptée');
  return v_course;
end;
$$;

create or replace function public.mettre_a_jour_course_delivery(
  p_course_id uuid,
  p_statut text,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_distance_finale_km numeric default null
) returns public.courses_delivery
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses_delivery;
  v_commission_pct numeric;
  v_montant_final numeric;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;
  if p_statut not in ('vers_retrait', 'recuperee', 'vers_destination', 'arrivee', 'litige') then
    raise exception 'Statut Delivery invalide';
  end if;

  select * into v_course from public.courses_delivery where id = p_course_id and livreur_id = auth.uid() for update;
  if not found then raise exception 'Course introuvable'; end if;
  if v_course.statut in ('livree', 'annulee') then raise exception 'Cette course est déjà terminée'; end if;

  select coalesce((valeur #>> '{}')::numeric, 5) into v_commission_pct
  from public.parametres_systeme where cle = 'commission_pourcentage';

  v_montant_final := coalesce(v_course.montant_final, v_course.montant_estime);
  if p_statut = 'arrivee' then
    if p_distance_finale_km is not null then
      v_montant_final := (public.calculer_tarif_course(
        v_course.depart_latitude, v_course.depart_longitude,
        v_course.destination_latitude, v_course.destination_longitude,
        p_distance_finale_km
      )->>'montant')::numeric;
    end if;
    update public.courses_delivery
    set statut = 'arrivee',
        distance_finale_km = coalesce(p_distance_finale_km, distance_estimee_km),
        montant_final = v_montant_final,
        commission = round(v_montant_final * v_commission_pct / 100, 2),
        montant_net_livreur = round(v_montant_final * (1 - v_commission_pct / 100), 2),
        arrived_at = now(), updated_at = now(),
        livreur_latitude = coalesce(p_latitude, livreur_latitude), livreur_longitude = coalesce(p_longitude, livreur_longitude)
    where id = p_course_id;
  else
    update public.courses_delivery
    set statut = p_statut,
        livreur_latitude = coalesce(p_latitude, livreur_latitude),
        livreur_longitude = coalesce(p_longitude, livreur_longitude),
        picked_up_at = case when p_statut = 'recuperee' then now() else picked_up_at end,
        updated_at = now()
    where id = p_course_id;
  end if;

  select * into v_course from public.courses_delivery where id = p_course_id;
  perform public.delivery_log_event(v_course.id, v_course.statut, auth.uid(), null);
  return v_course;
end;
$$;

create or replace function public.annuler_course_delivery(p_course_id uuid, p_raison text default null)
returns public.courses_delivery
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses_delivery;
begin
  update public.courses_delivery
  set statut = 'annulee', cancelled_at = now(), cancel_reason = nullif(trim(p_raison), ''), updated_at = now()
  where id = p_course_id and client_id = auth.uid() and statut in ('en_attente', 'attribuee', 'vers_retrait')
  returning * into v_course;
  if not found then raise exception 'Cette course ne peut plus être annulée'; end if;
  perform public.delivery_log_event(v_course.id, v_course.statut, auth.uid(), v_course.cancel_reason);
  return v_course;
end;
$$;

create or replace function public.finaliser_paiement_delivery(p_transaction_reference text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intent public.delivery_payment_intents;
  v_course public.courses_delivery;
begin
  select * into v_intent from public.delivery_payment_intents where transaction_reference = p_transaction_reference for update;
  if not found then return jsonb_build_object('success', false, 'raison', 'transaction_inconnue'); end if;
  if v_intent.statut = 'paye' then return jsonb_build_object('success', true, 'deja_traite', true, 'course_id', v_intent.course_id); end if;

  select * into v_course from public.courses_delivery where id = v_intent.course_id for update;
  if not found then return jsonb_build_object('success', false, 'raison', 'course_introuvable'); end if;
  if v_course.statut <> 'arrivee' then return jsonb_build_object('success', false, 'raison', 'course_pas_arrivee'); end if;

  update public.delivery_payment_intents set statut = 'paye', paid_at = now(), updated_at = now() where id = v_intent.id;
  update public.courses_delivery
  set statut_paiement = 'paye', statut = 'livree', delivered_at = now(), updated_at = now(),
      mode_paiement = v_intent.methode, reseau = v_intent.reseau, telephone_paiement = v_intent.telephone,
      payment_intent_id = v_intent.id, transaction_reference = p_transaction_reference
  where id = v_course.id;

  if v_course.livreur_id is not null then
    insert into public.paiements_delivery_livreur(course_id, livreur_id, montant, commission, montant_net, methode, reference, statut, paid_at)
    values (
      v_course.id, v_course.livreur_id, coalesce(v_course.montant_final, v_course.montant_estime),
      v_course.commission, coalesce(v_course.montant_net_livreur, v_course.montant_final, v_course.montant_estime),
      v_intent.methode, p_transaction_reference, 'paye', now()
    )
    on conflict (course_id) do update set statut = 'paye', paid_at = now(), reference = excluded.reference;

    insert into public.notifications(user_id, type, titre, contenu, lien)
    values (v_course.livreur_id, 'delivery', 'Course payée', 'Le client a confirmé le paiement de ta course.', '/livreur/missions?platform=delivery');
  end if;

  insert into public.notifications(user_id, type, titre, contenu, lien)
  values (v_course.client_id, 'delivery', 'Paiement confirmé', 'Le paiement de ta course a été confirmé.', '/delivery/courses/' || v_course.id);

  perform public.delivery_log_event(v_course.id, 'livree', v_course.client_id, 'Paiement confirmé par GeniusPay');
  return jsonb_build_object('success', true, 'course_id', v_course.id);
end;
$$;

create or replace function public.marquer_echec_paiement_delivery(p_transaction_reference text, p_raison text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intent public.delivery_payment_intents;
begin
  select * into v_intent from public.delivery_payment_intents where transaction_reference = p_transaction_reference for update;
  if not found then return; end if;
  update public.delivery_payment_intents set statut = 'echoue', raison_echec = p_raison, updated_at = now() where id = v_intent.id and statut = 'en_attente';
  update public.courses_delivery set statut_paiement = 'echoue', updated_at = now() where id = v_intent.course_id and statut_paiement = 'en_attente';
end;
$$;

revoke all on function public.delivery_log_event(uuid, text, uuid, text) from public;
revoke all on function public.calculer_tarif_course(numeric, numeric, numeric, numeric, numeric) from public;
revoke all on function public.creer_course_delivery(text, text, numeric, numeric, text, text, text, text, numeric, numeric, text, text, text, text, text, numeric) from public;
revoke all on function public.accepter_course_delivery(uuid) from public;
revoke all on function public.mettre_a_jour_course_delivery(uuid, text, numeric, numeric, numeric) from public;
revoke all on function public.annuler_course_delivery(uuid, text) from public;
revoke all on function public.finaliser_paiement_delivery(text) from public;
revoke all on function public.marquer_echec_paiement_delivery(text, text) from public;

grant execute on function public.calculer_tarif_course(numeric, numeric, numeric, numeric, numeric) to authenticated;
grant execute on function public.creer_course_delivery(text, text, numeric, numeric, text, text, text, text, numeric, numeric, text, text, text, text, text, numeric) to authenticated;
grant execute on function public.accepter_course_delivery(uuid) to authenticated;
grant execute on function public.mettre_a_jour_course_delivery(uuid, text, numeric, numeric, numeric) to authenticated;
grant execute on function public.annuler_course_delivery(uuid, text) to authenticated;
grant execute on function public.finaliser_paiement_delivery(text) to service_role;
grant execute on function public.marquer_echec_paiement_delivery(text, text) to service_role;

do $$
begin
  alter publication supabase_realtime add table public.courses_delivery;
exception when duplicate_object then null;
end $$;
