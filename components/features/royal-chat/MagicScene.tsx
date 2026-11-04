import type { SkyKind } from '@/lib/characters';

/** Valores fijos (no aleatorios) para que servidor y cliente pinten lo mismo. */
const FLAKES = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  size: 2 + (i % 4),
  duration: 9 + (i % 7) * 2.1,
  delay: -((i * 3.7) % 16),
  opacity: 0.35 + (i % 4) * 0.12,
}));

const STARS = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 53 + 11) % 100}%`,
  top: `${(i * 29 + 5) % 70}%`,
  size: 2 + (i % 3),
  delay: -((i * 1.3) % 6),
}));

/**
 * Fondo vivo de la sala: Laponia nevada con aurora y pinos, u Oriente estrellado.
 * Solo capas con transform/opacity (GPU) y ocultas a lectores de pantalla.
 */
export function MagicScene({ sky }: { sky: SkyKind }) {
  if (sky === 'snow') {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="royal-snow absolute inset-0" />
        <div className="anim-aurora absolute -left-1/4 -top-10 h-72 w-[150%] rounded-full bg-[radial-gradient(closest-side,rgba(80,230,170,.28),transparent)] blur-2xl" />
        <div className="anim-aurora absolute -right-1/3 top-10 h-64 w-[130%] rounded-full bg-[radial-gradient(closest-side,rgba(120,150,255,.20),transparent)] blur-2xl [animation-delay:-6s]" />
        {STARS.slice(0, 9).map((s, i) => (
          <span key={`s${i}`} className="anim-twinkle absolute rounded-full bg-white" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
        ))}
        {FLAKES.map((f, i) => (
          <span key={`f${i}`} className="anim-snow absolute top-0 rounded-full bg-white" style={{ left: f.left, width: f.size, height: f.size, opacity: f.opacity, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }} />
        ))}
        <svg className="absolute inset-x-0 bottom-0 h-32 w-full opacity-60" viewBox="0 0 400 128" preserveAspectRatio="none">
          <path d="M0 128V96c30-10 60-4 90-14 30-10 55-6 85-12 40-8 70 4 110-4 40-8 80-2 115-10v72z" fill="#143a2a" />
          <g fill="#0b2a1d">
            {[18, 58, 112, 190, 262, 330, 378].map((x, i) => {
              const h = 52 + (i % 3) * 14;
              return <path key={x} d={`M${x} ${128 - h}l-${13 + (i % 2) * 4} ${h}h${26 + (i % 2) * 8}z`} />;
            })}
          </g>
          <path d="M0 128V112c40-6 80-2 120-8 50-8 90 2 140-4 50-6 90-2 140-8v36z" fill="#e8f1ee" fillOpacity=".16" />
        </svg>
      </div>
    );
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="royal-sky absolute inset-0" />
      <div className="anim-aurora absolute -top-16 left-1/2 h-72 w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(246,215,122,.20),transparent)] blur-2xl" />
      {STARS.map((s, i) => (
        <span key={i} className="anim-twinkle absolute rounded-full bg-[#fff6dc]" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
      ))}
      <span className="anim-shoot absolute right-[18%] top-[12%] h-0.5 w-16 rounded-full bg-gradient-to-l from-transparent via-white/80 to-white" />
    </div>
  );
}

/** Guirnalda de luces bajo la cabecera: discreta, con bombillas que respiran. */
export function Garland({ sky }: { sky: SkyKind }) {
  const colors = sky === 'snow' ? ['#ff5a5f', '#f6d77a', '#4cd98a', '#6fb7ff'] : ['#f6d77a', '#fff1b8', '#f2c94c'];
  const bulbs: { x: number; y: number; c: string; d: number }[] = [];
  for (let k = 0; k < 3; k++) {
    for (const t of [0.2, 0.5, 0.8]) {
      const y = (1 - t) * (1 - t) * 2 + 2 * (1 - t) * t * 20 + t * t * 2;
      const i = bulbs.length;
      bulbs.push({ x: ((k + t) / 3) * 100, y, c: colors[i % colors.length] ?? '#f6d77a', d: -(i * 0.45) });
    }
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full z-10 h-5">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 20" preserveAspectRatio="none">
        <path d="M0 2Q66 20 133 2Q200 20 266 2Q333 20 400 2" fill="none" stroke="#0b0b0b" strokeOpacity=".55" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      {bulbs.map((b, i) => (
        <span
          key={i}
          className="anim-bulb absolute size-2 -translate-x-1/2 rounded-full"
          style={{ left: `${b.x}%`, top: b.y + 1, background: b.c, boxShadow: `0 0 8px 2px ${b.c}`, animationDelay: `${b.d}s` }}
        />
      ))}
    </div>
  );
}
