"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, X, CheckCircle2, Info, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/kyc/StepIndicator";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { determinerStatutInitial } from "@/lib/articles/moderation";

const STEP_LABELS = ["Informations", "Photos"];
const MAX_PHOTOS = 5;
const MIN_DIMENSION = 600;

interface PhotoEntry {
  file: File;
  preview: string;
}

interface Categorie {
  id: string;
  nom: string;
}

function checkImageDimensions(file: File): Promise<{ ok: boolean; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: img.width >= MIN_DIMENSION && img.height >= MIN_DIMENSION, width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, width: 0, height: 0 });
    };
    img.src = url;
  });
}

export default function NouveauArticlePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [publishedStatut, setPublishedStatut] = useState<"publie" | "en_attente" | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, nom")
          .eq("active", true)
          .order("ordre", { ascending: true });
        if (error) throw error;
        setCategories(data ?? []);
      } catch (err: any) {
        setCategoriesError("Impossible de charger les catégories — recharge la page.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix: "",
    categorieId: "",
    stock: "1",
  });

  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Verrou dur contre le double-clic, en plus de `loading`
  const isSubmittingRef = useRef(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (formData.nom.trim().length < 3) errors.nom = "Le nom doit faire au moins 3 caractères.";

    const prixNum = Number(formData.prix);
    if (!formData.prix || isNaN(prixNum) || prixNum <= 0) {
      errors.prix = "Indique un prix valide, supérieur à 0.";
    } else if (prixNum > 5_000_000) {
      errors.prix = "Ce prix semble très élevé — vérifie qu'il est correct.";
    }

    const stockNum = Number(formData.stock);
    if (isNaN(stockNum) || stockNum < 0) errors.stock = "Le stock doit être un nombre positif.";
    if (!formData.categorieId) errors.categorieId = "Choisis une catégorie.";
    if (formData.description.trim().length < 10) {
      errors.description = "Décris ton article en au moins 10 caractères pour rassurer les acheteurs.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoError(null);
    if (files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (files.length > remaining) {
      setPhotoError(`Tu peux ajouter ${remaining} photo${remaining > 1 ? "s" : ""} de plus maximum.`);
    }

    setUploadingPhoto(true);
    const candidats = files.slice(0, remaining);

    for (const file of candidats) {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Seules les images sont acceptées (JPG, PNG).");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError(`"${file.name}" dépasse 5 Mo — compresse-la ou choisis-en une autre.`);
        continue;
      }
      const { ok, width, height } = await checkImageDimensions(file);
      if (!ok) {
        setPhotoError(
          `"${file.name}" est trop petite (${width}×${height}px) — utilise une photo d'au moins ${MIN_DIMENSION}×${MIN_DIMENSION}px.`
        );
        continue;
      }
      const preview = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { file, preview }]);
    }

    setUploadingPhoto(false);
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
    setSubmitError(null);

    // Verrou dur : ignore tout clic supplémentaire pendant qu'une soumission est en cours
    if (isSubmittingRef.current) return;

    if (photos.length === 0) {
      setSubmitError("Ajoute au moins une photo avant de publier.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    const supabase = createClient();

    // Piste des fichiers déjà uploadés au Storage, pour pouvoir les nettoyer
    // si une étape suivante échoue (évite les fichiers orphelins).
    const uploadedPaths: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError("Ta session a expiré — reconnecte-toi puis réessaie.");
        return;
      }

      const { data: vendeur } = await supabase
        .from("vendeurs")
        .select("statut")
        .eq("id", user.id)
        .maybeSingle();

      const dixMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count: articlesRecents } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("vendeur_id", user.id)
        .gte("created_at", dixMinutesAgo);

      const { statut, raison } = determinerStatutInitial({
        nom: formData.nom,
        description: formData.description,
        prix: Number(formData.prix),
        vendeurStatut: vendeur?.statut ?? null,
        articlesRecents: articlesRecents ?? 0,
      });

      // 1. Upload de TOUTES les photos d'abord — l'article n'est créé qu'une fois
      // qu'on est sûr que chaque photo est bien passée, pour éviter un article
      // "fantôme" sans image si un upload échoue en cours de route.
      const photoUrls: { url: string; ordre: number }[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const ext = photo.file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("articles-photos")
          .upload(path, photo.file, { upsert: true });

        if (uploadErr) {
          throw new Error(`Échec de l'envoi de la photo ${i + 1} : ${uploadErr.message}`);
        }

        uploadedPaths.push(path);
        const { data: urlData } = supabase.storage.from("articles-photos").getPublicUrl(path);
        photoUrls.push({ url: urlData.publicUrl, ordre: i });
      }

      // 2. Créer l'article seulement maintenant que toutes les photos sont sécurisées.
      // `actif` est aligné sur le statut réel : un article en attente ou refusé
      // ne doit jamais être visible publiquement, même via une autre policy.
      const { data: articleCree, error: insertError } = await supabase
        .from("articles")
        .insert({
          vendeur_id: user.id,
          categorie_id: formData.categorieId,
          nom: formData.nom.trim(),
          description: formData.description.trim(),
          prix: Number(formData.prix),
          stock: Number(formData.stock),
          statut,
          raison_rejet: raison ?? null,
          actif: statut === "publie",
        })
        .select("id")
        .single();

      if (insertError || !articleCree) {
        throw new Error(insertError?.message || "Échec de la création de l'article.");
      }

      // 3. Rattacher les photos déjà uploadées à l'article créé
      const { error: imagesInsertError } = await supabase.from("article_images").insert(
        photoUrls.map((p) => ({
          article_id: articleCree.id,
          image_url: p.url,
          ordre: p.ordre,
        }))
      );

      if (imagesInsertError) {
        throw new Error(`Article créé mais échec de l'enregistrement des photos : ${imagesInsertError.message}`);
      }

      setPublishedStatut(statut);
      setSuccess(true);
    } catch (err: any) {
      // Nettoyage : si on a uploadé des fichiers mais que la suite a échoué,
      // on les retire du Storage pour ne pas laisser de fichiers orphelins.
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("articles-photos").remove(uploadedPaths).catch(() => {
          // Le nettoyage est une best-effort ; si ça échoue aussi, on ne bloque pas
          // l'affichage de l'erreur principale à l'utilisateur.
        });
      }
      setSubmitError(err.message || "Une erreur inattendue est survenue. Vérifie ta connexion et réessaie.");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-0">
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
          {!success && <StepIndicator currentStep={step} totalSteps={2} stepLabels={STEP_LABELS} />}
        </div>
      </div>

      {success ? (
        <div className="bg-white p-8 md:p-12 rounded-[32px] border border-teal-100 shadow-xl shadow-teal-500/5 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-500">
            <CheckCircle2 size={40} />
          </div>
          {publishedStatut === "publie" ? (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Article publié !</h3>
              <p className="text-gray-500 font-medium mb-8">
                Ton article est en ligne et visible par les acheteurs du quartier.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Article envoyé pour vérification</h3>
              <p className="text-gray-500 font-medium mb-8">
                On vérifie rapidement ton article avant sa mise en ligne — tu recevras une
                notification dès qu'il sera publié.
              </p>
            </>
          )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'article</label>
                  <input
                    type="text"
                    name="nom"
                    placeholder="Ex: Tissu Wax 6 yards"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className={`w-full h-11 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-shadow ${
                      fieldErrors.nom ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-coral-400 focus:ring-coral-100"
                    }`}
                  />
                  {fieldErrors.nom && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.nom}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prix (FCFA)</label>
                    <input
                      type="number"
                      name="prix"
                      placeholder="5000"
                      value={formData.prix}
                      onChange={handleInputChange}
                      className={`w-full h-11 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-shadow ${
                        fieldErrors.prix ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-coral-400 focus:ring-coral-100"
                      }`}
                    />
                    {fieldErrors.prix && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.prix}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock disponible</label>
                    <input
                      type="number"
                      name="stock"
                      min={0}
                      placeholder="1"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className={`w-full h-11 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-shadow ${
                        fieldErrors.stock ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-coral-400 focus:ring-coral-100"
                      }`}
                    />
                    {fieldErrors.stock && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.stock}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                    <select
                      name="categorieId"
                      value={formData.categorieId}
                      onChange={handleInputChange}
                      disabled={loadingCategories}
                      className={`w-full h-11 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-shadow ${
                        fieldErrors.categorieId ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-coral-400 focus:ring-coral-100"
                      }`}
                    >
                      <option value="">
                        {loadingCategories ? "Chargement..." : "Sélectionner..."}
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                    {fieldErrors.categorieId && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.categorieId}</p>}
                    {categoriesError && <p className="text-xs text-red-500 mt-1.5">{categoriesError}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Décrivez votre article en quelques mots (matière, état, taille...)"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none transition-shadow ${
                      fieldErrors.description ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-coral-400 focus:ring-coral-100"
                    }`}
                  />
                  {fieldErrors.description && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.description}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Ajoute des photos</h2>
                  <p className="text-sm text-gray-500">
                    Jusqu'à {MAX_PHOTOS} photos nettes, au moins {MIN_DIMENSION}×{MIN_DIMENSION}px —
                    la première sera celle affichée sur ta boutique.
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
                    <div key={photo.preview} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
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
                      disabled={uploadingPhoto}
                      className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 hover:border-coral-300 transition-colors disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-medium text-gray-500">
                        {uploadingPhoto ? "Vérification..." : "Ajouter"}
                      </span>
                    </button>
                  )}
                </div>

                {photoError && (
                  <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                    <AlertCircle size={12} /> {photoError}
                  </p>
                )}

                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Vérifie bien ton prix et ton stock — une fois publié, l'article est
                    immédiatement visible et disponible à la vente. Si ton compte n'est pas
                    encore vérifié, l'article sera d'abord contrôlé avant mise en ligne.
                  </p>
                </div>

                {submitError && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-relaxed">{submitError}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
              {step === 1 ? (
                <>
                  <Link href="/vendeur/articles" className="shrink-0">
                    <button type="button" className="h-12 px-4 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                      Annuler
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-1 h-12 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold transition-colors"
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
