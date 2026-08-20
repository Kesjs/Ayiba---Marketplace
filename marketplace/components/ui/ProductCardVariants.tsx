import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingBag } from "lucide-react";
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
      {/* IMAGE — carrée, aucune bordure, aucune ombre */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden mb-2 group/image">
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

        {/* Bandeau Rupture de stock */}
        {enRupture && (
          <span className="absolute top-2 left-2 bg-white/95 text-gray-700 text-[10px] font-bold uppercase tracking-widest px-2 py-1">
            Rupture
          </span>
        )}

        {/* Indicateur multi-photos, en bas à gauche */}
        {photosCount != null && photosCount > 1 && (
          <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-1.5 py-0.5 flex items-center gap-1">
            <i className="ti ti-photo text-[11px]" />
            {photosCount}
          </span>
        )}

        <button
          type="button"
          onClick={handleFavorite}
          className="absolute top-1 right-1 w-10 h-10 flex items-center justify-center"
        >
          <span className="w-7 h-7 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
            <Heart
              size={13}
              className={favorite ? "fill-coral-500 text-coral-500" : "text-gray-500"}
            />
          </span>
        </button>
      </div>

      {/* TEXTE — aucune carte, directement sur fond blanc */}
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-[10px] font-bold text-coral-500 uppercase tracking-widest truncate">
          {category}
        </p>

        <p className="text-xs text-gray-600 font-medium truncate">
          {name}
        </p>

        {(sellerName || location) && (
          <p className="text-[10px] text-gray-400 truncate">
            {sellerName}
            {sellerName && location && " · "}
            {location}
          </p>
        )}

        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-bold text-gray-600">{rating}</span>
            </div>
            <span className="text-[10px] text-gray-300">•</span>
            <span className="text-[10px] text-gray-400">{reviewCount} avis</span>
          </div>
        )}

        {/* Ligne prix + icône panier à droite, sans fond ni bordure */}
        <div className="flex items-center justify-between mt-0.5 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <p className={`text-base font-black whitespace-nowrap ${discount ? 'text-coral-600' : 'text-gray-900'}`}>
              {price.toLocaleString("fr-FR")} <span className={`text-[11px] font-bold ${discount ? 'text-coral-500' : ''}`}>FCFA</span>
            </p>
            {discount && (
              <>
                <span className="text-[10px] font-bold text-coral-500 bg-coral-50 px-1.5 py-0.5 whitespace-nowrap">
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
            className={`shrink-0 p-3 -m-3 flex items-center justify-center ${
              enRupture ? "cursor-not-allowed" : ""
            }`}
            aria-label={enRupture ? "Produit en rupture de stock" : "Ajouter au panier"}
          >
            <ShoppingBag
              size={19}
              className={`transition-colors duration-300 ${
                enRupture
                  ? "text-gray-300"
                  : justAdded
                  ? "text-teal-600"
                  : "text-gray-900 hover:text-coral-500"
              }`}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
