# PRODUCT.md — Ayiba Marketplace

**Product:** Ayiba — Marketplace local multi-rôles (Client, Vendeur, Livreur, Admin)  
**Type:** Full-stack marketplace app (Next.js + Supabase + Tailwind)  
**Platform:** Web (responsive mobile → desktop)  
**Status:** In development with GeniusPay payment integration

---

## Purpose

Ayiba est une plateforme de marketplace local qui permet aux clients d'acheter auprès de vendeurs locaux, avec système de livraison par livreurs, le tout sécurisé par un panel admin.

## Users & Roles

1. **Client** (espace public)
   - Consulter catalogue, ajouter au panier, passer commandes
   - Paiement par Mobile Money (MTN/Moov) ou Carte (GeniusPay)
   - Suivi des commandes, favoris, adresses
   - Peut devenir Vendeur via wizard KYC

2. **Vendeur** (dashboard)
   - Gérer articles, boutique, ventes
   - Suivi des commandes, paiements/retraits
   - Messagerie, notifications

3. **Livreur** (dashboard)
   - Missions de livraison (statut pending → accepted → completed)
   - Historique, paiements, KYC validation

4. **Admin** (dashboard)
   - Modération articles, vendeurs, livreurs
   - Gestion KYC, commandes, litiges, paiements
   - 12 sections de gestion

---

## Visual System

**Design:** Tailwind CSS custom theme (coral/teal accents)  
**Color:**
- Primary: Coral (#FF6B4A, #F97060, #FF5A4A)
- Secondary: Teal (#14B8A6)
- Neutral: Gray scale (50-900)

**Typography:** System fonts (fallback to sans)  
**Components:** Custom UI library in `components/ui/`  
**Patterns:** 
- Dashboards use `DashboardLayout` (admin/vendeur/livreur)
- Client has custom sidebar layout (`(client)/layout.tsx`)
- Settings pages use `SettingsForm` components
- Mobile bottom nav for navigation

---

## Key Recent Changes

1. **Payment Integration:** GeniusPay for Mobile Money (direct) + Card (redirect)
2. **Sidebar Collapse:** Toggle moved to header for accessibility
3. **Responsive Fix:** Breakpoints corrected (md→lg), mobile spacing optimized
4. **UI Consistency:** Single CartProvider + ToastProvider at root

---

## Design Principles

- **Mobile-first:** All features work on small screens
- **Accessibility:** Always-visible controls (collapse toggle in header)
- **Consistency:** Shared patterns across roles (Sidebar.tsx, DashboardLayout, SettingsForm)
- **Performance:** Lazy loading, pagination, optimized queries

---

## Next Phase

- Unify Client dashboard with shared `DashboardLayout` (Option A migration)
- Harden error states, empty states, edge cases
- Polish animations and micro-interactions
