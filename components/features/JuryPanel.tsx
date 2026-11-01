'use client';

import { Card } from '@/components/ui/Card';
import { FugitiveButton } from '@/components/features/FugitiveButton';
import { SIGN_INPUT_ID, SignForm } from '@/components/features/SignForm';

export function JuryPanel({ shortId, defendantName }: { shortId: string; defendantName: string }) {
  const goToSignature = () => {
    const el = document.getElementById(SIGN_INPUT_ID);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-1 text-lg font-extrabold">¿Eres {defendantName}? Apela.</h2>
        <p className="mb-3 text-sm text-court-snow/60">Declararte inocente es tu derecho. Alcanzar el botón, otro tema.</p>
        <FugitiveButton label="Soy inocente" surrenderLabel="Vale, soy culpable" onCaught={goToSignature} />
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Firma como jurado</h2>
        <SignForm shortId={shortId} />
      </Card>
    </div>
  );
}
