import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/** Enregistre une action admin dans le journal d'audit. Ne bloque jamais l'action principale si l'écriture échoue. */
async function logAction(actionType: string, cibleType: string, cibleId: string, details?: Record<string, unknown>) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("admin_actions_log").insert({
      admin_id: auth.user.id,
      action_type: actionType,
      cible_type: cibleType,
      cible_id: cibleId,
      details: details || null,
    });
  } catch {
    // le journal ne doit jamais bloquer l'action métier
  }
}

// ---------- Vue d'ensemble ----------
export interface AdminStats {
  utilisateurs_actifs: number;
  commandes_24h: number;
  litiges_ouverts: number;
  volume_affaires_mois: number;
  vendeurs_kyc_attente: number;
  livreurs_kyc_attente: number;
  articles_a_moderer: number;
  retraits_a_valider: number;
  demandes_suppression_attente: number;
  montant_en_sequestre: number;
}

export function useAdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentCommandes, setRecentCommandes] = useState<any[]>([]);
  const [recentDisputes, setRecentDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [statsRes, commandesRes, disputesRes] = await Promise.all([
      supabase.from("vue_stats_admin").select("*").single(),
      supabase
        .from("commandes")
        .select("id, numero, nom_client, montant_total, statut, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("disputes")
        .select("id, motif, statut, created_at, commande_id")
        .in("statut", ["ouvert", "en_cours"])
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (statsRes.error) setError(statsRes.error.message);
    else setStats(statsRes.data as AdminStats);

    setRecentCommandes(commandesRes.data || []);
    setRecentDisputes(disputesRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, recentCommandes, recentDisputes, loading, error, refresh: load };
}

// ---------- KYC Vendeurs ----------
export interface VendeurKyc {
  id: string;
  nom_complet: string | null;
  nom_boutique: string | null;
  quartier: string | null;
  commune: string | null;
  photo_cni_path: string | null;
  photo_profil_url: string | null;
  mobile_money_network: string | null;
  mobile_money_number: string | null;
  statut: string;
  raison_rejet: string | null;
  created_at: string;
}

export function useAdminVendeursKyc() {
  const [vendeurs, setVendeurs] = useState<VendeurKyc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vendeurs")
      .select("id, nom_complet, nom_boutique, quartier, commune, photo_cni_path, photo_profil_url, mobile_money_network, mobile_money_number, statut, raison_rejet, created_at")
      .order("created_at", { ascending: false });
    setVendeurs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const valider = async (id: string) => {
    await supabase.from("vendeurs").update({ statut: "valide", raison_rejet: null, reviewed_at: new Date().toISOString() }).eq("id", id);
    await logAction("kyc_valide", "vendeur", id);
    await load();
  };

  const rejeter = async (id: string, raison: string) => {
    await supabase.from("vendeurs").update({ statut: "refuse", raison_rejet: raison, reviewed_at: new Date().toISOString() }).eq("id", id);
    await logAction("kyc_refuse", "vendeur", id, { raison });
    await load();
  };

  return { vendeurs, loading, valider, rejeter, refresh: load };
}

// ---------- KYC Livreurs ----------
export interface LivreurKyc {
  id: string;
  nom_complet: string;
  quartier: string | null;
  commune: string | null;
  type_vehicule: string | null;
  photo_cni_path: string | null;
  photo_profil_url: string | null;
  photo_vehicule_url: string | null;
  plaque_immatriculation: string | null;
  mobile_money_network: string | null;
  mobile_money_number: string | null;
  statut_verification: string;
  raison_rejet: string | null;
  created_at: string;
}

export function useAdminLivreursKyc() {
  const [livreurs, setLivreurs] = useState<LivreurKyc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("livreurs")
      .select("id, nom_complet, quartier, commune, type_vehicule, photo_cni_path, photo_profil_url, photo_vehicule_url, plaque_immatriculation, mobile_money_network, mobile_money_number, statut_verification, raison_rejet, created_at")
      .order("created_at", { ascending: false });
    setLivreurs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const valider = async (id: string) => {
    await supabase.from("livreurs").update({ statut_verification: "valide", raison_rejet: null, reviewed_at: new Date().toISOString() }).eq("id", id);
    await logAction("kyc_valide", "livreur", id);
    await load();
  };

  const rejeter = async (id: string, raison: string) => {
    await supabase.from("livreurs").update({ statut_verification: "refuse", raison_rejet: raison, reviewed_at: new Date().toISOString() }).eq("id", id);
    await logAction("kyc_refuse", "livreur", id, { raison });
    await load();
  };

  return { livreurs, loading, valider, rejeter, refresh: load };
}

// ---------- Modération articles ----------
export interface ArticleModeration {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  statut: string;
  raison_rejet: string | null;
  vendeur_id: string;
  created_at: string;
}

export function useAdminArticles() {
  const [articles, setArticles] = useState<ArticleModeration[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select("id, nom, description, prix, statut, raison_rejet, vendeur_id, created_at")
      .order("created_at", { ascending: false });
    setArticles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const publier = async (id: string) => {
    await supabase.from("articles").update({ statut: "publie", raison_rejet: null }).eq("id", id);
    await logAction("article_publie", "article", id);
    await load();
  };

  const refuser = async (id: string, raison: string) => {
    await supabase.from("articles").update({ statut: "refuse", raison_rejet: raison }).eq("id", id);
    await logAction("article_refuse", "article", id, { raison });
    await load();
  };

  return { articles, loading, publier, refuser, refresh: load };
}

// ---------- Utilisateurs ----------
export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  statut: string;
  created_at: string;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email, phone, role, statut, created_at")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const suspendre = async (id: string) => {
    await supabase.from("users").update({ statut: "suspendu" }).eq("id", id);
    await logAction("utilisateur_suspendu", "user", id);
    await load();
  };

  const reactiver = async (id: string) => {
    await supabase.from("users").update({ statut: "actif" }).eq("id", id);
    await logAction("utilisateur_reactive", "user", id);
    await load();
  };

  return { users, loading, suspendre, reactiver, refresh: load };
}

// ---------- Litiges ----------
export interface DisputeRow {
  id: string;
  motif: string;
  statut: string;
  client_id: string;
  commande_id: string;
  created_at: string;
}

export function useAdminLitiges() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("disputes")
      .select("id, motif, statut, client_id, commande_id, created_at")
      .order("created_at", { ascending: false });
    setDisputes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changerStatut = async (id: string, statut: "en_cours" | "résolu") => {
    await supabase.from("disputes").update({ statut }).eq("id", id);
    await logAction("litige_" + statut, "dispute", id);
    await load();
  };

  return { disputes, loading, changerStatut, refresh: load };
}

// ---------- Paiements & Retraits ----------
export interface RetraitRow {
  id: string;
  vendeur_id: string | null;
  livreur_id: string | null;
  montant: number;
  numero_mobile_money: string | null;
  reseau: string | null;
  statut: string;
  created_at: string;
}

export function useAdminRetraits() {
  const [retraits, setRetraits] = useState<RetraitRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("retraits")
      .select("id, vendeur_id, livreur_id, montant, numero_mobile_money, reseau, statut, created_at")
      .order("created_at", { ascending: false });
    setRetraits(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const valider = async (id: string) => {
    await supabase.from("retraits").update({ statut: "valide" }).eq("id", id);
    await logAction("retrait_valide", "retrait", id);
    await load();
  };

  const marquerPaye = async (id: string) => {
    await supabase.from("retraits").update({ statut: "paye", traite_le: new Date().toISOString() }).eq("id", id);
    await logAction("retrait_paye", "retrait", id);
    await load();
  };

  const rejeter = async (id: string, commentaire: string) => {
    await supabase.from("retraits").update({ statut: "refuse", commentaire }).eq("id", id);
    await logAction("retrait_refuse", "retrait", id, { commentaire });
    await load();
  };

  return { retraits, loading, valider, marquerPaye, rejeter, refresh: load };
}

// ---------- Catégories ----------
export interface CategoryRow {
  id: string;
  nom: string;
  slug: string;
  icone: string | null;
  couleur: string | null;
  ordre: number;
  active: boolean;
}

export function useAdminCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("ordre", { ascending: true });
    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const creer = async (nom: string, couleur: string) => {
    const slug = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await supabase.from("categories").insert({ nom, slug, couleur, active: true, ordre: categories.length });
    await load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("categories").update({ active }).eq("id", id);
    await load();
  };

  const supprimer = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    await load();
  };

  return { categories, loading, creer, toggleActive, supprimer, refresh: load };
}

