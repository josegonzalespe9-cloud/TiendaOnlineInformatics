import React, { useState, useEffect } from 'react';

/**
 * Reusable image component that handles client-side caching using the browser's Cache API.
 * It caches cross-origin images locally so they load instantly on subsequent visits.
 * Incorporates a smooth fade-in animation for a premium visual experience.
 */
export default function CachedImage({ src, alt, className = '', onError, ...props }) {
  const [imageSrc, setImageSrc] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectURL = null;
    const CACHE_NAME = 'tienda-images-cache-v1';

    const loadImage = async () => {
      if (!src) {
        if (isMounted) setImageSrc('');
        return;
      }

      // If it's a relative path or local resource, bypass the network cache system
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        if (isMounted) {
          setImageSrc(src);
          setLoaded(true);
        }
        return;
      }

      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(src);

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          objectURL = URL.createObjectURL(blob);
          if (isMounted) {
            setImageSrc(objectURL);
            setLoaded(true);
          }
          return;
        }

        // Fetch image and cache it
        const response = await fetch(src, { mode: 'cors' });
        if (response.ok) {
          // Clone the response because its body can only be read once
          await cache.put(src, response.clone());
          const blob = await response.blob();
          objectURL = URL.createObjectURL(blob);
          if (isMounted) {
            setImageSrc(objectURL);
            setLoaded(true);
          }
        } else {
          // Fallback directly to the network URL on failure
          if (isMounted) {
            setImageSrc(src);
            setLoaded(true);
          }
        }
      } catch (error) {
        console.warn(`[Cache API] Failed to cache/load image: ${src}. Falling back to direct rendering.`, error);
        // Fallback directly to the network URL on CORS or network error
        if (isMounted) {
          setImageSrc(src);
          setLoaded(true);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectURL) {
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [src]);

  return (
    <div className="relative overflow-hidden w-full h-full">
      {/* Skeleton / Shimmer background while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            if (onError) onError(e);
          }}
          className={`${className} transition-opacity duration-500 ease-in-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
}
