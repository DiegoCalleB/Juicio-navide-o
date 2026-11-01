import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Tribunal } from '@/components/features/Tribunal';
import { clientEnv } from '@/lib/env';
import { shortIdSchema } from '@/lib/schemas';
import { getRecentSignatures, getTrialByShortId } from '@/services/trials';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}

export const revalidate = 15; // ISR: absorbe picos de tráfico viral sin machacar la BD

async function loadTrial(id: string) {
  if (!shortIdSchema.safeParse(id).success) return null;
  return getTrialByShortId(id);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const trial = await loadTrial((await params).id);
  if (!trial) return { title: 'Juicio no encontrado' };
  const title = `Juicio a ${trial.defendantName}`;
  const description = `Acusado de: ${trial.charge}. ${trial.signatureCount} firmas de culpabilidad. ¡Firma tú también!`;
  return { title, description, openGraph: { title, description }, twitter: { title, description } };
}

export default async function TrialPage({ params, searchParams }: PageProps) {
  const trial = await loadTrial((await params).id);
  if (!trial) notFound();
  const isNew = (await searchParams).nuevo === '1';
  const signatures = await getRecentSignatures(trial.id);
  const shareUrl = `${clientEnv.NEXT_PUBLIC_SITE_URL}/juicio/${trial.shortId}`;
  return <Tribunal trial={trial} signatures={signatures} shareUrl={shareUrl} isNew={isNew} />;
}
