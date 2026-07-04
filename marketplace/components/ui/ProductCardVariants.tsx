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
  onAddToCart: () => void;
  onToggleFavorite: () => void;
  onClick?: () => void;
}

// ============================================
// VARIANT 1: MINIMAL - Clean & Simple
// ============================================
export function ProductCardMinimal({
  image,
  category,
  name,
  rating,
  price,
  oldPrice,
  onAddToCart,
  onToggleFavorite,
  onClick,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden w-full text-left hover:border-coral-200 hover:shadow-lg transition-all duration-300 cursor-pointer group/card"
    >
      <div className="relative h-[180px] bg-gray-50 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
        />
        {oldPrice && (
          <div className="absolute top-2 left-2 bg-coral-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
            -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <i className="ti ti-heart text-sm text-gray-600 hover:text-red-500" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-500">{category}</p>
        <p className="text-sm font-bold text-gray-900 line-clamp-2">{name}</p>
        <div className="flex items-center gap-1 mt-1">
          <i className="ti ti-star-filled text-xs text-amber-500" />
          <span className="text-xs text-gray-600">{rating}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-base font-bold text-gray-900">
            {price.toLocaleString("fr-FR")} FCFA
          </p>
          {oldPrice && (
            <p className="text-xs text-gray-400 line-through">
              {oldPrice.toLocaleString("fr-FR")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          className="w-full mt-2 py-2 bg-coral-500 text-white rounded-lg text-xs font-bold hover:bg-coral-600 transition-all"
        >
          Ajouter
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// VARIANT 2: MODERN - Bold & Visual
// ============================================
export function ProductCardModern({
  image,
  category,
  name,
  rating,
  price,
  oldPrice,
  onAddToCart,
  onToggleFavorite,
  onClick,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="flex flex-col bg-white border-2 border-gray-100 rounded-2xl overflow-hidden w-full text-left hover:border-coral-300 hover:shadow-xl hover:shadow-coral-500/10 transition-all duration-300 cursor-pointer group/card"
    >
      <div className="relative h-[200px] bg-gray-50 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover/card:scale-110"
        />
        {oldPrice && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white rounded-lg px-3 py-1 text-sm font-bold">
            -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors shadow-lg"
        >
          <i className="ti ti-heart text-base text-gray-600 hover:text-red-500" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-coral-600 uppercase tracking-wider">{category}</p>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
            <i className="ti ti-star-filled text-xs text-amber-500" />
            <span className="text-xs font-bold text-amber-700">{rating}</span>
          </div>
        </div>
        <p className="text-base font-bold text-gray-900 leading-tight line-clamp-1">{name}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-black text-gray-900">
            {price.toLocaleString("fr-FR")} <span className="text-xs font-bold">FCFA</span>
          </p>
          {oldPrice && (
            <p className="text-sm text-gray-400 line-through font-medium">
              {oldPrice.toLocaleString("fr-FR")}
            </p>
          )}
        </div>
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          whileTap={{ scale: 0.85 }}
          className="absolute bottom-5 right-5 w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-coral-500 transition-all duration-300 shadow-lg"
        >
          <i className="ti ti-shopping-cart text-base" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// VARIANT 3: COMPACT - Dense & Efficient
// ============================================
export function ProductCardCompact({
  image,
  category,
  name,
  rating,
  price,
  oldPrice,
  onAddToCart,
  onToggleFavorite,
  onClick,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="flex gap-3 bg-white border border-gray-100 rounded-xl overflow-hidden w-full text-left hover:border-coral-200 hover:shadow-md transition-all duration-300 cursor-pointer group/card p-3"
    >
      <div className="relative w-24 h-24 bg-gray-50 rounded-lg overflow-hidden shrink-0">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover/card:scale-110"
        />
        {oldPrice && (
          <div className="absolute top-1 left-1 bg-coral-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
            -{Math.round(((oldPrice - price) / oldPrice) * 100)}%
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase">{category}</p>
          <p className="text-sm font-bold text-gray-900 line-clamp-2 mt-0.5">{name}</p>
          <div className="flex items-center gap-1 mt-1">
            <i className="ti ti-star-filled text-[10px] text-amber-500" />
            <span className="text-[10px] text-gray-600">{rating}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1">
            <p className="text-sm font-bold text-gray-900">
              {price.toLocaleString("fr-FR")}
            </p>
            {oldPrice && (
              <p className="text-[10px] text-gray-400 line-through">
                {oldPrice.toLocaleString("fr-FR")}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <i className="ti ti-heart text-xs text-gray-600 hover:text-red-500" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="w-7 h-7 bg-coral-500 rounded-lg flex items-center justify-center hover:bg-coral-600 transition-colors"
            >
              <i className="ti ti-plus text-xs text-white" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
