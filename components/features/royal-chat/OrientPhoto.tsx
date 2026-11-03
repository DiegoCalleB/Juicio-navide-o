/** "Foto" enviada desde Oriente: escena vectorial (palacio, dunas, caravana, estrella). */
export function OrientPhoto() {
  return (
    <svg viewBox="0 0 320 220" className="block h-auto w-full" role="img" aria-label="El palacio de Oriente de noche con la caravana de camellos">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0520" />
          <stop offset="60%" stopColor="#2a0f4a" />
          <stop offset="100%" stopColor="#5b2a6e" />
        </linearGradient>
        <radialGradient id="glow" cx="72%" cy="22%" r="35%">
          <stop offset="0%" stopColor="#fff1b8" stopOpacity=".55" />
          <stop offset="100%" stopColor="#fff1b8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dune1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a4a2a" />
          <stop offset="100%" stopColor="#3b1f14" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" fill="url(#sky)" />
      <rect width="320" height="220" fill="url(#glow)" />
      {[[20, 30], [60, 18], [100, 44], [140, 22], [190, 50], [270, 70], [300, 30], [40, 80], [120, 90], [250, 20]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} fill="#fff" opacity={0.7} />
      ))}
      <g transform="translate(230 46)">
        <path d="M0-16L3.5-3.5 16 0 3.5 3.5 0 16-3.5 3.5-16 0-3.5-3.5z" fill="#fff6d1" />
        <path d="M0-6L1.3-1.3 6 0 1.3 1.3 0 6-1.3 1.3-6 0-1.3-1.3z" fill="#fff" />
        <path d="M0 16L-8 60" stroke="#fff6d1" strokeOpacity=".35" strokeWidth="1.5" />
      </g>
      <g fill="#1a0b2e">
        <rect x="40" y="110" width="110" height="60" />
        <path d="M70 110a25 25 0 0 1 50 0z" />
        <rect x="93" y="70" width="4" height="16" />
        <path d="M95 64l3 6h-6z" />
        <rect x="32" y="96" width="14" height="74" />
        <path d="M32 96a7 9 0 0 1 14 0z" />
        <rect x="144" y="96" width="14" height="74" />
        <path d="M144 96a7 9 0 0 1 14 0z" />
      </g>
      <g fill="#f2c94c" opacity=".85">
        <rect x="64" y="132" width="6" height="10" rx="3" />
        <rect x="92" y="128" width="6" height="12" rx="3" />
        <rect x="120" y="132" width="6" height="10" rx="3" />
      </g>
      <path d="M0 170c50-22 110-26 170-10s110 8 150-6v66H0z" fill="url(#dune1)" />
      <path d="M0 190c70-14 140-12 200 0s90 4 120-4v34H0z" fill="#2a160e" />
      <g fill="#0f0618" transform="translate(186 150) scale(1.15)">
        <path d="M0 14c0-3 2-5 4-5h1c1-4 4-7 7-7s4 3 5 5c1-2 3-4 5-4 3 0 5 3 5 6l2 2 3-3c1-1 2 0 2 1l-4 6c-1 3-3 4-5 4v7h-2v-7h-9v7h-2v-7c-3 0-5-2-6-4l-2 1c-2 1-4 0-4-1z" />
      </g>
      <g fill="#0f0618" transform="translate(236 156) scale(.95)">
        <path d="M0 14c0-3 2-5 4-5h1c1-4 4-7 7-7s4 3 5 5c1-2 3-4 5-4 3 0 5 3 5 6l2 2 3-3c1-1 2 0 2 1l-4 6c-1 3-3 4-5 4v7h-2v-7h-9v7h-2v-7c-3 0-5-2-6-4l-2 1c-2 1-4 0-4-1z" />
      </g>
      <g fill="#0f0618" transform="translate(278 162) scale(.75)">
        <path d="M0 14c0-3 2-5 4-5h1c1-4 4-7 7-7s4 3 5 5c1-2 3-4 5-4 3 0 5 3 5 6l2 2 3-3c1-1 2 0 2 1l-4 6c-1 3-3 4-5 4v7h-2v-7h-9v7h-2v-7c-3 0-5-2-6-4l-2 1c-2 1-4 0-4-1z" />
      </g>
    </svg>
  );
}
