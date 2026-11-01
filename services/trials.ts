import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/lib/supabase/server';
import { photoPublicUrl } from '@/services/storage';
import type { Signature, Trial } from '@/types';
import type { CreateTrialInput, SignTrialInput } from '@/lib/schemas';

const TRIAL_COLUMNS = 'id, short_id, defendant_name, charge, sentence, photo_path, signature_count, created_at';

export type MutationOutcome = 'ok' | 'duplicate' | 'rate_limited' | 'not_found' | 'error';

/** Deduplicado por request (generateMetadata + page + OG image). */
export const getTrialByShortId = cache(async (shortId: string): Promise<Trial | null> => {
  const { data, error } = await getServerClient()
    .from('trials')
    .select(TRIAL_COLUMNS)
    .eq('short_id', shortId)
    .maybeSingle();
  if (error || !data) return null;
  return toTrial(data);
});

function toTrial(data: {
  id: string; short_id: string; defendant_name: string; charge: string; sentence: string;
  photo_path: string | null; signature_count: number; created_at: string;
}): Trial {
  return {
    id: data.id,
    shortId: data.short_id,
    defendantName: data.defendant_name,
    charge: data.charge,
    sentence: data.sentence,
    photoUrl: data.photo_path ? photoPublicUrl(data.photo_path) : null,
    signatureCount: data.signature_count,
    createdAt: data.created_at,
  };
}

/** Juicios con más firmas (prueba social + descubrimiento en portada). */
export async function getTopTrials(limit = 5): Promise<Trial[]> {
  const { data, error } = await getServerClient()
    .from('trials')
    .select(TRIAL_COLUMNS)
    .gt('signature_count', 0)
    .order('signature_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(toTrial);
}

export async function getRecentSignatures(trialId: string, limit = 30): Promise<Signature[]> {
  const { data, error } = await getServerClient()
    .from('signatures')
    .select('id, signer_name, created_at')
    .eq('trial_id', trialId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({ id: r.id, signerName: r.signer_name, createdAt: r.created_at }));
}

function classify(error: { code?: string; message: string }): MutationOutcome {
  if (error.code === '23505') return 'duplicate';
  if (error.message.includes('RATE_LIMIT')) return 'rate_limited';
  if (error.code === '23503') return 'not_found';
  return 'error';
}

export async function insertTrial(
  input: CreateTrialInput,
  shortId: string,
  creatorHash: string,
): Promise<MutationOutcome> {
  const { error } = await getServerClient().from('trials').insert({
    short_id: shortId,
    defendant_name: input.defendantName,
    charge: input.charge,
    sentence: input.sentence,
    photo_path: input.photoPath ?? null,
    creator_hash: creatorHash,
  });
  return error ? classify(error) : 'ok';
}

export async function insertSignature(input: SignTrialInput, fingerprint: string): Promise<MutationOutcome> {
  const trial = await getTrialByShortId(input.shortId);
  if (!trial) return 'not_found';
  const { error } = await getServerClient()
    .from('signatures')
    .insert({ trial_id: trial.id, signer_name: input.signerName, fingerprint_hash: fingerprint });
  return error ? classify(error) : 'ok';
}
