-- Ajoute les coordonnées GPS de la boutique, nécessaires pour calculer une
-- distance vendeur -> client (chantier "frais de livraison" du roadmap).
-- La table `addresses` a déjà latitude/longitude ; il manquait l'équivalent
-- côté vendeur.
alter table public.vendeurs
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7);
