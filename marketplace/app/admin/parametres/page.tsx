"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminParametres, useChangerMonMotDePasse, useMonProfilAdmin } from "@/lib/hooks/useAdmin";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CATEGORIES } from "@/lib/mock-data";
import {
  Wallet, Route, ShieldAlert, Save, Check, Clock, XCircle, BellRing,
  FileText, CalendarClock, KeyRound, History, User,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function Card({
  custom,
  children,
  className = "",
}: {
  custom: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      custom={custom}
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className={`bg-white rounded-[32px] border border-gray-50 shadow-sm p-8 max-w-xl space-y-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({
  icon: Icon,
  color,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-1">
        <Icon size={16} className={color} />
        {title}
      </label>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

// Convertit une valeur ISO stockée en DB vers le format attendu par un
// input datetime-local (et inversement).
function toDatetimeLocal(iso: unknown): string {
  if (!iso || typeof iso !== "string") return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AdminParametresPage() {
  const { params, historique, loading, mettreAJourPlusieurs } = useAdminParametres();
  const { changer: changerMotDePasse, saving: savingPassword } = useChangerMonMotDePasse();
  const { profil, loading: loadingProfil, mettreAJour: mettreAJourProfil } = useMonProfilAdmin();
  const { showToast } = useToast();

  // Profil admin
  const [profilNom, setProfilNom] = useState("");
  const [profilEmail, setProfilEmail] = useState("");
  const [erreurProfil, setErreurProfil] = useState<string | null>(null);
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilJustSaved, setProfilJustSaved] = useState(false);

  // Commission & livraison
  const [commission, setCommission] = useState("10");
  const [commissionParCategorie, setCommissionParCategorie] = useState<Record<string, string>>({});
  const [fraisBase, setFraisBase] = useState("300");
  const [prixParKm, setPrixParKm] = useState("100");
  const [rayonLivraisonActif, setRayonLivraisonActif] = useState(false);
  const [rayonLivraisonMaxKm, setRayonLivraisonMaxKm] = useState("15");

  // Horaires de service
  const [horairesServiceActif, setHorairesServiceActif] = useState(false);
  const [horairesServiceDebut, setHorairesServiceDebut] = useState("07:00");
  const [horairesServiceFin, setHorairesServiceFin] = useState("22:00");

  // Annulation & notifications
  const [delaiAnnulation, setDelaiAnnulation] = useState("15");
  const [notifSeuilMin, setNotifSeuilMin] = useState("60");
  const [notifEmailAdmin, setNotifEmailAdmin] = useState("");

  // Textes légaux
  const [cguNote, setCguNote] = useState("");
  const [confidentialiteNote, setConfidentialiteNote] = useState("");

  // Maintenance
  const [maintenance, setMaintenance] = useState(false);
  const [maintenancePrevueActive, setMaintenancePrevueActive] = useState(false);
  const [maintenancePrevueDebut, setMaintenancePrevueDebut] = useState("");
  const [maintenancePrevueFin, setMaintenancePrevueFin] = useState("");
  const [maintenancePrevueMessage, setMaintenancePrevueMessage] = useState("");

  // Sécurité
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmMdp, setConfirmMdp] = useState("");
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);
  const [mdpJustChanged, setMdpJustChanged] = useState(false);

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (params.commission_pourcentage !== undefined) setCommission(String(params.commission_pourcentage));
    if (params.commission_par_categorie && typeof params.commission_par_categorie === "object") {
      const map: Record<string, string> = {};
      Object.entries(params.commission_par_categorie).forEach(([k, v]) => (map[k] = String(v)));
      setCommissionParCategorie(map);
    }
    if (params.frais_base_livraison !== undefined) setFraisBase(String(params.frais_base_livraison));
    if (params.prix_par_km !== undefined) setPrixParKm(String(params.prix_par_km));
    if (params.rayon_livraison_actif !== undefined) setRayonLivraisonActif(params.rayon_livraison_actif === true || params.rayon_livraison_actif === "true");
    if (params.rayon_livraison_max_km !== undefined) setRayonLivraisonMaxKm(String(params.rayon_livraison_max_km));

    if (params.horaires_service_actif !== undefined) setHorairesServiceActif(params.horaires_service_actif === true || params.horaires_service_actif === "true");
    if (params.horaires_service_debut) setHorairesServiceDebut(String(params.horaires_service_debut));
    if (params.horaires_service_fin) setHorairesServiceFin(String(params.horaires_service_fin));

    if (params.delai_annulation_gratuite_min !== undefined) setDelaiAnnulation(String(params.delai_annulation_gratuite_min));
    if (params.notif_commande_bloquee_min !== undefined) setNotifSeuilMin(String(params.notif_commande_bloquee_min));
    if (params.notif_email_admin !== undefined) setNotifEmailAdmin(String(params.notif_email_admin || ""));

    if (params.cgu_note_admin !== undefined) setCguNote(String(params.cgu_note_admin || ""));
    if (params.confidentialite_note_admin !== undefined) setConfidentialiteNote(String(params.confidentialite_note_admin || ""));

    if (params.mode_maintenance !== undefined) setMaintenance(params.mode_maintenance === true || params.mode_maintenance === "true");
    if (params.maintenance_prevue_active !== undefined) setMaintenancePrevueActive(params.maintenance_prevue_active === true || params.maintenance_prevue_active === "true");
    if (params.maintenance_prevue_debut !== undefined) setMaintenancePrevueDebut(toDatetimeLocal(params.maintenance_prevue_debut));
    if (params.maintenance_prevue_fin !== undefined) setMaintenancePrevueFin(toDatetimeLocal(params.maintenance_prevue_fin));
    if (params.maintenance_prevue_message !== undefined) setMaintenancePrevueMessage(String(params.maintenance_prevue_message || ""));
  }, [loading, params]);

  useEffect(() => {
    if (loadingProfil || !profil) return;
    setProfilNom(profil.full_name || "");
    setProfilEmail(profil.email || "");
  }, [loadingProfil, profil]);

  const handleSave = async () => {
    setSaving(true);
    const categorieMap: Record<string, number> = {};
    Object.entries(commissionParCategorie).forEach(([id, v]) => {
      if (v !== "" && v !== undefined && !isNaN(Number(v))) categorieMap[id] = Number(v);
    });

    await mettreAJourPlusieurs([
      { cle: "commission_pourcentage", valeur: Number(commission) },
      { cle: "commission_par_categorie", valeur: categorieMap },
      { cle: "frais_base_livraison", valeur: Number(fraisBase) },
      { cle: "prix_par_km", valeur: Number(prixParKm) },
      { cle: "rayon_livraison_actif", valeur: rayonLivraisonActif },
      { cle: "rayon_livraison_max_km", valeur: Number(rayonLivraisonMaxKm) },
      { cle: "horaires_service_actif", valeur: horairesServiceActif },
      { cle: "horaires_service_debut", valeur: horairesServiceDebut },
      { cle: "horaires_service_fin", valeur: horairesServiceFin },
      { cle: "delai_annulation_gratuite_min", valeur: Number(delaiAnnulation) },
      { cle: "notif_commande_bloquee_min", valeur: Number(notifSeuilMin) },
      { cle: "notif_email_admin", valeur: notifEmailAdmin.trim() },
      { cle: "cgu_note_admin", valeur: cguNote },
      { cle: "confidentialite_note_admin", valeur: confidentialiteNote },
      { cle: "mode_maintenance", valeur: maintenance },
      { cle: "maintenance_prevue_active", valeur: maintenancePrevueActive },
      { cle: "maintenance_prevue_debut", valeur: fromDatetimeLocal(maintenancePrevueDebut) },
      { cle: "maintenance_prevue_fin", valeur: fromDatetimeLocal(maintenancePrevueFin) },
      { cle: "maintenance_prevue_message", valeur: maintenancePrevueMessage.trim() },
    ]);
    setSaving(false);
    setJustSaved(true);
    showToast("Paramètres enregistrés", "success");
    setTimeout(() => setJustSaved(false), 2200);
  };

  const handleSauvegarderProfil = async () => {
    setErreurProfil(null);
    if (!profilNom.trim()) {
      setErreurProfil("Le nom ne peut pas être vide.");
      return;
    }
    if (!profilEmail.trim()) {
      setErreurProfil("L'email ne peut pas être vide.");
      return;
    }
    setSavingProfil(true);
    const err = await mettreAJourProfil(profilNom, profilEmail.trim());
    setSavingProfil(false);
    if (err) {
      setErreurProfil(err);
      return;
    }
    setProfilJustSaved(true);
    showToast("Profil admin mis à jour", "success");
    setTimeout(() => setProfilJustSaved(false), 2200);
  };

  const handleChangerMotDePasse = async () => {
    setErreurMdp(null);
    if (nouveauMdp.length < 6) {
      setErreurMdp("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (nouveauMdp !== confirmMdp) {
      setErreurMdp("Les deux mots de passe ne correspondent pas.");
      return;
    }
    const err = await changerMotDePasse(nouveauMdp);
    if (err) {
      setErreurMdp(err);
      return;
    }
    setNouveauMdp("");
    setConfirmMdp("");
    setMdpJustChanged(true);
    showToast("Mot de passe modifié", "success");
    setTimeout(() => setMdpJustChanged(false), 2200);
  };

  // Simulation live de l'exemple de calcul affiché sous les 2 champs de
  // livraison, pour que l'admin visualise l'impact immédiat de ses réglages.
  const exempleDistance = 5;
  const exempleFrais =
    (Number(fraisBase) || 0) + exempleDistance * (Number(prixParKm) || 0);

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Paramètres système">
        <div className="space-y-6 max-w-xl">
          <Skeleton className="h-96 rounded-[32px]" />
          <Skeleton className="h-64 rounded-[32px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Paramètres système">
      <div className="space-y-6">
        {/* Commission & livraison */}
        <Card custom={0}>
          <div>
            <SectionTitle icon={Wallet} color="text-coral-500" title="Commission plateforme (%)" />
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full h-12 px-4 mt-2 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-shadow"
            />
            <p className="text-xs text-gray-400 mt-1">Prélevée sur chaque commande livrée. Sert de valeur par défaut pour toutes les catégories.</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Commission par catégorie (optionnel)</p>
            <p className="text-xs text-gray-400 mb-3">
              Laisse un champ vide pour utiliser la commission par défaut ci-dessus.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 h-11">
                  <span className="text-xs text-gray-600 flex-1 truncate">{cat.label}</span>
                  <input
                    type="number"
                    placeholder="—"
                    value={commissionParCategorie[cat.id] ?? ""}
                    onChange={(e) =>
                      setCommissionParCategorie((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    className="w-14 h-8 px-2 bg-white border border-gray-100 rounded-lg text-xs font-medium text-right focus:outline-none focus:ring-2 focus:ring-coral-500/20"
                  />
                  <span className="text-[10px] text-gray-400">%</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle
              icon={Route}
              color="text-teal-500"
              title="Frais de livraison"
              subtitle="Frais = frais de base + (distance × prix par km), calculé automatiquement à partir des coordonnées GPS."
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Frais de base (FCFA)</span>
                <input
                  type="number"
                  value={fraisBase}
                  onChange={(e) => setFraisBase(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-shadow"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Prix par km (FCFA)</span>
                <input
                  type="number"
                  value={prixParKm}
                  onChange={(e) => setPrixParKm(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-shadow"
                />
              </div>
            </div>

            <motion.div
              key={exempleFrais}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-teal-50/60 rounded-xl px-3 py-2"
            >
              <Route size={14} className="text-teal-500 shrink-0" />
              Exemple à {exempleDistance} km : <span className="font-bold text-gray-800">{exempleFrais.toLocaleString("fr-FR")} FCFA</span>
            </motion.div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex-1 pr-4">
              <p className="text-sm font-bold text-gray-700">Rayon de livraison maximum</p>
              <p className="text-xs text-gray-400">Bloque les commandes au-delà de la distance indiquée.</p>
              {rayonLivraisonActif && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    value={rayonLivraisonMaxKm}
                    onChange={(e) => setRayonLivraisonMaxKm(e.target.value)}
                    className="w-20 h-9 px-3 bg-white border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="text-xs text-gray-400">km</span>
                </div>
              )}
            </div>
            <input
              type="checkbox"
              checked={rayonLivraisonActif}
              onChange={(e) => setRayonLivraisonActif(e.target.checked)}
              className="w-5 h-5 accent-teal-500 shrink-0"
            />
          </div>
        </Card>

        {/* Horaires de service */}
        <Card custom={1}>
          <div className="flex items-center justify-between">
            <SectionTitle icon={Clock} color="text-amber-500" title="Horaires de service" subtitle="Restreint les commandes à une plage horaire précise." />
            <input
              type="checkbox"
              checked={horairesServiceActif}
              onChange={(e) => setHorairesServiceActif(e.target.checked)}
              className="w-5 h-5 accent-amber-500 shrink-0"
            />
          </div>
          {horairesServiceActif && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Ouverture</span>
                <input
                  type="time"
                  value={horairesServiceDebut}
                  onChange={(e) => setHorairesServiceDebut(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-shadow"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Fermeture</span>
                <input
                  type="time"
                  value={horairesServiceFin}
                  onChange={(e) => setHorairesServiceFin(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-shadow"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Annulation & notifications */}
        <Card custom={2}>
          <div>
            <SectionTitle icon={XCircle} color="text-coral-500" title="Délai d'annulation gratuite" subtitle="Temps après la commande pendant lequel le client peut annuler sans frais." />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={delaiAnnulation}
                onChange={(e) => setDelaiAnnulation(e.target.value)}
                className="w-24 h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-shadow"
              />
              <span className="text-xs text-gray-400">minutes</span>
            </div>
          </div>

          <div>
            <SectionTitle icon={BellRing} color="text-teal-500" title="Alerte commande bloquée" subtitle="Notifie l'admin si une commande reste sans mise à jour trop longtemps." />
            <div className="flex items-center gap-2 mt-2 mb-3">
              <input
                type="number"
                value={notifSeuilMin}
                onChange={(e) => setNotifSeuilMin(e.target.value)}
                className="w-24 h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-shadow"
              />
              <span className="text-xs text-gray-400">minutes</span>
            </div>
            <input
              type="email"
              placeholder="admin@ayiba.com"
              value={notifEmailAdmin}
              onChange={(e) => setNotifEmailAdmin(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-shadow"
            />
            <p className="text-xs text-gray-400 mt-1">
              Le réglage est enregistré ici ; l'envoi effectif de l'email nécessite une tâche planifiée côté Supabase (comme <code>confirm-delivery</code>), à configurer séparément.
            </p>
          </div>
        </Card>

        {/* Textes légaux */}
        <Card custom={3}>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700">Textes légaux</h3>
          </div>
          <p className="text-xs text-gray-400 -mt-4">
            Note affichée en haut des pages publiques CGU et Politique de confidentialité, sans remplacer leur contenu.
          </p>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Note sur la page CGU</span>
            <textarea
              value={cguNote}
              onChange={(e) => setCguNote(e.target.value)}
              rows={3}
              placeholder="Ex : Ces conditions ont été mises à jour le ..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-300/40 transition-shadow resize-none"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Note sur la page Politique de confidentialité</span>
            <textarea
              value={confidentialiteNote}
              onChange={(e) => setConfidentialiteNote(e.target.value)}
              rows={3}
              placeholder="Ex : Nous avons précisé notre politique de conservation des données."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-300/40 transition-shadow resize-none"
            />
          </div>
        </Card>

        {/* Maintenance immédiate */}
        <Card custom={4}>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} className="text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-700">Mode maintenance</p>
                <p className="text-xs text-red-500">Bloque l'accès au site pour tous les non-admins</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="w-5 h-5 accent-red-500 shrink-0"
            />
          </div>

          {/* Maintenance programmée */}
          <div className="flex items-center justify-between">
            <SectionTitle
              icon={CalendarClock}
              color="text-amber-500"
              title="Bannière de maintenance programmée"
              subtitle="Prévient les visiteurs d'une indisponibilité à venir, sans bloquer le site."
            />
            <input
              type="checkbox"
              checked={maintenancePrevueActive}
              onChange={(e) => setMaintenancePrevueActive(e.target.checked)}
              className="w-5 h-5 accent-amber-500 shrink-0"
            />
          </div>
          {maintenancePrevueActive && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Indisponible à partir de</span>
                  <input
                    type="datetime-local"
                    value={maintenancePrevueDebut}
                    onChange={(e) => setMaintenancePrevueDebut(e.target.value)}
                    className="w-full h-12 px-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-shadow"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Jusqu'à</span>
                  <input
                    type="datetime-local"
                    value={maintenancePrevueFin}
                    onChange={(e) => setMaintenancePrevueFin(e.target.value)}
                    className="w-full h-12 px-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-shadow"
                  />
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Message personnalisé (optionnel)</span>
                <input
                  type="text"
                  placeholder="Ex : Le site sera indisponible ce soir pour une mise à jour."
                  value={maintenancePrevueMessage}
                  onChange={(e) => setMaintenancePrevueMessage(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-shadow"
                />
              </div>
            </div>
          )}
        </Card>

        <Card custom={5}>
          <Button variant="primary" onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <Save size={16} className="animate-pulse" />
            ) : justSaved ? (
              <Check size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Enregistrement..." : justSaved ? "Enregistré" : "Enregistrer les paramètres"}
          </Button>
        </Card>

        {/* Profil admin */}
        <Card custom={6}>
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700">Profil admin</h3>
          </div>
          <p className="text-xs text-gray-400 -mt-4">Nom et email affichés et utilisés pour la connexion à cet espace admin.</p>

          {erreurProfil && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreurProfil}</p>
          )}

          <div>
            <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Nom complet</span>
            <input
              type="text"
              value={profilNom}
              onChange={(e) => setProfilNom(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-300/40 transition-shadow"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Email</span>
            <input
              type="email"
              value={profilEmail}
              onChange={(e) => setProfilEmail(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-300/40 transition-shadow"
            />
            <p className="text-xs text-gray-400 mt-1.5">Changer l'email peut nécessiter une confirmation par lien reçu à la nouvelle adresse.</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSauvegarderProfil}
            disabled={savingProfil || loadingProfil}
            className="w-full"
          >
            {profilJustSaved ? <Check size={16} /> : <User size={16} />}
            {savingProfil ? "Enregistrement..." : profilJustSaved ? "Profil mis à jour" : "Enregistrer le profil"}
          </Button>
        </Card>

        {/* Sécurité du compte */}
        <Card custom={7}>
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700">Sécurité du compte</h3>
          </div>
          <p className="text-xs text-gray-400 -mt-4">Change le mot de passe utilisé pour te connecter à cet espace admin.</p>

          {erreurMdp && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreurMdp}</p>
          )}

          <div>
            <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Nouveau mot de passe</span>
            <input
              type="password"
              value={nouveauMdp}
              onChange={(e) => setNouveauMdp(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-300/40 transition-shadow"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Confirmer le mot de passe</span>
            <input
              type="password"
              value={confirmMdp}
              onChange={(e) => setConfirmMdp(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-300/40 transition-shadow"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleChangerMotDePasse}
            disabled={savingPassword || !nouveauMdp || !confirmMdp}
            className="w-full"
          >
            {mdpJustChanged ? <Check size={16} /> : <KeyRound size={16} />}
            {savingPassword ? "Modification..." : mdpJustChanged ? "Mot de passe modifié" : "Changer le mot de passe"}
          </Button>
        </Card>

        {/* Historique des modifications */}
        <Card custom={8}>
          <div className="flex items-center gap-2">
            <History size={16} className="text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700">Historique des modifications</h3>
          </div>
          {historique.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune modification enregistrée pour l'instant.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {historique.map((h) => (
                <div key={h.id} className="text-xs border-l-2 border-gray-100 pl-3 py-0.5">
                  <p className="font-bold text-gray-700">{h.cible_id.replaceAll("_", " ")}</p>
                  <p className="text-gray-400">
                    {new Date(h.created_at).toLocaleString("fr-FR")}
                    {h.admin?.full_name ? ` · ${h.admin.full_name}` : ""}
                  </p>
                  {h.details && (
                    <p className="text-gray-400 mt-0.5">
                      {JSON.stringify(h.details.ancienne_valeur)} → {JSON.stringify(h.details.nouvelle_valeur)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
