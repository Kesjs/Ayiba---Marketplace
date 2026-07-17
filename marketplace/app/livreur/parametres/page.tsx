"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  MapPin,
  Bike,
  Wallet,
  Bell,
  LogOut,
  Camera,
  Check,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  useLivreurParametres,
  type TypeVehicule,
  type MobileMoneyNetwork,
} from "@/app/hooks/useLivreurParametres";

const VEHICULES: { value: TypeVehicule; label: string }[] = [
  { value: "motocyclette", label: "Motocyclette" },
  { value: "velo", label: "Vélo" },
  { value: "tricycle", label: "Tricycle" },
  { value: "a_pied", label: "À pied" },
];

const RESEAUX: { value: MobileMoneyNetwork; label: string }[] = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "moov", label: "Moov Money" },
  { value: "celtiis", label: "Celtiis Cash" },
];

export default function LivreurParametresPage() {
  const router = useRouter();
  const { loading, saving, uploadingAvatar, error, successMessage, data, save, uploadAvatar } =
    useLivreurParametres();

  const [form, setForm] = useState(data);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!loading && !initialized) {
    setForm(data);
    setInitialized(true);
  }

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    await save(form);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <DashboardLayout role="livreur" title="Paramètres">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="max-w-2xl">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Avatar + nom */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm mb-6 flex items-center gap-5"
          >
            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="relative w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 group"
            >
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatarUrl} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <User size={28} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={18} className="text-white" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{form.fullName || "Ton nom"}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Touche la photo pour la changer</p>
            </div>
          </motion.div>

          {/* Profil */}
          <Section icon={User} title="Profil" delay={0.05}>
            <Field label="Nom complet">
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="input"
                placeholder="Ton nom complet"
              />
            </Field>
            <Field label="Téléphone" icon={Phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="input"
                placeholder="+229 00 00 00 00"
              />
            </Field>
          </Section>

          {/* Localisation */}
          <Section icon={MapPin} title="Localisation" delay={0.1}>
            <Field label="Quartier">
              <input
                type="text"
                value={form.quartier}
                onChange={(e) => setForm((f) => ({ ...f, quartier: e.target.value }))}
                className="input"
                placeholder="Ex: Godomey"
              />
            </Field>
            <Field label="Commune">
              <input
                type="text"
                value={form.commune}
                onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))}
                className="input"
                placeholder="Ex: Calavi"
              />
            </Field>
          </Section>

          {/* Véhicule */}
          <Section icon={Bike} title="Véhicule" delay={0.15}>
            <Field label="Type de véhicule">
              <select
                value={form.typeVehicule}
                onChange={(e) =>
                  setForm((f) => ({ ...f, typeVehicule: e.target.value as TypeVehicule }))
                }
                className="input"
              >
                <option value="">Sélectionner</option>
                {VEHICULES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
            {form.typeVehicule && form.typeVehicule !== "velo" && form.typeVehicule !== "a_pied" && (
              <Field label="Plaque d'immatriculation">
                <input
                  type="text"
                  value={form.plaqueImmatriculation}
                  onChange={(e) => setForm((f) => ({ ...f, plaqueImmatriculation: e.target.value }))}
                  className="input"
                  placeholder="Ex: AB 1234 RB"
                />
              </Field>
            )}
          </Section>

          {/* Mobile money */}
          <Section icon={Wallet} title="Mobile Money" delay={0.2}>
            <Field label="Réseau">
              <select
                value={form.mobileMoneyNetwork}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mobileMoneyNetwork: e.target.value as MobileMoneyNetwork }))
                }
                className="input"
              >
                <option value="">Sélectionner</option>
                {RESEAUX.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Numéro Mobile Money">
              <input
                type="tel"
                value={form.mobileMoneyNumber}
                onChange={(e) => setForm((f) => ({ ...f, mobileMoneyNumber: e.target.value }))}
                className="input"
                placeholder="+229 00 00 00 00"
              />
            </Field>
          </Section>

          {/* Notifications */}
          <Section icon={Bell} title="Notifications" delay={0.25}>
            <Toggle
              label="Notifications push"
              checked={form.notifPush}
              onChange={(v) => setForm((f) => ({ ...f, notifPush: v }))}
            />
            <Toggle
              label="Notifications WhatsApp"
              checked={form.notifWhatsapp}
              onChange={(v) => setForm((f) => ({ ...f, notifWhatsapp: v }))}
            />
            <Toggle
              label="Notifications email"
              checked={form.notifEmail}
              onChange={(v) => setForm((f) => ({ ...f, notifEmail: v }))}
            />
          </Section>

          {/* Bouton sauvegarder */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
          >
            {saving ? (
              "Enregistrement..."
            ) : successMessage ? (
              <>
                <Check size={18} /> {successMessage}
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </motion.button>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full h-14 border border-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 mb-10"
          >
            <LogOut size={18} /> Déconnexion
          </button>

          <style jsx global>{`
            .input {
              width: 100%;
              height: 3rem;
              padding: 0 1rem;
              border-radius: 0.875rem;
              border: 1px solid rgb(229 231 235);
              font-size: 0.875rem;
              font-weight: 600;
              color: rgb(17 24 39);
              background: white;
            }
            .input:focus {
              outline: none;
              border-color: rgb(20 184 166);
              box-shadow: 0 0 0 3px rgb(20 184 166 / 0.1);
            }
          `}</style>
        </div>
      )}
    </DashboardLayout>
  );
}

function Section({
  icon: Icon,
  title,
  delay,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm mb-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Icon size={18} className="text-teal-600" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-2"
    >
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <span
        className={`relative w-11 h-7 rounded-full transition-colors duration-300 ${
          checked ? "bg-teal-500" : "bg-gray-300"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
          style={{ left: checked ? "calc(100% - 24px)" : "4px" }}
        />
      </span>
    </button>
  );
}
