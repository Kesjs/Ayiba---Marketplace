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
  const DEFAULT_FALLBACK = "/images/hero-illustration.png";
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src || DEFAULT_FALLBACK);

  const isExternalUrl = currentSrc.startsWith('http://') || currentSrc.startsWith('https://');
  const isSvg = currentSrc.endsWith('.svg');

  const handleError = () => {
    if (currentSrc !== DEFAULT_FALLBACK) {
      setCurrentSrc(DEFAULT_FALLBACK);
    }
  };

  if (isSvg || (isExternalUrl && !currentSrc.includes('supabase'))) {
    return (
      <img
        src={currentSrc}
        alt={alt}
        className={clsx(
          className,
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
        )}
        onError={handleError}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={currentSrc}
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
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
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
      onError={handleError}
    />
  );
}
