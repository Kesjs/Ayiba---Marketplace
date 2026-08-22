---
name: Ayiba Marketplace
description: Marketplace locale béninoise — chaleureuse, artisanale et éditoriale (Etsy Bénin)
colors:
  primary: "#D85A30"
  primary-hover: "#C24923"
  primary-deep: "#993C1D"
  primary-soft: "#FAECE7"
  signature-teal: "#1D9E75"
  signature-teal-dark: "#0F6E56"
  signature-teal-light: "#E1F5EE"
  amber-gold: "#D97706"
  amber-soft: "#FAEEDA"
  neutral-dark: "#2C2C2A"
  neutral-gray: "#52524E"
  neutral-bg: "#FFFFFF"
  warm-paper: "#F1EFE8"
  warm-paper-light: "#F7F6F2"
  danger-red: "#DC2626"
  danger-soft: "#FCEBEB"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  default: "8px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "20px"
  3xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.neutral-dark}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  card-editorial:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.2xl}"
    padding: "20px"
---

# Design System: Ayiba Marketplace

## Overview

**Creative North Star: "L'Échoppe Artisanale du Bénin"**

Ayiba incarne l'esprit des marchés vivants et chaleureux de Cotonou, Porto-Novo et Calavi, transposé dans une expérience numérique fluide et raffinée. À l'instar d'Etsy, l'interface s'efface pour laisser briller le produit et l'artisan local. Le chrome applicatif est chaud, sobre et respirant. 

Le design privilégie la mise en scène éditoriale : typographies soignées, grilles asymétriques et révélations progressives au scroll, plutôt que des alignements mécaniques ou des templates génériques. Chaque photo produit, même imparfaite, trouve sa place grâce à un travail subtil d'encadrement, d'ombrages portés et de textures papier réchauffées (`#F1EFE8`).

### Key Characteristics:
- **Artisanal & Éditorial :** Traitement de magazine culturel combiné à la praticité d'une marketplace moderne.
- **Produits en Avant-Scène :** Le chrome de l'interface est minimaliste et chaud ; les visuels vendeurs attirent le regard.
- **Confiance & Sérénité :** Les réassurances (Escrow Mobile Money, code OTP, suivi GPS) sont intégrées avec élégance et clarté.
- **Révélation Progressive :** Transitions fluides et animations au scroll (GSAP / Framer Motion) qui rythment la lecture sans surcharger.

---

## Colors

La palette puise ses origines dans les couleurs terreuses et végétales du paysage béninois : la terre de barre corail, les lagunes teal et le papier kraft chaud.

### Primary (Terre Corail)
- **Coral Action / Terracotta** (`#D85A30` / `#C24923`): Utilisé exclusivement pour les appels à l'action principaux, badges de vente flash et éléments d'engagement fort.
- **Coral Soft Background** (`#FAECE7`): Fonds d'accentuation légers pour faire ressortir les pilules actives ou badges.

### Signature (Teal Lagune)
- **Lagoon Teal** (`#1D9E75`): Couleur de réassurance et d'identité secondaire (sécurité des paiements, garanties, statut livreur vérifié).
- **Teal Light** (`#E1F5EE`): Fonds de réassurance et puces de validation.

### Neutral (Papier Chaud & Encre)
- **Encrier Chaud** (`#2C2C2A`): Titres, textes principaux et icônes d'interface. Ne jamais utiliser un noir pur `#000000`.
- **Gris Pierre Chaud** (`#F1EFE8`): Fonds de cartes, sections alternées et bordures douces.
- **Blanc Pur** (`#FFFFFF`): Surfaces de lecture, conteneurs de produits et modals.

### Named Rules
**The Editorial Rarity Rule.** La couleur Corail (`#D85A30`) ne doit pas occuper plus de 10% de la surface d'une page. Son pouvoir d'attraction réside dans sa rareté.
**The Warm Neutral Rule.** Aucun fond ou texte ne doit utiliser de gris froid (`#F3F4F6` ou `#111827`). Tous les neutres sont teintés de jaune/brun chaud (`#F1EFE8` et `#2C2C2A`).

---

## Typography

