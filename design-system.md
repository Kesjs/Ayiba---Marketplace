# Design system — Marketplace de proximité

Ce document est la référence unique pour tout le design front-end du projet.
Avant de créer un nouveau composant, vérifie d'abord `components/ui/` — s'il existe déjà, réutilise-le. Ne jamais inventer une couleur, un espacement ou un rayon hors de ce document.

---

## 1. Philosophie

- **Chaleureux et local**, pas premium ni corporate. C'est un marché de quartier digitalisé, pas une fintech.
- **Clair et rassurant** : chaque écran qui touche à l'argent (paiement, séquestre, OTP) doit visuellement respirer la sécurité.
- **Sobre** : surfaces plates, pas de dégradés, pas d'ombres fortes, pas d'effets décoratifs.
- **Une seule couleur d'action par écran.** Jamais deux boutons coral en concurrence visuelle sur la même vue.

---

## 2. Couleurs

### Palette principale

| Token | Hex | Usage |
|---|---|---|
| `coral-50` | `#FAECE7` | Fond très léger (badges prix, hover) |
| `coral-100` | `#F5C4B3` | Fond léger |
| `coral-400` | `#D85A30` | **Couleur d'action principale** — boutons CTA, prix, liens primaires |
| `coral-600` | `#993C1D` | Hover/active sur bouton coral |
| `coral-800` | `#712B13` | Texte sur fond coral clair |
| `coral-900` | `#4A1B0C` | Texte foncé sur fond coral très clair |
| `teal-50` | `#E1F5EE` | Fond badge "sécurisé/payé" |
| `teal-100` | `#9FE1CB` | Fond léger statut confiance |
| `teal-400` | `#1D9E75` | **Couleur de confiance** — statuts payé/livré/vérifié/séquestre uniquement |
| `teal-800` | `#085041` | Texte sur fond teal clair |
| `amber-50` | `#FAEEDA` | Fond alerte/attente |
| `amber-400` | `#EF9F27` | Icônes alerte, badges "en attente", litige |
| `amber-800` | `#633806` | Texte sur fond amber |
| `red-50` | `#FCEBEB` | Fond erreur |
| `red-400` | `#E24B4A` | Erreurs, suppression, refus |
| `red-800` | `#791F1F` | Texte sur fond rouge clair |
| `gray-50` | `#F1EFE8` | Fond de page |
| `gray-100` | `#D3D1C7` | Fond de carte secondaire / hover |
| `gray-400` | `#888780` | Texte tertiaire, icônes inactives |
| `gray-600` | `#5F5E5A` | Bordures, séparateurs visibles |
| `gray-900` | `#2C2C2A` | Texte principal |
| `white` | `#FFFFFF` | Fond de carte primaire |

### Règles d'usage strictes

- **Coral** : exclusivement pour CTA primaires (Commander, Publier, Payer, Accepter), prix affichés, liens d'action. Jamais en fond de page ou en décoratif.
- **Teal** : exclusivement pour les statuts de confiance (payé, vérifié, livré, en séquestre, badge "Paiement sécurisé"). Ne jamais l'utiliser comme couleur de marque ou décorative — sinon il perd sa valeur de signal.
- **Amber** : alertes, litiges, "en attente de validation/modération".
- **Red** : erreurs, refus, suppression, actions destructives uniquement.
- **Gray** : tout le reste — texte, bordures, fonds neutres.
- Texte sur fond coloré : toujours utiliser le stop `800` ou `900` de la même rampe (ex : texte `coral-800` sur fond `coral-50`). Jamais de noir générique sur un fond coloré.

---

## 3. Typographie

- Police : système sans-serif (`Inter`, ou fallback `-apple-system, sans-serif`).
- Poids autorisés : **400 (regular)** et **500 (medium)** uniquement. Jamais 600/700 — ça casse la légèreté de l'interface.
- Casse : phrase normale partout (jamais de MAJUSCULES ni de Title Case pour les boutons/labels).

| Élément | Taille | Poids |
|---|---|---|
| H1 | 22px | 500 |
| H2 | 18px | 500 |
| H3 | 16px | 500 |
| Corps de texte | 14–16px | 400 |
| Label / texte secondaire | 12–13px | 400 |
| Hint / texte tertiaire | 11px | 400 |

