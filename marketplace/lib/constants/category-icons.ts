import {
  Utensils, Shirt, Sofa, Smartphone, Sparkles, Hammer, Baby, Bike, Car, Home,
  Briefcase, PartyPopper, Tag, WashingMachine, Dumbbell, Palette, Tent, Watch,
  Laptop, BookOpen, Gamepad2, Music, Camera, Gem, PawPrint, Wrench, ShoppingBag,
  LucideIcon,
} from "lucide-react";

/**
 * Icônes disponibles pour les catégories, choisies dans l'admin
 * (/admin/categories) et stockées par leur `name` dans `categories.icone`.
 * La page d'accueil résout ce nom vers le composant via resolveCategoryIcon.
 * Ajouter une entrée ici la rend immédiatement disponible dans le picker —
 * aucune autre modification nécessaire pour supporter une nouvelle catégorie.
 */
export const CATEGORY_ICON_OPTIONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: "tag", label: "Général", icon: Tag },
  { name: "utensils", label: "Alimentation", icon: Utensils },
  { name: "shirt", label: "Vêtements", icon: Shirt },
  { name: "sofa", label: "Mobilier", icon: Sofa },
  { name: "washing-machine", label: "Électroménager", icon: WashingMachine },
  { name: "smartphone", label: "Téléphones", icon: Smartphone },
  { name: "laptop", label: "Informatique", icon: Laptop },
  { name: "sparkles", label: "Soins / beauté", icon: Sparkles },
  { name: "palette", label: "Maquillage", icon: Palette },
  { name: "dumbbell", label: "Fitness", icon: Dumbbell },
  { name: "tent", label: "Plein air", icon: Tent },
  { name: "bike", label: "Sport & loisirs", icon: Bike },
  { name: "car", label: "Auto & moto", icon: Car },
  { name: "home", label: "Immobilier", icon: Home },
  { name: "baby", label: "Bébé & enfant", icon: Baby },
  { name: "paw-print", label: "Animaux", icon: PawPrint },
  { name: "watch", label: "Accessoires", icon: Watch },
  { name: "gem", label: "Bijoux", icon: Gem },
  { name: "book-open", label: "Livres", icon: BookOpen },
  { name: "gamepad", label: "Jeux & loisirs", icon: Gamepad2 },
  { name: "music", label: "Musique", icon: Music },
  { name: "camera", label: "Photo & vidéo", icon: Camera },
  { name: "hammer", label: "Bricolage", icon: Hammer },
  { name: "wrench", label: "Services", icon: Wrench },
  { name: "shopping-bag", label: "Commerce", icon: ShoppingBag },
  { name: "briefcase", label: "Emploi", icon: Briefcase },
  { name: "party-popper", label: "Événementiel", icon: PartyPopper },
];

const ICON_MAP = new Map(CATEGORY_ICON_OPTIONS.map((o) => [o.name, o.icon]));

/** Résout le nom d'icône stocké en base (`categories.icone`) vers son composant.
 * Retombe sur l'étiquette générique si aucune icône n'a encore été choisie. */
export function resolveCategoryIcon(name: string | null | undefined): LucideIcon {
  return (name && ICON_MAP.get(name)) || Tag;
}
