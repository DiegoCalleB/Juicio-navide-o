/**
 * Plantillas de correo. Van a la persona adulta que cuida de la cuenta: sin nombres de niños, sin explicar la magia
 * y sin nada que un peque pueda leer por encima del hombro en una notificación (asunto neutro).
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const shell = (title: string, body: string, footer: string) =>
  `<!doctype html><html lang="es"><body style="margin:0;background:#0a1220;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e8f1ff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#111c33;border-radius:16px;padding:24px">
<tr><td><p style="margin:0 0 12px;font-size:20px;font-weight:800;color:#f6d77a">${esc(title)}</p>${body}
<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#9fb0cf">${footer}</p></td></tr></table></td></tr></table></body></html>`;

const button = (href: string, label: string) =>
  `<p style="margin:16px 0"><a href="${esc(href)}" style="display:inline-block;background:#5eead4;color:#04302b;font-weight:800;text-decoration:none;padding:12px 20px;border-radius:12px">${esc(label)}</a></p>
<p style="margin:0;font-size:12px;word-break:break-all;color:#9fb0cf">${esc(href)}</p>`;

function footer(unsubscribeUrl?: string): { html: string; text: string } {
  if (!unsubscribeUrl) return { html: 'Te escribimos porque has pedido que te enviemos este enlace. No volveremos a escribirte por este motivo.', text: 'Te escribimos porque has pedido que te enviemos este enlace. No volveremos a escribirte por este motivo.' };
  return {
    html: `Recibirás novedades y ofertas de Línea Mágica porque lo has aceptado. <a href="${esc(unsubscribeUrl)}" style="color:#9fb0cf">Darme de baja</a>.`,
    text: `Recibirás novedades y ofertas de Línea Mágica porque lo has aceptado. Darme de baja: ${unsubscribeUrl}`,
  };
}

/** El enlace guardado (de la familia o del panel) que la persona ha pedido recibir. */
export function savedLinkMail(link: string, unsubscribeUrl?: string) {
  const f = footer(unsubscribeUrl);
  return {
    subject: 'Tu enlace de Línea Mágica',
    html: shell(
      'Tu enlace guardado',
      `<p style="margin:0;font-size:15px;line-height:1.5">Aquí tienes tu enlace. Guárdalo: quien lo tenga puede entrar, así que no lo compartas con quien no quieras que entre. Si pusiste un PIN, te lo pedirá al entrar.</p>${button(link, 'Entrar')}`,
      f.html,
    ),
    text: `Tu enlace guardado de Línea Mágica:\n${link}\n\nGuárdalo: quien lo tenga puede entrar. Si pusiste un PIN, te lo pedirá al entrar.\n\n${f.text}`,
  };
}

/** Tras pagar: el enlace del pase. */
export function passMail(passLink: string) {
  return {
    subject: 'Tu Pase de Navidad está activo',
    html: shell(
      'Tu Pase de Navidad está activo',
      `<p style="margin:0;font-size:15px;line-height:1.5">Gracias. Este es tu pase: guárdalo por si lo necesitas en otro móvil.</p>${button(passLink, 'Mi pase')}`,
      'Es un pago único, no una suscripción: no hay nada que cancelar. Si algo no funciona, responde a este correo.',
    ),
    text: `Gracias. Tu Pase de Navidad está activo.\n\nTu pase: ${passLink}\n\nEs un pago único, no una suscripción: no hay nada que cancelar. Si algo no funciona, responde a este correo.`,
  };
}
