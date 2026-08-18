# Architecture Technique & Base de Données

Ce document cartographie l'architecture réelle d'Ayiba Marketplace telle qu'elle est implémentée en code, et clarifie les écarts potentiels avec les fichiers de migration initiaux.

## 1. Structure du Code Source (Next.js App Router)

L'application utilise le framework Next.js 14+ avec l'App Router (`app/`). La plateforme est divisée en plusieurs espaces selon le rôle de l'utilisateur :

- `app/(client)/` : L'espace réservé aux acheteurs (profil, historique des commandes, messagerie avec les vendeurs/livreurs, favoris).
- `app/vendeur/` : L'espace de gestion pour les boutiques (dashboard, gestion du catalogue, commandes reçues, retraits financiers).
- `app/livreur/` : L'espace pour les coursiers (missions disponibles, courses actives avec QR Code OTP, paiements).
- `app/admin/` : L'espace d'administration et de modération (validation KYC, litiges, paiements).
- `app/api/` : Routes backend serveur (création de paiements FedaPay, gestion des webhooks).

## 2. Schéma de Base de Données Réel (Supabase)

Voici la structure des tables **telles qu'elles sont réellement utilisées par le code de production** (qui peut différer du fichier de migration `0001_init.sql` généré au début du projet).

### 2.1. Table `users`
Contient l'ensemble des utilisateurs de la plateforme (Clients, Vendeurs, Livreurs, Admin).
- `id` (uuid) : Clé primaire, reliée à `auth.users`.
- `phone` (text) : Numéro de téléphone unique servant d'identifiant principal.
- `full_name` (text) : Nom complet ou nom de la boutique.
- `role` (text) : `client`, `vendeur`, `livreur`, `admin`.
- `statut` (text) : État du compte (actif, suspendu, etc.).

### 2.2. Table `products`
- `id` (uuid)
- `vendeur_id` (uuid) : Lien vers la table `users`.
- `nom` (text)
- `prix`, `ancien_prix` (numeric)
- `categorie` (text)
- `photos` (text[])
- `statut` (text) : `actif`, `en_attente`, `suspendu`.

### 2.3. Table `orders`
Gère l'achat de produits. Les paiements sont sécurisés par un système d'Escrow (séquestre).
- `id` (uuid)
- `client_id` (uuid), `vendeur_id` (uuid), `product_id` (uuid)
- `montant_total` (numeric)
- `statut` (text) : `en_attente`, `payé`, `en_preparation`, `collecté`, `en_livraison`, `livré`, `annulé`.
- `statut_paiement` (text) : `non_payé`, `en_sequestre`, `débloqué`, `remboursé`.
- `otp_livraison` (text) : Code secret remis au client pour valider la livraison.
- `otp_confirme` (boolean) : Si `true`, le paiement séquestré peut être débloqué.

### 2.4. Table `deliveries`
Relie un Livreur à une Commande.
- `id` (uuid)
- `order_id` (uuid)
- `livreur_id` (uuid)
- `statut` (text) : `disponible`, `acceptée`, `collectée`, `livrée`, `échouée`.
- `otp_collecte` / `otp_collecte_confirme` : Validation entre Vendeur et Livreur.
- `otp_livraison` / `otp_livraison_confirme` : Validation entre Livreur et Client.

### 2.5. Table `messages` (Attention: Différence avec `0001_init.sql`)
> ⚠️ **IMPORTANT : DÉVIATION DE SCHÉMA**
> Le fichier `0001_init.sql` déclare que la table utilise les colonnes `conversation_id` et `sender_id`. **C'est faux en production.**
> Le code de production actuel (via `useClientMessages`, `ContactModal`) regroupe les conversations manuellement en utilisant les colonnes suivantes :
- `id` (uuid)
- `expediteur_id` (uuid) : L'utilisateur qui envoie (Client, Vendeur ou Livreur).
- `destinataire_id` (uuid) : L'utilisateur qui reçoit.
- `contenu` (text) : Le message.
- `lu` (boolean)
- `commande_id` (uuid) : Optionnel, pour lier un message à un contexte.
- `created_at` (timestamptz)

La table `conversations` n'est **pas utilisée** par le système actuel de messagerie.

## 3. Sécurité (Row Level Security - RLS)

Supabase est configuré avec des règles RLS (Row Level Security) strictes :
- Seul l'expéditeur et le destinataire peuvent lire un message.
- Un vendeur ne peut modifier que ses propres produits.
- Les données sensibles (OTP) sont gérées soit côté serveur (API routes) soit protégées via des vues sécurisées.
