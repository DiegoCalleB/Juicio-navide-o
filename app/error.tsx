'use client';

import { Button } from '@/components/ui/Button';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="my-auto space-y-4 text-center">
      <h1 className="text-2xl font-extrabold">El tribunal se ha quedado sin luz</h1>
      <p className="text-court-snow/70">Fallo de red o de servidor. Tus datos no se han perdido.</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
