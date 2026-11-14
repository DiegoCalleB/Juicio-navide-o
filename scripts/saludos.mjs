#!/usr/bin/env node
// Genera los audios fijos del saludo inicial (uno por personaje) con ElevenLabs:
//   public/voces/saludo/<personaje>.mp3       → el cuerpo del saludo (igual para todos los niños)
//   public/voces/saludo/<personaje>-hola.mp3  → "¡Hola!" sin nombre (respaldo si no se puede generar el nombre)
// El "¡Hola, Lucía!" con el nombre lo genera el servidor la primera vez que el niño abre el sello.
//   ELEVENLABS_API_KEY=... node scripts/saludos.mjs [personaje]
import { mkdirSync, writeFileSync } from 'node:fs';

const VOICES = {
  papa_noel: '7qXldmK3yFlWBHejdkpP',
  duende_chispa: 'HMCmDsbKeaSZp5LMOYKR',
  raton_perez: '1eHrpOW5l98cxiSRjbzJ',
  melchor: 'GojDwihhnL1f7RrBuXsJ',
  gaspar: 'ewZshglVwjWcMIuBYCCS',
  baltasar: 'orF2qy9215xjwqqxqsWW',
};
const HOLA = {
  papa_noel: '[risas] ¡Jo, jo, jo! ¡Hola!',
  duende_chispa: '[susurra] ¡Psss! ¡Hola!',
  raton_perez: '¡Hola!',
  melchor: '¡Hola!',
  gaspar: '¡Hola!',
  baltasar: '¡Hola!',
};
const BODY = {
  papa_noel: '[cálido] ¡Qué alegría que hayas abierto mi mensaje! Aquí en el Polo Norte no para de nevar, y los renos y yo estábamos deseando hablar contigo. Escríbeme cuando quieras: te leo siempre.',
  duende_chispa: '[risita] ¡Por fin te encuentro! He llegado esta noche desde el Polo Norte, y vengo con muchísimas ganas de travesuras. Cada mañana me esconderé en un sitio nuevo… ¿serás capaz de encontrarme?',
  raton_perez: 'Soy el Ratoncito Pérez. [emocionado] ¡Qué ilusión que me escribas! Desde mi castillo cuido con muchísimo cariño los dientes de todos los niños. Si se te mueve alguno, cuéntamelo: aquí estaré.',
  melchor: 'Soy el Rey Melchor. Venimos desde Oriente con nuestros camellos, siguiendo la estrella, y he leído tu carta con muchísima atención. Escríbeme cuando quieras: los pajes me traen tus mensajes al momento.',
  gaspar: 'Soy el Rey Gaspar. Hemos cruzado el desierto siguiendo la estrella, y mi camello no deja de preguntar por ti. He leído tu carta con muchísimo cariño. Escríbeme cuando quieras: aquí estoy.',
  baltasar: 'Soy el Rey Baltasar. [cálido] Desde Oriente, bajo la luz de la estrella, he leído tu carta con muchísima ilusión. Mis pajes me traerán todos tus mensajes. Escríbeme cuando quieras.',
};

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error('Falta ELEVENLABS_API_KEY');
const only = process.argv[2];
mkdirSync('public/voces/saludo', { recursive: true });

async function tts(voice, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_v3', language_code: 'es' }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

for (const id of Object.keys(VOICES).filter((k) => !only || k === only)) {
  writeFileSync(`public/voces/saludo/${id}.mp3`, await tts(VOICES[id], BODY[id]));
  writeFileSync(`public/voces/saludo/${id}-hola.mp3`, await tts(VOICES[id], HOLA[id]));
  console.log('✓', id);
}
