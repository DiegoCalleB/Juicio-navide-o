import 'server-only';
import { isMemoryStore } from '@/services/room-store';

/**
 * Hora de la web. En producción siempre es la real. Con el almacén en memoria (solo desarrollo y pruebas)
 * se puede fijar con FAKE_NOW=ISO para probar la portada de temporada, las campañas y los precios.
 */
export function siteNow(): Date {
  const fake = process.env.FAKE_NOW;
  if (fake && isMemoryStore()) {
    const d = new Date(fake);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
