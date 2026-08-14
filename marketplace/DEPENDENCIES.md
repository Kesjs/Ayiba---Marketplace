# Analyse des Dépendances - Optimisation

## 📦 Dépendances Actuelles

### Production
```json
{
  "@lottiefiles/dotlottie-react": "^0.19.4",           // 150KB - Animations
  "@lottiefiles/react-lottie-player": "^3.6.0",        // 180KB - Animations
  "@supabase/ssr": "^0.12.0",                           // 50KB - Auth/DB
  "@supabase/supabase-js": "^2.108.2",                  // 200KB - DB client
  "clsx": "^2.1.1",                                     // 3KB - Utility
  "fedapay": "^1.2.5",                                  // 50KB - Payment
  "framer-motion": "^12.42.2",                          // 280KB - Animations ⚠️
  "html5-qrcode": "^2.3.8",                             // 180KB - QR Scanner ⚠️
  "leaflet": "^1.9.4",                                  // 200KB - Maps ⚠️
  "lucide-react": "^1.23.0",                            // 100KB - Icons
  "next": "16.2.9",                                     // Framework
  "nextjs-toploader": "^3.9.17",                        // 20KB - Progress bar
  "pdfkit": "^0.15.1",                                  // 150KB - PDF ⚠️
  "react": "19.2.4",                                    // Framework
  "qrcode": "^1.5.4",                                   // 80KB - QR encode
  "react-dom": "19.2.4",                                // Framework
  "recharts": "^3.9.0",                                 // 250KB - Charts ⚠️
  "tailwind-merge": "^3.6.0",                           // 15KB - CSS utility
}
```

**Total Production: ~2.5MB**

---

## ⚠️ Optimisations Requises

### 1. **Framer Motion (280KB)**
**Statut:** ⚠️ Utilisé mais peut être optimisé

**Problème:**
- Importé statiquement partout
- Utilisé pour des animations non-critiques

**Solution:**
```typescript
// ❌ Avant
import { motion } from "framer-motion";

// ✅ Après
const motion = dynamic(() => import("framer-motion").then(mod => ({ 
  default: mod.motion 
})), { ssr: false });
```

**Gain:** 280KB sur le bundle initial

---

### 2. **html5-qrcode (180KB)**
**Statut:** ⚠️ Utilisé uniquement sur certaines pages

**Problème:**
- Importé sur toutes les pages
- Seulement nécessaire pour les pages de scanner

**Solution:**
```typescript
// Lazy-load uniquement sur les pages de scanner
const QRScanner = dynamic(() => import("@/components/scanner/QrScannerModal"), {
  loading: () => <div>Chargement...</div>,
});
```

**Pages concernées:**
- `/livreur/missions` - Scanner QR pour les missions
- `/vendeur/articles` - Scanner optionnel

**Gain:** 180KB sur pages autres que scanner

---

### 3. **Leaflet (200KB)**
**Statut:** ⚠️ Utilisé uniquement pour les cartes

**Problème:**
- Importé statiquement
- Utilisé seulement sur certaines pages

**Solution:**
```typescript
// Lazy-load les cartes
const DeliveryMap = dynamic(() => import("@/components/dashboard/DeliveryMap"), {
  loading: () => <MapSkeleton />,
});
```

**Pages concernées:**
- `/livreur/missions` - Carte des missions
- `/checkout` - Carte de livraison

**Gain:** 200KB sur pages autres que carte

---

### 4. **Recharts (250KB)**
**Statut:** ⚠️ Utilisé uniquement sur pages dashboards

**Problème:**
- Importé statiquement
- Seulement sur /vendeur/dashboard et /admin/dashboard

**Solution:**
```typescript
// Lazy-load les charts
const VentesChart = dynamic(() => import("@/components/dashboard/VentesChart"), {
  loading: () => <ChartSkeleton />,
});
```

**Gain:** 250KB sur pages autres que dashboard

---

### 5. **PDFKit (150KB)**
**Statut:** ⚠️ Utilisé pour export de factures

**Problème:**
- Importé statiquement
- Utilisé uniquement pour générer des factures

