"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCategoriesFormulaire, type CategorieArbre } from "@/lib/queries/articles";
import { ChevronRight } from "lucide-react";

export function MegaMenu() {
  const [categories, setCategories] = useState<CategorieArbre[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategorieArbre | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    getCategoriesFormulaire({ activesUniquement: true })
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  if (categories.length === 0) return null;

  return (
    <div 
      className="hidden md:flex border-b border-gray-100 bg-white"
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveCategory(null);
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full relative">
        <ul className="flex items-center gap-6 py-2">
          {categories.map(cat => (
            <li 
              key={cat.id}
              onMouseEnter={() => {
                setActiveCategory(cat);
                setIsHovering(true);
              }}
              className="py-2"
            >
              <Link 
                href={`/?categorie=${cat.slug}`}
                className={`text-sm font-medium transition-colors hover:text-coral-600 ${
                  activeCategory?.id === cat.id ? "text-coral-600" : "text-gray-700"
                }`}
              >
                {cat.nom}
              </Link>
            </li>
          ))}
        </ul>

        {/* Panneau du menu déroulant */}
        {isHovering && activeCategory && activeCategory.sousCategories.length > 0 && (
          <div 
            className="absolute left-0 top-full w-full bg-white shadow-xl border-t border-gray-100 z-50 p-6 rounded-b-2xl"
          >
            <div className="max-w-4xl grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {activeCategory.sousCategories.map(sousCat => (
                <Link
                  key={sousCat.id}
                  href={`/?categorie=${sousCat.slug}`}
                  className="group flex items-center justify-between text-gray-600 hover:text-coral-600 hover:bg-coral-50 p-2 rounded-lg transition-colors"
                  onClick={() => setIsHovering(false)}
                >
                  <span className="text-sm font-medium">{sousCat.nom}</span>
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
