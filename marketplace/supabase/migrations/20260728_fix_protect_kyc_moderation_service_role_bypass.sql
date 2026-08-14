-- ============================================================================
-- Fix : cliquer "Valider" sur un KYC vendeur/livreur dans /admin ne
-- persistait jamais le changement, malgré un log admin_actions_log créé
-- (donc pas d'erreur visible côté API).
--
-- Cause : les triggers protect_kyc_moderation_fields_vendeurs/livreurs
-- vérifient l'admin via `auth.uid()`. Or /api/admin/moderation-kyc écrit
-- avec le client service_role (pas de session utilisateur), donc auth.uid()
-- est null : le trigger croit qu'un non-admin tente de passer le statut à
-- 'valide' et annule silencieusement le changement.
--
-- Fix : on laisse passer les appels service_role sans y appliquer le check
-- (ces routes sont déjà protégées par requireAdmin() côté serveur).
--
-- Note : cette migration documente un changement déjà appliqué directement
-- en base le 28/07/2026 (rattrapage du repo pour rester synchronisé).
-- ============================================================================

create or replace function public.protect_kyc_moderation_fields_vendeurs()
 returns trigger
 language plpgsql
 security definer
as $function$
declare
  is_admin boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  select (role = 'admin') into is_admin from public.users where id = auth.uid();

  if not coalesce(is_admin, false) then
    if new.statut = 'valide' then
      new.statut := old.statut;
    end if;

    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.raison_rejet := old.raison_rejet;
  end if;

  return new;
end;
$function$;

create or replace function public.protect_kyc_moderation_fields_livreurs()
 returns trigger
 language plpgsql
 security definer
as $function$
declare
  is_admin boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  select (role = 'admin') into is_admin from public.users where id = auth.uid();

  if not coalesce(is_admin, false) then
    if new.statut_verification = 'valide' then
      new.statut_verification := old.statut_verification;
    end if;

    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.raison_rejet := old.raison_rejet;
  end if;

  return new;
end;
$function$;
