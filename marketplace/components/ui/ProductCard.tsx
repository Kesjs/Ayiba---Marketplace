import Image from "next/image";
import { motion } from "framer-motion";

interface ProductCardProps {
  image: string;
  category: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  oldPrice?: number;
  variants?: string[];
  onAddToCart: () => void;
  onToggleFavorite: () => void;
  onClick?: () => void;
}

export function ProductCard({
  image,
  category,
  name,
  rating,
  reviewCount,
  price,
  oldPrice,
  variants,
  onAddToCart,
  onToggleFavorite,
  onClick,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="flex flex-col bg-white border border-gray-100 rounded-[32px] overflow-hidden w-full text-left hover:border-coral-200 hover:shadow-2xl hover:shadow-coral-500/5 transition-all duration-300 cursor-pointer group/card"
    >
      {/* BLOC IMAGE */}
      <div className="relative h-[240px] bg-gray-50 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover/card:scale-110"
        />
        
        {/* Badge promo */}
        {oldPrice && (
          <div className="absolute top-2 left-2 bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-900">
            -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
          </div>
        )}
        
        {/* Bouton favori */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <i className="ti ti-heart text-sm text-gray-600 hover:text-red-500" />
        </button>
        
        {/* Dots de pagination */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>

      {/* BLOC CONTENU */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-coral-500 uppercase tracking-widest">{category}</p>
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
              <i className="ti ti-star-filled text-[10px] text-amber-500" />
              <span className="text-[10px] font-bold text-amber-700">{rating}</span>
            </div>
          )}
        </div>
        
        <p className="text-lg font-bold text-gray-900 leading-tight line-clamp-1">{name}</p>
        
        {/* Ligne de prix */}
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-xl font-black text-gray-900">
            {price.toLocaleString("fr-FR")} <span className="text-xs font-bold">FCFA</span>
          </p>
          {oldPrice && (
            <p className="text-sm text-gray-400 line-through font-medium">
              {oldPrice.toLocaleString("fr-FR")}
            </p>
          )}
        </div>
        
        {/* Bouton Ajouter au panier */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onAddToCart();
          }}
          className="w-full mt-2 py-3 bg-gray-950 text-white rounded-[16px] text-sm font-bold hover:bg-coral-500 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
        >
          <i className="ti ti-shopping-cart text-lg" />
          Ajouter au panier
        </button>
      </div>
    </motion.div>
  );
}