"use client";

import { ReactNode } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { BottomNav } from "@/components/ui/BottomNav";
import { useUiChrome } from "@/context/UiChromeContext";

// Extrait de app/layout.tsx (qui doit rester un Server Component pour
// exporter metadata/viewport) pour pouvoir lire le contexte UiChrome ici.
export function AppShell({ children }: { children: ReactNode }) {
  const { hideBottomNav } = useUiChrome();

  return (
    <>
      <main className={`flex-1 ${hideBottomNav ? "pb-0" : "pb-24 lg:pb-0"}`}>
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </>
  );
}
