import { ImageResponse } from 'next/og';
import { elfArtDataUri } from '@/lib/elfArt';

export const alt = 'Mi diario de travesuras · el elfo Chispa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Vista previa del diario: solo magia (AGENTS.md). Sin emojis: el motor no los dibuja. */
export default function OgImage() {
  const pics = [10, 4, 2].map((d) => elfArtDataUri(d)).filter((x): x is string => !!x);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0d2b3a', color: '#fff6dc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 50px', width: 520 }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#7ee2a8', textTransform: 'uppercase' }}>Escrito por Chispa</div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, lineHeight: 1.05, marginTop: 18 }}>Mi diario de travesuras</div>
          <div style={{ display: 'flex', fontSize: 30, marginTop: 22, color: '#f6d77a' }}>Una trastada cada noche de diciembre</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 24, flex: 1 }}>
          {pics[0] && <img src={pics[0]} width={632} height={330} style={{ objectFit: 'cover', borderRadius: 24 }} />}
          <div style={{ display: 'flex', gap: 12 }}>
            {pics.slice(1).map((p, i) => (
              <img key={i} src={p} width={310} height={240} style={{ objectFit: 'cover', borderRadius: 20 }} />
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
