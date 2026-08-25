import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Star, Images } from "lucide-react";
import { CartPlusIcon } from "@/components/ui/CartPlusIcon";
import { useState, useEffect } from "react";

interface ProductCardProps {
  image: string;
  category: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  oldPrice?: number;
  isFavorite?: boolean;
  /** Nom de la boutique vendeuse. Affiché sous le nom si fourni. */
  sellerName?: string;
  /** Quartier ou commune du vendeur, pour un repère de proximité. */
  location?: string;
  /** Stock restant. Si 0, la carte passe en état "Rupture" et désactive l'ajout au panier. */
  stock?: number;
  /** Date de création (ISO) de l'article, pour le badge "Nouveau" (< 7 jours). */
  createdAt?: string;
  /** Nombre de photos disponibles pour ce produit, pour l'indicateur multi-photos. */
  photosCount?: number;
  priority?: boolean;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
  onClick?: () => void;
}

const NOUVEAU_SEUIL_JOURS = 7;

function estNouveau(createdAt?: string): boolean {
  if (!createdAt) return false;
  const jours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return jours >= 0 && jours <= NOUVEAU_SEUIL_JOURS;
}

export function ProductCardModern({
  image,
  category,
  name,
  rating,
  reviewCount,
  price,
  oldPrice,
  isFavorite = false,
  sellerName,
  location,
  stock,
  createdAt,
  photosCount,
  priority = false,
  onAddToCart,
  onToggleFavorite,
  onClick,
}: ProductCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [justAdded, setJustAdded] = useState(false);
  const DEFAULT_IMAGE = "/images/hero-illustration.png";
  const [imgSrc, setImgSrc] = useState(image || DEFAULT_IMAGE);

  useEffect(() => {
    setImgSrc(image || DEFAULT_IMAGE);
  }, [image]);

  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
  const enRupture = stock === 0;
  const nouveau = !enRupture && estNouveau(createdAt);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite((f) => !f);
    onToggleFavorite();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (enRupture) return;
    onAddToCart();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="flex flex-col w-full text-left cursor-pointer"
    >
      {/* IMAGE — carrée avec masque photo-neutralizer et coins arrondis éditoriaux */}
      <div className="relative aspect-square bg-[#F1EFE8] rounded-2xl overflow-hidden mb-2.5 group/image photo-neutralizer shadow-xs">
        <Image
          src={imgSrc}
          alt={name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-500 group-hover/image:scale-105 ${
            enRupture ? "grayscale-[50%] opacity-70" : ""
          }`}
          onError={() => {
            if (imgSrc !== DEFAULT_IMAGE) {
              setImgSrc(DEFAULT_IMAGE);
            }
          }}
        />

        {/* Badge Nouveau si récent */}
        {nouveau && (
          <span className="absolute top-2.5 left-2.5 bg-coral-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md shadow-xs">
            Nouveau
          </span>
        )}

        {/* Bandeau Rupture de stock */}
        {enRupture && (
          <span className="absolute top-2.5 left-2.5 bg-gray-900/90 text-white text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md">
            Rupture
          </span>
        )}

        {/* Indicateur multi-photos */}
        {photosCount != null && photosCount > 1 && (
          <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
            <Images size={12} className="text-gray-500" />
            {photosCount}
          </span>
        )}

        <button
          type="button"
          onClick={handleFavorite}
          className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:scale-110 active:scale-95 transition-all shadow-2xs"
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart
            size={14}
            className={favorite ? "fill-coral-500 text-coral-500" : "text-gray-600 hover:text-coral-500"}
          />
        </button>
      </div>

      {/* TEXTE — typographie éditoriale épurée sur fond blanc */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] font-extrabold text-coral-600 uppercase tracking-widest truncate">
          {category}
        </p>

        <p className="text-xs text-gray-900 font-semibold truncate leading-tight group-hover:text-coral-600 transition-colors">
          {name}
        </p>

        {(sellerName || location) && (
          <p className="text-[11px] text-gray-500 truncate">
            {sellerName}
            {sellerName && location && " · "}
            {location}
          </p>
        )}

        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-extrabold text-gray-800">{rating}</span>
            </div>
            <span className="text-[10px] text-gray-300">•</span>
            <span className="text-[11px] text-gray-500">{reviewCount} avis</span>
          </div>
        )}

        {/* Ligne prix + bouton panier */}
        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <p className={`text-base font-extrabold whitespace-nowrap tracking-tight ${discount ? 'text-coral-600' : 'text-gray-900'}`}>
              {price.toLocaleString("fr-FR")} <span className="text-[11px] font-bold">FCFA</span>
            </p>
            {discount && (
              <>
                <span className="text-[10px] font-extrabold text-coral-600 bg-coral-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  -{discount}%
                </span>
                <span className="text-[11px] text-gray-400 line-through font-medium whitespace-nowrap">
                  {oldPrice!.toLocaleString("fr-FR")}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={enRupture}
            aria-disabled={enRupture}
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              enRupture
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : justAdded
                ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                : "bg-gray-100 hover:bg-coral-500 text-gray-800 hover:text-white"
            }`}
            aria-label={enRupture ? "Produit en rupture de stock" : "Ajouter au panier"}
          >
            <CartPlusIcon
              size={15}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
