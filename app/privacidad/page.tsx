import type { Metadata } from 'next';
import { ContactLine, LegalPage, LegalSection } from '@/components/features/LegalPage';
import { regionalize } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n.server';

export const metadata: Metadata = { title: 'Privacidad' };

export default async function PrivacidadPage() {
  const locale = await getRequestLocale();
  const r = (t: string) => regionalize(t, locale);
  return (
    <LegalPage title="Privacidad" intro="Esta app está pensada para que los padres creen una conversación mágica con sus hijos. Te contamos qué guardamos y por qué.">
      <LegalSection title="Quién usa la app">
        <p>La crean y la gestionan los padres, madres o tutores. El niño solo ve su chat a través de un enlace privado que le da un adulto.</p>
      </LegalSection>

      <LegalSection title="Qué datos guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>El nombre de pila del niño (nunca apellidos) y el personaje elegido.</li>
          <li>Los mensajes escritos, los audios del niño y las fotos (y, solo si algún día se activa, las respuestas con voz del personaje).</li>
          <li>Si los padres lo indican, si el niño ya lee (para mostrarle el texto en mayúsculas y dar consejos a los padres).</li>
          <li>{r('Un identificador técnico anónimo (hash) para limitar abusos y el número de pruebas gratis por móvil. No es reversible.')}</li>
          <li>{r('Si compráis el Pase de Navidad: un identificador del pago de Stripe, el importe y la fecha de caducidad del pase. No guardamos vuestro nombre, correo ni tarjeta.')}</li>
        </ul>
        <p>No pedimos cuentas, correos, teléfonos, direcciones ni ubicación, y no usamos publicidad ni cookies de seguimiento. En el propio navegador guardamos solo lo necesario para que funcione: tus salas, tu pase, la preferencia de mayúsculas y el idioma que elijas.</p>
        <p>{r('La app no graba vídeo ni usa la cámara del niño. Si los padres graban su reacción con la opción “Con este móvil”, el vídeo se crea en el propio móvil de los padres y nunca pasa por nuestros servidores.')}</p>
      </LegalSection>

      <LegalSection title="Servicios que intervienen">
        <p>Alojamos los datos en Supabase y el servicio en Railway. Los pagos los gestiona Stripe, que trata los datos del pago (correo, tarjeta) como responsable según su propia política; nosotros no los vemos. Si se activa la voz del personaje, el texto de la respuesta se envía a ElevenLabs para convertirlo en audio; no se envían nombres ni datos del niño más allá de lo que los padres escriban en ese mensaje.</p>
      </LegalSection>

      <LegalSection title="Quién puede verlo">
        <p>Solo quien tenga el enlace del niño o el enlace de los padres. Los enlaces son largos y aleatorios; si crees que alguien más tiene el del niño, cámbialo desde el panel (el anterior deja de funcionar). Las fotos y los audios se guardan en un almacén privado y se sirven con enlaces temporales. Los audios del niño solo pueden escucharlos los padres.</p>
      </LegalSection>

      <LegalSection title="Cuánto tiempo lo guardamos">
        <p>Las conversaciones se borran automáticamente a los 45 días de crearse, o pasadas las fiestas (el 10 de enero; el 20 con los Reyes) si eso es más tarde, junto con sus audios y fotos.</p>
      </LegalSection>

      <LegalSection title="Tus derechos">
        <p>Puedes pedir en cualquier momento que borremos una conversación, acceder a lo guardado o resolver dudas sobre tus datos. Indica el enlace del panel de los padres para localizarla.</p>
        <ContactLine />
      </LegalSection>
    </LegalPage>
  );
}
