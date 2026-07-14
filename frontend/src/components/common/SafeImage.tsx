'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends ImageProps {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = '/book-covers.png';

export const SafeImage = ({ src, fallbackSrc = DEFAULT_FALLBACK, alt, ...props }: SafeImageProps) => {
  const [error, setError] = useState(false);
  const displaySrc = error || !src ? fallbackSrc : src;

  return (
    <Image
      {...props}
      key={typeof src === 'string' ? src : undefined}
      src={displaySrc}
      alt={alt}
      onError={() => {
        setError(true);
      }}
    />
  );
};
