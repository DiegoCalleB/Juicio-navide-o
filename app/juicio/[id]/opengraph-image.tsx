import { ImageResponse } from 'next/og';
import { shortIdSchema } from '@/lib/schemas';
import { getTrialByShortId } from '@/services/trials';

export const alt = 'Juicio Navideño';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 60;

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trial = shortIdSchema.safeParse(id).success ? await getTrialByShortId(id) : null;
  const name = trial?.defendantName ?? 'Juicio Navideño';
  const charge = trial ? `Acusado de: ${trial.charge}` : 'Crea tu juicio';
  const count = trial?.signatureCount ?? 0;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 80, background: '#0a1a12', color: '#f8fafc' }}>
        <div style={{ fontSize: 34, color: '#f4c542', letterSpacing: 6 }}>TRIBUNAL NAVIDEÑO</div>
        <div style={{ fontSize: 88, fontWeight: 800, marginTop: 24, lineHeight: 1.05 }}>{name}</div>
        <div style={{ fontSize: 44, marginTop: 24, color: '#cbd5e1' }}>{charge}</div>
        <div style={{ fontSize: 56, marginTop: 40, color: '#e5383b', fontWeight: 800 }}>
          {`${count} firmas de culpabilidad`}
        </div>
      </div>
    ),
    size,
  );
}
