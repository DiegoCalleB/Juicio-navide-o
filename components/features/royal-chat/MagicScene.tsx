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
  if (sky === 'candy') {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(63,207,122,.22),transparent_60%),linear-gradient(180deg,#0f3140_0%,#0d2b3a_55%,#0a1f2c_100%)]" />
        {FLAKES.map((f, i) => {
          const colors = ['#ff5a5f', '#ffd25a', '#4cd98a', '#7ec8ff', '#ffffff'];
          return (
            <span key={`g${i}`} className="anim-snow absolute top-0 rounded-sm" style={{ left: f.left, width: f.size + 1, height: f.size + 3, background: colors[i % colors.length], opacity: 0.55, animationDuration: `${f.duration + 4}s`, animationDelay: `${f.delay}s`, transform: `rotate(${(i * 37) % 90}deg)` }} />
          );
        })}
        <div className="absolute inset-x-0 bottom-0 h-3 opacity-80" style={{ background: 'repeating-linear-gradient(135deg,#e5383b 0 14px,#ffffff 14px 28px)' }} />
      </div>
    );
  }
  if (sky === 'night') {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_8%,rgba(160,140,255,.28),transparent_55%),linear-gradient(180deg,#1b1f55_0%,#171a45_55%,#10122f_100%)]" />
        <div className="absolute bottom-32 right-6 size-16 rounded-full shadow-[inset_-15px_7px_0_0_#fff3c4,0_0_46px_10px_rgba(255,243,196,.18)]" />
        {STARS.map((s, i) => (
          <span key={i} className="anim-twinkle absolute rounded-full bg-[#fff6dc]" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
        ))}
        {[12, 36, 62, 84].map((left, i) => (
          <span key={left} className="anim-float absolute text-[15px] text-[#ffd86b]" style={{ left: `${left}%`, top: `${30 + ((i * 17) % 40)}%`, animationDelay: `${-i * 0.9}s`, opacity: 0.7 }}>✦</span>
        ))}
        <svg className="absolute inset-x-0 bottom-0 h-24 w-full opacity-70" viewBox="0 0 400 96" preserveAspectRatio="none">
          <path d="M0 96V66c40-12 70-6 110-14 40-8 80 4 130-4 50-8 100 0 160-10v58z" fill="#0d0f2b" />
          <path d="M0 96V82c50-8 90-2 140-8 60-7 110 2 260-6v28z" fill="#0a0b22" />
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
  const colors = sky === 'snow' ? ['#ff5a5f', '#f6d77a', '#4cd98a', '#6fb7ff'] : sky === 'night' ? ['#ffe08a', '#c9b8ff', '#fff3c4'] : sky === 'candy' ? ['#ff5a5f', '#ffd25a', '#4cd98a', '#7ec8ff'] : ['#f6d77a', '#fff1b8', '#f2c94c'];
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
