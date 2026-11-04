import { ImageResponse } from 'next/og';
import { getSiteUrl } from '@/lib/site';

export const alt = 'Papá Noel y los Reyes Magos contestan a tu hijo';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Vista previa al compartir el enlace (WhatsApp, redes). Sin emojis: el motor no los dibuja. */
export default function OgImage() {
  const host = new URL(getSiteUrl()).host;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '70px 90px',
          background: 'linear-gradient(135deg, #2a0f4a 0%, #160a2b 55%, #0e2418 100%)',
          color: '#fff6dc',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 8, color: '#f6d77a', textTransform: 'uppercase' }}>
          Mensajería mágica de Navidad
        </div>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, lineHeight: 1.08, marginTop: 28 }}>
          Papá Noel y los Reyes Magos le contestan a tu hijo
        </div>
        <div style={{ display: 'flex', fontSize: 34, marginTop: 30, color: '#d9cfe8', maxWidth: 980 }}>
          Tú escribes desde tu móvil. A él le llega como si fuera el personaje, en directo.
        </div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 'auto', paddingTop: 24, color: '#f6d77a' }}>{host}</div>
      </div>
    ),
    size,
  );
}
