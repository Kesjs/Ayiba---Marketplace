-- L'admin n'avait aucune policy RLS pour lire les photos d'un article non
-- publié (seul le vendeur propriétaire, ou le public si l'article est
-- publié, pouvait les voir) : la page de modération ne pouvait donc pas
-- afficher les photos des articles en_attente/refusés avant validation.
create policy "admin lit toutes les photos"
on public.article_images
for select
using (is_admin());
