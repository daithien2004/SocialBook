'use client';

import { useState, useEffect, useMemo } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends ImageProps {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop';

export const SafeImage = ({ src, fallbackSrc = DEFAULT_FALLBACK, alt, ...props }: SafeImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setError(false);
  }, [src]);

  // Handle known bad domains immediately if needed
  const isBadDomain = typeof src === 'string' && src.includes('nhasachmienphi.com');

  return (
    <Image
      {...props}
      src={error || isBadDomain ? fallbackSrc : imgSrc}
      alt={alt}
      onError={() => {
        setError(true);
      }}
    />
  );
};
