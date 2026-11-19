import { useState } from 'react';
import { Store } from 'lucide-react';

interface OfferImageProps {
  src: string;
  alt: string;
  businessName: string;
  className?: string;
}

export function OfferImage({ src, alt, businessName, className = '' }: OfferImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 text-slate-600 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Store className="w-7 h-7 text-emerald-700 mb-2" strokeWidth={1.75} />
        <span className="text-xs font-medium text-slate-700 line-clamp-2">{businessName}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover w-full h-full ${className}`}
    />
  );
}