---

## 4. Espacement

Multiples de 4 uniquement : `4, 8, 12, 16, 24, 32, 48`. Jamais de valeur arbitraire (13px, 22px, etc.).

- Padding interne carte : `16px 20px`
- Gap entre éléments d'une liste : `8px` ou `12px`
- Marge entre sections : `24px` ou `32px`

---

## 5. Rayons et bordures

- Rayon standard (inputs, boutons, badges) : `8px`
- Rayon cartes principales : `12px`
- Rayon pills (badges arrondis complets) : `9999px`
- Bordures : toujours `1px solid` en `gray-100` (mode clair). Jamais de bordure épaisse sauf accent volontaire (ex : carte mise en avant).
- **Jamais d'ombre portée forte.** Seule exception : `box-shadow: 0 0 0 3px` pour les focus rings d'accessibilité.
- Jamais de dégradé.

---

## 6. Composants — règles générales

### Boutons
- **Primaire** : fond `coral-400`, texte blanc, poids 500, rayon 8px, padding `10px 20px`. Hover → `coral-600`.
- **Secondaire** : fond transparent, bordure `1px solid gray-100`, texte `gray-900`. Hover → fond `gray-50`.
- **Destructif** : fond transparent ou `red-50`, texte `red-800`, bordure `red-400` si besoin d'emphase.
- Un seul bouton primaire visible par écran/section. Toute autre action est secondaire.

### Cartes
- Fond blanc, bordure `1px solid gray-100`, rayon `12px`, padding `16px 20px`.
- Carte "métrique" (stat) : fond `gray-50` (pas de bordure), label 12px gris au-dessus, chiffre 24px/500 en dessous.

### Badges de statut
- Toujours pill (`rayon 9999px`), padding `4px 12px`, taille 11px, poids 500.
- Couleur selon la sémantique : teal = confiance/validé, amber = en attente, red = erreur/refusé, gray = neutre/brouillon.

### Inputs
- Hauteur 36–40px, rayon 8px, bordure `1px solid gray-100`. Focus → bordure `coral-400` + ring léger.
- Label toujours au-dessus, 12px, `gray-600`.

### Icônes
- Set unique : **Tabler Icons** (outline uniquement, jamais filled).
- Taille standard inline : 16–20px. Décoratif max : 24px.
- Couleur héritée du texte parent, sauf icône de statut (teal/amber/red selon contexte).

---

## 7. Tokens Tailwind (à coller dans `tailwind.config.js`)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FAECE7',
          100: '#F5C4B3',
          200: '#F0997B',
          400: '#D85A30',
          600: '#993C1D',
          800: '#712B13',
          900: '#4A1B0C',
        },
        teal: {
          50: '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          400: '#1D9E75',
          600: '#0F6E56',
          800: '#085041',
          900: '#04342C',
        },
        amber: {
          50: '#FAEEDA',
          100: '#FAC775',
          400: '#EF9F27',
          600: '#BA7517',
          800: '#633806',
        },
        red: {
          50: '#FCEBEB',
          100: '#F7C1C1',
          400: '#E24B4A',
          600: '#A32D2D',
          800: '#791F1F',
        },
        gray: {
          50: '#F1EFE8',
          100: '#D3D1C7',
          200: '#B4B2A9',
          400: '#888780',
          600: '#5F5E5A',
          800: '#444441',
          900: '#2C2C2A',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
      },
    },
  },
}
```

---

## 8. Checklist avant de livrer un écran

- [ ] Un seul bouton coral visible à l'écran
- [ ] Teal utilisé uniquement pour un statut de confiance, pas en décoratif
- [ ] Tous les espacements sont des multiples de 4
- [ ] Aucun dégradé, aucune ombre forte
- [ ] Police : poids 400 ou 500 uniquement
- [ ] Tous les textes sur fond coloré utilisent le stop 800/900 de la même rampe
- [ ] Icônes Tabler outline uniquement
- [ ] Composant déjà existant dans `components/ui/` réutilisé si possible, pas redupliqué