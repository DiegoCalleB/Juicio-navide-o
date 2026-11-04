/**
 * Interruptores de funcionalidad. Se leen en build (NEXT_PUBLIC_*), por eso
 * hay que redeployar al cambiarlos.
 * Fase 1: solo texto y fotos. La voz se activa con NEXT_PUBLIC_ENABLE_VOICE=1.
 */
export const VOICE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_VOICE === '1';
