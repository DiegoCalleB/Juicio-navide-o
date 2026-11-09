import { z } from 'zod';
import { sanitizeText } from '@/lib/sanitize';
import { CHARACTER_IDS } from '@/lib/characters';
import { REPLY_DELAYS } from '@/lib/royal';

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



/** Honeypot: los humanos lo dejan vacío. */
const honeypot = z.string().max(0).optional();

export const createRoomSchema = z.object({
  childName: text(1, 30),
  characterId: z.enum(CHARACTER_IDS),
  /** Solo el elfo: nombre que le pone la familia y si es chico o chica. */
  characterAlias: text(1, 20).optional(),
  characterGender: z.enum(['m', 'f']).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: 'Necesitamos tu consentimiento' }) }),
  website: honeypot,
});

/** Los padres cambian el nombre y/o el personaje de la sala. */
export const roomEditSchema = z
  .object({
    childName: text(1, 30).optional(),
    characterId: z.enum(CHARACTER_IDS).optional(),
    characterAlias: text(1, 20).optional(),
    characterGender: z.enum(['m', 'f']).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), 'Nada que cambiar.');

/** Texto nuevo de un mensaje del personaje (vacío solo vale para un pie de foto). */
export const messageEditSchema = z.object({ text: z.string().max(300).transform((s) => s.trim()) });

export const childTextSchema = z.object({ text: text(1, 300) });

export const scheduledAtSchema = z
  .string()
  .datetime()
  .refine((v) => {
    const t = Date.parse(v) - Date.now();
    return t >= 60_000 && t <= 90 * 24 * 3_600_000;
  }, 'La fecha debe estar entre dentro de 1 minuto y 90 días.');

export const kingReplySchema = z.object({
  text: text(1, 300),
  mode: z.enum(['voice', 'text']).default('text'),
  surprise: z.boolean().optional(),
  /** Entrega programada: entre 1 minuto y 90 días desde ahora. */
  scheduledAt: scheduledAtSchema.optional(),
  delayMinutes: z.union([z.literal(REPLY_DELAYS[0]), z.literal(REPLY_DELAYS[1]), z.literal(REPLY_DELAYS[2]), z.literal(REPLY_DELAYS[3])]),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type KingReplyInput = z.infer<typeof kingReplySchema>;
