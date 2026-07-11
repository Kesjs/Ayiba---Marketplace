import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  image: string;
  category: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  oldPrice?: number;
  isFavorite?: boolean;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
  onClick?: () => void;
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
  onAddToCart,
  onToggleFavorite,
  onClick,
}: ProductCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [justAdded, setJustAdded] = useState(false);

  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite((f) => !f);
    onToggleFavorite();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2 group/image">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover/image:scale-105"
        />

        <button
          type="button"
          onClick={handleFavorite}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart
            size={13}
            className={favorite ? "fill-coral-500 text-coral-500" : "text-gray-500"}
          />
        </button>
      </div>

      {/* TEXTE — aucune carte, directement sur fond blanc */}
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-xs text-gray-600 font-medium truncate">
          {name}
        </p>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-gray-600">{rating}</span>
          </div>
          <span className="text-[10px] text-gray-300">•</span>
          <span className="text-[10px] text-gray-400">{reviewCount} avis</span>
        </div>

        {/* Ligne prix + icône panier à droite, sans fond ni bordure */}
        <div className="flex items-center justify-between mt-0.5 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <p className="text-base font-black text-gray-900 whitespace-nowrap">
              {price.toLocaleString("fr-FR")} <span className="text-[11px] font-bold">FCFA</span>
            </p>
            {discount && (
              <>
                <span className="text-[10px] font-bold text-coral-500 bg-coral-50 px-1.5 py-0.5 rounded whitespace-nowrap">
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
            className="shrink-0 p-1 -m-1"
            aria-label="Ajouter au panier"
          >
            <ShoppingBag
              size={19}
              className={`transition-colors duration-300 ${
                justAdded ? "text-teal-600" : "text-gray-900 hover:text-coral-500"
              }`}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
