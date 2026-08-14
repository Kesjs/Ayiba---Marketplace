import {
  Utensils, Shirt, Sofa, Smartphone, Sparkles, Hammer, Baby, Bike, Car, Home,
  Briefcase, PartyPopper, Tag, LucideIcon,
} from "lucide-react";

/**
 * La table `categories` a des colonnes `icone` / `couleur`, mais rien dans
 * le code ne les consomme encore et leur format (nom d'icône ? emoji ? hex ?)
 * n'a jamais été fixé — donc plutôt que de deviner un format à l'aveugle,
 * on garde un style purement visuel ici, choisi par nom de catégorie, avec
 * un style par défaut pour toute catégorie qu'on ne reconnaît pas. Le jour
 * où le format de `icone`/`couleur` est arrêté, cette table peut être
 * remplacée par une lecture directe des colonnes.
 */
type CategoryStyle = { icon: LucideIcon; color: string };

const STYLES_PAR_NOM: Record<string, CategoryStyle> = {
  "alimentation": { icon: Utensils, color: "bg-teal-50 text-teal-600" },
  "mode": { icon: Shirt, color: "bg-amber-50 text-amber-600" },
  "maison": { icon: Sofa, color: "bg-coral-50 text-coral-600" },
  "électronique": { icon: Smartphone, color: "bg-blue-50 text-blue-600" },
  "electronique": { icon: Smartphone, color: "bg-blue-50 text-blue-600" },
  "tech": { icon: Smartphone, color: "bg-blue-50 text-blue-600" },
  "beauté": { icon: Sparkles, color: "bg-purple-50 text-purple-600" },
  "beaute": { icon: Sparkles, color: "bg-purple-50 text-purple-600" },
  "services": { icon: Hammer, color: "bg-gray-50 text-gray-600" },
  "bébé & enfant": { icon: Baby, color: "bg-pink-50 text-pink-600" },
  "bebe & enfant": { icon: Baby, color: "bg-pink-50 text-pink-600" },
  "sport & loisirs": { icon: Bike, color: "bg-emerald-50 text-emerald-600" },
  "auto & moto": { icon: Car, color: "bg-slate-50 text-slate-600" },
  "immobilier": { icon: Home, color: "bg-orange-50 text-orange-600" },
  "emploi": { icon: Briefcase, color: "bg-indigo-50 text-indigo-600" },
  "événementiel": { icon: PartyPopper, color: "bg-rose-50 text-rose-600" },
  "evenementiel": { icon: PartyPopper, color: "bg-rose-50 text-rose-600" },
};

const STYLE_PAR_DEFAUT: CategoryStyle = { icon: Tag, color: "bg-gray-50 text-gray-500" };

export function getCategoryStyle(nom: string): CategoryStyle {
  return STYLES_PAR_NOM[nom.trim().toLowerCase()] || STYLE_PAR_DEFAUT;
}
