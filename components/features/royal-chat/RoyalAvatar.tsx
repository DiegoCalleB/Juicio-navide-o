import type { King } from './types';

/** Avatar heráldico propio: corona dorada sobre el color del manto. Sin assets externos. */
export function RoyalAvatar({ king, size = 40 }: { king: King; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={`Avatar de ${king.name}`} className="shrink-0">
      <defs>
        <radialGradient id={`robe-${king.id}`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={king.robe} stopOpacity="1" />
          <stop offset="100%" stopColor="#1a0830" />
        </radialGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff1b8" />
          <stop offset="55%" stopColor="#f2c94c" />
          <stop offset="100%" stopColor="#b8862b" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill={`url(#robe-${king.id})`} stroke="url(#gold)" strokeWidth="2" />
      <path d="M12 30l-1.5-12 6.5 5.5L24 12l7 11.5 6.5-5.5L36 30z" fill="url(#gold)" stroke="#8a6214" strokeWidth=".8" strokeLinejoin="round" />
      <rect x="12" y="30" width="24" height="4.5" rx="1.5" fill="url(#gold)" stroke="#8a6214" strokeWidth=".8" />
      <circle cx="24" cy="21.5" r="2" fill="#e5383b" />
      <circle cx="16.5" cy="25" r="1.4" fill="#4fb3ff" />
      <circle cx="31.5" cy="25" r="1.4" fill="#3ddc84" />
      <circle cx="24" cy="12" r="1.6" fill="#fff1b8" />
    </svg>
  );
}
