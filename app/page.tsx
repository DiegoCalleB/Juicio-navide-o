import { TrialForm } from '@/components/features/TrialForm';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
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
    </div>
  );
}
