"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface UiChromeContextType {
  hideBottomNav: boolean;
  setHideBottomNav: (hide: boolean) => void;
}

const UiChromeContext = createContext<UiChromeContextType | undefined>(undefined);

// Permet à n'importe quelle page (ex: une conversation ouverte dans Messages)
// de demander à la BottomNav globale de se cacher, comme le fait Instagram
// quand on ouvre un DM. Le provider vit dans app/layout.tsx.
export function UiChromeProvider({ children }: { children: ReactNode }) {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  return (
    <UiChromeContext.Provider value={{ hideBottomNav, setHideBottomNav }}>
      {children}
    </UiChromeContext.Provider>
  );
}

export function useUiChrome() {
  const ctx = useContext(UiChromeContext);
  if (!ctx) {
    // Pas de provider monté au-dessus (ne devrait pas arriver dans l'app) — no-op silencieux
    return { hideBottomNav: false, setHideBottomNav: () => {} };
  }
  return ctx;
}
