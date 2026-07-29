-- ============================================================================
-- Fix : "Volume d'affaires (mois)" sur le dashboard admin sommait TOUTES les
-- commandes du mois sans filtrer par statut, y compris les commandes
-- 'annulee' et 'remboursee' qui ne représentent aucune activité économique
-- réelle. Le chiffre affiché était donc gonflé artificiellement.
--
-- Fix : on exclut les commandes annulées/remboursées du calcul. Le reste de
-- la vue (utilisateurs_actifs, litiges_ouverts, etc.) est inchangé.
-- ============================================================================

create or replace view public.vue_stats_admin as
select
  (select count(*) from users where users.statut = 'actif') as utilisateurs_actifs,
  (select count(*) from commandes where commandes.created_at >= now() - interval '1 day') as commandes_24h,
  (select count(*) from disputes where disputes.statut = any (array['ouvert', 'en_cours'])) as litiges_ouverts,
  (select coalesce(sum(commandes.montant_total), 0)
     from commandes
    where commandes.created_at >= date_trunc('month', now())
      and commandes.statut not in ('annulee', 'remboursee')) as volume_affaires_mois,
  (select count(*) from vendeurs where vendeurs.statut = 'en_attente') as vendeurs_kyc_attente,
  (select count(*) from livreurs where livreurs.statut_verification = 'en_attente') as livreurs_kyc_attente,
  (select count(*) from articles where articles.statut = 'en_attente') as articles_a_moderer,
  (select count(*) from retraits where retraits.statut = 'en_attente') as retraits_a_valider,
  (select count(*) from demandes_suppression where demandes_suppression.statut = 'en_attente') as demandes_suppression_attente,
  (select coalesce(sum(paiements.montant), 0) from paiements where paiements.statut = 'en_attente') as montant_en_sequestre;
