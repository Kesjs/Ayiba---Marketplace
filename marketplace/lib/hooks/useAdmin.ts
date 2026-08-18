import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/** Appelle une route serveur /api/admin/* (protégée par requireAdmin) et lève une erreur lisible en cas d'échec. */
async function appelerApiAdmin(path: string, body: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Une erreur est survenue.");
  return json;
}

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
  // Volume du mois civil précédent (mêmes filtres que volume_affaires_mois), pour calculer l'évolution.
  volume_affaires_mois_precedent: number;
  // Commission Ayiba perçue ce mois-ci sur les commandes réelles (hors annulées/remboursées).
  revenu_net_mois: number;
  // % de commandes annulées ou remboursées sur le total du mois.
  taux_annulation_mois: number;
  // Somme des retraits déjà effectivement versés (statut 'paye'), tous temps confondus.
  retraits_verses_total: number;
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
      supabase.rpc("get_stats_admin"),
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
    else setStats((Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data) as AdminStats);

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
  description: string | null;
  quartier: string | null;
  commune: string | null;
  photo_cni_path: string | null;
  photo_profil_url: string | null;
  photo_couverture_url: string | null;
  horaires: Record<string, unknown> | null;
  en_pause: boolean | null;
  mobile_money_network: string | null;
  mobile_money_number: string | null;
  statut: string;
  raison_rejet: string | null;
  created_at: string;
  // Infos jointes depuis public.users (coordonnées de contact, réputation)
  email: string | null;
  phone: string | null;
  compte_cree_le: string | null;
  note_moyenne: number | null;
  nb_avis: number | null;
}

