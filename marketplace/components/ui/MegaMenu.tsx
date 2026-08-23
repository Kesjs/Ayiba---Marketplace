"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCategoriesFormulaire, type CategorieArbre } from "@/lib/queries/articles";
import { resolveCategoryIcon } from "@/lib/constants/category-icons";
import { LayoutGrid } from "lucide-react";

export function MegaMenu() {
  const [categories, setCategories] = useState<CategorieArbre[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  useEffect(() => {
    getCategoriesFormulaire({ activesUniquement: true, avecArticlesUniquement: true })
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="hidden md:flex border-b border-gray-100 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full">
        <ul className="flex items-center gap-6 py-2">
          {categories.map(cat => (
            <li
              key={cat.id}
              className="relative py-2"
              onMouseEnter={() => setActiveCategoryId(cat.id)}
              onMouseLeave={() => setActiveCategoryId(null)}
            >
              <Link
                href={`/catalogue?categorie=${encodeURIComponent(cat.nom)}`}
                className={`text-sm font-medium transition-colors hover:text-coral-600 ${
                  activeCategoryId === cat.id ? "text-coral-600" : "text-gray-700"
                }`}
              >
                {cat.nom}
              </Link>

              {/* Panneau du menu déroulant : liste verticale à icônes, ancrée sous CET onglet */}
              {activeCategoryId === cat.id && cat.sousCategories.length > 0 && (
                <div className="absolute left-0 top-full pt-1 z-50 w-64">
                  <div className="bg-white shadow-xl border border-gray-100 rounded-2xl py-2 overflow-hidden">
                    <Link
                      href={`/catalogue?categorie=${encodeURIComponent(cat.nom)}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-coral-50 hover:text-coral-600 transition-colors"
                      onClick={() => setActiveCategoryId(null)}
                    >
                      <LayoutGrid size={16} className="text-coral-500 shrink-0" />
                      <span>Voir tout</span>
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    {cat.sousCategories.map(sousCat => {
                      const Icon = resolveCategoryIcon(sousCat.icone);
                      return (
                        <Link
                          key={sousCat.id}
                          href={`/catalogue?categorie=${encodeURIComponent(sousCat.nom)}`}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-coral-50 hover:text-coral-600 transition-colors"
                          onClick={() => setActiveCategoryId(null)}
                        >
                          <Icon size={16} className="text-coral-500 shrink-0" />
                          <span>{sousCat.nom}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
