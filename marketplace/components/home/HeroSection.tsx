"use client";

import { useState, useEffect } from "react";
import { HeroVintedSolid } from "./variants/HeroVintedSolid";
import { HeroSplit5050 } from "./variants/HeroSplit5050";
import { HeroSearchFirst } from "./variants/HeroSearchFirst";
import { HeroBentoGrid } from "./variants/HeroBentoGrid";
import { HeroEditorial } from "./variants/HeroEditorial";
import { VariantSwitcher, type HeroVariantId } from "./variants/VariantSwitcher";

export function HeroSection() {
  const [variant, setVariant] = useState<HeroVariantId>("vinted");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ayiba_hero_variant") as HeroVariantId | null;
    if (saved && ["vinted", "split", "search", "bento", "editorial"].includes(saved)) {
      setVariant(saved);
    }
  }, []);

  const handleVariantChange = (newVariant: HeroVariantId) => {
    setVariant(newVariant);
    if (typeof window !== "undefined") {
      localStorage.setItem("ayiba_hero_variant", newVariant);
    }
  };

  return (
    <>
      {variant === "vinted" && <HeroVintedSolid />}
      {variant === "split" && <HeroSplit5050 />}
      {variant === "search" && <HeroSearchFirst />}
      {variant === "bento" && <HeroBentoGrid />}
      {variant === "editorial" && <HeroEditorial />}

      {/* Floating Variant Switcher Bar for Real-Time Testing */}
      {mounted && (
        <VariantSwitcher active={variant} onChange={handleVariantChange} />
      )}
    </>
  );
}