// ---------- Paramètres système ----------
export function useAdminParametres() {
  const [params, setParams] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("parametres_systeme").select("*");
    const map: Record<string, any> = {};
    (data || []).forEach((row: { cle: string; valeur: unknown }) => (map[row.cle] = row.valeur));
    setParams(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mettreAJour = async (cle: string, valeur: unknown) => {
    const { data: auth } = await supabase.auth.getUser();
    await supabase
      .from("parametres_systeme")
      .update({ valeur, updated_at: new Date().toISOString(), updated_by: auth.user?.id })
      .eq("cle", cle);
    await load();
  };

  return { params, loading, mettreAJour, refresh: load };
}

// ---------- Avis (modération) ----------
export function useAdminAvis() {
  const [avis, setAvis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("avis")
      .select("id, note, commentaire, utilisateur_id, article_id, livreur_id, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setAvis(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const supprimer = async (id: string) => {
    await supabase.from("avis").delete().eq("id", id);
    await logAction("avis_supprime", "avis", id);
    await load();
  };

  return { avis, loading, supprimer, refresh: load };
}

// ---------- Demandes de suppression de compte ----------
export function useAdminDemandesSuppression() {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("demandes_suppression")
      .select("id, user_id, raison, statut, created_at")
      .order("created_at", { ascending: false });
    setDemandes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Appelle la route serveur /api/admin/supprimer-compte (service_role) :
   * bannit le compte auth + anonymise le profil, sans casser l'historique des commandes/paiements. */
  const traiter = async (id: string, userId: string): Promise<string | null> => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/supprimer-compte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, demandeId: id }),
      });
      const json = await res.json();
      if (!res.ok) return json.error || "Échec de la suppression";
      await load();
      return null;
    } catch (e) {
      return "Erreur réseau lors de la suppression";
    } finally {
      setProcessingId(null);
    }
  };

  const annuler = async (id: string) => {
    await supabase.from("demandes_suppression").update({ statut: "annulee" }).eq("id", id);
    await load();
  };

  return { demandes, loading, processingId, traiter, annuler, refresh: load };
}
