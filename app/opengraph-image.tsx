import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { heroFor } from '@/lib/brand';
import { siteNow } from '@/lib/clock';
import { getSiteUrl } from '@/lib/site';

export const alt = 'Línea Mágica · Mensajes mágicos de Navidad';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FACE: Record<string, string> = { 'elf-pre': 'chispa', elf: 'chispa', noel: 'noel', reyes: 'reyes', raton: 'raton' };

/** Retrato del personaje de la temporada (público/og). Si faltara el archivo, la vista previa sale solo con texto. */
async function face(phase: string): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'og', `${FACE[phase] ?? 'chispa'}.jpg`));
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Vista previa al compartir el enlace (WhatsApp, redes). Sin emojis: el motor no los dibuja. */
export default async function OgImage() {
  const host = new URL(getSiteUrl()).host;
  const hero = heroFor(siteNow());
  const img = await face(hero.phase);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '60px 70px',
          background: 'linear-gradient(135deg, #2a0f4a 0%, #160a2b 60%, #0e2418 100%)',
          color: '#fff6dc',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', justifyContent: 'center', paddingRight: img ? 40 : 0 }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#f6d77a', textTransform: 'uppercase' }}>
            {`Línea Mágica · ${hero.tagline}`}
          </div>
          <div style={{ display: 'flex', fontSize: img ? 58 : 72, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>{hero.title}</div>
          <div style={{ display: 'flex', fontSize: img ? 27 : 34, marginTop: 24, color: '#d9cfe8', maxWidth: 980 }}>{hero.subtitle}</div>
          <div style={{ display: 'flex', fontSize: 28, marginTop: 'auto', paddingTop: 20, color: '#f6d77a' }}>{host}</div>
        </div>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} width={440} height={440} alt="" style={{ borderRadius: 48, border: '6px solid #f6d77a', objectFit: 'cover' }} />
        )}
      </div>
    ),
    size,
  );
}
