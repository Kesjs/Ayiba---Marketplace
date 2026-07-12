"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Shield, Smartphone, ChevronRight, Camera,
  X, Mail, Phone, Lock, Trash2, PauseCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

// ============================================
// MODALE RÉUTILISABLE — bottom sheet mobile, dialog centré desktop
// ============================================
function SettingsModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
          />
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// TOGGLE — switch animé façon iOS
// ============================================
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${
        checked ? "bg-teal-500" : "bg-gray-200"
      }`}
      aria-pressed={checked}
    >
      <motion.div
        className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
        animate={{ left: checked ? "22px" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ============================================
// INPUT FIELD réutilisable pour les modales
// ============================================
function Field({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: any;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">{label}</label>
      <div className="relative">
        <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-400 transition-all"
        />
      </div>
    </div>
  );
}

export default function VendeurParametresPage() {
  const { showToast } = useToast();

  // Données du compte (mock — à brancher sur la vraie session plus tard)
  const [profile, setProfile] = useState({
    name: "Aminata Koné",
    email: "aminata.kone@example.com",
    phone: "+229 97 00 00 00",
  });
  const [editForm, setEditForm] = useState(profile);

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });

  // Toggles notifications — fonctionnels
  const [notifications, setNotifications] = useState({
    push: true,
    whatsapp: true,
    email: false,
  });

  const [twoFactor, setTwoFactor] = useState(true);

  // États des modales
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showConfirmPause, setShowConfirmPause] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 700)); // simulate save
    setProfile(editForm);
    setIsSaving(false);
    setShowEditProfile(false);
    showToast("Profil mis à jour", "success");
  };

  const handleChangePassword = async () => {
    if (passwordForm.next.length < 6) {
      showToast("Le mot de passe doit contenir au moins 6 caractères", "error");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsSaving(false);
    setShowChangePassword(false);
    setPasswordForm({ current: "", next: "", confirm: "" });
    showToast("Mot de passe modifié avec succès", "success");
  };

  const handleToggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    showToast(
      `Notifications ${key === "push" ? "push" : key === "whatsapp" ? "WhatsApp" : "email"} ${!notifications[key] ? "activées" : "désactivées"}`,
      "success"
    );
  };

  const handleConfirmPause = () => {
    setShowConfirmPause(false);
    showToast("Votre boutique est maintenant en pause", "success");
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmText !== "SUPPRIMER") return;
    setShowConfirmDelete(false);
    showToast("Demande de suppression envoyée", "success");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
      {/* Profile Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gray-100 overflow-hidden border-4 border-white shadow-md">
            <img src="https://i.pravatar.cc/200?u=Aminata" className="w-full h-full object-cover" alt="" />
          </div>
          <button className="absolute -bottom-2 -right-2 w-9 h-9 md:w-10 md:h-10 bg-coral-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-transform">
            <Camera size={16} />
          </button>
        </div>
        <div className="text-center md:text-left flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 truncate">{profile.name}</h3>
          <p className="text-gray-500 font-medium text-sm mb-3 md:mb-4">Vendeuse certifiée depuis Mars 2024</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-100">
              Boutique Vérifiée
            </span>
            <span className="px-3 py-1 bg-coral-50 text-coral-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-coral-100">
              Premium
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          className="rounded-2xl h-11 md:h-12 px-6 w-full md:w-auto shrink-0"
          onClick={() => {
            setEditForm(profile);
            setShowEditProfile(true);
          }}
        >
          Modifier le profil
        </Button>
      </div>

      {/* Compte */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Compte</h4>
        <div className="bg-white rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          <button
            onClick={() => {
              setEditForm(profile);
              setShowEditProfile(true);
            }}
            className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-gray-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors shrink-0">
                <User size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Informations personnelles</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{profile.email}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-gray-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors shrink-0">
                <Lock size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Mot de passe</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">••••••••</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          <div className="w-full flex items-center justify-between p-5 md:p-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Validation en 2 étapes</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {twoFactor ? "Activée" : "Désactivée"}
                </p>
              </div>
            </div>
            <Toggle checked={twoFactor} onChange={() => setTwoFactor((v) => !v)} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Notifications</h4>
        <div className="bg-white rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          <div className="w-full flex items-center justify-between p-5 md:p-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <p className="text-sm font-bold text-gray-900">Notifications push</p>
            </div>
            <Toggle checked={notifications.push} onChange={() => handleToggleNotif("push")} />
          </div>

          <div className="w-full flex items-center justify-between p-5 md:p-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Smartphone size={20} />
              </div>
              <p className="text-sm font-bold text-gray-900">Alertes WhatsApp</p>
            </div>
            <Toggle checked={notifications.whatsapp} onChange={() => handleToggleNotif("whatsapp")} />
          </div>

          <div className="w-full flex items-center justify-between p-5 md:p-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <p className="text-sm font-bold text-gray-900">Notifications email</p>
            </div>
            <Toggle checked={notifications.email} onChange={() => handleToggleNotif("email")} />
          </div>
        </div>
      </div>

      {/* Zone dangereuse */}
      <div className="pt-4 md:pt-6 border-t border-gray-100 space-y-3">
        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest ml-4">Zone sensible</h4>

        <button
          onClick={() => setShowConfirmPause(true)}
          className="w-full p-5 md:p-6 bg-amber-50 text-amber-700 rounded-3xl border border-amber-100 flex items-center justify-between hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-sm shrink-0">
              <PauseCircle size={20} />
            </div>
            <p className="font-bold text-sm text-left">Fermer temporairement la boutique</p>
          </div>
          <ChevronRight size={18} className="shrink-0" />
        </button>

        <button
          onClick={() => setShowConfirmDelete(true)}
          className="w-full p-5 md:p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center justify-between hover:bg-red-100 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white text-red-500 flex items-center justify-center shadow-sm shrink-0">
              <Trash2 size={20} />
            </div>
            <p className="font-bold text-sm text-left">Supprimer mon compte</p>
          </div>
          <ChevronRight size={18} className="shrink-0" />
        </button>
      </div>

      {/* MODALE — Modifier le profil */}
      <SettingsModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Modifier mes informations">
        <div className="space-y-4">
          <Field label="Nom complet" icon={User} value={editForm.name} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} />
          <Field label="Email" icon={Mail} type="email" value={editForm.email} onChange={(v) => setEditForm((f) => ({ ...f, email: v }))} />
          <Field label="Téléphone" icon={Phone} value={editForm.phone} onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} />

          <Button
            className="w-full h-12 rounded-xl mt-2"
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Enregistrer"}
          </Button>
        </div>
      </SettingsModal>

      {/* MODALE — Changer le mot de passe */}
      <SettingsModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} title="Changer le mot de passe">
        <div className="space-y-4">
          <Field
            label="Mot de passe actuel"
            icon={Lock}
            type="password"
            value={passwordForm.current}
            onChange={(v) => setPasswordForm((f) => ({ ...f, current: v }))}
          />
          <Field
            label="Nouveau mot de passe"
            icon={Lock}
            type="password"
            value={passwordForm.next}
            onChange={(v) => setPasswordForm((f) => ({ ...f, next: v }))}
            placeholder="6 caractères minimum"
          />
          <Field
            label="Confirmer le nouveau mot de passe"
            icon={Lock}
            type="password"
            value={passwordForm.confirm}
            onChange={(v) => setPasswordForm((f) => ({ ...f, confirm: v }))}
          />

          <Button
            className="w-full h-12 rounded-xl mt-2"
            onClick={handleChangePassword}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Mettre à jour"}
          </Button>
        </div>
      </SettingsModal>

      {/* MODALE — Confirmer pause boutique */}
      <SettingsModal isOpen={showConfirmPause} onClose={() => setShowConfirmPause(false)} title="Fermer temporairement">
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Votre boutique ne sera plus visible dans le catalogue tant qu'elle est en pause. Vous pourrez la réactiver à tout moment depuis cette page.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmPause(false)}
            className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmPause}
            className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors"
          >
            Confirmer
          </button>
        </div>
      </SettingsModal>

      {/* MODALE — Confirmer suppression compte */}
      <SettingsModal
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setDeleteConfirmText("");
        }}
        title="Supprimer mon compte"
      >
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Cette action est <strong className="text-red-600">définitive et irréversible</strong>. Toutes vos données, articles et l'historique de votre boutique seront supprimés.
        </p>
        <p className="text-xs text-gray-500 font-medium mb-2">
          Tapez <strong className="text-gray-900">SUPPRIMER</strong> pour confirmer :
        </p>
        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium mb-4 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
          placeholder="SUPPRIMER"
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowConfirmDelete(false);
              setDeleteConfirmText("");
            }}
            className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={deleteConfirmText !== "SUPPRIMER"}
            className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            Supprimer définitivement
          </button>
        </div>
      </SettingsModal>
    </div>
  );
}