**Display & Body Font:** Inter (Google Fonts) avec fallbacks `system-ui, -apple-system, sans-serif`.

### Hierarchy
- **Display** (Bold 700, `clamp(2.25rem, 5vw, 3.75rem)`, `1.15`): Utilisé pour les titres de héros et les accroches majeures.
- **Headline** (Bold 700, `clamp(1.5rem, 3.5vw, 2.25rem)`, `1.2`): Utilisé pour les en-têtes de sections (`Ventes flash`, `Explorer les boutiques`).
- **Title** (SemiBold 600, `1.25rem`, `1.3`): Utilisé pour les noms de produits et cartes de boutiques.
- **Body** (Regular 400 / Medium 500, `0.9375rem`, `1.6`): Description des produits, articles et étapes.
- **Label** (SemiBold 600, `0.75rem`, uppercase, tracking `0.05em`): Badges, catégories et micro-informations.

---

## Layout

- **Grille Éditoriale :** Alternance de rangées pleine largeur et de grilles asymétriques pour rompre la monotonie des cartes alignées.
- **Conteneur Principal :** `max-w-7xl` (`1280px`) centré avec padding responsive (`px-4 sm:px-6 lg:px-12`).
- **Rythme Spacial :** Espacements généreux entre sections (`py-16 md:py-24`) pour donner un sentiment de boutique haut de gamme.

---

## Elevation & Depth

- **Flat-First & Tonal Layering :** Les ombres sont rares à l'état repos. La profondeur s'exprime par le contraste entre les surfaces (`#FFFFFF` sur `#F1EFE8`).
- **Soft Editorial Shadows :** Ombres diffusables au survol (`box-shadow: 0 12px 32px -8px rgba(44, 44, 42, 0.08)`).
- **Glass & Blur Subtil :** Effets de flou d'arrière-plan (`backdrop-blur-md bg-white/90`) sur la Navbar sticky et les filtres.

---

## Shapes

- **Radius Étagé :**
  - Boutons & Pilules : `rounded-xl` (`12px`) ou `rounded-full` (`9999px`).
  - Cartes Produits & Boutiques : `rounded-2xl` (`16px`) ou `rounded-3xl` (`24px`).
  - Badges & Micro-éléments : `rounded-lg` (`8px`).
- **Encadrement Image Produit :** Ratio 1:1 fixe avec `object-cover` et traitement d'encadrement neutre pour uniformiser le catalogue.

---

## Components

### Buttons
- **Primary Action :** Fond Corail (`#D85A30`), texte blanc, `rounded-xl`, padding `12px 24px`, effet active `scale-[0.98]`.
- **Secondary / Soft :** Fond Gris Papier Chaud (`#F1EFE8`), texte Encrier (`#2C2C2A`), hover border Corail.
- **Ghost / Link :** Texte Encrier avec flèche d'entraînement à droite (`ArrowRight`).

### Product Cards (`ProductCardModern`)
- Carte sur fond blanc avec coins arrondis (`16px`), bordure discrète (`border-gray-200/60`), masque d'image produit, badge promo corail, bouton favori en superposition douce.

### Navigation
- Navbar flottante / sticky avec fond blanc translucide, logo Ayiba épuré, menu dropdown "Devenir Partenaire" et barre de recherche contextuelle.

---

## Do's and Don'ts

### Do:
- **Do** privilégier des visuels réels et des photos d'artisans/produits locaux.
- **Do** neutraliser visuellement les images fournisseurs médiocres avec un recadrage serré et des masques propres.
- **Do** intégrer des animations de scroll subtiles (Framer Motion / GSAP) pour créer une expérience vivante.
- **Do** maintenir la clarté des prix et des filtres de catégories.

### Don't:
- **Don't** utiliser de dégradés violet/néon génériques style Web3/Crypto.
- **Don't** faire de grilles uniformes répétitives qui ressemblent à un template Bootstrap par défaut.
- **Don't** ajouter de CTA vendeur ou livreur sur la page d'accueil (réservée à l'acheteur).
- **Don't** altérer la logique métier existante (Mobile Money, escrow, favoris, paniers, redirections de rôles).
