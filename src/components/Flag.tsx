import { useState } from 'react';

interface FlagProps {
  code: string;
  fallbackEmoji: string;
  className?: string;
}

// Eagerly import all flag PNGs from src/assets/flags/
const flagImages: Record<string, string> = import.meta.glob('../assets/flags/*.png', { eager: true, import: 'default' });

export default function Flag({ code, fallbackEmoji, className = 'w-6 h-4' }: FlagProps) {
  const [error, setError] = useState(false);

  const upperCode = code?.toUpperCase() || '';
  const localSrc = flagImages[`../assets/flags/${upperCode}.png`];

  if (error || (!localSrc && !upperCode)) {
    return (
      <span className="inline-block font-mono text-xs font-bold text-slate-300" style={{ lineHeight: 1 }}>
        {fallbackEmoji}
      </span>
    );
  }

  const src = localSrc || `https://flagcdn.com/w80/${upperCode.toLowerCase().slice(0, 2)}.png`;

  return (
    <img
      src={src}
      alt={`${code} flag`}
      className={`${className} object-cover inline-block rounded shadow-sm border border-slate-700/50`}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

