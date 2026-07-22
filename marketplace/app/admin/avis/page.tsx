"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminAvis } from "@/lib/hooks/useAdmin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Star, Trash2 } from "lucide-react";

export default function AdminAvisPage() {
  const { avis, loading, supprimer } = useAdminAvis();

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Modération des avis">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : avis.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-50 p-16 text-center">
          <p className="text-gray-400 font-medium">Aucun avis pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {avis.map((a) => (
            <div key={a.id} className="p-6 flex items-start gap-4">
              <div className="flex items-center gap-1 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < a.note ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                ))}
              </div>
              <p className="flex-1 text-sm text-gray-600">{a.commentaire || <span className="italic text-gray-300">Sans commentaire</span>}</p>
              <button onClick={() => supprimer(a.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
