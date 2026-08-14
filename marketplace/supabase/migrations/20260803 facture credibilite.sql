-- Traçabilité des téléchargements de facture + support de la vérification
-- publique d'authenticité (QR code + code de sécurité imprimés sur le PDF).
--
-- Contexte : jusqu'ici la facture PDF ne contient aucun élément
-- re-vérifiable côté serveur — un PDF peut toujours être édité avec
-- n'importe quel logiciel, donc son apparence seule ne prouve rien. Cette
-- migration ajoute :
--   1. Un historique de chaque génération de facture (qui, quand, avec
--      quel code de sécurité), utile en cas de litige ou d'enquête fraude.
--   2. Une vue publique restreinte (sans aucune PII client) permettant à
--      quiconque scanne le QR code de la facture de vérifier que la
--      commande existe bien, avec le bon montant et le bon vendeur.

create table if not exists public.facture_telechargements (
  id uuid primary key default uuid_generate_v4(),
  commande_id uuid references public.commandes(id) not null,
  vendeur_id uuid references public.users(id) not null,
  numero text not null,
  code_securite text not null,
  ip_address text,
  user_agent text,
  downloaded_at timestamptz default now()
);

alter table public.facture_telechargements enable row level security;

-- Le vendeur ne voit que l'historique de ses propres factures.
create policy "lecture vendeur propre" on public.facture_telechargements
  for select using (auth.uid() = vendeur_id);

-- Écriture : uniquement le vendeur concerné (la route API est déjà
-- authentifiée et revérifie vendeur_id = auth.uid() avant tout insert,
-- cette policy est une seconde ligne de défense, jamais une écriture libre).
create policy "creation vendeur propre" on public.facture_telechargements
  for insert with check (auth.uid() = vendeur_id);

create index if not exists idx_facture_telechargements_commande
  on public.facture_telechargements(commande_id);

-- Vue de vérification publique : uniquement les champs nécessaires pour
-- confirmer l'authenticité (numéro, date, montant, nom du vendeur, statut
-- vérifié KYC). Aucune donnée client (nom, téléphone, adresse de livraison)
-- n'est exposée : un ticket perdu ou photographié par un tiers ne doit
-- jamais faire fuiter d'information personnelle sur l'acheteur.
--
-- Note sécurité : cette vue s'exécute avec les privilèges de son
-- propriétaire (comportement standard Postgres pour une vue sans
-- security_invoker), ce qui lui permet de lire commandes/vendeurs malgré
-- leur RLS restrictive — c'est volontaire et strictement scopé aux
-- colonnes ci-dessous. Ne jamais ajouter nom_client/telephone_client/
-- adresse_livraison à cette vue.
create or replace view public.verification_facture as
select
  c.numero,
  c.created_at,
  c.montant_total,
  c.vendeur_id,
  coalesce(v.nom_boutique, v.nom_complet) as vendeur_nom,
  (v.statut = 'valide') as vendeur_verifie
from public.commandes c
join public.vendeurs v on v.id = c.vendeur_id;

grant select on public.verification_facture to anon, authenticated;
