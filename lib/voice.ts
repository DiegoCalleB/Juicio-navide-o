import 'server-only';
import type { CharacterId } from '@/lib/characters';
import { getElevenLabsKey } from '@/lib/env.server';

/**
 * Voces de la biblioteca de ElevenLabs. Se pueden cambiar SIN tocar código con
 * ELEVENLABS_VOICE_PAPA_NOEL, ELEVENLABS_VOICE_MELCHOR, ELEVENLABS_VOICE_GASPAR,
 * ELEVENLABS_VOICE_BALTASAR y ELEVENLABS_VOICE_RATON_PEREZ (el valor es el voice_id).
 */
const DEFAULT_VOICE_IDS: Record<CharacterId, string> = {
  papa_noel: 'Yb8JGzcZyW5YYzenhRCm', // El Abuelo Charlie – anciano cálido y calmado (acento latino; elegido por el cliente)
  melchor: 'GojDwihhnL1f7RrBuXsJ', // Luis – castellano, maduro, cálido (elegido)
  gaspar: 'ewZshglVwjWcMIuBYCCS', // Antonio Lobo – castellano (Madrid), grave y tranquilo (elegido)
  baltasar: 'orF2qy9215xjwqqxqsWW', // Rafael – castellano, cuentos y leyendas (elegido)
  raton_perez: 'CPv3Zr3CQCqE4ZzuCgBP', // Lulu – aguda, dulce y juguetona (acento latino; elegida por el cliente)
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
    dailyChars: num(process.env.VOICE_DAILY_CHAR_LIMIT, 150_000),
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

async function requestOnce(character: CharacterId, text: string): Promise<Response> {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceIdFor(character)}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': getElevenLabsKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL?.trim() || 'eleven_multilingual_v2',
      language_code: 'es',
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
}

/** Sintetiza la voz del personaje. Un reintento ante errores transitorios. */
export async function synthesizeKingVoice(
  character: CharacterId,
  rawText: string,
): Promise<{ audio: Buffer; seconds: number; spokenChars: number }> {
  const text = prepareSpeechText(rawText);
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
