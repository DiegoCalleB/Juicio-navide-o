import { ImageResponse } from 'next/og';
import { elfArtDataUri } from '@/lib/elfArt';
import { elfNights, nightDate } from '@/lib/elfIdeas';
import { getSiteUrl } from '@/lib/site';

export const alt = 'Una trastada del elfo travieso para cada noche';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Vista previa de cada noche al compartir (WhatsApp, redes). Sin emojis: el motor no los dibuja. */
export default async function OgImage({ params }: { params: Promise<{ noche: string }> }) {
  const n = Number((await params).noche);
  const night = elfNights().find((x) => x.day === n);
  const host = new URL(getSiteUrl()).host;
  const idea = night ? night.title : 'Una trastada del elfo travieso';
  const art = night ? elfArtDataUri(night.day) : null;
  if (night && art) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '48px 56px', background: 'linear-gradient(135deg, #0f3b2a 0%, #160a2b 60%, #2a0f4a 100%)', color: '#fff6dc' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 560, height: '100%', paddingRight: 36 }}>
            <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, color: '#7ee2a8', textTransform: 'uppercase' }}>{`Trastada ${night.day} de 24`}</div>
            <div style={{ display: 'flex', fontSize: idea.length > 30 ? 56 : 66, fontWeight: 800, lineHeight: 1.08, marginTop: 20 }}>{idea}</div>
            <div style={{ display: 'flex', fontSize: 25, lineHeight: 1.3, marginTop: 20, color: '#d9cfe8' }}>{night.why.length > 130 ? `${night.why.slice(0, night.why.lastIndexOf(' ', 128))}…` : night.why}</div>
            <div style={{ display: 'flex', fontSize: 24, marginTop: 'auto', color: '#f6d77a' }}>{`Línea Mágica · ${host}/ideas-elfo`}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={art} width={528} height={396} style={{ borderRadius: 26, border: '4px solid rgba(246,215,122,.55)' }} />
        </div>
      ),
      size,
    );
  }
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 84px', background: 'linear-gradient(135deg, #0f3b2a 0%, #160a2b 60%, #2a0f4a 100%)', color: '#fff6dc' }}>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 6, color: '#7ee2a8', textTransform: 'uppercase' }}>
          {night ? `Noche ${night.day} de 24 · ${nightDate(night.day)}` : 'Trastadas del elfo'}
        </div>
        <div style={{ display: 'flex', fontSize: idea.length > 40 ? 72 : 88, fontWeight: 800, lineHeight: 1.1, marginTop: 26, maxWidth: 1030 }}>{idea}</div>
        <div style={{ display: 'flex', fontSize: 34, marginTop: 28, color: '#d9cfe8' }}>{night ? night.why : 'La trastada de esta noche, con el mensaje del elfo'}</div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 'auto', paddingTop: 20, color: '#f6d77a' }}>{`Línea Mágica · ${host}/ideas-elfo`}</div>
      </div>
    ),
    size,
  );
}
