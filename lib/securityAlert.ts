import 'server-only';
import { mailEnabled, sendMail } from '@/lib/mail';
import { secEvent } from '@/lib/securityLog';

/**
 * Alertas de seguridad al dueño: además de escribir el evento en los logs, manda un correo (a SECURITY_ALERT_EMAIL)
 * cuando ocurre algo que merece mirarse. Frenado para no llenar el buzón: un correo por tipo de evento cada hora
 * y 10 al día. Sin datos personales ni enlaces: solo qué pasó y cuándo.
 */
const TITLES: Record<string, string> = {
  stripe_firma_invalida: 'Aviso de pago de Stripe con firma no válida',
  cron_no_autorizado: 'Intento no autorizado a la limpieza diaria',
  metricas_clave_incorrecta: 'Clave incorrecta en el panel de métricas',
  pin_bloqueo: 'Un PIN se ha bloqueado por intentos fallidos',
  puerta_bloqueo: 'La puerta de la cuenta se ha bloqueado por intentos fallidos',
};

const last = new Map<string, number>();
let day = '';
let sentToday = 0;

export function secAlert(event: string, detail: Record<string, string | number | boolean | null | undefined> = {}): void {
  secEvent(event, detail);
  const to = process.env.SECURITY_ALERT_EMAIL?.trim().toLowerCase();
  const title = TITLES[event];
  if (!to || !title || !mailEnabled()) return;
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  if (day !== today) {
    day = today;
    sentToday = 0;
  }
  if (sentToday >= 10 || now - (last.get(event) ?? 0) < 3_600_000) return;
  last.set(event, now);
  sentToday++;
  const when = new Date(now).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  const extra = Object.entries(detail).map(([k, v]) => `${k}: ${String(v)}`).join(' · ');
  const text = `${title}.\n\nCuándo: ${when} (hora de Madrid)${extra ? `\nDetalle: ${extra}` : ''}\n\nMás información en los logs de Railway: filtra por «[security]». Si no reconoces la actividad, cambia las claves afectadas y revisa los accesos.\n\nNo recibirás otro aviso de este tipo durante una hora.`;
  const html = `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`;
  void sendMail({ to, subject: `[Línea Mágica] Alerta: ${title}`, text, html }).catch(() => {});
}
