'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signTrialAction } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Honeypot } from '@/components/ui/Honeypot';
import { signTrialSchema } from '@/lib/schemas';

export const SIGN_INPUT_ID = 'sign-name';

export function SignForm({ shortId }: { shortId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [trap, setTrap] = useState('');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const payload = { shortId, signerName: name, website: trap };
    const check = signTrialSchema.safeParse(payload);
    if (!check.success) {
      setError(check.error.flatten().fieldErrors.signerName?.[0] ?? 'Datos no válidos');
      return;
    }
    startTransition(async () => {
      const res = await signTrialAction(payload);
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(res.error.fieldErrors?.signerName?.[0] ?? res.error.message);
        if (res.error.code === 'DUPLICATE') setDone(true);
      }
    });
  };

  if (done) {
    return (
      <p role="status" className="animate-pop rounded-2xl bg-court-red/15 p-4 text-center font-bold">
        Firmado. El acusado ya es culpable.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative space-y-3">
      <Field
        id={SIGN_INPUT_ID}
        label="Tu nombre (jurado)"
        placeholder="Tía Mari"
        maxLength={60}
        autoComplete="given-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error}
      />
      <Honeypot value={trap} onChange={setTrap} />
      <Button type="submit" loading={pending} className="w-full">
        Firmar: CULPABLE
      </Button>
    </form>
  );
}
