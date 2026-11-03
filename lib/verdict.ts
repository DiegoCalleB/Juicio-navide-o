export type Verdict = 'culpable' | 'inocente';
export type Judge = 'noel' | 'reyes';

export const VERDICT_THRESHOLD = 10;

export function getVerdict(signatureCount: number): Verdict {
  return signatureCount >= VERDICT_THRESHOLD ? 'culpable' : 'inocente';
}

/** Determinista por juicio: mismo enlace, mismo juez. */
export function getJudge(shortId: string): Judge {
  let sum = 0;
  for (const ch of shortId) sum += ch.charCodeAt(0);
  return sum % 2 === 0 ? 'noel' : 'reyes';
}
