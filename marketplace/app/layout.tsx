import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { UiChromeProvider } from "@/context/UiChromeContext";
import { InstallAppProvider } from "@/context/InstallAppContext";
import NextTopLoader from "nextjs-toploader";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { MaintenanceBanner } from "@/components/ui/MaintenanceBanner";
import { AppShell } from "@/components/layout/AppShell";
import { Toast } from "@/components/ui/Toast";
import { PwaSplashScreen } from "@/components/ui/PwaSplashScreen";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ayiba-marketplace-4376-rho.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D85A30",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Ayiba — La Marketplace de Proximité au Bénin",
    template: "%s | Ayiba Bénin",
  },
  description:
    "Achetez et vendez facilement au Bénin : Mode, artisanat, beauté, électronique. Paiements 100% sécurisés par Mobile Money (MTN, Moov, Celtiis) et livraison express partout au Bénin.",
  applicationName: "Ayiba",
  authors: [{ name: "Ayiba Marketplace", url: BASE_URL }],
  generator: "Next.js",
  keywords: [
    "ayiba",
    "marketplace bénin",
    "achat en ligne bénin",
    "vendre en ligne cotonou",
    "boutique en ligne bénin",
    "artisanat béninois",
    "mode béninoise",
    "livraison cotonou",
    "mobile money bénin",
    "mtn mobile money bénin",
    "moov money bénin",
    "celtiis cash bénin",
    "e-commerce bénin",
  ],
  creator: "Ayiba",
  publisher: "Ayiba Inc",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ayiba",
  },
  openGraph: {
    type: "website",
    locale: "fr_BJ",
    url: BASE_URL,
    siteName: "Ayiba",
    title: "Ayiba — La Marketplace de Proximité au Bénin",
    description:
      "Trouvez des produits de qualité près de chez vous. Paiements sécurisés par Mobile Money et livraison locale rapide.",
    images: [
      {
        url: "/images/hero/hero-vendeur.webp",
        width: 1200,
        height: 630,
        alt: "Ayiba Marketplace Bénin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ayiba — La Marketplace de Proximité au Bénin",
    description:
      "Achetez et vendez en toute sécurité avec Ayiba. Paiements Mobile Money instantanés et livraison locale.",
    images: ["/images/hero/hero-vendeur.webp"],
    creator: "@AyibaMarket",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Data Schema.org (Organization + WebSite avec SearchAction)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Ayiba",
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/logo-email.png`,
          width: "400",
          height: "125",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "ayiba.marketplace@gmail.com",
          contactType: "customer service",
          areaServed: "BJ",
          availableLanguage: "French",
        },
        sameAs: [
          "https://facebook.com/ayiba.marketplace",
          "https://instagram.com/ayiba.marketplace",
          "https://tiktok.com/@ayiba.marketplace",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Ayiba",
        publisher: {
          "@id": `${BASE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${BASE_URL}/recherche?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD Schema.org pour Google Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <NextTopLoader
          color="#D85A30"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #D85A30,0 0 5px #D85A30"
        />
        <MaintenanceBanner />
        <PwaSplashScreen />
        <InstallAppProvider>
          <CartProvider>
            <ToastProvider>
              <UiChromeProvider>
                <AppShell>{children}</AppShell>
                <Toast />
                <ScrollToTop />
              </UiChromeProvider>
            </ToastProvider>
          </CartProvider>
        </InstallAppProvider>
      </body>
    </html>
  );
}
