"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminUserDetail } from "@/lib/hooks/useAdmin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import {
  ArrowLeft,
  Ban,
  RotateCcw,
  LogOut,
  KeyRound,
  ShieldCheck,
  MapPin,
  ShoppingBag,
  Star,
  AlertTriangle,
  Wallet,
  History,
  StickyNote,
  Trash2,
  MessageCircle,
  Package,
  ImageOff,
} from "lucide-react";

function PhotoGallery({ photoCniPath, photoProfilUrl, photoSecondaireUrl, photoSecondaireLabel }: {
  photoCniPath: string | null;
  photoProfilUrl: string | null;
  photoSecondaireUrl: string | null;
  photoSecondaireLabel: string;
}) {
  const [cniUrl, setCniUrl] = useState<string | null>(null);
  const [cniLoading, setCniLoading] = useState(false);
  const [cniError, setCniError] = useState<string | null>(null);

  useEffect(() => {
    setCniUrl(null);
    setCniError(null);
    if (!photoCniPath) return;
    let cancelled = false;
    setCniLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/admin/kyc-document-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: photoCniPath }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) setCniError(json.error || "Impossible de charger le document");
        else setCniUrl(json.url);
      } catch {
        if (!cancelled) setCniError("Impossible de charger le document");
      } finally {
        if (!cancelled) setCniLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoCniPath]);

  const items = [
    { label: "Pièce d'identité (CNI)", url: cniUrl, loading: cniLoading, error: cniError, missing: !photoCniPath },
    { label: "Photo de profil", url: photoProfilUrl, loading: false, error: null, missing: !photoProfilUrl },
    { label: photoSecondaireLabel, url: photoSecondaireUrl, loading: false, error: null, missing: !photoSecondaireUrl },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="aspect-square rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center">
            {it.missing ? (
              <span className="text-[10px] text-gray-300 text-center px-2">Aucune</span>
            ) : it.loading ? (
              <span className="text-[10px] text-gray-300">Chargement...</span>
            ) : it.error ? (
              <span className="text-[10px] text-red-400 text-center px-2">{it.error}</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <a href={it.url!} target="_blank" rel="noopener noreferrer">
                <img src={it.url!} alt={it.label} className="w-full h-full object-cover" />
              </a>
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-bold text-center mt-1.5">{it.label}</p>
        </div>
      ))}
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  vendeur: "Vendeur",
  livreur: "Livreur",
  admin: "Admin",
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n || 0)) + " F";
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">{icon}</div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const {
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
  } = useAdminUserDetail(userId);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState("");
  const [noteText, setNoteText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin Ayiba" title="Fiche utilisateur">
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-[32px]" />
          <Skeleton className="h-64 rounded-[32px]" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !user) {
    return (
      <DashboardLayout role="admin" userName="Admin Ayiba" title="Fiche utilisateur">
        <div className="bg-white rounded-[32px] border border-gray-50 p-10 text-center text-gray-400">
          Utilisateur introuvable.
          <div className="mt-4">
            <Link href="/admin/utilisateurs" className="text-coral-500 font-bold text-sm">
              Retour à la liste
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const doForcerDeconnexion = async () => {
    setBusy(true);
    setErrorMsg(null);
    const err = await forcerDeconnexion();
    if (err) setErrorMsg(err);
    setBusy(false);
  };

  const doReinitialiser = async () => {
    setBusy(true);
    setErrorMsg(null);
    const res = await reinitialiserMotDePasse();
    if (res.error) setErrorMsg(res.error);
    else if (res.tempPassword) setTempPassword(res.tempPassword);
    setBusy(false);
  };

  const doChangerRole = async () => {
    if (!pendingRole) return;
    setBusy(true);
    await changerRole(pendingRole);
    setBusy(false);
    setRoleModalOpen(false);
  };

  const doAjouterNote = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    await ajouterNote(noteText.trim());
    setNoteText("");
    setBusy(false);
  };

  const doEnvoyerMessage = async () => {
    if (!messageText.trim()) return;
    setBusy(true);
    setErrorMsg(null);
    const err = await envoyerMessage(messageText.trim());
    if (err) setErrorMsg(err);
    else setMessageText("");
    setBusy(false);
  };

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Fiche utilisateur">
      <button
        onClick={() => router.push("/admin/utilisateurs")}
        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Retour aux utilisateurs
      </button>

      {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium">{errorMsg}</div>}

      {/* En-tête identité */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm mb-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500 shrink-0">
              {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.full_name || "Sans nom"}</h2>
              <p className="text-sm text-gray-400 font-medium">{user.email || user.phone}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">{ROLE_LABELS[user.role] || user.role}</span>
                <StatusBadge variant={user.statut === "actif" ? "success" : "error"}>
                  {user.statut === "actif" ? "Actif" : user.statut === "suspendu" ? "Suspendu" : "Supprimé"}
                </StatusBadge>
                {user.note_moyenne ? (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={11} className="fill-amber-500 text-amber-500" /> {user.note_moyenne} ({user.nb_avis})
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-400 mt-2">Inscrit le {formatDate(user.created_at)}</p>
            </div>
          </div>

          {/* Actions admin */}
          <div className="flex flex-wrap gap-2">
            {user.role !== "admin" && (
              <button
                disabled={busy}
                onClick={() => (user.statut === "actif" ? suspendre() : reactiver())}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors disabled:opacity-50 ${
                  user.statut === "actif" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-teal-50 text-teal-600 hover:bg-teal-100"
                }`}
              >
                {user.statut === "actif" ? <Ban size={14} /> : <RotateCcw size={14} />}
                {user.statut === "actif" ? "Suspendre" : "Réactiver"}
              </button>
            )}
            <button
              disabled={busy}
              onClick={doForcerDeconnexion}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <LogOut size={14} /> Déconnexion forcée
            </button>
            <button
              disabled={busy}
              onClick={doReinitialiser}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <KeyRound size={14} /> Réinitialiser mdp
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setPendingRole(user.role);
                setRoleModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <ShieldCheck size={14} /> Changer rôle
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Adresses */}
        <Section title="Adresses" icon={<MapPin size={16} />}>
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune adresse enregistrée.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-bold text-gray-900">{a.label}{a.est_defaut ? " · par défaut" : ""}</p>
                    <p className="text-gray-400 text-xs">{a.adresse_complete}, {a.quartier}, {a.commune}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Profil KYC vendeur/livreur */}
        {(vendeurProfil || livreurProfil) && (
          <Section title={vendeurProfil ? "Profil vendeur" : "Profil livreur"} icon={<ShieldCheck size={16} />}>
            {vendeurProfil && (
              <div className="space-y-4 text-sm">
                <PhotoGallery
                  photoCniPath={vendeurProfil.photo_cni_path}
                  photoProfilUrl={vendeurProfil.photo_profil_url}
                  photoSecondaireUrl={vendeurProfil.photo_couverture_url}
                  photoSecondaireLabel="Couverture boutique"
                />
                <p><span className="text-gray-400">Boutique : </span><span className="font-bold text-gray-900">{vendeurProfil.nom_boutique || "—"}</span></p>
                <p><span className="text-gray-400">Statut KYC : </span><StatusBadge variant={vendeurProfil.statut === "valide" ? "success" : vendeurProfil.statut === "refuse" ? "error" : vendeurProfil.statut === "en_attente" ? "pending" : "neutral"}>{vendeurProfil.statut === "en_attente" ? "en attente" : vendeurProfil.statut === "valide" ? "valide" : vendeurProfil.statut === "refuse" ? "refuse" : "non soumis"}</StatusBadge></p>
                <p><span className="text-gray-400">Zone : </span>{vendeurProfil.quartier}, {vendeurProfil.commune}</p>
                <p><span className="text-gray-400">Mobile Money : </span>{vendeurProfil.mobile_money_network?.toUpperCase()} {vendeurProfil.mobile_money_number}</p>
                <Link href="/admin/vendeurs" className="text-coral-500 font-bold text-xs inline-block mt-2">Voir dans la modération KYC →</Link>
              </div>
            )}
            {livreurProfil && (
              <div className="space-y-4 text-sm">
                <PhotoGallery
                  photoCniPath={livreurProfil.photo_cni_path}
                  photoProfilUrl={livreurProfil.photo_profil_url}
                  photoSecondaireUrl={livreurProfil.photo_vehicule_url}
                  photoSecondaireLabel="Véhicule"
                />
                <p><span className="text-gray-400">Véhicule : </span><span className="font-bold text-gray-900">{livreurProfil.type_vehicule || "—"}</span></p>
                <p><span className="text-gray-400">Statut KYC : </span><StatusBadge variant={livreurProfil.statut_verification === "valide" ? "success" : livreurProfil.statut_verification === "refuse" ? "error" : livreurProfil.statut_verification === "en_attente" ? "pending" : "neutral"}>{livreurProfil.statut_verification === "en_attente" ? "en attente" : livreurProfil.statut_verification === "valide" ? "valide" : livreurProfil.statut_verification === "refuse" ? "refuse" : "non soumis"}</StatusBadge></p>
                <p><span className="text-gray-400">Zone : </span>{livreurProfil.quartier}, {livreurProfil.commune}</p>
                <p><span className="text-gray-400">Mobile Money : </span>{livreurProfil.mobile_money_network?.toUpperCase()} {livreurProfil.mobile_money_number}</p>
                <Link href="/admin/livreurs" className="text-coral-500 font-bold text-xs inline-block mt-2">Voir dans la modération KYC →</Link>
              </div>
            )}
          </Section>
        )}

        {/* Articles (vendeur uniquement) */}
        {user.role === "vendeur" && (
          <Section title={`Articles (${articles.length})`} icon={<Package size={16} />}>
            {articles.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun article publié.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {articles.map((a: any) => {
                  const photo = [...(a.article_images ?? [])].sort(
                    (x: any, y: any) => (x.ordre ?? 0) - (y.ordre ?? 0)
                  )[0];
                  return (
                    <Link
                      key={a.id}
                      href={`/produits/${a.id}`}
                      target="_blank"
                      className="flex items-center gap-3 text-sm hover:bg-gray-50/50 -mx-2 px-2 py-1.5 rounded-xl transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.image_url} alt={a.nom} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff size={14} className="text-gray-300" />
                        )}
                      </div>
                      <span className="flex-1 min-w-0 font-medium text-gray-900 truncate">{a.nom}</span>
                      <span className="font-bold text-gray-700 shrink-0">{formatFCFA(a.prix)}</span>
                      <StatusBadge variant={a.statut === "publie" ? "success" : a.statut === "refuse" ? "error" : "pending"}>
                        {a.statut === "publie" ? "Publié" : a.statut === "refuse" ? "Refusé" : "En attente"}
                      </StatusBadge>
                    </Link>
                  );
                })}
              </div>
            )}
            {articles.length > 0 && (
              <Link href="/admin/moderation" className="text-coral-500 font-bold text-xs inline-block mt-3">
                Gérer dans la modération des articles →
              </Link>
            )}
          </Section>
        )}

        {/* Commandes */}
        <Section title={`Commandes (${commandes.length})`} icon={<ShoppingBag size={16} />}>
          {commandes.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune commande.</p>
          ) : (
            <div className="space-y-3">
              {commandes.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-bold text-gray-900">#{c.numero}</p>
                    <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-700">{formatFCFA(c.montant_total)}</p>
                    <StatusBadge variant={c.statut === "livree" ? "success" : c.statut === "annulee" ? "error" : "info"}>{c.statut}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Litiges */}
        <Section title={`Litiges (${disputes.length})`} icon={<AlertTriangle size={16} />}>
          {disputes.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun litige.</p>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <Link key={d.id} href="/admin/litiges" className="flex items-center justify-between text-sm hover:bg-gray-50/50 -mx-2 px-2 py-1 rounded-xl transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{d.type}</p>
                    <p className="text-xs text-gray-400">{d.motif}</p>
                  </div>
                  <StatusBadge variant={d.statut === "résolu" ? "success" : "error"}>{d.statut}</StatusBadge>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* Avis */}
        <Section title="Avis" icon={<Star size={16} />}>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reçus ({avisRecus.length})</p>
              {avisRecus.length === 0 ? <p className="text-sm text-gray-400">Aucun.</p> : (
                <div className="space-y-2">
                  {avisRecus.slice(0, 5).map((a) => (
                    <div key={a.id} className="text-sm flex items-center gap-2">
                      <span className="text-amber-500 font-bold">{a.note}★</span>
                      <span className="text-gray-500 truncate">{a.commentaire || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Laissés ({avisLaisses.length})</p>
              {avisLaisses.length === 0 ? <p className="text-sm text-gray-400">Aucun.</p> : (
                <div className="space-y-2">
                  {avisLaisses.slice(0, 5).map((a) => (
                    <div key={a.id} className="text-sm flex items-center gap-2">
                      <span className="text-amber-500 font-bold">{a.note}★</span>
                      <span className="text-gray-500 truncate">{a.commentaire || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Finances (vendeur/livreur) */}
        {(paiements.length > 0 || retraits.length > 0) && (
          <Section title="Finances" icon={<Wallet size={16} />}>
            <div className="space-y-4">
              {paiements.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Paiements reçus</p>
                  {paiements.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-500">{formatDate(p.created_at)}</span>
                      <span className="font-bold text-gray-900">{formatFCFA(p.montant_net || p.montant)}</span>
                      <StatusBadge variant={p.statut === "paye" ? "success" : "pending"}>{p.statut}</StatusBadge>
                    </div>
                  ))}
                </div>
              )}
              {retraits.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Retraits</p>
                  {retraits.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-500">{formatDate(r.created_at)}</span>
                      <span className="font-bold text-gray-900">{formatFCFA(r.montant)}</span>
                      <StatusBadge variant={r.statut === "paye" ? "success" : r.statut === "refuse" ? "error" : "pending"}>{r.statut}</StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Contacter */}
        <Section title="Contacter" icon={<MessageCircle size={16} />}>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
            {messagesAdmin.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun échange pour l'instant.</p>
            ) : (
              messagesAdmin.map((m: any) => {
                const estAdmin = m.expediteur_id !== userId;
                return (
                  <div key={m.id} className={`flex ${estAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${estAdmin ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
                      <p>{m.contenu}</p>
                      <p className={`text-[10px] mt-1 ${estAdmin ? "text-gray-300" : "text-gray-400"}`}>{formatDate(m.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doEnvoyerMessage()}
              placeholder="Écrire un message à cet utilisateur..."
              className="flex-1 h-11 px-4 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/10"
            />
            <button
              disabled={busy || !messageText.trim()}
              onClick={doEnvoyerMessage}
              className="px-4 rounded-2xl bg-gray-900 text-white text-xs font-bold disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
        </Section>

        {/* Notes internes */}
        <Section title="Notes internes (admin uniquement)" icon={<StickyNote size={16} />}>
          <div className="space-y-3 mb-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ajouter une note visible uniquement par les admins..."
              className="w-full h-20 p-3 bg-gray-50 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coral-500/10"
            />
            <button
              disabled={busy || !noteText.trim()}
              onClick={doAjouterNote}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold disabled:opacity-40"
            >
              Ajouter la note
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune note.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n: any) => (
                <div key={n.id} className="flex items-start justify-between gap-2 bg-gray-50 p-3 rounded-2xl">
                  <div>
                    <p className="text-sm text-gray-800">{n.contenu}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.admin?.full_name || "Admin"} · {formatDate(n.created_at)}</p>
                  </div>
                  <button onClick={() => supprimerNote(n.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Journal des actions admin */}
        <Section title="Journal des actions admin" icon={<History size={16} />}>
          {actionsLog.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune action enregistrée.</p>
          ) : (
            <div className="space-y-3">
              {actionsLog.map((l: any) => (
                <div key={l.id} className="text-sm">
                  <p className="font-bold text-gray-900">{l.action_type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-gray-400">{formatDate(l.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Modal changement de rôle */}
      <Modal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Changer le rôle">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Le rôle vendeur ne peut pas être attribué ici : il faut que le compte passe par le parcours KYC (devenir-vendeur) pour avoir un profil boutique complet.
            Changer le rôle livreur ne crée pas automatiquement le profil KYC associé. À utiliser avec précaution.
          </p>
          <select
            value={pendingRole}
            onChange={(e) => setPendingRole(e.target.value)}
            className="w-full h-12 px-4 bg-gray-50 rounded-2xl font-bold text-sm"
          >
            <option value="client">Client</option>
            <option value="livreur">Livreur</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setRoleModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500">
              Annuler
            </button>
            <button disabled={busy} onClick={doChangerRole} className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-900 text-white disabled:opacity-50">
              Confirmer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal mot de passe temporaire */}
      <Modal isOpen={!!tempPassword} onClose={() => setTempPassword(null)} title="Mot de passe réinitialisé">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Communique ce mot de passe temporaire à l'utilisateur (WhatsApp, téléphone). Il ne sera plus jamais affiché.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold tracking-widest text-gray-900">{tempPassword}</p>
          </div>
          <button onClick={() => setTempPassword(null)} className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white">
            J'ai noté, fermer
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
