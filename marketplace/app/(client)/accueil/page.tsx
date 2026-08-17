import { redirect } from "next/navigation";

// L'onglet "Accueil" du client pointe désormais directement vers "/" (même
// page que l'accueil visiteur, header personnalisé une fois connecté) — cette
// route ne sert plus qu'à ne pas casser les anciens liens/favoris vers /accueil.
export default function AccueilRedirectPage() {
  redirect("/");
}
