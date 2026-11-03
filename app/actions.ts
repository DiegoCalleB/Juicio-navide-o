'use server';

import { revalidatePath } from 'next/cache';
import { appError } from '@/lib/errors';
import { createTrialSchema, signTrialSchema } from '@/lib/schemas';
import { generateShortId, getClientFingerprint, rateLimit } from '@/lib/security';
import { insertSignature, insertTrial, type MutationOutcome } from '@/services/trials';
import type { ActionResult } from '@/types';

function failure(outcome: Exclude<MutationOutcome, 'ok'>): ActionResult<never> {
  switch (outcome) {
    case 'duplicate':
      return { ok: false, error: appError('DUPLICATE') };
    case 'rate_limited':
      return { ok: false, error: appError('RATE_LIMITED') };
    case 'not_found':
      return { ok: false, error: appError('NOT_FOUND') };
    case 'error':
      return { ok: false, error: appError('UNKNOWN') };
  }
}

async function safely<T>(name: string, fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[${name}]`, err);
    return { ok: false, error: appError('UNKNOWN') };
  }
}

export async function createTrialAction(raw: unknown): Promise<ActionResult<{ shortId: string }>> {
  return safely('createTrialAction', () => createTrial(raw));
}

export async function signTrialAction(raw: unknown): Promise<ActionResult<{ shortId: string }>> {
  return safely('signTrialAction', () => signTrial(raw));
}

async function createTrial(raw: unknown): Promise<ActionResult<{ shortId: string }>> {
  const parsed = createTrialSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: appError('VALIDATION', parsed.error.flatten().fieldErrors) };
  if (parsed.data.website) return { ok: false, error: appError('SPAM') };

  const fingerprint = await getClientFingerprint();
  if (!rateLimit(`create:${fingerprint}`, 3, 60_000)) return { ok: false, error: appError('RATE_LIMITED') };

  for (let attempt = 0; attempt < 3; attempt++) {
    const shortId = generateShortId();
    const outcome = await insertTrial(parsed.data, shortId, fingerprint);
    if (outcome === 'ok') return { ok: true, data: { shortId } };
    if (outcome !== 'duplicate') return failure(outcome); // 'duplicate' = colisión de short_id → reintento
  }
  return { ok: false, error: appError('UNKNOWN') };
}

async function signTrial(raw: unknown): Promise<ActionResult<{ shortId: string }>> {
  const parsed = signTrialSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: appError('VALIDATION', parsed.error.flatten().fieldErrors) };
  if (parsed.data.website) return { ok: false, error: appError('SPAM') };

  const fingerprint = await getClientFingerprint();
  if (!rateLimit(`sign:${fingerprint}`, 10, 60_000)) return { ok: false, error: appError('RATE_LIMITED') };

  const outcome = await insertSignature(parsed.data, fingerprint);
  if (outcome !== 'ok') return failure(outcome);

  revalidatePath(`/juicio/${parsed.data.shortId}`);
  return { ok: true, data: { shortId: parsed.data.shortId } };
}
