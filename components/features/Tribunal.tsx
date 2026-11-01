import { Card } from '@/components/ui/Card';
import { JuryPanel } from '@/components/features/JuryPanel';
import { ShareButtons } from '@/components/features/ShareButtons';
import type { Signature, Trial } from '@/types';

interface TribunalProps {
  trial: Trial;
  signatures: Signature[];
  shareUrl: string;
  isNew?: boolean;
}

export const VERDICT_THRESHOLD = 10;

/** Server Component: React escapa todo el texto de usuario (sin dangerouslySetInnerHTML). */
export function Tribunal({ trial, signatures, shareUrl, isNew = false }: TribunalProps) {
  return (
    <div className="space-y-4">
      {isNew && (
        <p role="status" className="animate-pop rounded-2xl bg-court-gold px-4 py-3 text-center font-bold text-court-bg">
          Juicio abierto. Compártelo ahora para reunir al jurado.
        </p>
      )}
      <Card className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-court-gold">Tribunal Navideño</p>
        {trial.photoUrl && (
          <img
            src={trial.photoUrl}
            alt={`Foto de ${trial.defendantName}`}
            width={160}
            height={160}
            decoding="async"
            className="mx-auto mt-4 size-40 rounded-full border-4 border-court-gold object-cover"
          />
        )}
        <h1 className="mt-4 break-words text-2xl font-extrabold">{trial.defendantName}</h1>
        <p className="mt-2 break-words text-court-snow/80">
          Acusado de: <strong className="text-court-snow">{trial.charge}</strong>
        </p>
        <p className="mt-1 break-words text-court-snow/80">
          Condena pedida: <strong className="text-court-gold">{trial.sentence}</strong>
        </p>
        <p className="mt-4 text-4xl font-black tabular-nums text-court-red">{trial.signatureCount}</p>
        <p className="text-xs uppercase tracking-wider text-court-snow/50">firmas de culpabilidad</p>
        {trial.signatureCount >= VERDICT_THRESHOLD ? (
          <p className="mt-4 inline-block -rotate-3 rounded-lg border-4 border-court-red px-4 py-1 text-xl font-black uppercase tracking-widest text-court-red">
            Culpable · Sentencia firme
          </p>
        ) : (
          <p className="mt-3 text-xs text-court-snow/50">
            Faltan {VERDICT_THRESHOLD - trial.signatureCount} firmas para la sentencia firme
          </p>
        )}
      </Card>

      <ShareButtons
        url={shareUrl}
        text={`${trial.defendantName} está siendo juzgado por: ${trial.charge}. ¡Firma como jurado!`}
      />

      <JuryPanel shortId={trial.shortId} defendantName={trial.defendantName} />

      {signatures.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-extrabold">Jurado</h2>
          <ul className="space-y-2">
            {signatures.map((s) => (
              <li key={s.id} className="break-words rounded-xl bg-court-bg px-4 py-2 text-sm">
                {s.signerName} <span className="text-court-red">firmó culpable</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
