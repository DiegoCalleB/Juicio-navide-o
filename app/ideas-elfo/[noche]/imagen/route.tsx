import { ImageResponse } from 'next/og';
import { elfArtDataUri } from '@/lib/elfArt';
import { elfNights, MESS_LABEL, nightDate } from '@/lib/elfIdeas';
import { getSiteUrl } from '@/lib/site';

/**
 * Imagen vertical (2:3) de cada trastada, para Pinterest, Instagram y TikTok.
 * Con ?descargar=1 se descarga como archivo. Sin emojis: el motor no los dibuja.
 */
export async function GET(req: Request, { params }: { params: Promise<{ noche: string }> }) {
  const n = Number((await params).noche);
  const night = elfNights().find((x) => x.day === n);
  if (!night) return new Response('No existe', { status: 404 });
  const host = new URL(getSiteUrl()).host;
  const titleSize = night.title.length > 34 ? 66 : 78;
  const art = elfArtDataUri(night.day);
  const img = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '70px 70px 60px', background: 'linear-gradient(160deg, #0f3b2a 0%, #160a2b 55%, #2a0f4a 100%)', color: '#fff6dc' }}>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 5, color: '#7ee2a8', textTransform: 'uppercase' }}>{`Trastada ${night.day} de 24 · ${nightDate(night.day)}`}</div>
        <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 800, lineHeight: 1.05, marginTop: 26 }}>{night.title}</div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 22, color: '#f6d77a' }}>{`${night.minutes} minutos · ${MESS_LABEL[night.mess]} · ${night.need}`}</div>
        {art ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 30, marginBottom: 30 }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={art} width={860} height={645} style={{ borderRadius: 30, border: '4px solid rgba(246,215,122,.55)' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40 }}>
          {night.steps.slice(0, 3).map((s, i) => (
            <div key={i} style={{ display: 'flex', fontSize: 32, lineHeight: 1.3, marginTop: 14, color: '#e9e0f5' }}>
              <div style={{ display: 'flex', width: 54, flexShrink: 0, color: '#7ee2a8', fontWeight: 800 }}>{`${i + 1}.`}</div>
              <div style={{ display: 'flex', flex: 1 }}>{s}</div>
            </div>
          ))}
          </div>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', marginTop: 30, marginBottom: 30 }}>
          <div style={{ display: 'flex', fontSize: night.why.length > 110 ? 40 : 46, lineHeight: 1.25, fontStyle: 'italic', color: '#f6d77a', borderLeft: '8px solid #f6d77a', paddingLeft: 30 }}>{`«${night.why}»`}</div>
          </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#fbf5e6', color: '#3a2208', borderRadius: 34, padding: '28px 34px' }}>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: 3, color: '#9a6b1f', textTransform: 'uppercase' }}>El mensaje del elfo</div>
          <div style={{ display: 'flex', fontSize: 32, lineHeight: 1.3, marginTop: 10 }}>{night.message}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, marginTop: 34, color: '#f6d77a' }}>
          <div style={{ display: 'flex' }}>Línea Mágica</div>
          <div style={{ display: 'flex' }}>{`${host}/ideas-elfo`}</div>
        </div>
      </div>
    ),
    { width: 1000, height: 1500 },
  );
  const headers = new Headers(img.headers);
  headers.set('Cache-Control', 'public, max-age=86400');
  if (new URL(req.url).searchParams.has('descargar')) headers.set('Content-Disposition', `attachment; filename="trastada-elfo-${night.day}.png"`);
  return new Response(img.body, { status: 200, headers });
}
