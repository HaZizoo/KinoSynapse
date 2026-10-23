import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react';

export interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string | null | undefined;
  alt: string;
  fallback?: ReactNode;
}

/**
 * Renders a TMDB image, replacing it with `fallback` when the URL is missing
 * or the request fails. Without this, a deleted poster leaves a broken icon.
 */
export function SafeImage({
  src,
  alt,
  fallback = null,
  className,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
