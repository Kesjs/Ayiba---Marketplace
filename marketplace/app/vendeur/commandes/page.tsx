"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ChevronDown,
  Phone,
  MapPin,
  MessageCircle,
  Package,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
  Search,
  CheckSquare,
  Square,
  Download,
  Clock,
  Users,
  ArrowUpDown,
  StickyNote,
  Wallet,
  History,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  STATUTS_COMMANDE,
  LABELS_STATUT_COMMANDE,
  STATUT_STYLE,
  STATUT_SPINE_COLOR,
  PROCHAINS_STATUTS,
  type StatutCommande,
} from "@/lib/constants/commandes";

const PAGE_SIZE = 20;
const SLA_HEURES = 3;

interface Commande {
  id: string;
  numero: string;
  client_id: string;
  nom_client: string | null;
  telephone_client: string | null;
  adresse_livraison: string | null;
  commune: string | null;
  note_client: string | null;
  note_vendeur: string | null;
  montant_total: number;
  statut: StatutCommande;
  created_at: string;
}

interface ArticleLigne {
  id: string;
  article_id: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  nom: string;
  image_url: string | null;
}

interface Paiement {
  id: string;
  methode: string | null;
  statut: string;
  montant: number;
  montant_net: number | null;
}

interface HistoriqueEntry {
  id: string;
  ancien_statut: string | null;
  nouveau_statut: string;
  created_at: string;
}

interface DetailCommande {
  articles: ArticleLigne[];
  paiement: Paiement | null;
  historique: HistoriqueEntry[];
  nbCommandesClient: number;
}

type FiltreStatut = StatutCommande | "tous";
type TriOption = "recent" | "montant" | "statut";
type PeriodeOption = "tout" | "7j" | "30j";

const FILTRES: { value: FiltreStatut; label: string }[] = [
  { value: "tous", label: "Toutes" },
  ...Object.values(STATUTS_COMMANDE).map((value) => ({
    value,
    label: LABELS_STATUT_COMMANDE[value],
  })),
];

const ORDRE_STATUT: StatutCommande[] = [
  STATUTS_COMMANDE.EN_ATTENTE,
  STATUTS_COMMANDE.CONFIRMEE,
  STATUTS_COMMANDE.PREPAREE,
  STATUTS_COMMANDE.EXPEDIEE,
  STATUTS_COMMANDE.LIVREE,
  STATUTS_COMMANDE.REMBOURSEE,
  STATUTS_COMMANDE.ANNULEE,
];

const expandVariants: Variants = {
  collapsed: { height: 0, opacity: 0 },
  open: { height: "auto", opacity: 1 },
};

function formatMontant(v: number) {
  return new Intl.NumberFormat("fr-FR").format(v) + " F";
}