export function useAdminVendeursKyc() {
  const [vendeurs, setVendeurs] = useState<VendeurKyc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vendeurs")
      .select(
        "id, nom_complet, nom_boutique, description, quartier, commune, photo_cni_path, photo_profil_url, photo_couverture_url, horaires, en_pause, mobile_money_network, mobile_money_number, statut, raison_rejet, created_at, users!vendeurs_id_fkey(email, phone, created_at, note_moyenne, nb_avis)"
      )
      .order("created_at", { ascending: false });

    const mapped: VendeurKyc[] = (data || []).map((v: any) => ({
      ...v,
      email: v.users?.email ?? null,
      phone: v.users?.phone ?? null,
      compte_cree_le: v.users?.created_at ?? null,
      note_moyenne: v.users?.note_moyenne ?? null,
      nb_avis: v.users?.nb_avis ?? null,
    }));

    setVendeurs(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const valider = async (id: string) => {
    await appelerApiAdmin("/api/admin/moderation-kyc", { type: "vendeur", action: "valider", id });
    await load();
  };

  const rejeter = async (id: string, raison: string) => {
    await appelerApiAdmin("/api/admin/moderation-kyc", { type: "vendeur", action: "rejeter", id, raison });
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
    await appelerApiAdmin("/api/admin/moderation-kyc", { type: "livreur", action: "valider", id });
    await load();
  };

  const rejeter = async (id: string, raison: string) => {
    await appelerApiAdmin("/api/admin/moderation-kyc", { type: "livreur", action: "rejeter", id, raison });
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
  prix_promo: number | null;
  stock: number | null;
  statut: string;
  raison_rejet: string | null;
  vendeur_id: string;
  created_at: string;
  categorie_id: string | null;
  categories: { nom: string } | null;
  article_images: { id: string; image_url: string; ordre: number | null }[];
  // Statut KYC vendeur en direct (jointure live) — à ne jamais confondre avec
  // raison_rejet, qui est un texte figé au moment de la création de l'article
  // et qui devient trompeur si le vendeur se fait vérifier après coup.
  vendeur: { nom_boutique: string | null; nom_complet: string | null; statut: string | null; email: string | null } | null;
}

export function useAdminArticles() {
  const [articles, setArticles] = useState<ArticleModeration[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select(
        "id, nom, description, prix, prix_promo, stock, statut, raison_rejet, vendeur_id, created_at, categorie_id, categories(nom), article_images(id, image_url, ordre), vendeur:vendeurs(nom_boutique, nom_complet, statut, users!vendeurs_id_fkey(email))"
      )
      .order("created_at", { ascending: false });
    
    const mapped = (data || []).map((a: any) => ({
      ...a,
      vendeur: a.vendeur ? {
        nom_boutique: a.vendeur.nom_boutique,
        nom_complet: a.vendeur.nom_complet,
        statut: a.vendeur.statut,
        email: a.vendeur.users?.email ?? null
      } : null
    }));
    
    setArticles(mapped as ArticleModeration[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Le statut KYC du vendeur peut changer dans un autre onglet (ex: validation
  // pendant que la page modération des articles est restée ouverte). On
  // rafraîchit au retour sur l'onglet pour ne pas afficher un badge périmé.
  useEffect(() => {
    const onFocusOuVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocusOuVisible);
    document.addEventListener("visibilitychange", onFocusOuVisible);
    return () => {
      window.removeEventListener("focus", onFocusOuVisible);
      document.removeEventListener("visibilitychange", onFocusOuVisible);
    };
  }, [load]);

  const publier = async (id: string) => {
    await supabase.from("articles").update({ statut: "publie", raison_rejet: null, actif: true }).eq("id", id);
    await logAction("article_publie", "article", id);
    await load();
  };

  const refuser = async (id: string, raison: string) => {
    await supabase.from("articles").update({ statut: "refuse", raison_rejet: raison }).eq("id", id);
    await logAction("article_refuse", "article", id, { raison });
    await load();
  };

  /** Publie plusieurs articles d'un coup (sélection multiple / "tout confirmer"). */
  const publierMultiple = async (ids: string[]) => {
    if (ids.length === 0) return;
    await supabase.from("articles").update({ statut: "publie", raison_rejet: null, actif: true }).in("id", ids);
    await Promise.all(ids.map((id) => logAction("article_publie", "article", id)));
    await load();
  };

  /** Refuse plusieurs articles d'un coup avec un motif commun. */
  const refuserMultiple = async (ids: string[], raison: string) => {
    if (ids.length === 0) return;
    await supabase.from("articles").update({ statut: "refuse", raison_rejet: raison }).in("id", ids);
    await Promise.all(ids.map((id) => logAction("article_refuse", "article", id, { raison })));
    await load();
  };

  return { articles, loading, publier, refuser, publierMultiple, refuserMultiple, refresh: load };
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
  kyc_statut: string | null; // statut vendeurs.statut / livreurs.statut_verification, null si client/admin
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [usersRes, vendeursRes, livreursRes] = await Promise.all([
      supabase.from("users").select("id, full_name, email, phone, role, statut, created_at").order("created_at", { ascending: false }),
      supabase.from("vendeurs").select("id, statut"),
      supabase.from("livreurs").select("id, statut_verification"),
    ]);
    const kycByUserId = new Map<string, string>();
    (vendeursRes.data || []).forEach((v: any) => kycByUserId.set(v.id, v.statut));
    (livreursRes.data || []).forEach((l: any) => kycByUserId.set(l.id, l.statut_verification));
    const merged = (usersRes.data || []).map((u: any) => ({ ...u, kyc_statut: kycByUserId.get(u.id) ?? null }));
    setUsers(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const suspendre = async (id: string) => {
    await appelerApiAdmin("/api/admin/utilisateurs", { action: "suspendre", userId: id });
    await load();
  };

  const reactiver = async (id: string) => {
    await appelerApiAdmin("/api/admin/utilisateurs", { action: "reactiver", userId: id });
    await load();
  };

  const changerRole = async (id: string, role: string) => {
    await appelerApiAdmin("/api/admin/utilisateurs", { action: "changer-role", userId: id, role });
    await load();
  };

  return { users, loading, suspendre, reactiver, changerRole, refresh: load };
}

// ---------- Fiche utilisateur détaillée ----------
export interface AdminUserDetail extends AdminUser {
  avatar_url: string | null;
  note_moyenne: number | null;
  nb_avis: number | null;
}

export function useAdminUserDetail(userId: string) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [vendeurProfil, setVendeurProfil] = useState<any | null>(null);
  const [livreurProfil, setLivreurProfil] = useState<any | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [avisRecus, setAvisRecus] = useState<any[]>([]);
  const [avisLaisses, setAvisLaisses] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [retraits, setRetraits] = useState<any[]>([]);
  const [actionsLog, setActionsLog] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [messagesAdmin, setMessagesAdmin] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);

    const { data: userRow } = await supabase
      .from("users")
      .select("id, full_name, email, phone, role, statut, created_at, avatar_url, note_moyenne, nb_avis")
      .eq("id", userId)
      .maybeSingle();

    if (!userRow) {
      setUser(null);
      setNotFound(true);
      setLoading(false);
      return;
    }
    setUser(userRow as AdminUserDetail);

    const [
      vendeurRes,
      livreurRes,
      addressesRes,
      logRes,
      notesRes,
    ] = await Promise.all([
      userRow.role === "vendeur" ? supabase.from("vendeurs").select("*").eq("id", userId).maybeSingle() : Promise.resolve({ data: null }),
      userRow.role === "livreur" ? supabase.from("livreurs").select("*").eq("id", userId).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("addresses").select("*").eq("user_id", userId).order("est_defaut", { ascending: false }),
      supabase.from("admin_actions_log").select("*").eq("cible_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("admin_notes").select("*, admin:admin_id(full_name)").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    setVendeurProfil(vendeurRes.data || null);
    setLivreurProfil(livreurRes.data || null);
    setAddresses(addressesRes.data || []);
    setActionsLog(logRes.data || []);
    setNotes(notesRes.data || []);

    // Articles du vendeur — permet de voir sa liste de produits directement
    // depuis sa fiche, sans repasser par la modération.
    if (userRow.role === "vendeur") {
      const { data: articlesData } = await supabase
        .from("articles")
        .select("id, nom, prix, statut, stock, created_at, article_images(image_url, ordre)")
        .eq("vendeur_id", userId)
        .order("created_at", { ascending: false });
      setArticles(articlesData || []);
    } else {
      setArticles([]);
    }

    // Fil de discussion admin <-> cet utilisateur (échangé dans les deux sens)
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: messagesData } = await supabase
        .from("messages")
        .select("id, expediteur_id, destinataire_id, contenu, created_at")
        .or(
          `and(expediteur_id.eq.${auth.user.id},destinataire_id.eq.${userId}),and(expediteur_id.eq.${userId},destinataire_id.eq.${auth.user.id})`
        )
        .order("created_at", { ascending: true });
      setMessagesAdmin(messagesData || []);
    }

    // Commandes : selon le rôle, l'utilisateur peut être client, vendeur (via vendeurs.id) ou livreur
    const commandesQuery =
      userRow.role === "vendeur"
        ? supabase.from("commandes").select("id, numero, montant_total, statut, created_at").eq("vendeur_id", userId)
        : userRow.role === "livreur"
        ? supabase.from("commandes").select("id, numero, montant_total, statut, created_at").eq("livreur_id", userId)
        : supabase.from("commandes").select("id, numero, montant_total, statut, created_at").eq("client_id", userId);
    const { data: commandesData } = await commandesQuery.order("created_at", { ascending: false }).limit(20);
    setCommandes(commandesData || []);

    let avisRecusData: any[] = [];
    if (userRow.role === "livreur") {
      const { data } = await supabase
        .from("avis")
        .select("id, note, commentaire, created_at, article_id, livreur_id")
        .eq("livreur_id", userId)
        .order("created_at", { ascending: false });
      avisRecusData = data || [];
    } else if (userRow.role === "vendeur") {
      const { data: mesArticles } = await supabase.from("articles").select("id").eq("vendeur_id", userId);
      const articleIds = (mesArticles || []).map((a: { id: string }) => a.id);
      if (articleIds.length > 0) {
        const { data } = await supabase
          .from("avis")
          .select("id, note, commentaire, created_at, article_id, livreur_id")
          .in("article_id", articleIds)
          .order("created_at", { ascending: false });
        avisRecusData = data || [];
      }
    }
    setAvisRecus(avisRecusData);

    const { data: avisLaissesData } = await supabase
      .from("avis")
      .select("id, note, commentaire, created_at, article_id")
      .eq("utilisateur_id", userId)
      .order("created_at", { ascending: false });
    setAvisLaisses(avisLaissesData || []);

    const { data: disputesData } = await supabase
      .from("disputes")
      .select("id, motif, statut, type, created_at, commande_id")
      .or(`client_id.eq.${userId},livreur_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    setDisputes(disputesData || []);

    if (userRow.role === "vendeur") {
      const { data: paiementsData } = await supabase
        .from("paiements")
        .select("id, montant, montant_net, statut, created_at")
        .eq("vendeur_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setPaiements(paiementsData || []);

      const { data: retraitsData } = await supabase
        .from("retraits")
        .select("id, montant, statut, reseau, created_at")
        .eq("vendeur_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setRetraits(retraitsData || []);
    } else if (userRow.role === "livreur") {
      const { data: retraitsData } = await supabase
        .from("retraits")
        .select("id, montant, statut, reseau, created_at")
        .eq("livreur_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setRetraits(retraitsData || []);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const suspendre = async () => {
    await appelerApiAdmin("/api/admin/utilisateurs", { action: "suspendre", userId });
    await load();
  };

  const reactiver = async () => {
    await appelerApiAdmin("/api/admin/utilisateurs", { action: "reactiver", userId });
    await load();
  };

  const changerRole = async (role: string) => {
    await appelerApiAdmin("/api/admin/utilisateurs", { action: "changer-role", userId, role });
    await load();
  };

  const ajouterNote = async (contenu: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("admin_notes").insert({ user_id: userId, admin_id: auth.user.id, contenu });
    await load();
  };

  const supprimerNote = async (noteId: string) => {
    await supabase.from("admin_notes").delete().eq("id", noteId);
    await load();
  };

  const envoyerMessage = async (contenu: string): Promise<string | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return "Non authentifié";
    const { error } = await supabase.from("messages").insert({
      expediteur_id: auth.user.id,
      destinataire_id: userId,
      contenu,
    });
    if (error) return error.message;
    await logAction("message_envoye_admin", "user", userId);
    await load();
    return null;
  };

  const forcerDeconnexion = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/admin/forcer-deconnexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) return json.error || "Échec de la déconnexion forcée";
      await load();
      return null;
    } catch {
      return "Erreur réseau";
    }
  };

  const reinitialiserMotDePasse = async (): Promise<{ tempPassword?: string; error?: string }> => {
    try {
      const res = await fetch("/api/admin/reinitialiser-mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error || "Échec de la réinitialisation" };
      await load();
      return { tempPassword: json.tempPassword };
    } catch {
      return { error: "Erreur réseau" };
    }
  };

  return {
    user,
    vendeurProfil,
    livreurProfil,
    articles,
    addresses,
    commandes,
    avisRecus,
    avisLaisses,
    disputes,
    paiements,
    retraits,
    actionsLog,
    notes,
    messagesAdmin,
    loading,
    notFound,
    suspendre,
    reactiver,
    changerRole,
    ajouterNote,
    supprimerNote,
    envoyerMessage,
    forcerDeconnexion,
    reinitialiserMotDePasse,
    refresh: load,
  };
}

// ---------- Litiges ----------
export interface DisputeRow {
  id: string;
  motif: string;
  statut: string;
  type: string;
  photo_url: string | null;
  client_id: string;
  livreur_id: string | null;
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
      .select("id, motif, statut, type, photo_url, client_id, livreur_id, commande_id, created_at")
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

  const creer = async (nom: string, couleur: string, icone: string) => {
    const slug = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await supabase.from("categories").insert({ nom, slug, couleur, icone, active: true, ordre: categories.length });
    await load();
  };

  /** Modifie l'icône et/ou la couleur d'une catégorie existante — utilisé
   * pour donner une icône aux catégories créées avant l'ajout du picker. */
  const mettreAJourStyle = async (id: string, patch: { icone?: string; couleur?: string }) => {
    await supabase.from("categories").update(patch).eq("id", id);
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

  return { categories, loading, creer, toggleActive, supprimer, mettreAJourStyle, refresh: load };
}

// ---------- Paramètres système ----------
export interface ParametreHistoriqueEntry {
  id: string;
  cible_id: string; // = la clé du paramètre modifié
  details: { ancienne_valeur?: unknown; nouvelle_valeur?: unknown } | null;
  created_at: string;
  admin?: { full_name?: string } | null;
}

export function useAdminParametres() {
  const [params, setParams] = useState<Record<string, any>>({});
  const [historique, setHistorique] = useState<ParametreHistoriqueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [paramsRes, histRes] = await Promise.all([
      supabase.from("parametres_systeme").select("*"),
      supabase
        .from("admin_actions_log")
        .select("id, cible_id, details, created_at, admin:admin_id(full_name)")
        .eq("cible_type", "parametre_systeme")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    const map: Record<string, any> = {};
    (paramsRes.data || []).forEach((row: { cle: string; valeur: unknown }) => (map[row.cle] = row.valeur));
    setParams(map);
    setHistorique((histRes.data as unknown as ParametreHistoriqueEntry[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Met à jour un seul paramètre (conservé pour compatibilité). */
  const mettreAJour = async (cle: string, valeur: unknown) => {
    await mettreAJourPlusieurs([{ cle, valeur }]);
  };

  /**
   * Met à jour plusieurs paramètres en une seule opération et journalise
   * chaque changement réel (valeur différente de l'ancienne) dans
   * `admin_actions_log`, pour alimenter l'historique affiché à l'admin.
   */
  const mettreAJourPlusieurs = async (entries: { cle: string; valeur: unknown }[]) => {
    const { data: auth } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    for (const { cle, valeur } of entries) {
      const ancienneValeur = params[cle];
      await supabase
        .from("parametres_systeme")
        .update({ valeur, updated_at: now, updated_by: auth.user?.id })
        .eq("cle", cle);

      if (JSON.stringify(ancienneValeur) !== JSON.stringify(valeur)) {
        await logAction("parametre_modifie", "parametre_systeme", cle, {
          ancienne_valeur: ancienneValeur ?? null,
          nouvelle_valeur: valeur,
        });
      }
    }

    await load();
  };

  return { params, historique, loading, mettreAJour, mettreAJourPlusieurs, refresh: load };
}

/** Permet à l'utilisateur connecté (ici l'admin) de changer son propre mot de passe. */
export function useChangerMonMotDePasse() {
  const [saving, setSaving] = useState(false);

  const changer = async (nouveauMotDePasse: string): Promise<string | null> => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: nouveauMotDePasse });
      if (error) return error.message;
      return null;
    } catch (err: any) {
      return err?.message || "Une erreur est survenue.";
    } finally {
      setSaving(false);
    }
  };

  return { changer, saving };
}

/** Charge et permet de modifier le nom / email de l'admin actuellement connecté. */
export function useMonProfilAdmin() {
  const [profil, setProfil] = useState<{ id: string; full_name: string | null; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setProfil(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("id", auth.user.id)
      .single();
    setProfil(data || { id: auth.user.id, full_name: null, email: auth.user.email || null });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Met à jour le nom complet (table users) et, si changé, l'email (auth + users). */
  const mettreAJour = async (fullName: string, email: string): Promise<string | null> => {
    if (!profil) return "Profil introuvable.";
    try {
      const ancienNom = profil.full_name;
      const ancienEmail = profil.email;

      if (email && email !== ancienEmail) {
        const { error: authError } = await supabase.auth.updateUser({ email });
        if (authError) return authError.message;
      }

      const { error } = await supabase
        .from("users")
        .update({ full_name: fullName.trim(), email })
        .eq("id", profil.id);
      if (error) return error.message;

      if (fullName.trim() !== ancienNom || email !== ancienEmail) {
        await logAction("profil_admin_modifie", "users", profil.id, {
          ancienne_valeur: { full_name: ancienNom, email: ancienEmail },
          nouvelle_valeur: { full_name: fullName.trim(), email },
        });
      }

      await load();
      return null;
    } catch (err: any) {
      return err?.message || "Une erreur est survenue.";
    }
  };

  return { profil, loading, mettreAJour, refresh: load };
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
