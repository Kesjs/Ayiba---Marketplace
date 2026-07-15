"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Upload, X, CheckCircle2, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/kyc/StepIndicator";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/mock-data";

const STEP_LABELS = ["Informations", "Photos"];
const MAX_PHOTOS = 5;

interface PhotoEntry {
  file: File;
  preview: string;
}

export default function NouveauArticlePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix: "",
    categorie: "",
    stock: "1",
  });

  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isStep1Valid =
    formData.nom.trim().length > 2 &&
    formData.prix.trim().length > 0 &&
    formData.categorie.length > 0 &&
    formData.description.trim().length > 5;

  // Ajoute une ou plusieurs vraies photos (au lieu du mock Picsum précédent)
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoError(null);
    if (files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (files.length > remaining) {
      setPhotoError(`Tu peux ajouter ${remaining} photo${remaining > 1 ? "s" : ""} de plus maximum.`);
    }

    const accepted = files.slice(0, remaining).filter((f) => {
      if (!f.type.startsWith("image/")) {
        setPhotoError("Seules les images sont acceptées.");
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        setPhotoError("Chaque image doit faire moins de 5 Mo.");
        return false;
      }
      return true;
    });

    accepted.forEach((file) => {
      const preview = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { file, preview }]);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: upload réel des `photos[].file` vers Supabase Storage puis insert en base,
    // sur le même modèle que VendeurKycWizard (bucket dédié, path `${vendeurId}/articles/...`)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push("/vendeur/dashboard"), 2000);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-0">
      {/* Header — même logique que le wizard KYC : croix/retour + StepIndicator */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/vendeur/articles">
          <button
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Retour aux articles"
          >
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          {!success && (
            <StepIndicator currentStep={step} totalSteps={2} stepLabels={STEP_LABELS} />
          )}
        </div>
      </div>

      {success ? (
        <div className="bg-white p-8 md:p-12 rounded-[32px] border border-teal-100 shadow-xl shadow-teal-500/5 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-500">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Article publié !</h3>
          <p className="text-gray-500 font-medium mb-8">
            Votre article est maintenant en ligne et visible par les acheteurs du quartier.
          </p>
          <Link href="/vendeur/dashboard">
            <Button className="w-full h-14 rounded-2xl">Retour au tableau de bord</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-8">
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Décris ton article</h2>
                  <p className="text-sm text-gray-500">
                    Ces informations apparaîtront sur ta boutique et dans les résultats de recherche.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'article
                  </label>
                  <input
                    type="text"
                    name="nom"
                    placeholder="Ex: Tissu Wax 6 yards"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-shadow"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (FCFA)
                    </label>
                    <input
                      type="number"
                      name="prix"
                      placeholder="5000"
                      value={formData.prix}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock disponible
                    </label>
                    <input
                      type="number"
                      name="stock"
                      min={0}
                      placeholder="1"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      name="categorie"
                      value={formData.categorie}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-shadow"
                    >
                      <option value="">Sélectionner...</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Décrivez votre article en quelques mots (matière, état, taille...)"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 resize-none transition-shadow"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Ajoute des photos</h2>
                  <p className="text-sm text-gray-500">
                    Jusqu'à {MAX_PHOTOS} photos nettes — la première sera celle affichée sur ta boutique.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo, i) => (
                    <div
                      key={photo.preview}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group"
                    >
                      <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-700 px-2 py-0.5 rounded-full">
                          Principale
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        aria-label="Retirer la photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 hover:border-coral-300 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-medium text-gray-500">Ajouter</span>
                    </button>
                  )}
                </div>

                {photoError && (
                  <p className="text-xs text-red-500 text-center">{photoError}</p>
                )}

                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Vérifie bien ton prix et ton stock — une fois publié, l'article est
                    immédiatement visible et disponible à la vente.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation — dans le bloc, cohérent avec le wizard KYC */}
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
              {step === 1 ? (
                <>
                  <Link href="/vendeur/articles" className="shrink-0">
                    <button
                      type="button"
                      className="h-12 px-4 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className="flex-1 flex items-center justify-center gap-1 h-12 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Continuer
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 px-4 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading || photos.length === 0}
                    className="flex-1 h-12 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Publication..." : "Publier maintenant"}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
