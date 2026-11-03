'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VerdictScene } from '@/components/features/VerdictScene';

type Props = Omit<React.ComponentProps<typeof VerdictScene>, 'onClose'>;

export function VerdictButton(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full bg-court-gold text-court-bg shadow-court-gold/30">
        Ver el veredicto de Papá Noel y los Reyes
      </Button>
      {open && <VerdictScene {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
