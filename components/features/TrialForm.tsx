'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTrialAction } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Honeypot } from '@/components/ui/Honeypot';
import { createTrialSchema } from '@/lib/schemas';
import { uploadEvidence } from '@/services/storage';

type Errors = Partial<Record<'defendantName' | 'charge' | 'sentence' | 'photo' | 'form', string>>;

export function TrialForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState({ defendantName: '', charge: '', sentence: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [trap, setTrap] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const check = createTrialSchema.safeParse({ ...values, photoPath: null, website: trap });
    if (!check.success) {
      const f = check.error.flatten().fieldErrors;
      setErrors({ defendantName: f.defendantName?.[0], charge: f.charge?.[0], sentence: f.sentence?.[0] });
      return;
    }
    startTransition(async () => {
      try {
        const photoPath = photo ? await uploadEvidence(photo) : null;
        const res = await createTrialAction({ ...values, photoPath, website: trap });
        if (res.ok) {
          router.push(`/juicio/${res.data.shortId}?nuevo=1`);
          return;
        }
        const f = res.error.fieldErrors ?? {};
        setErrors({
          defendantName: f.defendantName?.[0],
          charge: f.charge?.[0],
          sentence: f.sentence?.[0],
          form: res.error.message,
        });
      } catch (err) {
        setErrors({ photo: err instanceof Error ? err.message : 'Error con la foto.' });
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate className="relative space-y-4">
      <Field id="defendant" label="Acusado" placeholder="Mi cuñado Paco" maxLength={60}
        value={values.defendantName} onChange={set('defendantName')} error={errors.defendantName} />
      <Field id="charge" label="Delito" placeholder="Explicar criptomonedas durante el turrón" maxLength={200}
        value={values.charge} onChange={set('charge')} error={errors.charge} />
      <Field id="sentence" label="Condena" placeholder="Fregar todos los platos hasta Reyes" maxLength={200}
        value={values.sentence} onChange={set('sentence')} error={errors.sentence} />
      <div className="space-y-1.5">
        <label htmlFor="photo" className="block text-sm font-semibold text-court-snow/80">
          Foto del acusado (opcional)
        </label>
        <input id="photo" type="file" accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-court-card file:px-4 file:py-3 file:font-semibold file:text-court-snow" />
        {errors.photo && <p role="alert" className="text-sm text-court-red">{errors.photo}</p>}
      </div>
      <Honeypot value={trap} onChange={setTrap} />
      {errors.form && <p role="alert" className="text-sm text-court-red">{errors.form}</p>}
      <Button type="submit" loading={pending} className="w-full">
        Abrir juicio
      </Button>
    </form>
  );
}
