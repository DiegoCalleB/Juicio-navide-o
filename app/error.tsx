'use client';

import { Button } from '@/components/ui/Button';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="my-auto space-y-4 text-center">
      <h1 className="text-2xl font-extrabold">Algo ha fallado</h1>
      <p className="text-court-snow/70">Ha habido un problema de conexión o del servidor. Inténtalo de nuevo.</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
