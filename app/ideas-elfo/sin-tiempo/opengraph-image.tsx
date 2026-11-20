import { ImageResponse } from 'next/og';
import { getSiteUrl } from '@/lib/site';

export const alt = '15 trastadas del elfo para cuando no hay tiempo';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  const host = new URL(getSiteUrl()).host;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '70px 90px', background: 'linear-gradient(135deg, #3a250a 0%, #160a2b 55%, #2a0f4a 100%)', color: '#fff6dc' }}>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 8, color: '#f6d77a', textTransform: 'uppercase' }}>Plan de emergencia</div>
        <div style={{ display: 'flex', fontSize: 74, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>15 trastadas del elfo para cuando se te ha olvidado</div>
        <div style={{ display: 'flex', fontSize: 36, marginTop: 26, color: '#d9cfe8' }}>Menos de un minuto, sin material y con el mensaje del elfo.</div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 'auto', paddingTop: 24, color: '#f6d77a' }}>{`Línea Mágica · ${host}/ideas-elfo/sin-tiempo`}</div>
      </div>
    ),
    size,
  );
}
