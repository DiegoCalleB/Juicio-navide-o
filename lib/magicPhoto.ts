import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CharacterId } from '@/lib/characters';
import { isMemoryStore } from '@/services/room-store';

/**
 * «✨ Convertir en escena mágica»: el dibujo, la carta o el juguete que manda el niño se convierte en una
 * ilustración con el personaje (Gemini). Privacidad: solo dibujos y objetos; si aparece una persona real,
 * no se transforma. La imagen se envía a Google solo para esto y no se guarda allí desde nuestra parte.
 */

export class MagicError extends Error {
  constructor(public readonly kind: 'person' | 'unavailable' | 'refused', detail?: string) {
    super(detail ?? kind);
  }
}

export function magicEnabled(): boolean {
  return isMagicFake() || (process.env.GEMINI_API_KEY ?? '').trim().length >= 10;
}
function isMagicFake(): boolean {
  return process.env.GEMINI_FAKE === '1' && isMemoryStore();
}
export function magicLimits(): { roomDaily: number; trialDaily: number; globalDaily: number } {
  const num = (v: string | undefined, d: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
  return { roomDaily: num(process.env.MAGIC_ROOM_DAILY, 5), trialDaily: num(process.env.MAGIC_TRIAL_DAILY, 1), globalDaily: num(process.env.MAGIC_DAILY_LIMIT, 200) };
}

const WHO: Record<CharacterId, string> = {
  papa_noel: 'Santa Claus (Papá Noel), a jolly kind old man with a white beard and red suit',
  melchor: 'the Wise King Melchior (one of the Three Wise Men), with a crown, rich robes and a long white beard',
  gaspar: 'the Wise King Caspar (one of the Three Wise Men), with a crown, rich robes and a brown beard',
  baltasar: 'the Wise King Balthazar (one of the Three Wise Men), with a crown and rich robes',
  raton_perez: 'Ratoncito Pérez, a small elegant mouse with a tiny crown and glasses who collects children\'s teeth in his castle',
  duende_chispa: 'Chispa, the red felt Christmas elf shown in the reference image (same face, outfit and colours)',
};

const key = () => process.env.GEMINI_API_KEY?.trim() ?? '';

async function gemini(model: string, body: unknown, timeoutMs: number): Promise<{ parts: { text?: string; inlineData?: { mimeType: string; data: string } }[]; finish?: string }> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store',
  });
  if (!res.ok) throw new MagicError('unavailable', `gemini ${res.status}`);
  const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; inlineData?: { mimeType: string; data: string } }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  if (j.promptFeedback?.blockReason) throw new MagicError('refused', j.promptFeedback.blockReason);
  const c = j.candidates?.[0];
  return { parts: c?.content?.parts ?? [], finish: c?.finishReason };
}

/** ¿Sale una persona real? (foto, no dibujo). Ante la duda, se considera que sí. */
async function containsRealPerson(image: Buffer, mime: string): Promise<boolean> {
  const out = await gemini(
    process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
    {
      contents: [
        {
          role: 'user',
          parts: [
            { inline_data: { mime_type: mime, data: image.toString('base64') } },
            { text: 'Does this image show a real human being (a photograph of a real person, their face, or a recognisable part of their body such as hands)? Drawings, paintings, letters, toys, dolls and objects do NOT count. Answer in JSON.' },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 400,
        responseMimeType: 'application/json',
        responseSchema: { type: 'OBJECT', properties: { real_person: { type: 'BOOLEAN' }, kind: { type: 'STRING' } }, required: ['real_person'] },
        thinkingConfig: { thinkingLevel: 'low' },
      },
    },
    25_000,
  );
  try {
    return (JSON.parse(out.parts.map((p) => p.text ?? '').join('')) as { real_person?: boolean }).real_person !== false;
  } catch {
    return true;
  }
}

export async function makeMagicScene(input: { image: Buffer; mime: string; character: CharacterId; elfFemale?: boolean }): Promise<Buffer> {
  if (isMagicFake()) {
    const sharp = (await import('sharp')).default;
    return sharp(input.image).resize(768, 768, { fit: 'cover' }).modulate({ saturation: 1.4 }).tint({ r: 255, g: 220, b: 160 }).jpeg({ quality: 80 }).toBuffer();
  }
  if (!key()) throw new MagicError('unavailable', 'sin clave');
  if (await containsRealPerson(input.image, input.mime)) throw new MagicError('person');

  const who = input.character === 'duende_chispa' && input.elfFemale ? 'a cheerful red felt Christmas elf girl with freckles, ginger hair and a pointy red hat' : WHO[input.character];
  const parts: unknown[] = [{ inline_data: { mime_type: input.mime, data: input.image.toString('base64') } }];
  if (input.character === 'duende_chispa' && !input.elfFemale) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: readFileSync(path.join(process.cwd(), 'assets', 'personajes', 'chispa.jpg')).toString('base64') } });
  }
  parts.push({
    text:
      `The first image is something a young child sent (a drawing, letter, craft or toy). Turn it into a magical, heart-warming storybook illustration: ` +
      `bring the child's creation to life: its elements become real handmade-felt objects in the scene, clearly recognisable (same subjects, shapes and colours), and add ${who} happily playing with them or admiring them, in a cosy magical Christmas setting with soft sparkles. ` +
      `Soft 3D handmade-felt storybook style, warm light, 4:3 landscape. Do not add any real people or children. ABSOLUTELY NO text, letters or words anywhere.`,
  });
  const out = await gemini(
    process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-3.1-flash-image',
    { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '4:3' } } },
    90_000,
  );
  const img = out.parts.find((p) => p.inlineData?.data);
  if (!img?.inlineData) throw new MagicError('refused', out.finish ?? 'sin imagen');
  return Buffer.from(img.inlineData.data, 'base64');
}
