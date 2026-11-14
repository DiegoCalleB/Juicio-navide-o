import { ImageResponse } from 'next/og';
import { elfQuick } from '@/lib/elfIdeas';
import { getSiteUrl } from '@/lib/site';

/** Chuleta vertical (2:3) de las 15 trastadas exprés, para Pinterest e Instagram. ?descargar=1 la descarga. */
export async function GET(req: Request) {
  const host = new URL(getSiteUrl()).host;
  const ideas = elfQuick();
  const img = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '64px 70px 54px', background: 'linear-gradient(160deg, #3a250a 0%, #160a2b 45%, #2a0f4a 100%)', color: '#fff6dc' }}>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 5, color: '#f6d77a', textTransform: 'uppercase' }}>Plan de emergencia del elfo</div>
        <div style={{ display: 'flex', fontSize: 66, fontWeight: 800, lineHeight: 1.05, marginTop: 18 }}>15 trastadas para cuando se te ha olvidado</div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 16, color: '#7ee2a8' }}>Menos de un minuto. Sin material.</div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 34 }}>
          {ideas.map((q, i) => (
            <div key={q.id} style={{ display: 'flex', fontSize: 34, lineHeight: 1.2, marginTop: 13 }}>
              <div style={{ display: 'flex', width: 62, flexShrink: 0, color: '#f6d77a', fontWeight: 800 }}>{`${i + 1}.`}</div>
              <div style={{ display: 'flex', flex: 1 }}>{q.title}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 34, lineHeight: 1.25, color: '#7ee2a8', borderLeft: '8px solid #7ee2a8', paddingLeft: 28 }}>Regla de oro: un elfo dormido es una historia. Un elfo olvidado, no.</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, marginTop: 34, color: '#f6d77a' }}>
          <div style={{ display: 'flex' }}>Línea Mágica</div>
          <div style={{ display: 'flex' }}>{`${host}/ideas-elfo/sin-tiempo`}</div>
        </div>
      </div>
    ),
    { width: 1000, height: 1500 },
  );
  const headers = new Headers(img.headers);
  headers.set('Cache-Control', 'public, max-age=86400');
  if (new URL(req.url).searchParams.has('descargar')) headers.set('Content-Disposition', 'attachment; filename="trastadas-elfo-sin-tiempo.png"');
  return new Response(img.body, { status: 200, headers });
}
