"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Capture l'évènement `beforeinstallprompt` (Chrome/Android/Edge) une seule
// fois au montage du RootLayout, pour qu'il reste disponible peu importe la
// page sur laquelle l'utilisateur clique sur "Installer l'application"
// (le layout racine ne se démonte jamais entre deux navigations Next.js).
//
// Safari iOS ne supporte pas `beforeinstallprompt` du tout : aucune API ne
// permet de déclencher l'installation par programme, seulement des
// instructions manuelles (Partager > Sur l'écran d'accueil). `isIOS` sert à
// distinguer ce cas dans l'UI plutôt que de simplement cacher le bouton.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppContextType {
  /** true si Chrome/Android a proposé l'installation native pour cette session */
  canInstallNative: boolean;
  /** true si Safari iOS (installation manuelle uniquement, pas de prompt natif) */
  isIOS: boolean;
  /** true si déjà lancée en mode standalone (déjà installée) */
  isStandalone: boolean;
  /** déclenche le prompt natif Chrome/Android. Ne fait rien sur iOS. */
  promptInstall: () => Promise<void>;
}

const InstallAppContext = createContext<InstallAppContextType | undefined>(undefined);

export function InstallAppProvider({ children }: { children: ReactNode }) {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari expose ce flag non-standard au lieu de display-mode
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const handleInstalled = () => {
      setDeferredEvent(null);
      setIsStandalone(true);
    };
    window.addEventListener("appinstalled", handleInstalled);

    // Service worker minimal : requis par Chrome/Android pour proposer
    // l'installation. Ne met rien en cache (pas de stratégie offline pour
    // l'instant) — évite tout bug de contenu périmé, sert uniquement à
    // satisfaire le critère d'installabilité.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // installabilité dégradée seulement, pas bloquant pour le reste du site
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  };

  return (
    <InstallAppContext.Provider
      value={{ canInstallNative: !!deferredEvent, isIOS, isStandalone, promptInstall }}
    >
      {children}
    </InstallAppContext.Provider>
  );
}

export function useInstallApp() {
  const ctx = useContext(InstallAppContext);
  if (!ctx) throw new Error("useInstallApp doit être utilisé dans InstallAppProvider");
  return ctx;
}
