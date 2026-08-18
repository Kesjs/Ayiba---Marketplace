# Ayiba Marketplace

Ayiba Marketplace est une plateforme e-commerce multi-vendeurs innovante, conçue pour mettre en relation des clients, des vendeurs et des livreurs dans un écosystème sécurisé et fluide.

## 🚀 Fonctionnalités Principales

- **Multi-Rôles** : Une seule application gère 4 espaces distincts (Client, Vendeur, Livreur, Admin).
- **Paiements Sécurisés (Escrow)** : Les paiements des clients (via FedaPay) sont bloqués en séquestre jusqu'à la confirmation de la livraison.
- **Livraison par OTP** : La remise du colis se fait via un code secret (OTP) fourni au client, garantissant que le livreur a bien livré la bonne personne.
- **Messagerie Intégrée** : Un système de messagerie en temps réel permettant aux clients de discuter directement avec les vendeurs et les livreurs.
- **Boutiques Indépendantes** : Chaque vendeur possède sa propre vitrine, gère son catalogue, et suit ses statistiques.

## 🛠️ Stack Technique

- **Framework** : [Next.js 14](https://nextjs.org/) (App Router)
- **Langage** : TypeScript
- **Style** : TailwindCSS, Lucide React (Icônes)
- **Base de données & Auth** : [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
- **Paiements** : FedaPay API

## 📂 Structure du Projet

L'application est structurée autour du *Next.js App Router* (`app/`). Chaque sous-dossier représente un espace dédié avec ses propres layouts sécurisés :

- `/app/(client)/` : Espace Client (profil, favoris, commandes, messagerie).
- `/app/vendeur/` : Espace Vendeur (dashboard, catalogue, paiements).
- `/app/livreur/` : Espace Livreur (missions, courses actives).
- `/app/admin/` : Back-office d'administration (modération, KYC).
- `/app/api/` : Endpoints backend (FedaPay, Webhooks).
- `/components/` : Composants réutilisables (UI globale, Modales, Layouts).
- `/lib/` : Utilitaires, clients Supabase, et Hooks personnalisés (ex: `useClientMessages`).

> 📚 **Note d'Architecture :** Pour comprendre la structure exacte de la base de données et les déviations par rapport aux fichiers de migration SQL initiaux, veuillez consulter le fichier [ARCHITECTURE.md](./ARCHITECTURE.md).

## 💻 Démarrage Local

### Prérequis
- Node.js (v18 ou supérieur)
- Un compte Supabase
- Un compte FedaPay Sandbox

### Installation

1. Cloner le dépôt et installer les dépendances :
   ```bash
   npm install
   # ou yarn install
   ```

2. Configurer les variables d'environnement. Créez un fichier `.env.local` à la racine :
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anonyme
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_secrete_admin
   
   # FedaPay
   FEDAPAY_SECRET_KEY=sk_sandbox_votrecletest
   NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY=pk_sandbox_votrecletest
   
   # URL du site (pour les webhooks)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

4. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🌐 Déploiement

Le projet est optimisé pour être déployé sur **Vercel**.
1. Connectez votre dépôt GitHub à Vercel.
2. Ajoutez toutes les variables d'environnement (de `.env.local`) dans les *Settings* de Vercel.
3. Vercel s'occupera du reste (Build & Déploiement continus).

## 📄 Licence
Propriétaire - Ayiba Marketplace.
