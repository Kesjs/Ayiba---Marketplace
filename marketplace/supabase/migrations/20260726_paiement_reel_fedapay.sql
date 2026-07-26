-- ============================================================================
-- Chantier 5 — Paiement réel (FedaPay Mobile Money, mode "Collect" sans redirection)
-- ============================================================================
-- Principe : le client ne doit JAMAIS pouvoir créer une commande directement
-- (ça reste réservé à `creer_commande`, utilisée nulle part côté paiement réel
-- désormais). À la place :
--   1. Le checkout enregistre une INTENTION de paiement dans `paiements_checkout`
--      (côté client, RLS : il ne peut créer/lire que les siennes).
--   2. Le serveur (app/api/paiements/initier) déclenche la transaction FedaPay
--      et pousse la demande Mobile Money sur le téléphone du client.
--   3. Seul le webhook FedaPay (clé service_role, jamais exposée au navigateur)
--      peut appeler `finaliser_paiement_checkout` / `echouer_paiement_checkout`,
--      qui sont les SEULES fonctions autorisées à transformer une intention de
--      paiement en vraie(s) commande(s) via `creer_commande_service`.
--
-- Rien dans cette migration ne modifie `creer_commande` (utilisée ailleurs /
-- historiquement) ni `recalculer_montants_commande` : le déclencheur existant
-- `recalculer_montants_apres_article` sur `commande_articles` s'applique tel
-- quel aux commandes créées par `creer_commande_service`.
-- ============================================================================

-- 1. Table des intentions de paiement (une ligne par tentative de checkout) ---
create table if not exists public.paiements_checkout (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  fedapay_transaction_id text unique,
  montant numeric not null check (montant > 0),
  reseau text not null check (reseau in ('mtn', 'moov', 'celtiis')),
  telephone text not null,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'paye', 'echoue', 'annule')),
  raison_echec text,
  -- Snapshot complet de ce qu'il faut pour créer la ou les commandes une fois
  -- le paiement confirmé : { groupes: [{ vendeur_id, articles, nom_client,
  -- telephone_client, adresse_livraison, commune, latitude, longitude }] }
  payload jsonb not null,
  commande_ids uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_paiements_checkout_client on public.paiements_checkout (client_id);
create index if not exists idx_paiements_checkout_transaction on public.paiements_checkout (fedapay_transaction_id);

drop trigger if exists update_paiements_checkout_updated_at on public.paiements_checkout;
create trigger update_paiements_checkout_updated_at
  before update on public.paiements_checkout
  for each row execute function public.handle_updated_at();

alter table public.paiements_checkout enable row level security;

drop policy if exists "Client lit ses propres intentions de paiement" on public.paiements_checkout;
create policy "Client lit ses propres intentions de paiement"
  on public.paiements_checkout for select
  using (auth.uid() = client_id);

drop policy if exists "Client crée sa propre intention de paiement" on public.paiements_checkout;
create policy "Client crée sa propre intention de paiement"
  on public.paiements_checkout for insert
  with check (auth.uid() = client_id);

-- Pas de policy UPDATE/DELETE pour authenticated : seul service_role (webhook,
-- qui bypass RLS) peut faire évoluer le statut d'un paiement.

-- Diffusion Realtime pour que l'écran d'attente du checkout se mette à jour
-- dès que le webhook confirme/refuse le paiement (même pattern que missions
-- livreur / messagerie déjà utilisé ailleurs dans le projet).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'paiements_checkout'
  ) then
    alter publication supabase_realtime add table public.paiements_checkout;
  end if;
end $$;


-- 2. creer_commande_service — duplicata de creer_commande, sans dépendance à
--    auth.uid() (appelée côté serveur par le webhook, pas par le client) ------
create or replace function public.creer_commande_service(
  p_client_id uuid,
  p_vendeur_id uuid,
  p_articles jsonb,
  p_nom_client text,
  p_telephone_client text,
  p_adresse_livraison text,
  p_commune text,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_commande_id uuid;
  v_numero text;
  v_item jsonb;
  v_article record;
  v_prix numeric;
  v_qte int;
begin
  if p_client_id is null then
    raise exception 'client_id requis';
  end if;

  if p_articles is null or jsonb_array_length(p_articles) = 0 then
    raise exception 'Panier vide';
  end if;

  if coalesce(trim(p_commune), '') = '' or coalesce(trim(p_adresse_livraison), '') = '' then
    raise exception 'Adresse de livraison incomplète';
  end if;

  v_numero := 'CMD-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.commandes (
    numero, client_id, vendeur_id, nom_client, telephone_client,
    adresse_livraison, commune, latitude_livraison, longitude_livraison, statut
  )
  values (
    v_numero, p_client_id, p_vendeur_id, p_nom_client, p_telephone_client,
    p_adresse_livraison, p_commune, p_latitude, p_longitude, 'en_attente'
  )
  returning id into v_commande_id;

  for v_item in select * from jsonb_array_elements(p_articles)
  loop
    v_qte := (v_item->>'quantite')::int;
    if v_qte is null or v_qte < 1 then
      raise exception 'Quantité invalide';
    end if;

    select id, prix, prix_promo, stock, vendeur_id, statut, actif
    into v_article
    from public.articles
    where id = (v_item->>'article_id')::uuid
    for update;

    if not found or v_article.vendeur_id != p_vendeur_id or v_article.statut != 'publie' or v_article.actif is not true then
      raise exception 'Un article du panier n''est plus disponible';
    end if;

    if v_article.stock < v_qte then
      raise exception 'Stock insuffisant pour "%"', v_article.id;
    end if;

    v_prix := coalesce(v_article.prix_promo, v_article.prix);

    insert into public.commande_articles (commande_id, article_id, quantite, prix_unitaire, total)
    values (v_commande_id, v_article.id, v_qte, v_prix, v_prix * v_qte);

    update public.articles set stock = stock - v_qte where id = v_article.id;
  end loop;

  return v_commande_id;
