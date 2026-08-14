# Séquence de prompts Cursor — Marketplace de proximité

Règle d'or : un prompt = une étape testée avant de passer à la suivante. Ne jamais enchaîner deux étapes sans avoir vérifié que la précédente tourne (build sans erreur, page visible, table créée).

Avant de commencer : place `design-system.md`, `.cursorrules` et `components/ui/*.tsx` à la racine du projet (voir message précédent).

---

## Étape 0 — Setup du projet

```
Crée un projet Next.js 14 avec App Router, TypeScript et Tailwind CSS.
Configure tailwind.config.js avec les tokens de couleur définis dans design-system.md
(coral, teal, amber, red, gray) et les bordures (DEFAULT 8px, lg 12px, pill 9999px).
Installe et configure :
- @supabase/supabase-js et @supabase/ssr
- Tabler Icons via le webfont CDN dans le layout racine
Crée un fichier .env.local.example avec les variables NEXT_PUBLIC_SUPABASE_URL et
NEXT_PUBLIC_SUPABASE_ANON_KEY (vides, à remplir).
Ne génère aucune page métier pour l'instant, juste la structure de base.
```

**Test avant de continuer :** `npm run dev` démarre sans erreur, page d'accueil par défaut visible.

---

## Étape 1 — Base de données Supabase

```
Voici le schéma SQL complet du projet (7 tables : users, products, orders,
deliveries, conversations, messages, reviews) — [colle ici le schéma SQL de
ton fichier marketplace_proximite_COMPLET.md].

Génère le fichier supabase/migrations/0001_init.sql avec ce schéma exact.
Ajoute les politiques RLS (Row Level Security) de base :
- users : chacun lit/modifie seulement sa propre ligne
- products : lecture publique, écriture réservée au vendeur propriétaire
- orders : lecture/écriture réservée au client et au vendeur concernés
- messages : lecture/écriture réservée aux participants de la conversation
N'exécute rien, génère juste le fichier SQL.
```

**Test avant de continuer :** exécute le SQL toi-même dans le dashboard Supabase (SQL editor), vérifie que les 7 tables apparaissent sans erreur.

---

## Étape 2 — Authentification (inscription + OTP)

```
Implémente l'authentification par numéro de téléphone (+229) avec OTP SMS via
Supabase Auth (phone provider). Crée :
- app/auth/inscription/page.tsx : formulaire numéro de téléphone
- app/auth/verification/page.tsx : saisie du code OTP à 6 chiffres
- app/auth/choix-role/page.tsx : sélection du rôle (client / vendeur / livreur)
  après la première connexion
Utilise les composants Button et les règles de design-system.md (un seul bouton
coral primaire par écran, inputs avec label au-dessus).
Crée le middleware Next.js qui protège les routes selon le rôle de l'utilisateur
stocké dans la table users.
```

**Test avant de continuer :** tu peux t'inscrire avec ton propre numéro, recevoir le code (ou le voir en mode test Supabase), et arriver sur le choix de rôle.

---

## Étape 3 — Feed client + fiche produit

```
Crée le feed client géolocalisé et la fiche produit :
- app/(client)/accueil/page.tsx : grille de ProductCard (réutilise
  components/ui/ProductCard.tsx), triée par distance via PostGIS
- app/(client)/produit/[id]/page.tsx : fiche produit complète avec galerie photo,
  description, infos vendeur, bouton "Commander" (coral, primaire)
Utilise navigator.geolocation pour récupérer la position du client.
Gère les états de chargement et le cas "aucun produit à proximité".
Respecte design-system.md à chaque étape — pas de couleur ou rayon hors charte.
```

**Test avant de continuer :** le feed affiche des produits de test (insère 2-3 lignes manuellement dans Supabase), la fiche produit s'ouvre au clic.

---

## Étape 4 — Chat intégré (Supabase Realtime)