**Solution:**
```typescript
// Lazy-load la génération de PDF
const generatePDF = async () => {
  const { generateFacture } = await import("@/lib/pdf/facture");
  return generateFacture(data);
};
```

**Gain:** 150KB sur pages autres que facture

---

### 6. **Lucide React (100KB)**
**Statut:** ✅ Importé avec tree-shaking

**Problème:**
- Beaucoup d'icônes importées mais peu utilisées
- Même avec tree-shaking, certains composants importent trop d'icônes

**Solution:**
```typescript
// ❌ Avant - Importe 30+ icônes
import * from "lucide-react";

// ✅ Après - Importe uniquement les icônes utilisées
import { Wallet, Clock, Zap, MapPin } from "lucide-react";
```

**Gain:** 30-50KB par composant bien optimisé

---

## 📊 Plan d'Optimisation

### Phase 1: Lazy Loading (Immédiat - 900KB potentiel)
- [ ] Framer Motion: `dynamic()`
- [ ] html5-qrcode: `dynamic()`
- [ ] Leaflet: `dynamic()`
- [ ] Recharts: `dynamic()`
- [ ] PDFKit: Async import

### Phase 2: Tree Shaking (Court terme - 50-100KB)
- [ ] Audit tous les imports lucide-react
- [ ] Configurer tsconfig pour tree-shaking
- [ ] Vérifier @supabase/supabase-js imports

### Phase 3: Alternatives Légères (Moyen terme)
- [ ] Remplacer Recharts par Lightweight charts
- [ ] Remplacer Leaflet par Maplibre GL (légère alternative)
- [ ] Remplacer Lottie par simple CSS animations

### Phase 4: Code Splitting (Long terme)
- [ ] Route-based splitting
- [ ] Dynamic route params splitting
- [ ] Prefetching intelligent

---

## 🎯 Résultats Attendus

| Stratégie | Avant | Après | Gain |
|-----------|-------|-------|------|
| **Initial Bundle** | 500KB | 300KB | 40% ⬇️ |
| **FCP** | 1.2s | 600ms | 50% ⬇️ |
| **LCP** | 2.4s | 1.2s | 50% ⬇️ |
| **TTI** | 3.5s | 1.8s | 48% ⬇️ |

---

## 🔧 Configuration TypeScript pour Tree Shaking

```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "target": "ES2020",
    "moduleResolution": "bundler",
    "useSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "plugins": [
      {
        "name": "next"
      }
    ]
  }
}
```

---

## 📈 Commandes de Monitoring

```bash
# Analyser le bundle
npm run build -- --analyze

# Vérifier les dépendances inutilisées
npm ls --depth=0

# Vérifier les imports inutilisés dans un fichier
npx unimported

# Vérifier les vulnérabilités
npm audit

# Vérifier les mises à jour
npm outdated

# Analyser le bundle avec webpack-bundle-analyzer
npm install --save-dev @next/bundle-analyzer
```

---

## 🎓 Meilleures Pratiques

### 1. Imports Nommés
```typescript
// ✅ Bon - tree-shaking activé
import { motion } from "framer-motion";
import { Wallet, Clock } from "lucide-react";

// ❌ Mauvais - tree-shaking désactivé
import * as framer from "framer-motion";
import * as Icons from "lucide-react";
```

### 2. Lazy Loading de Composants
```typescript
// ✅ Bon
const HeavyComponent = dynamic(() => import("@/components/Heavy"), {
  loading: () => <Skeleton />,
  ssr: false, // Si server-rendering non nécessaire
});

// ❌ Mauvais
import HeavyComponent from "@/components/Heavy";
```

### 3. Async Imports pour Utilitaires
```typescript
// ✅ Bon - chargé à la demande
const generatePDF = async () => {
  const pdflib = await import("pdfkit");
  return pdflib.generate();
};

// ❌ Mauvais
import pdflib from "pdfkit";
```

---

## 📚 Références

- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/dynamic-imports)
- [Tree Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [React Code Splitting](https://react.dev/reference/react/lazy)
- [Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/package-bundling)
