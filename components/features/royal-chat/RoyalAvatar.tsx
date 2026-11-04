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
    <g clipPath="url(#santa-clip)">
      <defs>
        <clipPath id="santa-clip"><circle cx="24" cy="24" r="22.2" /></clipPath>
        <linearGradient id="santa-hat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ef4a4a" />
          <stop offset="100%" stopColor="#a81620" />
        </linearGradient>
        <linearGradient id="santa-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd9bd" />
          <stop offset="100%" stopColor="#f2b793" />
        </linearGradient>
        <linearGradient id="santa-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e4e9f2" />
        </linearGradient>
      </defs>
      {/* fondo de noche nevada */}
      <rect width="48" height="48" fill="#1c2d4f" fillOpacity=".0" />
      {/* hombros del abrigo */}
      <path d="M2 50c2-9 10-12 22-12s20 3 22 12z" fill="url(#santa-hat)" />
      <g transform="translate(0 2.6)">
      {/* barba grande */}
      <path d="M9 21c-1.5 10 3 22 15 24 12-2 16.5-14 15-24-3 3-8 4.5-15 4.5S12 24 9 21z" fill="url(#santa-fur)" />
      <path d="M14 33c3 4 6 5.5 10 5.5M34 33c-3 4-6 5.5-10 5.5M19 40c2 1.5 8 1.5 10 0" fill="none" stroke="#c9d2e3" strokeWidth=".9" strokeLinecap="round" />
      {/* cara */}
      <ellipse cx="24" cy="20.5" rx="9.4" ry="8.6" fill="url(#santa-skin)" />
      {/* mofletes */}
      <circle cx="17.2" cy="23" r="2.5" fill="#ff8f93" fillOpacity=".55" />
      <circle cx="30.8" cy="23" r="2.5" fill="#ff8f93" fillOpacity=".55" />
      {/* ojos sonrientes */}
      <path d="M17.6 19.6c1.2-1.6 3.4-1.6 4.6 0" fill="none" stroke="#2b1b0e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M25.8 19.6c1.2-1.6 3.4-1.6 4.6 0" fill="none" stroke="#2b1b0e" strokeWidth="1.5" strokeLinecap="round" />
      {/* cejas pobladas */}
      <path d="M16.5 17c1.7-1.8 4.2-1.9 6-.6M25.5 16.4c1.8-1.3 4.3-1.2 6 .6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      {/* nariz */}
      <ellipse cx="24" cy="23" rx="2.5" ry="2.1" fill="#f08a7e" />
      <ellipse cx="23.3" cy="22.3" rx=".8" ry=".55" fill="#fff" fillOpacity=".7" />
      {/* bigote */}
      <path d="M24 24.4c-2.2-1.4-6.2-1.8-8.6.2-1.6 1.4-1 4 1.2 4.1 2.2.1 5-.8 7.4-2.5 2.4 1.7 5.2 2.6 7.4 2.5 2.2-.1 2.8-2.7 1.2-4.1-2.4-2-6.4-1.6-8.6-.2z" fill="url(#santa-fur)" stroke="#d4dbe8" strokeWidth=".5" />
      {/* sonrisa */}
      <path d="M21.6 29.4c1.5 1.5 3.3 1.5 4.8 0" fill="none" stroke="#b04a4a" strokeWidth="1.1" strokeLinecap="round" />
      </g>
      <g transform="translate(0 -1.6)">
      {/* gorro */}
      <path d="M11.5 16.5C10 8 16 3.2 23.5 3.4c6.5.2 11 3.6 14.2 9.2l-1 4z" fill="url(#santa-hat)" />
      <circle cx="38.6" cy="13.2" r="3.7" fill="url(#santa-fur)" stroke="#d4dbe8" strokeWidth=".5" />
      {/* ribete de piel */}
      <rect x="10.3" y="14.6" width="27.4" height="5.6" rx="2.8" fill="url(#santa-fur)" stroke="#d4dbe8" strokeWidth=".5" />
      <path d="M15 17.4h.1M20 17.7h.1M25 17.4h.1M30 17.7h.1" stroke="#cfd7e6" strokeWidth="1.2" strokeLinecap="round" />
      {/* brillo del gorro */}
      <path d="M16 11c1.5-3 4.5-4.5 7.5-4.3" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </g>
  );
}
