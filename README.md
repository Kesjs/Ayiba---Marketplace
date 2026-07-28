# Ayiba — Marketplace

Marketplace e-commerce béninoise mettant en relation **clients**,
**vendeurs** et **livreurs indépendants**, avec paiement Mobile Money en
séquestre (escrow) et livraison suivie de bout en bout.

> ⚠️ Projet en développement actif. Certaines fonctionnalités décrites
> dans les pages légales (paiement en ligne réel, calcul des frais à la
> distance, assignation automatique du livreur) ne sont **pas encore
> implémentées** côté code — voir la section [État actuel du projet](#état-actuel-du-projet--limitations-connues).

---

## Sommaire

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Rôles et fonctionnalités](#rôles-et-fonctionnalités)
- [Structure du projet](#structure-du-projet)
- [Modèle de données (vue d'ensemble)](#modèle-de-données-vue-densemble)
- [Cycle de vie d'une commande](#cycle-de-vie-dune-commande)
- [Authentification, rôles et sécurité](#authentification-rôles-et-sécurité)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [État actuel du projet / limitations connues](#état-actuel-du-projet--limitations-connues)
- [Dette technique connue](#dette-technique-connue)

---

## Aperçu

Ayiba est une marketplace à trois faces :

- **Vendeurs** : commerçants indépendants qui publient des articles dans
  leur boutique.
- **Clients** : achètent des articles, suivent leurs commandes, discutent
  avec vendeurs/livreurs, laissent des avis.
- **Livreurs indépendants** : prennent en charge les commandes expédiées
  par les vendeurs et les livrent aux clients, avec vérification de
  remise par QR code / code à 6 chiffres.

Un espace **admin** supervise l'ensemble : validation KYC, litiges,
modération des avis, paramètres système, paiements/retraits.

---

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Langage | TypeScript |
| Style | Tailwind CSS 4 |
| Backend / DB | Supabase (Postgres, Auth, Realtime, Storage, RPC) |
| Animations | Framer Motion, Lottie |
| Cartes | Leaflet |
| QR Code | `qrcode` (génération), `html5-qrcode` (scan) |
| Graphiques | Recharts |
| Déploiement | Vercel |

---

## Rôles et fonctionnalités

### 👤 Client (`app/(client)/...`)
- Explorer le catalogue, filtrer/rechercher des articles (`/explorer`,
  `/recherche`, `/catalogue`, `/produits/[id]`)
- Panier multi-vendeurs (`CartContext`) — un panier peut générer
  plusieurs commandes (une par vendeur)
- Checkout (`/checkout`) : adresse de livraison, contact, récapitulatif
- Suivi de ses commandes (`/commandes`, `/commandes/[id]`) avec statut en
  temps réel, infos du livreur assigné
- Messagerie directe avec vendeur/livreur par commande
- Favoris, historique, gestion du profil et des adresses
- Laisser des avis (produit et livreur) après réception

### 🏪 Vendeur (`app/vendeur/...`)
- Dashboard avec statistiques de ventes (graphiques Recharts)
- Gestion des articles (`/vendeur/articles`)
- Gestion de la boutique et paramètres (nom, mobile money, quartier...)
- Gestion des commandes (`/vendeur/commandes`) : suivi en temps réel
  (Supabase Realtime), changement de statut
  (`en_attente → confirmée → préparée → expédiée`), annulation avec
  motif, actions groupées, filtre/tri/recherche, export
- Suivi des paiements et demandes de retrait (`/vendeur/paiements`)
- Onboarding KYC obligatoire avant activation (`/vendeur/kyc`)

### 🛵 Livreur (`app/livreur/...`)
- Missions à confirmer / en cours (`/livreur/missions`)
- Récupération de colis → génération d'un QR code + code à 6 chiffres à
  usage unique pour la remise au client
- Signalement d'incidents : client indisponible, refus de livraison,
  colis endommagé (avec preuve photo)
- Historique des livraisons, gains et demandes de retrait
  (`/livreur/historique`, `/livreur/paiements`)
- Onboarding KYC obligatoire (`/livreur/kyc`)

### 🛠️ Admin (`app/admin/...`)
- Dashboard global
- Validation des demandes KYC (vendeurs/livreurs) et modération des avis
- Gestion des litiges, des catégories, des utilisateurs
- Suivi des commandes et des paiements/retraits Mobile Money
  (validation manuelle des demandes de retrait)
- Paramètres système : commission plateforme, frais de livraison par
  défaut, mode maintenance
- Accès protégé par MFA (`/admin/mfa-setup`, `/admin/mfa-verify`)

---

## Structure du projet

```
marketplace/
├── app/
│   ├── (client)/          # Espace client : accueil, commandes, favoris, profil...
│   ├── vendeur/           # Espace vendeur : dashboard, articles, commandes, KYC...
│   ├── livreur/           # Espace livreur : missions, historique, paiements, KYC...
│   ├── admin/             # Back-office : validation, litiges, paramètres, MFA...
│   ├── api/admin/         # Routes API (ex : suppression de compte, URL doc KYC)
│   ├── checkout/          # Tunnel de commande
│   ├── boutiques/[id]/    # Page publique boutique
│   ├── produits/[id]/     # Fiche produit publique
│   ├── auth/              # Callback auth, reset password
│   ├── devenir-vendeur/   # Landing d'acquisition vendeur
│   ├── devenir-livreur/   # Landing d'acquisition livreur
│   └── (pages légales)/   # cgu, privacy, politique-livraison, faq, etc.
├── components/
│   ├── ui/                # Composants génériques (Navbar, Modal, Button, Toast...)
│   ├── dashboard/         # Composants du back-office (Sidebar, DeliveryMap, charts...)
│   ├── kyc/                # Wizards KYC vendeur/livreur
│   ├── client/, vendeur/, livreur/, boutique/, legal/, onboarding/, scanner/
├── context/                # CartContext, ToastContext, UiChromeContext
├── lib/
│   ├── supabase/           # Clients Supabase (browser/server)
│   ├── hooks/               # Hooks partagés (auth, messages, admin...)
│   ├── constants/           # Constantes métier (statuts commande, nav...)
│   └── queries/             # Requêtes réutilisables (articles, vendeurs...)
├── supabase/migrations/     # Migrations SQL versionnées (partielles — voir note ci-dessous)
├── middleware.ts            # Protection des routes par rôle + mode maintenance
└── public/                  # Assets statiques, logos, illustrations
```

> **Note** : `app/hooks/` contient aussi des hooks métier (livreur,
> vendeur) en plus de `lib/hooks/` — voir [Dette technique](#dette-technique-connue).

---

## Modèle de données (vue d'ensemble)

Le schéma complet vit dans Supabase (seules 3 migrations sont versionnées
dans ce repo — le reste du schéma existe directement dans le dashboard
Supabase du projet). Tables principales identifiées à l'usage :

| Table | Rôle |
|---|---|
| `users` | Compte utilisateur, `role` (client/vendeur/livreur/admin), `statut` (actif/suspendu) |
| `vendeurs` | Profil boutique (nom, quartier, mobile money...) |
| `livreurs` | Profil livreur |
| `addresses` | Adresses de livraison client (`commune`, `quartier`, `latitude`/`longitude`) |
| `commandes` | Une commande = un vendeur ; statut, montants, livreur assigné, codes de remise |
| `commande_articles` | Lignes d'articles d'une commande |
| `paiements` | Paiement reçu par commande (montant, montant net, statut) |
| `retraits` | Demandes de retrait vendeur/livreur (Mobile Money) |
| `avis` | Avis client sur un produit ou un livreur |
| `parametres_systeme` | Paramètres globaux (commission, frais par défaut, mode maintenance) |

Statuts de commande (`lib/constants/commandes.ts`) :

```
en_attente → confirmee → preparee → expediee → livree
                                        └──► en_attente_verification → livree | remboursee
   (annulee possible jusqu'à "preparee")
```

---

## Cycle de vie d'une commande

1. **Client** valide son panier → une commande par vendeur est créée via
   la RPC Supabase `creer_commande`.
2. **Vendeur** confirme, prépare, puis marque la commande "expédiée".
3. **Livreur** est assigné (mécanisme d'assignation actuel non
   entièrement clair côté code — voir limitations), récupère le colis
   (génération QR + code 6 chiffres via RPC `livreur_recuperer_colis`).
4. **Client** confirme la réception (scan QR ou code) → RPC
   `verifier_code_livraison` → commande passe à `livree`.
5. En cas d'incident (client injoignable, refus, colis endommagé) →
   passage en `en_attente_verification`, tranché par l'admin.
6. Une fois `livree`, l'argent devient disponible pour retrait côté
   vendeur/livreur (demande via l'app, validation manuelle par l'admin).

---

## Authentification, rôles et sécurité

- Authentification via Supabase Auth (email + mot de passe uniquement,
  pas de connexion sociale type Google), cookies gérés via `@supabase/ssr`.
- `middleware.ts` protège les routes par préfixe et par rôle
  (`/vendeur/dashboard`, `/livreur/missions`, `/admin/*`, etc.), redirige
  les comptes suspendus vers `/compte-suspendu`.
- **Mode maintenance** global piloté par `parametres_systeme` (clé
  `mode_maintenance`), lu à chaque requête par le middleware.
- **Admin protégé par MFA** (`/admin/mfa-setup`, `/admin/mfa-verify`).
- Une **Edge Function Supabase externe** (`confirm-delivery`) est
  appelée côté client mais **n'est pas versionnée dans ce repo** — elle
  vit directement dans le projet Supabase.

---

## Installation

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Autres scripts disponibles :

```bash
npm run build   # build de production
npm run start   # lancer le build de production
npm run lint    # ESLint
```

---

## Variables d'environnement

Aucun `.env.example` n'est présent dans le repo actuellement — à créer.
Variables identifiées comme utilisées dans le code :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # utilisé côté API admin (server-only, ne jamais exposer côté client)
NEXT_PUBLIC_SITE_URL=            # utilisé pour les redirections d'auth (emailRedirectTo)
```

---

## État actuel du projet / limitations connues

Un audit détaillé (fonctionnel + design) est disponible dans
[`roadmap-livraison-ayiba.md`](./roadmap-livraison-ayiba.md). Points
clés à connaître avant de considérer le site comme prêt pour un vrai
lancement :

- **Paiement non fonctionnel** : le checkout crée la commande mais ne
  déclenche aucun paiement réel (pas d'intégration FedaPay malgré ce
  qu'annoncent les CGU/FAQ).
- **Frais de livraison non calculés** : promis "frais de base +
  distance × prix/km" dans la politique de livraison, mais aucune
  coordonnée GPS n'est jamais capturée ni utilisée aujourd'hui.
- **Adresses non fiables** : champs texte libres sans validation ni
  géolocalisation.
- **Assignation du livreur** : le mécanisme qui remplit `livreur_id` sur
  une commande n'existe dans aucun fichier de ce repo — à clarifier ou
  construire (voir roadmap, chantier "pool ouvert").
- **Retraits 100% manuels** : un admin doit valider et exécuter chaque
  virement Mobile Money à la main, aucune API de payout automatisée.

---

## Dette technique connue

- **Hooks dupliqués** entre `app/hooks/` et `lib/hooks/` (ex.
  `useVendeurCommandes`, `useVendeurDashboard` existent aux deux
  endroits, avec des implémentations légèrement différentes) — à
  consolider pour éviter les incohérences.
- **Label d'adresse codé en dur** (`'domicile'`) dans
  `WelcomeAddressModal.tsx` et `checkout/page.tsx` — l'utilisateur ne
  choisit jamais de nom pour son adresse, cause de doublons visuels.
- **Schéma SQL partiellement versionné** : seules 3 migrations existent
  dans `supabase/migrations/`, le reste du schéma (tables commandes,
  paiements, retraits, fonctions RPC...) vit uniquement dans le
  dashboard Supabase — à exporter/versionner pour éviter de perdre la
  trace des changements.