```
Implémente le chat en temps réel entre client et vendeur :
- app/(client)/messages/page.tsx : liste des conversations + thread actif
- Utilise Supabase Realtime (channel par conversation_id) pour les nouveaux messages
- Bouton "Contacter le vendeur" sur la fiche produit qui crée ou ouvre la
  conversation existante
Reprends le layout du wireframe déjà validé (liste de conversations à gauche,
thread à droite sur desktop ; vue unique avec retour sur mobile).
```

**Test avant de continuer :** ouvre l'app dans deux onglets avec deux comptes différents, vérifie que les messages arrivent en temps réel sans rafraîchir.

---

## Étape 5 — Paiement + séquestre (Fedapay)

```
Intègre Fedapay pour le paiement à la commande :
- Crée l'API route app/api/paiement/initier/route.ts qui crée une transaction
  Fedapay et retourne l'URL de checkout
- Crée app/api/paiement/webhook/route.ts qui reçoit la confirmation Fedapay et
  met à jour orders.statut_paiement à "en_sequestre"
- Sur app/(client)/produit/[id]/page.tsx, le bouton Commander déclenche le
  paiement puis redirige vers Fedapay
Affiche un badge StatusBadge variant="success" "Paiement sécurisé" sur les
écrans de paiement (réutilise components/ui/StatusBadge.tsx).
N'implémente PAS encore le déblocage vers vendeur/livreur, juste la mise en séquestre.
```

**Test avant de continuer :** un paiement test (mode sandbox Fedapay) passe l'argent en statut "en_sequestre" dans Supabase.

---

## Étape 6 — Flux livreur + double OTP

```
Implémente le flux livreur complet :
- app/(livreur)/missions/page.tsx : liste des missions disponibles à proximité
  (reprends le wireframe carte mission déjà validé : gain, distance, accepter/refuser)
- app/(livreur)/mission/[id]/page.tsx : détail mission avec saisie OTP de collecte
  (chez le vendeur) puis OTP de livraison (chez le client)
- API route qui valide chaque OTP et déclenche, au second OTP validé, le
  déblocage du séquestre Fedapay (85% vendeur / 10% livreur / 5% plateforme)
```

**Test avant de continuer :** simule un parcours complet de bout en bout (commande → collecte OTP → livraison OTP) et vérifie dans Supabase que le statut passe à "livré" et que le séquestre est marqué débloqué.

---

## Étape 7 — Dashboard vendeur

```
Crée le dashboard vendeur (reprends le wireframe déjà validé) :
- app/(vendeur)/dashboard/page.tsx : metric cards (ventes du jour, commandes
  en attente, note moyenne), liste des derniers messages, raccourci "Publier
  un article"
- app/(vendeur)/articles/nouveau/page.tsx : formulaire de création d'article
  (reprends le wireframe déjà validé), avec statut "en attente de modération"
  par défaut (StatusBadge variant="pending")
```

**Test avant de continuer :** un nouvel article créé apparaît en statut "en attente" et n'est pas visible dans le feed client tant qu'il n'est pas validé manuellement.

---

## Étape 8 — Litiges et notation

```
Implémente :
- Bouton "Signaler un problème" sur le détail de commande client, qui crée une
  ligne dans une table disputes et bloque le déblocage automatique du séquestre
- app/(admin)/litiges/page.tsx : liste des litiges en attente d'arbitrage
- app/(client)/commande/[id]/avis/page.tsx : formulaire de notation (1-5 étoiles
  + commentaire) après livraison confirmée, qui met à jour la moyenne dans
  users.note_moyenne
```

**Test avant de continuer :** un litige créé apparaît bien dans la vue admin, et le séquestre ne se débloque pas automatiquement tant qu'il n'est pas résolu.

---

## Comment utiliser cette séquence

1. Copie-colle **une étape à la fois** dans Cursor (chat ou Composer).
2. Lance le test indiqué avant de passer à l'étape suivante.
3. Si quelque chose casse, corrige-le avec Cursor avant d'avancer — ne jamais empiler une nouvelle étape sur une base qui ne marche pas.
4. Si Cursor dévie du design system, rappelle-lui explicitement : "relis design-system.md et corrige les couleurs/espacements qui ne respectent pas la charte".
