'use client';

import { useEffect } from 'react';
import { getJudge, getVerdict } from '@/lib/verdict';
import { ShareButtons } from '@/components/features/ShareButtons';

interface VerdictSceneProps {
  shortId: string;
  defendantName: string;
  charge: string;
  sentence: string;
  signatureCount: number;
  shareUrl: string;
  onClose: () => void;
}

const FLAKES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 53) % 100}%`,
  size: 4 + (i % 4) * 2,
  duration: 6 + (i % 5) * 2,
  delay: -((i * 7) % 10),
}));

export function VerdictScene({ shortId, defendantName, charge, sentence, signatureCount, shareUrl, onClose }: VerdictSceneProps) {
  const verdict = getVerdict(signatureCount);
  const judge = getJudge(shortId);
  const guilty = verdict === 'culpable';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const who = judge === 'noel' ? 'Papá Noel' : 'Sus Majestades los Reyes Magos';
  const opening = judge === 'noel' ? '¡Jo, jo, jo!' : '¡Por los camellos de Oriente!';
  const speech = guilty
    ? `${opening} Tras oír al jurado, ${defendantName} es CULPABLE de: ${charge}. Condena: ${sentence}.`
    : `${opening} No hay pruebas suficientes. ${defendantName} queda INOCENTE… por esta vez.`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Veredicto" className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#1a0a0a] via-[#0a1a12] to-[#0a1a12]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLAKES.map((f, i) => (
          <span key={i} className="anim-snow absolute top-0 rounded-full bg-white/80"
            style={{ left: f.left, width: f.size, height: f.size, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }} />
        ))}
      </div>

      <button onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 z-10 size-11 rounded-full bg-white/10 text-xl">×</button>

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5 py-10 text-center">
        <p className="anim-fade-up text-xs font-bold uppercase tracking-widest text-court-gold" style={{ animationDelay: '0.1s' }}>
          El tribunal ha deliberado
        </p>

        <div className="anim-judge-in text-8xl" style={{ animationDelay: '0.5s' }} aria-hidden>
          {judge === 'noel' ? '🎅' : '🤴🏻🤴🏽🤴🏿'}
        </div>
        <p className="anim-fade-up font-extrabold" style={{ animationDelay: '1s' }}>{who} dicta sentencia</p>

        <div className="anim-fade-up relative rounded-3xl bg-white px-5 py-4 text-left text-base font-semibold leading-snug text-court-bg shadow-xl" style={{ animationDelay: '1.5s' }}>
          {speech}
          <span aria-hidden className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-white" />
        </div>

        <div aria-hidden className="anim-gavel text-6xl">🔨</div>

        <div className={guilty ? 'anim-shake' : ''}>
          <p className={`anim-stamp inline-block rounded-xl border-[6px] px-6 py-2 text-4xl font-black uppercase tracking-widest ${guilty ? 'border-court-red text-court-red' : 'border-court-gold text-court-gold'}`}>
            {guilty ? 'Culpable' : 'Inocente'}
          </p>
        </div>

        <div className="anim-fade-up w-full space-y-3 pt-2" style={{ animationDelay: '4s' }}>
          <ShareButtons url={shareUrl} text={`${who} ha dictado sentencia sobre ${defendantName}: ${guilty ? 'CULPABLE' : 'INOCENTE'}.`} />
        </div>
      </div>
    </div>
  );
}
