import type { CharacterProfile } from '@/lib/characters';

const GOLD = (
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#fff1b8" />
    <stop offset="55%" stopColor="#f2c94c" />
    <stop offset="100%" stopColor="#b8862b" />
  </linearGradient>
);

/** Avatares propios en SVG (sin assets externos): corona para los Reyes, gorro y barba para Papá Noel. */
export function RoyalAvatar({ character, size = 40 }: { character: CharacterProfile; size?: number }) {
  const gid = `bg-${character.id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={`Avatar de ${character.name}`} className="shrink-0">
      <defs>
        <radialGradient id={gid} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={character.theme.robe} />
          <stop offset="100%" stopColor="#1a0830" stopOpacity={character.avatar === 'santa' ? 0.55 : 1} />
        </radialGradient>
        {GOLD}
      </defs>
      <circle cx="24" cy="24" r="23" fill={`url(#${gid})`} stroke="url(#gold)" strokeWidth="2" />
      {character.avatar === 'crown' ? <Crown /> : <Santa />}
    </svg>
  );
}

function Crown() {
  return (
    <>
      <path d="M12 30l-1.5-12 6.5 5.5L24 12l7 11.5 6.5-5.5L36 30z" fill="url(#gold)" stroke="#8a6214" strokeWidth=".8" strokeLinejoin="round" />
      <rect x="12" y="30" width="24" height="4.5" rx="1.5" fill="url(#gold)" stroke="#8a6214" strokeWidth=".8" />
      <circle cx="24" cy="21.5" r="2" fill="#e5383b" />
      <circle cx="16.5" cy="25" r="1.4" fill="#4fb3ff" />
      <circle cx="31.5" cy="25" r="1.4" fill="#3ddc84" />
      <circle cx="24" cy="12" r="1.6" fill="#fff1b8" />
    </>
  );
}

function Santa() {
  return (
    <>
      {/* barba */}
      <path d="M12 22c0 11 5 18 12 18s12-7 12-18c-3 3-7 4-12 4s-9-1-12-4z" fill="#fff" />
      {/* cara */}
      <ellipse cx="24" cy="21" rx="8" ry="7" fill="#f6c9a6" />
      {/* bigote */}
      <path d="M15.5 24c3-1.5 5.5-.5 8.5 1 3-1.5 5.5-2.5 8.5-1-1 4-4.5 5.5-8.5 4.5-4 1-7.5-.5-8.5-4.5z" fill="#fff" />
      {/* ojos y nariz */}
      <circle cx="20.5" cy="20.5" r="1.1" fill="#2b1b0e" />
      <circle cx="27.5" cy="20.5" r="1.1" fill="#2b1b0e" />
      <circle cx="24" cy="23" r="1.6" fill="#e28a7a" />
      {/* gorro */}
      <path d="M13 17c1-8 6-12 12-12 4 0 7 2 9 5l-3 7H16z" fill="#d32f2f" />
      <rect x="12" y="15.5" width="24" height="4.5" rx="2.2" fill="#fff" />
      <circle cx="35" cy="9" r="3" fill="#fff" />
    </>
  );
}
