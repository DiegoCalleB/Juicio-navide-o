import Link from 'next/link';
import { TrialForm } from '@/components/features/TrialForm';
import { Card } from '@/components/ui/Card';
import { getTopTrials } from '@/services/trials';

export const revalidate = 30;

export default async function HomePage() {
  const top = await getTopTrials(5);
  return (
    <div className="space-y-6">
      <header className="pt-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-court-gold">Edición Navidad</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Juicio Navideño</h1>
        <p className="mt-3 text-court-snow/70">
          Acusa a tu cuñado, tu suegra o al del amigo invisible. Comparte el enlace y que el jurado decida.
        </p>
      </header>
      <Card>
        <TrialForm />
      </Card>
      {top.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Juicios más calientes</h2>
          <ul className="space-y-2">
            {top.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/juicio/${t.shortId}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-court-bg px-4 py-3 active:scale-[0.98]"
                >
                  <span className="min-w-0 break-words text-sm font-semibold">{t.defendantName}</span>
                  <span className="shrink-0 text-sm font-black tabular-nums text-court-red">{t.signatureCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
