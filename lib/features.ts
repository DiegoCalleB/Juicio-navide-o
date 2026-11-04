/**
 * Interruptores de funcionalidad. Se leen al compilar (NEXT_PUBLIC_*), así que
 * hay que redeployar al cambiarlos.
 *
 * Fase 1b:
 *  - El niño puede mandar audios (activo por defecto; NEXT_PUBLIC_ENABLE_CHILD_AUDIO=0 lo apaga).
 *  - El personaje contesta con texto y fotos. Su respuesta con voz sintetizada
 *    (ElevenLabs) queda apagada: NEXT_PUBLIC_ENABLE_VOICE=1 la activa.
 */
export const CHILD_AUDIO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CHILD_AUDIO !== '0';
export const KING_VOICE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_VOICE === '1';
