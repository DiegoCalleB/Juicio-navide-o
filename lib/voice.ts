import 'server-only';
import { getRoyalEnv } from '@/lib/env.server';
import type { KingId } from '@/lib/royal';

/** Voces provisionales de la biblioteca de ElevenLabs (español peninsular / narrador). */
const VOICE_IDS: Record<KingId, string> = {
  melchor: 'GojDwihhnL1f7RrBuXsJ', // Luis – maduro, cálido
  gaspar: '7qXldmK3yFlWBHejdkpP', // Julio Alonso – grave, solemne
  baltasar: 'orF2qy9215xjwqqxqsWW', // Rafael – cuentos y leyendas
};

const BITRATE = 64_000;

export async function synthesizeKingVoice(king: KingId, text: string): Promise<{ audio: Buffer; seconds: number }> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[king]}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: { 'xi-api-key': getRoyalEnv().ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        language_code: 'es',
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
      }),
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}`);
  const audio = Buffer.from(await res.arrayBuffer());
  return { audio, seconds: Math.max(1, Math.round(((audio.length * 8) / BITRATE) * 10) / 10) };
}
