import { redirect } from "next/navigation";

// Ancienne page "Tableau de bord" client (stats + double-sidebar bug, cf.
// discussion) — son contenu (résumé commandes/dépenses) a été fusionné en
// version allégée en haut de /menu ("Compte"). Cette route ne sert plus
// qu'à ne pas casser d'anciens liens/favoris ou la redirection post-connexion.
export default function DashboardRedirectPage() {
  redirect("/menu");
}
