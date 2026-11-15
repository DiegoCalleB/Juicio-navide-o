import 'server-only';
import type { CharacterId } from '@/lib/characters';
import { isMemoryStore } from '@/services/room-store';

/**
 * Ayudante para escribir mensajes (Gemini). Los padres escriben una idea y se proponen 3 mensajes
 * con la voz del personaje. Privacidad: a Google NO se le envía el nombre del niño; el modelo escribe
 * «[nombre]» y el panel lo sustituye en el navegador de los padres.
 */

export const NAME_MARK = '[nombre]';
const MAX_LEN = 300;

const PERSONA: Record<CharacterId, string> = {
  papa_noel: 'Papá Noel: abuelo bondadoso del Polo Norte, ríe con «¡Jo, jo, jo!», habla de los renos, los elfos, el taller y la nieve.',
  melchor: 'el Rey Mago Melchor: sabio, cariñoso y solemne; viaja desde Oriente en camello siguiendo la estrella, con sus pajes.',
  gaspar: 'el Rey Mago Gaspar: cálido, cercano y con humor tranquilo; viaja desde Oriente en camello siguiendo la estrella, con sus pajes.',
  baltasar: 'el Rey Mago Baltasar: sereno, protector y muy cariñoso; viaja desde Oriente en camello siguiendo la estrella, con sus pajes.',
  raton_perez: 'el Ratoncito Pérez: pequeño, elegante y educado; vive en un castillo donde guarda con cariño los dientes de los niños.',
  duende_chispa: 'un elfo navideño travieso, divertido y cómplice; llega del Polo Norte, hace travesuras cada noche y se esconde en un sitio nuevo cada mañana.',
};

export function assistantEnabled(): boolean {
  return isAssistantFake() || (process.env.GEMINI_API_KEY ?? '').trim().length >= 10;
}

/** Pruebas automáticas: respuestas fijas, sin red (solo con el almacén en memoria). */
function isAssistantFake(): boolean {
  return process.env.GEMINI_FAKE === '1' && isMemoryStore();
}

export function assistantDailyLimit(): number {
  const n = Number(process.env.GEMINI_DAILY_LIMIT);
  return Number.isFinite(n) && n > 0 ? n : 3000;
}

export class AssistantError extends Error {}

export interface SuggestInput {
  character: CharacterId;
  /** Nombre del elfo (lo eligen los padres; no es un dato del niño). */
  elfName?: string | null;
  elfFemale?: boolean;
  readingLevel?: 'yes' | 'learning' | 'no' | string | null;
  idea: string;
}

function systemPrompt(i: SuggestInput): string {
  const who =
    i.character === 'duende_chispa'
      ? `${i.elfFemale ? 'una elfa navideña traviesa' : PERSONA.duende_chispa} Se llama ${i.elfName?.trim() || 'Chispa'}${i.elfFemale ? ' y habla en femenino' : ''}.`
      : PERSONA[i.character];
  const reading =
    i.readingLevel === 'learning'
      ? 'El niño está aprendiendo a leer: frases muy cortas y palabras muy sencillas.'
      : i.readingLevel === 'no'
        ? 'El niño todavía no lee: un adulto se lo leerá en voz alta o lo escuchará con voz; que suene bien dicho en voz alta.'
        : 'El niño ya lee: frases claras y cortas.';
  return [
    `Escribes mensajes de chat para un niño o una niña pequeños como si fueras ${who}`,
    'Escribe en castellano de España (tú, vosotros, expresiones de España; nunca de Latinoamérica). Papá Noel ríe «¡Jo, jo, jo!», nunca «Ho, ho, ho»; su reno es Rodolfo (no Rudolph).',
    'No sabes si es niño o niña: evita palabras con género sobre él o ella (nada de «campeón», «guapo», «listo»…); usa frases neutras.',
    `Cuando hables al niño usa exactamente la marca ${NAME_MARK} en lugar de su nombre (como mucho una vez por mensaje). No inventes nombres.`,
    `Cada mensaje: máximo ${MAX_LEN - 60} caracteres, cálido, mágico y divertido, en primera persona del personaje. Puede llevar un emoji como mucho.`,
    reading,
    'Normas: nada que dé miedo, culpa o vergüenza; no prometas regalos concretos; no pidas datos personales, fotos ni direcciones; sin enlaces; no menciones que eres una IA.',
    'Si la idea de los padres es inapropiada para un niño, escribe mensajes amables y neutros sobre la magia de estas fechas.',
    'Devuelve 3 propuestas distintas entre sí (una más tierna, una más divertida y una más breve).',
  ].join('\n');
}

function clean(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .trim()
    .slice(0, MAX_LEN);
}

export async function suggestMessages(input: SuggestInput): Promise<string[]> {
  const idea = input.idea.trim().slice(0, 300);
  if (isAssistantFake()) {
    return [`¡Hola, ${NAME_MARK}! Me han contado algo precioso: ${idea}. ¡Estoy muy orgulloso!`, `¡Qué notición, ${NAME_MARK}! ${idea} ✨`, `${idea}. ¡Bravo, ${NAME_MARK}!`].map(clean);
  }
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new AssistantError('sin clave');
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(input) }] },
      contents: [{ role: 'user', parts: [{ text: `Idea de los padres para el mensaje de hoy: «${idea}»` }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1500,
        responseMimeType: 'application/json',
        responseSchema: { type: 'OBJECT', properties: { mensajes: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['mensajes'] },
        // Pensar poco: responde en ~2 s y no se come el límite de texto.
        thinkingConfig: model.startsWith('gemini-2.5') ? { thinkingBudget: 0 } : { thinkingLevel: 'low' },
      },
    }),
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  if (!res.ok) throw new AssistantError(`gemini ${res.status}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  let list: unknown;
  try {
    list = (JSON.parse(text) as { mensajes?: unknown }).mensajes;
  } catch {
    throw new AssistantError('respuesta no válida');
  }
  const out = (Array.isArray(list) ? list : []).filter((x): x is string => typeof x === 'string').map(clean).filter((x) => x.length >= 8);
  if (out.length === 0) throw new AssistantError('sin propuestas');
  return out.slice(0, 3);
}
