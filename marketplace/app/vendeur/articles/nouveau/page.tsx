"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { ArrowLeft, Upload, X, CheckCircle2, Info, ChevronRight, AlertCircle, FileText, Camera, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StepIndicator, type WizardStep } from "@/components/kyc/StepIndicator";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { determinerStatutInitial } from "@/lib/articles/moderation";
import { getCategoriesFormulaire, type CategorieArbre } from "@/lib/queries/articles";
import { compressImage } from "@/lib/imageCompressor";

const WIZARD_STEPS: WizardStep[] = [
  { label: "Informations", icon: FileText },
  { label: "Photos", icon: Camera },
  { label: "Variantes", icon: Layers },
];
const MAX_PHOTOS = 5;
const MIN_DIMENSION = 250;
const TYPES_VARIANTE = [
  { value: "couleur", label: "Couleur" },
  { value: "taille", label: "Taille" },
  { value: "modele", label: "Modèle / gamme" },
  { value: "format", label: "Format" },
] as const;

// Pour le type de variante "Taille", le bon référentiel dépend du produit :
// une chaussure se choisit en pointure, un vêtement en S/M/L. Plutôt que de
// laisser un champ libre pour les deux, on propose la bonne liste déroulante
// selon la catégorie/sous-catégorie choisie par le vendeur, identifiée par
// son slug (stable, contrairement au libellé affiché).
const TAILLES_VETEMENTS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const POINTURES_CHAUSSURES = Array.from({ length: 46 - 36 + 1 }, (_, i) => String(36 + i));

const SLUGS_CHAUSSURES = new Set(["mode-chaussures"]);
const SLUGS_VETEMENTS = new Set([
  "mode-vetements-homme",
  "mode-vetements-femme",
  "mode-vetements-enfant",
  "bebe-vetements",
]);

/** Renvoie la liste de tailles prédéfinie pertinente pour ce slug de
 * catégorie, ou null si aucune ne s'applique (le champ reste alors libre). */
function optionsTaillePour(slug: string | null): string[] | null {
  if (!slug) return null;
  if (SLUGS_CHAUSSURES.has(slug)) return POINTURES_CHAUSSURES;
  if (SLUGS_VETEMENTS.has(slug)) return TAILLES_VETEMENTS;
  return null;
}

interface PhotoEntry {
  file: File;
  preview: string;
}

interface Categorie {
  id: string;
  nom: string;
}

interface VarianteEntry {
  key: string;
  type_variante: (typeof TYPES_VARIANTE)[number]["value"];
  nom_variante: string;
  prix: string; // vide = hérite du prix de l'article
  stock: string;
  stockIllimite: boolean;
  photo: PhotoEntry | null;
}

function nouvelleVariante(): VarianteEntry {
  return {
    key: Math.random().toString(36).slice(2),
    type_variante: "couleur",
    nom_variante: "",
    prix: "",
    stock: "",
    stockIllimite: true,
    photo: null,
  };
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
  return (
    <Suspense fallback={null}>
      <NouveauArticleForm />
    </Suspense>
  );
}

function NouveauArticleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dupliquerId = searchParams.get("dupliquer");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [publishedStatut, setPublishedStatut] = useState<"publie" | "en_attente" | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [draftRestored, setDraftRestored] = useState(false);

  const [categories, setCategories] = useState<CategorieArbre[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesFormulaire();
        setCategories(data ?? []);
      } catch (err: any) {
        setCategoriesError("Impossible de charger les catégories — recharge la page.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Sous-catégorie choisie séparément de la catégorie parente : formData ne
  // stocke que l'id final envoyé en base (sous-catégorie si elle existe,
  // sinon la catégorie elle-même).
  const [parentCategorieId, setParentCategorieId] = useState("");
  const categorieParente = categories.find((c) => c.id === parentCategorieId) || null;
  const aDesSousCategories = (categorieParente?.sousCategories.length ?? 0) > 0;

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix: "",
    categorieId: "",
    stock: "1",
  });
  const [stockIllimite, setStockIllimite] = useState(false);

  // Slug de la catégorie réellement retenue pour l'article (la sous-catégorie
  // si elle existe, sinon la catégorie parente) — sert à proposer le bon
  // référentiel de tailles (pointures vs S/M/L) à l'étape Variantes.
  const slugCategorieChoisie = aDesSousCategories
    ? categorieParente?.sousCategories.find((sc) => sc.id === formData.categorieId)?.slug ?? null
    : categorieParente?.slug ?? null;
  const optionsTailleActuelles = optionsTaillePour(slugCategorieChoisie);

  // --- Promotion ---
  const [enPromo, setEnPromo] = useState(false);
  const [modePromo, setModePromo] = useState<"nouveau_prix" | "pourcentage">("pourcentage");
  const [pourcentagePromo, setPourcentagePromo] = useState("");
  const [nouveauPrixPromo, setNouveauPrixPromo] = useState("");
  // Durée de la promo : une vraie date de fin (date_fin_promo en base),
  // qui alimente le vrai countdown "Ventes flash" de la home et qui est
  // aussi ce qui déclenche l'expiration automatique côté serveur (cron).
  const DUREES_PROMO = [
    { label: "24h", heures: 24 },
    { label: "3 jours", heures: 72 },
    { label: "7 jours", heures: 168 },
  ] as const;
  const [dureePromo, setDureePromo] = useState<number>(72);

  const prixNumerique = Number(formData.prix) || 0;

  // Prix promo final et pourcentage affiché, dérivés selon le mode choisi.
  // Toujours calculés côté plateforme pour éviter toute incohérence saisie
  // par le vendeur (ex: un % qui ne correspond pas au prix indiqué).
  const promoCalcul = (() => {
    if (!enPromo || prixNumerique <= 0) return null;
    if (modePromo === "pourcentage") {
      const pct = Number(pourcentagePromo);
      if (!pourcentagePromo || isNaN(pct) || pct <= 0 || pct >= 100) return null;
      const nouveauPrix = Math.round(prixNumerique * (1 - pct / 100));
      return { nouveauPrix, pourcentage: -Math.round(pct) };
    }
    const nouveauPrix = Number(nouveauPrixPromo);
    if (!nouveauPrixPromo || isNaN(nouveauPrix) || nouveauPrix <= 0 || nouveauPrix >= prixNumerique) return null;
    const pourcentage = -Math.round(((prixNumerique - nouveauPrix) / prixNumerique) * 100);
    return { nouveauPrix, pourcentage };
  })();

  // Filet de sécurité contre les pertes de saisie : si la page se recharge
  // pour une raison ou une autre (erreur JS, session expirée, connexion
  // coupée...), le brouillon texte est restauré automatiquement. Les photos
  // ne sont volontairement pas persistées ici (des File ne se sérialisent
  // pas) — c'est la seule chose à resélectionner après un rechargement,
  // plutôt que tout le formulaire.
  const DRAFT_KEY = "ayiba-nouveau-article-draft";

  useEffect(() => {
    if (dupliquerId) return; // la duplication prime sur un brouillon local existant
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.formData) {
          setFormData(parsed.formData);
          if (parsed.formData.nom || parsed.formData.description) setDraftRestored(true);
        }
        if (typeof parsed?.stockIllimite === "boolean") setStockIllimite(parsed.stockIllimite);
        if (parsed?.step) setStep(parsed.step);
      }
    } catch {
      // Brouillon corrompu ou sessionStorage indisponible : on ignore et on
      // repart d'un formulaire vide plutôt que de bloquer la page.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dupliquerId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, step, stockIllimite }));
    } catch {
      // best-effort — un échec ici ne doit jamais bloquer la saisie
    }
  }, [formData, step, stockIllimite]);

  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [variantes, setVariantes] = useState<VarianteEntry[]>([]);
  const [varianteErrors, setVarianteErrors] = useState<Record<string, string>>({});

  // Verrou dur contre le double-clic, en plus de `loading`
  const isSubmittingRef = useRef(false);

  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicatedFromNom, setDuplicatedFromNom] = useState<string | null>(null);

  // Duplication d'un article existant : on préremplit le formulaire (texte
  // + photos déjà en ligne, reconverties en fichiers) à partir d'un article
  // que le vendeur possède déjà, pour lui éviter de tout ressaisir.
  useEffect(() => {
    if (!dupliquerId) return;
    let cancelled = false;

    const chargerSource = async () => {
      setDuplicating(true);
      setDuplicateError(null);
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Ta session a expiré — reconnecte-toi puis réessaie.");

        const { data: source, error: sourceError } = await supabase
          .from("articles")
          .select("nom, description, prix, stock, categorie_id, vendeur_id")
          .eq("id", dupliquerId)
          .maybeSingle();

        if (sourceError || !source) throw new Error("Article introuvable.");
        if (source.vendeur_id !== user.id) throw new Error("Tu ne peux dupliquer que tes propres articles.");

        if (cancelled) return;

        setFormData({
          nom: source.nom ? `${source.nom} (copie)` : "",
          description: source.description ?? "",
          prix: source.prix != null ? String(source.prix) : "",
          categorieId: source.categorie_id ?? "",
          stock: source.stock != null ? String(source.stock) : "1",
        });
        setStockIllimite(source.stock == null);
        setDuplicatedFromNom(source.nom ?? null);

        const { data: images } = await supabase
          .from("article_images")
          .select("image_url, ordre")
          .eq("article_id", dupliquerId)
          .order("ordre", { ascending: true });

        if (images && images.length > 0 && !cancelled) {
          const chargees: PhotoEntry[] = [];
          for (const img of images.slice(0, MAX_PHOTOS)) {
            try {
              const res = await fetch(img.image_url);
              const blob = await res.blob();
              const nomFichier = img.image_url.split("/").pop() || "photo.jpg";
              const file = new File([blob], nomFichier, { type: blob.type || "image/jpeg" });
              chargees.push({ file, preview: URL.createObjectURL(blob) });
            } catch {
              // Une photo qui ne se recharge pas ne doit pas bloquer toute la
              // duplication — le vendeur pourra la rajouter manuellement.
            }
          }
          if (!cancelled) setPhotos(chargees);
        }
      } catch (err: any) {
        if (!cancelled) setDuplicateError(err.message || "Impossible de dupliquer cet article.");
      } finally {
        if (!cancelled) setDuplicating(false);
      }
    };

    chargerSource();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dupliquerId]);

  // Une fois l'arbre de catégories chargé, si formData.categorieId est déjà
  // rempli (brouillon restauré ou duplication) mais que parentCategorieId ne
  // l'est pas encore, on retrouve le parent correspondant pour que le
  // sélecteur "Catégorie" affiche la bonne valeur.
  useEffect(() => {
    if (!formData.categorieId || parentCategorieId || categories.length === 0) return;
    const parentDirect = categories.find((c) => c.id === formData.categorieId);
    if (parentDirect) {
      setParentCategorieId(parentDirect.id);
      return;
    }
    const parentAvecSousCategorie = categories.find((c) =>
      c.sousCategories.some((sc) => sc.id === formData.categorieId)
    );
    if (parentAvecSousCategorie) setParentCategorieId(parentAvecSousCategorie.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, formData.categorieId]);

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

    if (!stockIllimite) {
      const stockNum = Number(formData.stock);
      if (isNaN(stockNum) || stockNum < 0) errors.stock = "Le stock doit être un nombre positif.";
    }
    if (!parentCategorieId) errors.categorieId = "Choisis une catégorie.";
    else if (aDesSousCategories && !formData.categorieId) errors.categorieId = "Choisis une sous-catégorie.";
    if (formData.description.trim().length < 10) {
      errors.description = "Décris ton article en au moins 10 caractères pour rassurer les acheteurs.";
    }

    if (enPromo && !promoCalcul) {
      errors.promo =
        modePromo === "pourcentage"
          ? "Indique un pourcentage de réduction valide (entre 1 et 99)."
          : "Le nouveau prix doit être positif et inférieur au prix normal.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleNextFromPhotos = () => {
    if (photos.length === 0) {
      setPhotoError("Ajoute au moins une photo avant de continuer.");
      return;
    }
    setStep(3);
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

    for (let file of candidats) {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Seules les images sont acceptées (JPG, PNG, WebP).");
        continue;
      }

      // Compression automatique côté client : redimensionne et convertit en WebP (~150 Ko)
      file = await compressImage(file);

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

  const addVariante = () => {
    if (variantes.length >= 20) return;
    setVariantes((prev) => [...prev, nouvelleVariante()]);
  };

  const removeVariante = (key: string) => {
    setVariantes((prev) => {
      const target = prev.find((v) => v.key === key);
      if (target?.photo) URL.revokeObjectURL(target.photo.preview);
      return prev.filter((v) => v.key !== key);
    });
    setVarianteErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateVariante = (key: string, patch: Partial<VarianteEntry>) => {
    setVariantes((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
    setVarianteErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleVariantePhoto = async (key: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setVarianteErrors((prev) => ({ ...prev, [key]: "Seules les images sont acceptées (JPG, PNG)." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setVarianteErrors((prev) => ({ ...prev, [key]: "Cette photo dépasse 5 Mo." }));
      return;
    }
    const { ok, width, height } = await checkImageDimensions(file);
    if (!ok) {
      setVarianteErrors((prev) => ({
        ...prev,
        [key]: `Photo trop petite (${width}×${height}px) — au moins ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
      }));
      return;
    }
    const current = variantes.find((v) => v.key === key);
    if (current?.photo) URL.revokeObjectURL(current.photo.preview);
    updateVariante(key, { photo: { file, preview: URL.createObjectURL(file) } });
  };

  const validateVariantes = () => {
    const errors: Record<string, string> = {};
    for (const v of variantes) {
      if (v.nom_variante.trim().length < 1) {
        errors[v.key] = "Donne un nom à cette variante (ex: Noir, XL, 13 Pro Max).";
        continue;
      }
      if (v.prix.trim() !== "") {
        const prixNum = Number(v.prix);
        if (isNaN(prixNum) || prixNum <= 0) {
          errors[v.key] = "Le prix de la variante doit être un nombre positif, ou laissé vide pour hériter du prix de l'article.";
          continue;
        }
      }
      if (!v.stockIllimite && v.stock.trim() !== "") {
        const stockNum = Number(v.stock);
        if (isNaN(stockNum) || stockNum < 0) {
          errors[v.key] = "Le stock de la variante doit être un nombre positif.";
        }
      }
    }
    setVarianteErrors(errors);
    return Object.keys(errors).length === 0;
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

    if (!validateVariantes()) {
      setStep(3);
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
          prix_promo: promoCalcul ? promoCalcul.nouveauPrix : null,
          date_fin_promo: promoCalcul
            ? new Date(Date.now() + dureePromo * 60 * 60 * 1000).toISOString()
            : null,
          stock: stockIllimite ? null : Number(formData.stock),
          statut,
          raison_rejet: raison ?? null,
          actif: statut === "publie",
        })
        .select("id")
        .single();

      if (insertError || !articleCree) {
        if (insertError?.code === "23503" && insertError.message?.includes("articles_vendeur_id_fkey")) {
          throw new Error(
            "Ton dossier vendeur n'est pas encore validé — termine ou vérifie ton KYC avant de pouvoir publier un article."
          );
        }
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

      // 4. Variantes (optionnel) : upload de la photo de chaque variante puis
      // insertion des lignes article_variantes rattachées à l'article créé.
      if (variantes.length > 0) {
        const variantesPayload = [];
        for (let i = 0; i < variantes.length; i++) {
          const v = variantes[i];
          let photo_url: string | null = null;

          if (v.photo) {
            const ext = v.photo.file.name.split(".").pop() || "jpg";
            const path = `${user.id}/variantes/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from("articles-photos")
              .upload(path, v.photo.file, { upsert: true });
            if (uploadErr) {
              throw new Error(`Article créé mais échec de l'envoi de la photo de variante "${v.nom_variante}" : ${uploadErr.message}`);
            }
            uploadedPaths.push(path);
            const { data: urlData } = supabase.storage.from("articles-photos").getPublicUrl(path);
            photo_url = urlData.publicUrl;
          }

          variantesPayload.push({
            article_id: articleCree.id,
            type_variante: v.type_variante,
            nom_variante: v.nom_variante.trim(),
            prix: v.prix.trim() === "" ? null : Number(v.prix),
            stock: v.stockIllimite || v.stock.trim() === "" ? null : Number(v.stock),
            photo_url,
            ordre: i,
          });
        }

        const { error: variantesInsertError } = await supabase.from("article_variantes").insert(variantesPayload);
        if (variantesInsertError) {
          throw new Error(`Article créé mais échec de l'enregistrement des variantes : ${variantesInsertError.message}`);
        }
      }

      setPublishedStatut(statut);
      setSuccess(true);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // best-effort
      }
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
          {!success && <StepIndicator currentStep={step} steps={WIZARD_STEPS} />}
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
          {duplicating && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-medium text-gray-600">
              <Info size={14} className="shrink-0" />
              Duplication de l'article en cours...
            </div>
          )}
          {duplicateError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-xs font-medium text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              {duplicateError}
            </div>
          )}
          {duplicatedFromNom && !duplicating && !duplicateError && (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 text-xs font-medium text-teal-700">
              <Info size={14} className="shrink-0" />
              Dupliqué depuis « {duplicatedFromNom} » — vérifie les infos avant de publier.
            </div>
          )}
          {draftRestored && (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 text-xs font-medium text-teal-700">
              <Info size={14} className="shrink-0" />
              Ton brouillon a été récupéré automatiquement.
            </div>
          )}
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
                      disabled={stockIllimite}
                      className={`w-full h-11 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-shadow ${
                        stockIllimite ? "bg-gray-50 text-gray-400" : ""
                      } ${
                        fieldErrors.stock ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-coral-400 focus:ring-coral-100"
                      }`}
                    />
                    <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 font-medium">
                      <input
                        type="checkbox"
                        checked={stockIllimite}
                        onChange={(e) => setStockIllimite(e.target.checked)}
                        className="rounded border-gray-300 text-coral-500 focus:ring-coral-400"
                      />
                      Stock illimité (je ne compte pas)
                    </label>
                    {fieldErrors.stock && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.stock}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                    <Select
                      value={parentCategorieId}
                      onChange={(id) => {
                        setParentCategorieId(id || "");
                        const parent = categories.find((c) => c.id === (id || ""));
                        setFormData((prev) => ({
                          ...prev,
                          categorieId: parent && parent.sousCategories.length === 0 ? (id || "") : "",
                        }));
                        setFieldErrors((prev) => ({ ...prev, categorieId: "" }));
                      }}
                      disabled={loadingCategories}
                      error={!!fieldErrors.categorieId}
                      options={[
                        { value: "", label: loadingCategories ? "Chargement..." : "Sélectionner..." },
                        ...categories.map((c) => ({ value: c.id, label: c.nom })),
                      ]}
                    />
                    {categoriesError && <p className="text-xs text-red-500 mt-1.5">{categoriesError}</p>}
                  </div>

                  {aDesSousCategories && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie</label>
                      <Select
                        value={formData.categorieId}
                        onChange={(id) => {
                          setFormData((prev) => ({ ...prev, categorieId: id || "" }));
                        }}
                        error={!!fieldErrors.categorieId}
                        options={[
                          { value: "", label: "Sélectionner..." },
                          ...(categorieParente?.sousCategories.map((sc) => ({ value: sc.id, label: sc.nom })) || []),
                        ]}
                      />
                    </div>
                  )}
                  {fieldErrors.categorieId && <p className="text-xs text-red-500 -mt-2">{fieldErrors.categorieId}</p>}
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

                <div className="rounded-2xl border border-gray-100 p-4 md:p-5 bg-gray-50/60">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enPromo}
                      onChange={(e) => setEnPromo(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-coral-500 focus:ring-coral-200"
                    />
                    <span className="text-sm font-semibold text-gray-800">Mettre cet article en promotion</span>
                  </label>

                  {enPromo && (
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setModePromo("pourcentage")}
                          className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                            modePromo === "pourcentage" ? "bg-coral-500 text-white" : "bg-white border border-gray-200 text-gray-600"
                          }`}
                        >
                          Je donne le %
                        </button>
                        <button
                          type="button"
                          onClick={() => setModePromo("nouveau_prix")}
                          className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                            modePromo === "nouveau_prix" ? "bg-coral-500 text-white" : "bg-white border border-gray-200 text-gray-600"
                          }`}
                        >
                          Je donne le nouveau prix
                        </button>
                      </div>

                      {modePromo === "pourcentage" ? (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Pourcentage de réduction (%)</label>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            placeholder="15"
                            value={pourcentagePromo}
                            onChange={(e) => setPourcentagePromo(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Nouveau prix (FCFA)</label>
                          <input
                            type="number"
                            min={1}
                            placeholder="4250"
                            value={nouveauPrixPromo}
                            onChange={(e) => setNouveauPrixPromo(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                          />
                        </div>
                      )}

                      {fieldErrors.promo && (
                        <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.promo}</p>
                      )}

                      {promoCalcul && (
                        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                          <span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-red-500 text-white text-[11px] font-bold gap-1">
                            ★ {promoCalcul.pourcentage}%
                          </span>
                          <span className="text-sm text-gray-400 line-through">{prixNumerique.toLocaleString("fr-FR")} FCFA</span>
                          <span className="text-sm font-bold text-gray-900">{promoCalcul.nouveauPrix.toLocaleString("fr-FR")} FCFA</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Durée de la promo
                        </label>
                        <div className="flex gap-2">
                          {DUREES_PROMO.map((d) => (
                            <button
                              key={d.heures}
                              type="button"
                              onClick={() => setDureePromo(d.heures)}
                              className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                                dureePromo === d.heures ? "bg-coral-500 text-white" : "bg-white border border-gray-200 text-gray-600"
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          Le prix redevient normal automatiquement à la fin de cette période.
                        </p>
                      </div>
                    </div>
                  )}
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

            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Variantes (optionnel)</h2>
                  <p className="text-sm text-gray-500">
                    Couleur, taille, ou modèle avec un prix différent — laisse vide si ton article
                    n'a qu'une seule version. Une variante sans prix hérite du prix de l'article.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {variantes.map((v) => (
                    <div key={v.key} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="grid grid-cols-2 gap-3 flex-1">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                            <select
                              value={v.type_variante}
                              onChange={(e) => updateVariante(v.key, { type_variante: e.target.value as VarianteEntry["type_variante"] })}
                              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                            >
                              {TYPES_VARIANTE.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom</label>
                            {v.type_variante === "taille" && optionsTailleActuelles ? (
                              <select
                                value={v.nom_variante}
                                onChange={(e) => updateVariante(v.key, { nom_variante: e.target.value })}
                                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                              >
                                <option value="">Choisir...</option>
                                {optionsTailleActuelles.map((taille) => (
                                  <option key={taille} value={taille}>{taille}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Ex: Noir, XL, 13 Pro Max"
                                value={v.nom_variante}
                                onChange={(e) => updateVariante(v.key, { nom_variante: e.target.value })}
                                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                              />
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariante(v.key)}
                          className="mt-6 shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          aria-label="Retirer cette variante"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Prix (FCFA)</label>
                          <input
                            type="number"
                            placeholder={`Même prix (${formData.prix || "—"})`}
                            value={v.prix}
                            onChange={(e) => updateVariante(v.key, { prix: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock</label>
                          <input
                            type="number"
                            min={0}
                            placeholder="Illimité"
                            value={v.stock}
                            onChange={(e) => updateVariante(v.key, { stock: e.target.value })}
                            disabled={v.stockIllimite}
                            className={`w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-shadow ${
                              v.stockIllimite ? "bg-gray-100 text-gray-400" : "border-gray-200 focus:border-coral-400 focus:ring-coral-100"
                            }`}
                          />
                          <label className="flex items-center gap-1.5 mt-1.5 text-[11px] text-gray-500 font-medium">
                            <input
                              type="checkbox"
                              checked={v.stockIllimite}
                              onChange={(e) => updateVariante(v.key, { stockIllimite: e.target.checked })}
                              className="rounded border-gray-300 text-coral-500 focus:ring-coral-400"
                            />
                            Stock illimité
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {v.photo ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                            <img src={v.photo.preview} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => updateVariante(v.key, { photo: null })}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                              aria-label="Retirer la photo de la variante"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-white flex items-center justify-center text-gray-400 cursor-pointer hover:border-coral-300 hover:text-coral-400 transition-colors shrink-0">
                            <Upload size={16} />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleVariantePhoto(v.key, e.target.files?.[0] ?? null)}
                            />
                          </label>
                        )}
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Photo de la variante (optionnel) — affichée en priorité quand cette
                          variante est sélectionnée par l'acheteur.
                        </p>
                      </div>

                      {varianteErrors[v.key] && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} /> {varianteErrors[v.key]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addVariante}
                  disabled={variantes.length >= 20}
                  className="flex items-center justify-center gap-1.5 h-11 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-coral-300 hover:text-coral-500 transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                  Ajouter une variante
                </button>

                {submitError && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-relaxed">{submitError}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
              {step === 1 && (
                <>
                  <Link href="/vendeur/articles" className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.removeItem(DRAFT_KEY);
                        } catch {
                          // best-effort
                        }
                      }}
                      className="h-12 px-4 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
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
              )}
              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 px-4 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromPhotos}
                    className="flex-1 flex items-center justify-center gap-1 h-12 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold transition-colors"
                  >
                    Continuer
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
              {step === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
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
