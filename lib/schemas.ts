import { z } from 'zod';
import { sanitizeText } from '@/lib/sanitize';
import { KING_IDS, REPLY_DELAYS } from '@/lib/royal';

const text = (min: number, max: number) =>
  z
    .string({ required_error: 'Obligatorio' })
    .max(max * 3, 'Demasiado largo') // corte duro previo a sanear
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(min, `Mínimo ${min} caracteres`)
        .max(max, `Máximo ${max} caracteres`),
    );

export const SHORT_ID_REGEX = /^[A-Za-z0-9]{8}$/;
export const PHOTO_PATH_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export const shortIdSchema = z.string().regex(SHORT_ID_REGEX);

/** Honeypot: los humanos lo dejan vacío. */
const honeypot = z.string().max(0).optional();

export const createTrialSchema = z.object({
  defendantName: text(2, 40),
  charge: text(5, 140),
  sentence: text(5, 140),
  photoPath: z.string().regex(PHOTO_PATH_REGEX).nullable().optional(),
  website: honeypot,
});

export const signTrialSchema = z.object({
  shortId: shortIdSchema,
  signerName: text(2, 30),
  website: honeypot,
});

export type CreateTrialInput = z.infer<typeof createTrialSchema>;
export type SignTrialInput = z.infer<typeof signTrialSchema>;

export const createRoomSchema = z.object({
  childName: text(1, 30),
  king: z.enum(KING_IDS),
  consent: z.literal(true, { errorMap: () => ({ message: 'Necesitamos tu consentimiento' }) }),
  website: honeypot,
});

export const kingReplySchema = z.object({
  text: text(1, 300),
  delayMinutes: z.union([z.literal(REPLY_DELAYS[0]), z.literal(REPLY_DELAYS[1]), z.literal(REPLY_DELAYS[2]), z.literal(REPLY_DELAYS[3])]),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type KingReplyInput = z.infer<typeof kingReplySchema>;
