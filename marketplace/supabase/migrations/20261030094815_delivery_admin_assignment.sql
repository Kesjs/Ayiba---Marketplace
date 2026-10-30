create or replace function public.admin_assigner_course_delivery(p_course_id uuid, p_livreur_id uuid)
returns public.courses_delivery
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses_delivery;
begin
  if not public.is_admin() then raise exception 'Réservé aux administrateurs'; end if;
  if not exists (select 1 from public.livreurs where id = p_livreur_id and statut_verification = 'valide' and coalesce(en_pause, false) = false) then
    raise exception 'Livreur indisponible';
  end if;
  update public.courses_delivery
  set livreur_id = p_livreur_id, statut = 'attribuee', assigned_at = now(), updated_at = now()
  where id = p_course_id and statut not in ('livree', 'annulee')
  returning * into v_course;
  if not found then raise exception 'Course introuvable ou déjà terminée'; end if;
  insert into public.notifications(user_id, type, titre, contenu, lien)
  values (p_livreur_id, 'delivery', 'Nouvelle course Delivery', 'Une course t’a été attribuée. Ouvre ton espace Delivery pour voir les étapes.', '/livreur/missions?platform=delivery');
  perform public.delivery_log_event(v_course.id, v_course.statut, auth.uid(), 'Course attribuée par un administrateur');
  return v_course;
end;
$$;

revoke all on function public.admin_assigner_course_delivery(uuid, uuid) from public;
grant execute on function public.admin_assigner_course_delivery(uuid, uuid) to authenticated;
