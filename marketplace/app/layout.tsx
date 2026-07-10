import type { Metadata } from "next";
import "./globals.css";
import 'leaflet/dist/leaflet.css'

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import NextTopLoader from 'nextjs-toploader';
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";

export const metadata: Metadata = {
  title: "Ayiba - Marketplace de proximité",
  description: "Trouve des produits près de chez toi, livrés en toute sécurité",
  manifest: "/manifest.json",
  themeColor: "#FF6653",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ayiba",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NextTopLoader 
          color="#FF6653"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #FF6653,0 0 5px #FF6653"
        />
        <CartProvider>
          <ToastProvider>
            <main className="flex-1 pb-24 lg:pb-0">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <BottomNav />
            <Toast />
            <ScrollToTop />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
