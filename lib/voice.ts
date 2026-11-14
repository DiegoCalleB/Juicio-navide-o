import 'server-only';
import type { CharacterId } from '@/lib/characters';
import { getElevenLabsKey } from '@/lib/env.server';

/**
 * Voces de la biblioteca de ElevenLabs. Se pueden cambiar SIN tocar código con
 * ELEVENLABS_VOICE_PAPA_NOEL, ELEVENLABS_VOICE_MELCHOR, ELEVENLABS_VOICE_GASPAR,
 * ELEVENLABS_VOICE_BALTASAR, ELEVENLABS_VOICE_RATON_PEREZ y ELEVENLABS_VOICE_DUENDE_CHISPA (el valor es el voice_id).
 */
/**
 * REGLA DEL PROYECTO: solo voces en castellano de España. Nunca acento latinoamericano.
 * (El Abuelo Charlie y Lulu se descartaron por eso.)
 */
const DEFAULT_VOICE_IDS: Record<CharacterId, string> = {
  papa_noel: '7qXldmK3yFlWBHejdkpP', // Julio Alonso – castellano, anciano, grave y con dicción perfecta (la más usada de las candidatas, 14-nov)
  melchor: 'GojDwihhnL1f7RrBuXsJ', // Luis – castellano, maduro, cálido (elegido)
  gaspar: 'ewZshglVwjWcMIuBYCCS', // Antonio Lobo – castellano (Madrid), grave y tranquilo (elegido)
  baltasar: 'orF2qy9215xjwqqxqsWW', // Rafael – castellano, cuentos y leyendas (elegido)
  duende_chispa: 'HMCmDsbKeaSZp5LMOYKR', // Johnny The Rogue – castellano, pícaro y burlón de dibujos (la más usada de las candidatas, 14-nov)
  raton_perez: '1eHrpOW5l98cxiSRjbzJ', // Raquel – castellana, joven, alegre y luminosa (la más usada de las candidatas, 14-nov)
};

const BITRATE = 64_000;
const TIMEOUT_MS = 25_000;

export type VoiceFailure = 'quota' | 'unavailable';

export class VoiceError extends Error {
  constructor(public readonly kind: VoiceFailure, detail?: string) {
    super(detail ? `${kind}: ${detail}` : kind);
  }
}

export function voiceIdFor(character: CharacterId): string {
  const override = process.env[`ELEVENLABS_VOICE_${character.toUpperCase()}`]?.trim();
  return override || DEFAULT_VOICE_IDS[character];
}

/** Límites de coste (configurables). */
export function voiceLimits(): { dailyChars: number; roomDailyReplies: number } {
  const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
  return {
    dailyChars: num(process.env.VOICE_DAILY_CHAR_LIMIT, 20_000), // ~210.000 créditos al mes en el plan Creator: que un día de mucho uso no gaste el mes
    roomDailyReplies: num(process.env.VOICE_ROOM_DAILY_LIMIT, 40),
  };
}

/** Quita lo que un sintetizador lee mal (emojis, símbolos de formato) y normaliza espacios. */
export function prepareSpeechText(input: string): string {
  return input
    .replace(/[\p{Extended_Pictographic}‍️]/gu, ' ')
    .replace(/[*_~`#<>[\]{}|\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Modelo: eleven_v3 (el más expresivo: risas, susurros, emoción). Se puede cambiar con ELEVENLABS_MODEL. */
export function voiceModel(): string {
  return process.env.ELEVENLABS_MODEL?.trim() || 'eleven_v3';
}

async function requestOnce(character: CharacterId, text: string): Promise<Response> {
  const model = voiceModel();
  // eleven_v3 solo admite estabilidad 0 / 0,5 / 1 y no usa style ni speaker_boost: se dejan sus valores por defecto.
  const settings = model.startsWith('eleven_v3') ? undefined : { stability: 0.5, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true };
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceIdFor(character)}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': getElevenLabsKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: model, language_code: 'es', ...(settings ? { voice_settings: settings } : {}) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
}

/** Sintetiza la voz del personaje. Un reintento ante errores transitorios. */
export async function synthesizeKingVoice(
  character: CharacterId,
  rawText: string,
  /** Texto propio con etiquetas de emoción ([risas], [susurra]…): no se limpia. Solo para frases internas, nunca texto de usuarios. */
  opts?: { trusted?: boolean },
): Promise<{ audio: Buffer; seconds: number; spokenChars: number }> {
  const text = opts?.trusted ? rawText.trim() : prepareSpeechText(rawText);
  if (!text) throw new VoiceError('unavailable', 'texto vacío tras limpiar');

  let res: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await requestOnce(character, text);
    } catch (err) {
      if (attempt === 1) throw new VoiceError('unavailable', err instanceof Error ? err.message : 'red');
      continue;
    }
    if (res.ok) break;
    if (res.status === 401 || res.status === 402 || res.status === 429) throw new VoiceError('quota', String(res.status));
    if (res.status < 500 || attempt === 1) throw new VoiceError('unavailable', String(res.status));
    await new Promise((r) => setTimeout(r, 600));
  }
  if (!res?.ok) throw new VoiceError('unavailable');

  const audio = Buffer.from(await res.arrayBuffer());
  if (audio.length < 200) throw new VoiceError('unavailable', 'audio vacío');
  return { audio, seconds: Math.max(1, Math.round(((audio.length * 8) / BITRATE) * 10) / 10), spokenChars: text.length };
}

/**
 * Primera frase del saludo con el nombre del niño ("¡Hola, Lucía!"). El resto del saludo está grabado
 * una sola vez por personaje en /public/voces/saludo/. El nombre se limpia: solo letras, espacios y guiones.
 */
export function greetingNameLine(character: CharacterId, childName: string): string | null {
  const name = childName.normalize('NFC').replace(/[^\p{L}\p{M}' -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!name) return null;
  if (character === 'papa_noel') return `[risas] ¡Jo, jo, jo! ¡Hola, ${name}!`;
  if (character === 'duende_chispa') return `[susurra] ¡Psss! ¡Hola, ${name}!`;
  return `¡Hola, ${name}!`;
}
