-- Supabase may have direct default grants for anon/authenticated on functions
-- created in the public schema. Keep the Delivery API explicitly scoped.

revoke all on function public.delivery_log_event(uuid, text, uuid, text) from anon, public, authenticated;
revoke all on function public.calculer_tarif_course(numeric, numeric, numeric, numeric, numeric) from anon, public;
revoke all on function public.creer_course_delivery(text, text, numeric, numeric, text, text, text, text, numeric, numeric, text, text, text, text, text, numeric) from anon, public;
revoke all on function public.accepter_course_delivery(uuid) from anon, public;
revoke all on function public.mettre_a_jour_course_delivery(uuid, text, numeric, numeric, numeric) from anon, public;
revoke all on function public.annuler_course_delivery(uuid, text) from anon, public;
revoke all on function public.finaliser_paiement_delivery(text) from anon, public, authenticated;
revoke all on function public.marquer_echec_paiement_delivery(text, text) from anon, public, authenticated;
revoke all on function public.admin_assigner_course_delivery(uuid, uuid) from anon, public;

grant execute on function public.calculer_tarif_course(numeric, numeric, numeric, numeric, numeric) to authenticated;
grant execute on function public.creer_course_delivery(text, text, numeric, numeric, text, text, text, text, numeric, numeric, text, text, text, text, text, numeric) to authenticated;
grant execute on function public.accepter_course_delivery(uuid) to authenticated;
grant execute on function public.mettre_a_jour_course_delivery(uuid, text, numeric, numeric, numeric) to authenticated;
grant execute on function public.annuler_course_delivery(uuid, text) to authenticated;
grant execute on function public.finaliser_paiement_delivery(text) to service_role;
grant execute on function public.marquer_echec_paiement_delivery(text, text) to service_role;
grant execute on function public.admin_assigner_course_delivery(uuid, uuid) to authenticated;
