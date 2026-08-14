"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Filet de sécurité pour tout l'espace vendeur : sans ce fichier, une
// exception JS non attrapée (upload photo, appel Supabase, etc.) fait
// planter tout l'arbre React côté client, avec pour seul recours un
// rechargement complet de la page — qui vide au passage tout ce que le
// vendeur était en train de saisir (formulaire d'article, boutique...).
// `reset()` retente le rendu du sous-arbre sans navigation ni perte d'état
// ailleurs dans l'app.
export default function VendeurError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[vendeur] erreur non gérée:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Un problème est survenu</h2>
        <p className="text-sm text-gray-500 mb-6">
          Rien n'est perdu — tes informations en cours de saisie sont conservées. Réessaie, ou reviens au tableau de bord.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full">
            Réessayer
          </Button>
          <Link href="/vendeur/dashboard">
            <button className="w-full h-12 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
              Retour au tableau de bord
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
