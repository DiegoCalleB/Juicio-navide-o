'use server';

import { appError } from '@/lib/errors';
import { createRoomSchema } from '@/lib/schemas';
import { getClientFingerprint, rateLimit } from '@/lib/security';
import { createRoom, RoomError } from '@/services/rooms';
import type { ActionResult } from '@/types';

export async function createRoomAction(raw: unknown): Promise<ActionResult<{ childToken: string; parentToken: string; plan: 'free' | 'trial' | 'pass' }>> {
  try {
    const parsed = createRoomSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: appError('VALIDATION', parsed.error.flatten().fieldErrors) };
    if (parsed.data.website) return { ok: false, error: appError('SPAM') };

    const fp = await getClientFingerprint();
    if (!rateLimit(`room:${fp}`, 5, 60_000)) return { ok: false, error: appError('RATE_LIMITED') };

    const tokens = await createRoom(
      { childName: parsed.data.childName, characterId: parsed.data.characterId, characterAlias: parsed.data.characterAlias, characterGender: parsed.data.characterGender, readingLevel: parsed.data.readingLevel, passToken: parsed.data.passToken },
      fp,
    );
    return { ok: true, data: tokens };
  } catch (err) {
    if (err instanceof RoomError && err.code === 'RATE_LIMITED') return { ok: false, error: appError('RATE_LIMITED') };
    if (err instanceof RoomError && err.code === 'TRIAL_USED') {
      return { ok: false, error: appError('TRIAL_USED') };
    }
    console.error('[createRoomAction]', err);
    return { ok: false, error: appError('UNKNOWN') };
  }
}