function initiales(nom: string | null) {
  if (!nom) return "?";
  return nom
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function heuresDepuis(dateStr: string) {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

function formatRelatif(dateStr: string) {
  const h = heuresDepuis(dateStr);
  if (h < 1) return `il y a ${Math.max(1, Math.round(h * 60))} min`;
  if (h < 24) return `il y a ${Math.round(h)} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

function estEnRetardSLA(order: Commande) {
  return order.statut === STATUTS_COMMANDE.EN_ATTENTE && heuresDepuis(order.created_at) >= SLA_HEURES;
}

function exportCSV(orders: Commande[]) {
  const header = ["Numero", "Client", "Telephone", "Commune", "Montant", "Statut", "Date"];
  const rows = orders.map((o) => [
    o.numero,
    o.nom_client ?? "",
    o.telephone_client ?? "",
    o.commune ?? "",
    String(o.montant_total),
    LABELS_STATUT_COMMANDE[o.statut] ?? o.statut,
    new Date(o.created_at).toLocaleString("fr-FR"),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ouvrirFacture(order: Commande, articles: ArticleLigne[]) {
  const win = window.open("", "_blank");
  if (!win) return;
  const lignes = articles
    .map(
      (a) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${a.nom}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${a.quantite}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatMontant(a.prix_unitaire)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatMontant(a.total)}</td></tr>`
    )
    .join("");
  win.document.write(`
    <html>
      <head>
        <title>Facture ${order.numero}</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; padding: 32px; color: #111; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; padding: 8px; border-bottom: 2px solid #111; font-size: 13px; }
          .total { text-align: right; font-weight: bold; font-size: 16px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <h1>Facture — ${order.numero}</h1>
        <p>Client : ${order.nom_client ?? "-"}<br/>Date : ${new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
        <table>
          <thead><tr><th>Article</th><th>Qté</th><th>P.U.</th><th>Total</th></tr></thead>
          <tbody>${lignes || "<tr><td colspan=4 style='padding:8px;color:#999;'>Aucun détail d'article</td></tr>"}</tbody>
        </table>
        <p class="total">Total : ${formatMontant(order.montant_total)}</p>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

function CommandeRowSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 sm:px-6 py-4 flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-gray-100 animate-pulse" />
        <div className="h-2.5 w-1/5 rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse" />
    </div>
  );
}

export default function VendeurCommandesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [vendeurId, setVendeurId] = useState<string | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState<FiltreStatut>("tous");
  const [tri, setTri] = useState<TriOption>("recent");
  const [periode, setPeriode] = useState<PeriodeOption>("tout");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [details, setDetails] = useState<Record<string, DetailCommande | "loading">>({});
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const [cancelTargets, setCancelTargets] = useState<Commande[] | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const offsetRef = useRef(0);

  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    offsetRef.current = 0;
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoadError("Ta session a expiré — reconnecte-toi puis réessaie.");
      setLoading(false);
      return;
    }
    setVendeurId(user.id);

    const { data, error } = await supabase
      .from("commandes")
      .select(
        "id, numero, client_id, nom_client, telephone_client, adresse_livraison, commune, note_client, note_vendeur, montant_total, statut, created_at"
      )
      .eq("vendeur_id", user.id)
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (error) {
      setLoadError("Impossible de charger tes commandes — vérifie ta connexion et réessaie.");
      setLoading(false);
      return;
    }

    const rows = (data as Commande[]) ?? [];
    setCommandes(rows);
    setHasMore(rows.length === PAGE_SIZE);
    offsetRef.current = rows.length;
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  const loadMore = useCallback(async () => {
    if (!vendeurId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const supabase = createClient();
    const start = offsetRef.current;
    const { data, error } = await supabase
      .from("commandes")
      .select(
        "id, numero, client_id, nom_client, telephone_client, adresse_livraison, commune, note_client, note_vendeur, montant_total, statut, created_at"
      )
      .eq("vendeur_id", vendeurId)
      .order("created_at", { ascending: false })
      .range(start, start + PAGE_SIZE - 1);

    setLoadingMore(false);
    if (error) {
      showToast("Impossible de charger plus de commandes", "error");
      return;
    }
    const rows = (data as Commande[]) ?? [];
    setCommandes((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      return [...prev, ...rows.filter((r) => !existingIds.has(r.id))];
    });
    setHasMore(rows.length === PAGE_SIZE);
    offsetRef.current = start + rows.length;
  }, [vendeurId, loadingMore, hasMore, showToast]);

  // Temps réel : nouvelles commandes et changements de statut
  useEffect(() => {
    if (!vendeurId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`commandes-vendeur-${vendeurId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commandes", filter: `vendeur_id=eq.${vendeurId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const nouvelle = payload.new as Commande;
            setCommandes((prev) => (prev.some((c) => c.id === nouvelle.id) ? prev : [nouvelle, ...prev]));
            showToast(`Nouvelle commande de ${nouvelle.nom_client ?? "un client"}`, "success");
          } else if (payload.eventType === "UPDATE") {
            const maj = payload.new as Commande;
            setCommandes((prev) => prev.map((c) => (c.id === maj.id ? { ...c, ...maj } : c)));
          } else if (payload.eventType === "DELETE") {
            const suppr = payload.old as Commande;
            setCommandes((prev) => prev.filter((c) => c.id !== suppr.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendeurId, showToast]);

  const searchedCommandes = useMemo(() => {
    if (!search.trim()) return commandes;
    const q = search.toLowerCase();
    return commandes.filter(
      (c) => (c.nom_client ?? "").toLowerCase().includes(q) || c.numero.toLowerCase().includes(q)
    );
  }, [commandes, search]);

  const periodeFiltered = useMemo(() => {
    if (periode === "tout") return searchedCommandes;
    const jours = periode === "7j" ? 7 : 30;
    const seuil = Date.now() - jours * 24 * 60 * 60 * 1000;
    return searchedCommandes.filter((c) => new Date(c.created_at).getTime() >= seuil);
  }, [searchedCommandes, periode]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { tous: periodeFiltered.length };
    Object.values(STATUTS_COMMANDE).forEach((s) => {
      c[s] = periodeFiltered.filter((cmd) => cmd.statut === s).length;
    });
    return c;
  }, [periodeFiltered]);

  const commandesFiltrees = useMemo(() => {
    const base = filtre === "tous" ? periodeFiltered : periodeFiltered.filter((c) => c.statut === filtre);
    const sorted = [...base];
    if (tri === "recent") {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (tri === "montant") {
      sorted.sort((a, b) => b.montant_total - a.montant_total);
    } else if (tri === "statut") {
      sorted.sort((a, b) => ORDRE_STATUT.indexOf(a.statut) - ORDRE_STATUT.indexOf(b.statut));
    }
    return sorted;
  }, [periodeFiltered, filtre, tri]);

  const openMessagerie = (clientId: string, commandeId: string) => {
    router.push(`/vendeur/messages?client=${clientId}&commande=${commandeId}`);
  };

  const updateStatut = async (commandeId: string, statut: StatutCommande) => {
    setUpdatingId(commandeId);
    const previous = commandes;
    setCommandes((prev) => prev.map((c) => (c.id === commandeId ? { ...c, statut } : c)));

    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut, updated_at: new Date().toISOString() })
      .eq("id", commandeId);

    setUpdatingId(null);

    if (error) {
      setCommandes(previous);
      showToast("Impossible de mettre à jour le statut", "error");
      return;
    }
    showToast(`Commande marquée « ${LABELS_STATUT_COMMANDE[statut]} »`, "success");
  };

  // --- Sélection multiple / actions groupées ---
  const toggleSelectionMode = () => {
    setSelectionMode((v) => !v);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === commandesFiltrees.length ? new Set() : new Set(commandesFiltrees.map((c) => c.id))
    );
  };

  const selectedOrders = useMemo(
    () => commandesFiltrees.filter((c) => selectedIds.has(c.id)),
    [commandesFiltrees, selectedIds]
  );

  const transitionsCommunes = useMemo(() => {
    if (selectedOrders.length === 0) return [];
    const listes = selectedOrders.map((o) => PROCHAINS_STATUTS[o.statut] || []);
    return listes.reduce((acc, liste) => acc.filter((s) => liste.includes(s)), listes[0] ?? []);
  }, [selectedOrders]);

  const applyBulkStatut = async (statut: StatutCommande) => {
    if (statut === STATUTS_COMMANDE.ANNULEE) {
      setCancelError(null);
      setCancelTargets(selectedOrders);
      return;
    }
    const ids = selectedOrders.map((o) => o.id);
    setBulkUpdating(true);
    const previous = commandes;
    setCommandes((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, statut } : c)));

    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut, updated_at: new Date().toISOString() })
      .in("id", ids);

    setBulkUpdating(false);
    if (error) {
      setCommandes(previous);
      showToast("Échec de la mise à jour groupée", "error");
      return;
    }
    showToast(`${ids.length} commande(s) marquée(s) « ${LABELS_STATUT_COMMANDE[statut]} »`, "success");
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  // --- Détail à la demande (articles, paiement, historique, historique client) ---
  const chargerDetail = useCallback(
    async (order: Commande) => {
      if (details[order.id]) return;
      setDetails((prev) => ({ ...prev, [order.id]: "loading" }));
      const supabase = createClient();

      const [articlesRes, paiementRes, historiqueRes, clientCountRes] = await Promise.all([
        supabase
          .from("commande_articles")
          .select("id, article_id, quantite, prix_unitaire, total, article:articles(nom, article_images(image_url, ordre))")
          .eq("commande_id", order.id),
        supabase
          .from("paiements")
          .select("id, methode, statut, montant, montant_net")
          .eq("commande_id", order.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("commande_statut_historique")
          .select("id, ancien_statut, nouveau_statut, created_at")
          .eq("commande_id", order.id)
          .order("created_at", { ascending: true }),
        vendeurId
          ? supabase
              .from("commandes")
              .select("id", { count: "exact", head: true })
              .eq("client_id", order.client_id)
              .eq("vendeur_id", vendeurId)
          : Promise.resolve({ count: null, error: null }),
      ]);

      const articles: ArticleLigne[] = (articlesRes.data ?? []).map((row: any) => {
        const images = (row.article?.article_images ?? []).sort(
          (a: any, b: any) => (a.ordre ?? 0) - (b.ordre ?? 0)
        );
        return {
          id: row.id,
          article_id: row.article_id,
          quantite: row.quantite,
          prix_unitaire: row.prix_unitaire,
          total: row.total,
          nom: row.article?.nom ?? "Article",
          image_url: images[0]?.image_url ?? null,
        };
      });

      setDetails((prev) => ({
        ...prev,
        [order.id]: {
          articles,
          paiement: (paiementRes.data as Paiement | null) ?? null,
          historique: (historiqueRes.data as HistoriqueEntry[]) ?? [],
          nbCommandesClient: clientCountRes.count ?? 1,
        },
      }));
      setNoteEdits((prev) => ({ ...prev, [order.id]: order.note_vendeur ?? "" }));
    },
    [details, vendeurId]
  );

  const toggleExpand = (order: Commande) => {
    const willExpand = expandedId !== order.id;
    setExpandedId(willExpand ? order.id : null);
    if (willExpand) chargerDetail(order);
  };

  const enregistrerNoteVendeur = async (order: Commande) => {
    setSavingNoteId(order.id);
    const supabase = createClient();
    const texte = noteEdits[order.id] ?? "";
    const { error } = await supabase.from("commandes").update({ note_vendeur: texte }).eq("id", order.id);
    setSavingNoteId(null);
    if (error) {
      showToast("Impossible d'enregistrer la note", "error");
      return;
    }
    setCommandes((prev) => prev.map((c) => (c.id === order.id ? { ...c, note_vendeur: texte } : c)));
    showToast("Note enregistrée", "success");
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargets || cancelTargets.length === 0) return;
    setCancelError(null);
    setIsCancelling(true);

    const ids = cancelTargets.map((c) => c.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut: STATUTS_COMMANDE.ANNULEE, updated_at: new Date().toISOString() })
      .in("id", ids);

    setIsCancelling(false);

    if (error) {
      setCancelError("Échec de l'annulation. Réessaie.");
      return;
    }

    setCommandes((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, statut: STATUTS_COMMANDE.ANNULEE } : c)));
    setCancelTargets(null);
    setSelectedIds(new Set());
    setSelectionMode(false);
    showToast(ids.length > 1 ? `${ids.length} commandes annulées` : "Commande annulée", "success");
  };

  return (
    <DashboardLayout role="vendeur" title="Commandes">
      <div className="w-full min-w-0 overflow-x-hidden">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client ou un numéro de commande..."
              className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-100 focus:border-coral-400 focus:bg-white transition-all text-sm font-medium"
            />
          </div>
        </div>

        {commandes.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1 gap-3">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{commandesFiltrees.length}</span> commande
              {commandesFiltrees.length > 1 ? "s" : ""}
              {counts[STATUTS_COMMANDE.EN_ATTENTE] > 0 && (
                <>
                  {" · "}
                  <span className="font-bold text-amber-600">{counts[STATUTS_COMMANDE.EN_ATTENTE]} en attente</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => exportCSV(commandesFiltrees)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
              >
                <Download size={13} />
                CSV
              </button>
              <button
                type="button"
                onClick={toggleSelectionMode}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold transition-colors ${
                  selectionMode ? "bg-coral-500 text-white" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CheckSquare size={13} />
                {selectionMode ? "Annuler" : "Sélectionner"}
              </button>
            </div>
          </div>
        )}

        <div className="w-full min-w-0 flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTRES.map((s) => {
            const active = filtre === s.value;
            const count = counts[s.value] || 0;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setFiltre(s.value)}
                className={`shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold transition-colors ${
                  active ? "bg-coral-500 text-white" : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold rounded-full px-1.5 ${active ? "bg-white/25" : "bg-gray-100"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="w-full min-w-0 flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["tout", "7j", "30j"] as PeriodeOption[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriode(p)}
              className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-semibold transition-colors ${
                periode === p ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {p === "tout" ? "Toute période" : `${p === "7j" ? "7" : "30"} derniers jours`}
            </button>
          ))}
          <span className="w-px h-5 bg-gray-200 shrink-0 mx-1" />
          {(
            [
              { value: "recent", label: "Récent" },
              { value: "montant", label: "Montant" },
              { value: "statut", label: "Statut" },
            ] as { value: TriOption; label: string }[]
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTri(t.value)}
              className={`shrink-0 flex items-center gap-1 h-8 px-3.5 rounded-full text-xs font-semibold transition-colors ${
                tri === t.value ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <ArrowUpDown size={11} />
              {t.label}
            </button>
          ))}
        </div>

        {selectionMode && commandesFiltrees.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3 px-1"
          >
            {selectedIds.size === commandesFiltrees.length ? <CheckSquare size={15} /> : <Square size={15} />}
            Tout sélectionner ({selectedIds.size}/{commandesFiltrees.length})
          </button>
        )}

        {loadError && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 mb-6 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 leading-relaxed mb-3">{loadError}</p>
              <button
                onClick={fetchCommandes}
                className="inline-flex items-center gap-2 text-xs font-bold text-red-700 hover:text-red-800"
              >
                <RefreshCw size={13} />
                Réessayer
              </button>
            </div>
          </div>
        )}

        {loading && !loadError && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CommandeRowSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !loadError && (
          <>
            {commandesFiltrees.length === 0 ? (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm px-8 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Package size={22} className="text-gray-300" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">
                  {search || filtre !== "tous" ? "Aucune commande ne correspond à ces critères" : "Tu n'as pas encore reçu de commande"}
                </p>
                <p className="text-sm text-gray-400">
                  {search || filtre !== "tous" ? "Essaie un autre mot-clé ou un autre filtre." : "Les nouvelles commandes de tes clients apparaîtront ici."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-24">
                {commandesFiltrees.map((order, i) => {
                  const isExpanded = expandedId === order.id;
                  const prochains = PROCHAINS_STATUTS[order.statut] || [];
                  const spineColor = STATUT_SPINE_COLOR[order.statut] || "#D1D5DB";
                  const detail = details[order.id];
                  const enRetard = estEnRetardSLA(order);
                  const isSelected = selectedIds.has(order.id);

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.25 }}
                      className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
                        isSelected ? "border-coral-300 ring-2 ring-coral-100" : "border-gray-100"
                      }`}
                      style={{ borderLeft: `4px solid ${spineColor}` }}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => (selectionMode ? toggleSelected(order.id) : toggleExpand(order))}
                        onKeyDown={(e) => e.key === "Enter" && (selectionMode ? toggleSelected(order.id) : toggleExpand(order))}
                        className="w-full flex items-center gap-2.5 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {selectionMode && (
                          <div className="shrink-0 text-coral-500">
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                          </div>
                        )}

                        <div className="w-10 h-10 rounded-full bg-coral-50 text-coral-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {initiales(order.nom_client)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate text-sm">{order.nom_client ?? "Client"}</p>
                          <p className="text-xs text-gray-500 truncate">{order.numero}</p>
                          {enRetard && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-red-600">
                              <Clock size={10} />
                              En attente {formatRelatif(order.created_at)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{formatMontant(order.montant_total)}</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                              STATUT_STYLE[order.statut] || "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {LABELS_STATUT_COMMANDE[order.statut] || order.statut}
                          </span>
                        </div>

                        {!selectionMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMessagerie(order.client_id, order.id);
                            }}
                            className="w-9 h-9 rounded-full bg-coral-50 flex items-center justify-center text-coral-600 hover:bg-coral-100 shrink-0"
                            aria-label="Discuter avec le client"
                            title="Discuter avec le client"
                          >
                            <MessageCircle size={15} />
                          </button>
                        )}

                        {!selectionMode && (
                          <ChevronDown size={18} className={`text-gray-400 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {isExpanded && !selectionMode && (
                          <motion.div
                            variants={expandVariants}
                            initial="collapsed"
                            animate="open"
                            exit="collapsed"
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 sm:px-6 pb-5 pt-4 bg-gray-50/60 border-t border-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2.5 rounded-xl border border-gray-100">
                                  <Phone size={15} className="text-gray-400 shrink-0" />
                                  <span className="truncate">{order.telephone_client || "Non renseigné"}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-gray-600 bg-white px-3 py-2.5 rounded-xl border border-gray-100">
                                  <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                                  <span>{order.adresse_livraison || order.commune || "Non renseignée"}</span>
                                </div>
                              </div>

                              {order.note_client && (
                                <p className="text-sm text-gray-600 bg-white p-3.5 rounded-2xl border border-gray-100 mb-3">« {order.note_client} »</p>
                              )}

                              {/* Articles */}
                              <div className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden">
                                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-gray-100 text-xs font-bold text-gray-500">
                                  <ShoppingBag size={13} />
                                  Articles
                                </div>
                                {detail === "loading" || !detail ? (
                                  <div className="p-3.5 flex items-center gap-2 text-xs text-gray-400">
                                    <Loader2 size={13} className="animate-spin" />
                                    Chargement...
                                  </div>
                                ) : detail.articles.length === 0 ? (
                                  <p className="p-3.5 text-xs text-gray-400">Aucun détail d'article enregistré pour cette commande.</p>
                                ) : (
                                  <div className="divide-y divide-gray-50">
                                    {detail.articles.map((a) => (
                                      <div key={a.id} className="flex items-center gap-3 px-3.5 py-2.5">
                                        <div className="w-9 h-9 rounded-lg bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center">
                                          {a.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={a.image_url} alt={a.nom} className="w-full h-full object-cover" />
                                          ) : (
                                            <Package size={14} className="text-gray-300" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-semibold text-gray-800 truncate">{a.nom}</p>
                                          <p className="text-[11px] text-gray-400">
                                            {a.quantite} × {formatMontant(a.prix_unitaire)}
                                          </p>
                                        </div>
                                        <span className="text-xs font-bold text-gray-900 shrink-0">{formatMontant(a.total)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Paiement */}
                              <div className="bg-white rounded-2xl border border-gray-100 mb-3 px-3.5 py-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1.5">
                                  <Wallet size={13} />
                                  Paiement
                                </div>
                                {detail === "loading" || !detail ? (
                                  <p className="text-xs text-gray-400">Chargement...</p>
                                ) : detail.paiement ? (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{detail.paiement.methode ?? "Mobile money"}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-bold ${
                                        detail.paiement.statut === "paye"
                                          ? "bg-green-50 text-green-700"
                                          : detail.paiement.statut === "echoue"
                                            ? "bg-red-50 text-red-700"
                                            : detail.paiement.statut === "rembourse"
                                              ? "bg-gray-100 text-gray-600"
                                              : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {detail.paiement.statut === "paye"
                                        ? "Payé"
                                        : detail.paiement.statut === "echoue"
                                          ? "Échoué"
                                          : detail.paiement.statut === "rembourse"
                                            ? "Remboursé"
                                            : "En attente"}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400">Aucun paiement enregistré.</p>
                                )}
                              </div>

                              {/* Historique statut */}
                              {detail && detail !== "loading" && detail.historique.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 mb-3 px-3.5 py-2.5">
                                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                                    <History size={13} />
                                    Historique
                                  </div>
                                  <div className="space-y-1.5">
                                    {detail.historique.map((h) => (
                                      <div key={h.id} className="flex items-center justify-between text-[11px] text-gray-500">
                                        <span>
                                          {h.ancien_statut ? `${LABELS_STATUT_COMMANDE[h.ancien_statut as StatutCommande] ?? h.ancien_statut} → ` : "Créée · "}
                                          <span className="font-semibold text-gray-700">
                                            {LABELS_STATUT_COMMANDE[h.nouveau_statut as StatutCommande] ?? h.nouveau_statut}
                                          </span>
                                        </span>
                                        <span>{formatRelatif(h.created_at)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Historique client */}
                              {detail && detail !== "loading" && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3.5 py-2.5 rounded-2xl border border-gray-100 mb-3">
                                  <Users size={13} className="text-gray-400 shrink-0" />
                                  {detail.nbCommandesClient > 1
                                    ? `${detail.nbCommandesClient} commandes au total avec ce client`
                                    : "Première commande de ce client"}
                                </div>
                              )}

                              {/* Note interne vendeur */}
                              <div className="bg-white rounded-2xl border border-gray-100 mb-4 px-3.5 py-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1.5">
                                  <StickyNote size={13} />
                                  Note interne (visible par toi seul)
                                </div>
                                <textarea
                                  value={noteEdits[order.id] ?? order.note_vendeur ?? ""}
                                  onChange={(e) => setNoteEdits((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Ex : préparer avec soin, client régulier..."
                                  rows={2}
                                  className="w-full text-xs rounded-lg border border-gray-100 bg-gray-50 p-2 focus:outline-none focus:ring-2 focus:ring-coral-100 resize-none"
                                />
                                <div className="flex justify-end mt-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      enregistrerNoteVendeur(order);
                                    }}
                                    disabled={savingNoteId === order.id}
                                    className="text-[11px] font-bold text-coral-600 hover:text-coral-700 disabled:opacity-50"
                                  >
                                    {savingNoteId === order.id ? "Enregistrement..." : "Enregistrer"}
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm text-gray-500 px-0.5 mb-3">
                                <span>Montant total</span>
                                <span className="font-bold text-gray-900">{formatMontant(order.montant_total)}</span>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                {prochains.map((next) => {
                                  const isCancel = next === STATUTS_COMMANDE.ANNULEE;
                                  return (
                                    <button
                                      key={next}
                                      type="button"
                                      disabled={updatingId === order.id}
                                      onClick={() =>
                                        isCancel ? (setCancelError(null), setCancelTargets([order])) : updateStatut(order.id, next)
                                      }
                                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                                        isCancel ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-coral-500 text-white hover:bg-coral-600"
                                      }`}
                                    >
                                      {updatingId === order.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        `Marquer ${LABELS_STATUT_COMMANDE[next]}`
                                      )}
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => ouvrirFacture(order, detail && detail !== "loading" ? detail.articles : [])}
                                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                                >
                                  Générer la facture
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {hasMore && !search && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 h-11 px-6 rounded-xl bg-white border border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {loadingMore ? <Loader2 size={15} className="animate-spin" /> : null}
                      Charger plus
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Barre d'actions groupées */}
        <AnimatePresence>
          {selectionMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-[420px] bg-gray-900 text-white rounded-2xl shadow-2xl p-4 z-50 flex items-center gap-3"
            >
              <span className="text-xs font-bold flex-1">{selectedIds.size} sélectionnée(s)</span>
              {transitionsCommunes.length === 0 ? (
                <span className="text-[11px] text-gray-400">Aucune action commune</span>
              ) : (
                transitionsCommunes.map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={bulkUpdating}
                    onClick={() => applyBulkStatut(next)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 ${
                      next === STATUTS_COMMANDE.ANNULEE ? "bg-red-500 hover:bg-red-600" : "bg-coral-500 hover:bg-coral-600"
                    }`}
                  >
                    {bulkUpdating ? <Loader2 size={13} className="animate-spin" /> : LABELS_STATUT_COMMANDE[next]}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cancelTargets && cancelTargets.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isCancelling && setCancelTargets(null)}
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
              />
              <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ y: 40, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 40, opacity: 0, scale: 0.98 }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {cancelTargets.length > 1 ? `Annuler ${cancelTargets.length} commandes ?` : "Annuler la commande ?"}
                    </h3>
                    <button
                      onClick={() => !isCancelling && setCancelTargets(null)}
                      className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {cancelTargets.length > 1 ? (
                      <>
                        <strong className="text-gray-900">{cancelTargets.length}</strong> commandes seront marquées comme annulées. Cette
                        action est définitive.
                      </>
                    ) : (
                      <>
                        La commande <strong className="text-gray-900">{cancelTargets[0].numero}</strong> de{" "}
                        <strong className="text-gray-900">{cancelTargets[0].nom_client ?? "ce client"}</strong> sera marquée comme
                        annulée. Cette action est définitive.
                      </>
                    )}
                  </p>

                  {cancelError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                      <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 leading-relaxed">{cancelError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => !isCancelling && setCancelTargets(null)}
                      disabled={isCancelling}
                      className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Ne pas annuler
                    </button>
                    <button
                      onClick={handleConfirmCancel}
                      disabled={isCancelling}
                      className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isCancelling ? <Loader2 size={18} className="animate-spin" /> : "Oui, annuler"}
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
