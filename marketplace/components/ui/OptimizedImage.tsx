import Image from 'next/image';
import { useState } from 'react';
import clsx from 'clsx';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
}

/**
 * Composant Image optimisé avec Next.js Image
 * - Lazy loading automatique
 * - Responsive images
 * - Format WebP automatique
 * - Optimisation des performances
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  objectFit = 'cover',
  priority = false,
  quality = 75,
  placeholder = 'empty',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Si c'est une URL externe et pas une image optimisée Supabase, utiliser img standard
  const isExternalUrl = src.startsWith('http://') || src.startsWith('https://');
  const isSvg = src.endsWith('.svg');

  if (isSvg || (isExternalUrl && !src.includes('supabase'))) {
    return (
      <img
        src={src}
        alt={alt}
        className={clsx(
          className,
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
        )}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={clsx(
          className,
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          isLoading && 'blur-sm',
        )}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        onLoadingComplete={() => setIsLoading(false)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 400}
      className={clsx(
        className,
        objectFit === 'cover' && 'object-cover',
        objectFit === 'contain' && 'object-contain',
        isLoading && 'blur-sm',
      )}
      priority={priority}
      quality={quality}
      placeholder={placeholder}
      onLoadingComplete={() => setIsLoading(false)}
    />
  );
}
