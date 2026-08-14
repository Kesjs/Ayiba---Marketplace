-- ============================================================================
-- Fix : un nouveau vendeur atterrit directement sur l'écran "Dossier en cours
-- de vérification" au lieu du formulaire KYC (5 étapes avec icônes).
--
-- Cause : `handle_new_user()` insère la ligne `vendeurs` avec statut =
-- 'en_attente' DÈS L'INSCRIPTION, avant que le vendeur ait rempli quoi que ce
-- soit. `VendeurKycWizard` lit ensuite ce statut et affiche l'écran d'attente
-- (`showStatusScreen = statut === 'en_attente' || statut === 'valide'`) au
-- lieu du formulaire.
--
-- Fix : la ligne `vendeurs` créée à l'inscription part avec statut = NULL
-- ("jamais soumis"). `statut` ne passe à 'en_attente' qu'au vrai moment de la
-- soumission du formulaire (déjà géré correctement par
-- VendeurKycWizard.handleSubmit, qui pose explicitement statut='en_attente'
-- à l'upsert final — inchangé). La contrainte CHECK existante
-- (vendeurs_statut_verification_check) autorise déjà NULL nativement.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
declare
  chosen_role text;
begin
  -- 1. Récupération du rôle
  chosen_role := coalesce(new.raw_user_meta_data->>'role', 'client');

  if chosen_role not in ('client', 'vendeur', 'livreur') then
    chosen_role := 'client';
  end if;

  -- 2. Insertion dans la table users
  insert into public.users (id, email, role)
  values (new.id, new.email, chosen_role);

  -- 3. Si c'est un vendeur, on crée son entrée dans la table vendeurs — SANS
  --    statut : tant qu'il n'a pas rempli et soumis le formulaire KYC, ce
  --    n'est ni "en_attente" (rien à examiner) ni "valide" ni "refuse".
  if chosen_role = 'vendeur' then
    insert into public.vendeurs (id, statut)
    values (new.id, null);
  end if;

  return new;
end;
$function$;

-- Cohérence : la colonne elle-même ne doit plus non plus défaulter sur
-- 'en_attente' pour un éventuel futur insert qui omettrait `statut`.
alter table public.vendeurs alter column statut set default null;
