-- ============================================================================
-- Ajout de 4 indicateurs financiers au dashboard admin, pour suivre
-- l'évolution de l'argent sur Ayiba au-delà du simple volume brut du mois :
--
--   - volume_affaires_mois_precedent : même calcul que volume_affaires_mois
--     mais pour le mois civil précédent, pour afficher une évolution (%).
--   - revenu_net_mois : somme de commandes.commission sur les commandes
--     réelles du mois (hors annulées/remboursées) = ce qu'Ayiba touche
--     réellement, pas juste le volume brut généré par les vendeurs.
--   - taux_annulation_mois : % de commandes annulées + remboursées sur le
--     total du mois, un signal d'alerte si la qualité se dégrade.
--   - retraits_verses_total : somme des retraits déjà au statut final 'paye'
--     (montant réellement sorti de la marketplace vers vendeurs/livreurs).
--
-- Comme CREATE OR REPLACE VIEW impose d'ajouter les nouvelles colonnes à la
-- fin, la fonction get_stats_admin() (dont le type de retour dépend de la
-- vue) doit être supprimée puis recréée.
-- ============================================================================

drop function if exists public.get_stats_admin();

create or replace view public.vue_stats_admin as
select
  (select count(*) from users where users.statut = 'actif') as utilisateurs_actifs,
  (select count(*) from commandes where commandes.created_at >= now() - interval '1 day') as commandes_24h,
  (select count(*) from disputes where disputes.statut = any (array['ouvert', 'en_cours'])) as litiges_ouverts,
  (select coalesce(sum(c.montant_total), 0)
     from commandes c
    where c.created_at >= date_trunc('month', now())
      and c.statut not in ('annulee', 'remboursee')) as volume_affaires_mois,
  (select count(*) from vendeurs where vendeurs.statut = 'en_attente') as vendeurs_kyc_attente,
  (select count(*) from livreurs where livreurs.statut_verification = 'en_attente') as livreurs_kyc_attente,
  (select count(*) from articles where articles.statut = 'en_attente') as articles_a_moderer,
  (select count(*) from retraits where retraits.statut = 'en_attente') as retraits_a_valider,
  (select count(*) from demandes_suppression where demandes_suppression.statut = 'en_attente') as demandes_suppression_attente,
  (select coalesce(sum(paiements.montant), 0) from paiements where paiements.statut = 'en_attente') as montant_en_sequestre,
  (select coalesce(sum(c.montant_total), 0)
     from commandes c
    where c.created_at >= date_trunc('month', now() - interval '1 month')
      and c.created_at < date_trunc('month', now())
      and c.statut not in ('annulee', 'remboursee')) as volume_affaires_mois_precedent,
  (select coalesce(sum(c.commission), 0)
     from commandes c
    where c.created_at >= date_trunc('month', now())
      and c.statut not in ('annulee', 'remboursee')) as revenu_net_mois,
  (select case when count(*) = 0 then 0
               else round(100.0 * count(*) filter (where c.statut in ('annulee', 'remboursee')) / count(*), 1)
          end
     from commandes c
    where c.created_at >= date_trunc('month', now())) as taux_annulation_mois,
  (select coalesce(sum(r.montant), 0) from retraits r where r.statut = 'paye') as retraits_verses_total;

create function public.get_stats_admin()
returns setof public.vue_stats_admin
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not is_admin() then
    raise exception 'Accès réservé aux administrateurs';
  end if;
  return query select * from public.vue_stats_admin;
end;
$function$;