end;
$function$;

-- Réservée au serveur (webhook via clé service_role) : jamais appelable
-- directement par un client authentifié ou anonyme.
revoke execute on function public.creer_commande_service(uuid, uuid, jsonb, text, text, text, text, numeric, numeric) from public, authenticated, anon;
grant execute on function public.creer_commande_service(uuid, uuid, jsonb, text, text, text, text, numeric, numeric) to service_role;


-- 3. finaliser_paiement_checkout — appelée par le webhook sur transaction.approved
create or replace function public.finaliser_paiement_checkout(p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.paiements_checkout%rowtype;
  v_groupe jsonb;
  v_commande_ids uuid[] := '{}';
  v_commande_id uuid;
begin
  select * into v_row
  from public.paiements_checkout
  where fedapay_transaction_id = p_transaction_id
  for update;

  if not found then
    -- Transaction inconnue de notre côté : ne pas planter le webhook (FedaPay
    -- réessaie sinon), juste tracer l'anomalie côté appelant.
    return jsonb_build_object('success', false, 'raison', 'transaction_inconnue');
  end if;

  -- Idempotence : FedaPay peut renvoyer le même webhook plusieurs fois.
  if v_row.statut = 'paye' then
    return jsonb_build_object('success', true, 'deja_traite', true, 'commande_ids', v_row.commande_ids);
  end if;

  if v_row.statut != 'en_attente' then
    return jsonb_build_object('success', false, 'raison', 'statut_inattendu_' || v_row.statut);
  end if;

  for v_groupe in select * from jsonb_array_elements(v_row.payload->'groupes')
  loop
    v_commande_id := public.creer_commande_service(
      v_row.client_id,
      (v_groupe->>'vendeur_id')::uuid,
      v_groupe->'articles',
      v_groupe->>'nom_client',
      v_groupe->>'telephone_client',
      v_groupe->>'adresse_livraison',
      v_groupe->>'commune',
      nullif(v_groupe->>'latitude', '')::numeric,
      nullif(v_groupe->>'longitude', '')::numeric
    );
    v_commande_ids := array_append(v_commande_ids, v_commande_id);
  end loop;

  update public.paiements_checkout
  set statut = 'paye',
      commande_ids = v_commande_ids
  where id = v_row.id;

  return jsonb_build_object('success', true, 'commande_ids', v_commande_ids);
exception
  when others then
    -- Le paiement a bien été prélevé côté FedaPay : on ne le marque JAMAIS
    -- "echoue" ici (l'argent est déjà chez Ayiba). On le laisse "en_attente"
    -- pour investigation manuelle et on renvoie l'erreur pour visibilité dans
    -- les logs Vercel/Render du webhook.
    return jsonb_build_object('success', false, 'raison', 'erreur_creation_commande', 'detail', SQLERRM);
end;
$function$;

revoke execute on function public.finaliser_paiement_checkout(text) from public, authenticated, anon;
grant execute on function public.finaliser_paiement_checkout(text) to service_role;


-- 4. echouer_paiement_checkout — appelée par le webhook sur transaction.declined/canceled
create or replace function public.echouer_paiement_checkout(p_transaction_id text, p_raison text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.paiements_checkout%rowtype;
begin
  select * into v_row
  from public.paiements_checkout
  where fedapay_transaction_id = p_transaction_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'raison', 'transaction_inconnue');
  end if;

  if v_row.statut != 'en_attente' then
    return jsonb_build_object('success', true, 'deja_traite', true);
  end if;

  update public.paiements_checkout
  set statut = 'echoue',
      raison_echec = p_raison
  where id = v_row.id;

  return jsonb_build_object('success', true);
end;
$function$;

revoke execute on function public.echouer_paiement_checkout(text, text) from public, authenticated, anon;
grant execute on function public.echouer_paiement_checkout(text, text) to service_role;


-- 5. Enregistrer le fedapay_transaction_id juste après la création de la
--    transaction (avant même la confirmation) — appelée par
--    app/api/paiements/initier via le client authentifié du user (RLS: sa
--    propre ligne uniquement, via la policy update ci-dessous, restreinte au
--    seul champ utile grâce à une fonction dédiée plutôt qu'un UPDATE direct).
create or replace function public.attacher_transaction_fedapay(p_paiement_checkout_id uuid, p_transaction_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.paiements_checkout
  set fedapay_transaction_id = p_transaction_id
  where id = p_paiement_checkout_id
    and client_id = auth.uid()
    and fedapay_transaction_id is null;
end;
$function$;

grant execute on function public.attacher_transaction_fedapay(uuid, text) to authenticated;


-- 6. echouer_initiation_paiement — permet au client (via l'API route) de
--    marquer sa propre intention "echoue" UNIQUEMENT si FedaPay n'a jamais
--    répondu (pas encore de transaction rattachée), donc avant tout risque
--    de conflit avec un webhook qui arriverait en parallèle.
create or replace function public.echouer_initiation_paiement(p_paiement_checkout_id uuid, p_raison text default 'erreur_initiation')
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.paiements_checkout
  set statut = 'echoue',
      raison_echec = p_raison
  where id = p_paiement_checkout_id
    and client_id = auth.uid()
    and statut = 'en_attente'
    and fedapay_transaction_id is null;
end;
$function$;

grant execute on function public.echouer_initiation_paiement(uuid, text) to authenticated;
