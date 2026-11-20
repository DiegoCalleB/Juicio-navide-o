import { ImageResponse } from 'next/og';
import { getSiteUrl } from '@/lib/site';

export const alt = 'Las 24 mejores trastadas del elfo travieso';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  const host = new URL(getSiteUrl()).host;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '70px 90px', background: 'linear-gradient(135deg, #0f3b2a 0%, #160a2b 60%, #2a0f4a 100%)', color: '#fff6dc' }}>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 8, color: '#7ee2a8', textTransform: 'uppercase' }}>Ideas gratis para Navidad</div>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 26 }}>Las 24 mejores trastadas del elfo travieso</div>
        <div style={{ display: 'flex', fontSize: 38, marginTop: 28, color: '#d9cfe8', maxWidth: 980 }}>Los clásicos de internet, paso a paso: tirolina, pesca en el váter, la puerta envuelta… y el mensaje del elfo para cada mañana.</div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 'auto', paddingTop: 24, color: '#f6d77a' }}>{`Línea Mágica · ${host}/ideas-elfo`}</div>
      </div>
    ),
    size,
  );
}
