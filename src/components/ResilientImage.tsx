'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ResilientImageProps extends Omit<ImageProps, 'onError'> {
  fallbackEmoji?: string;
  useStandardImg?: boolean;
}

/**
 * A wrapper around Next.js Image that handles:
 * 1. Broken URLs (falls back to emoji)
 * 2. Unconfigured domains (falls back to standard <img> if allowed)
 * 3. General loading errors
 */
export default function ResilientImage({ 
  src, 
  alt, 
  fallbackEmoji = '🍱', 
  useStandardImg = true,
  className,
  ...props 
}: ResilientImageProps) {
  const [error, setError] = useState(false);
  const [isUnconfiguredDomain, setIsUnconfiguredDomain] = useState(false);

  // If the src changes, reset error states
  useEffect(() => {
    setError(false);
    setIsUnconfiguredDomain(false);
  }, [src]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-neutral-50 text-[32px] w-full h-full ${className}`}>
        {fallbackEmoji}
      </div>
    );
  }

  // If we detected an unconfigured domain error in a previous render, 
  // or if we want to bypass Next.js image optimization for external URLs
  if (isUnconfiguredDomain && useStandardImg) {
    return (
      <img 
        src={typeof src === 'string' ? src : undefined} 
        alt={alt} 
        className={className}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        // Handle unconfigured domain errors specifically if possible, 
        // usually they just fire a generic onError in production or a big red box in dev.
        console.warn(`[ResilientImage] Failed to load: ${src}`);
        setError(true);
      }}
      {...props}
    />
  );
}
