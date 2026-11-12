import type { Metadata } from 'next';
import { ContactLine, LegalPage, LegalSection } from '@/components/features/LegalPage';

export const metadata: Metadata = { title: 'Privacidad' };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Privacidad" intro="Esta app está pensada para que los padres creen una conversación mágica con sus hijos. Te contamos qué guardamos y por qué.">
      <LegalSection title="Quién usa la app">
        <p>La crean y la gestionan los padres, madres o tutores. El niño solo ve su chat a través de un enlace privado que le da un adulto.</p>
      </LegalSection>

      <LegalSection title="Qué datos guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>El nombre de pila del niño (nunca apellidos) y el personaje elegido.</li>
          <li>Los mensajes escritos, los audios del niño y las fotos (y, solo si algún día se activa, las respuestas con voz del personaje).</li>
          <li>Un identificador técnico anónimo (hash) para limitar abusos. No es reversible.</li>
        </ul>
        <p>No pedimos cuentas, correos, teléfonos, direcciones ni ubicación, y no usamos publicidad ni cookies de seguimiento.</p>
        <p>La app no graba vídeo ni usa la cámara del niño. Si los padres graban su reacción con la opción “Con este móvil”, el vídeo se crea en el propio móvil de los padres y nunca pasa por nuestros servidores.</p>
      </LegalSection>

      <LegalSection title="Servicios que intervienen">
        <p>Alojamos los datos en Supabase y el servicio en Railway. Si se activa la voz del personaje, el texto de la respuesta se envía a ElevenLabs para convertirlo en audio; no se envían nombres ni datos del niño más allá de lo que los padres escriban en ese mensaje.</p>
      </LegalSection>

      <LegalSection title="Quién puede verlo">
        <p>Solo quien tenga el enlace del niño o el enlace de los padres. Los enlaces son largos y aleatorios; si crees que alguien más lo tiene, crea una sala nueva. Las fotos y los audios se guardan en un almacén privado y se sirven con enlaces temporales. Los audios del niño solo pueden escucharlos los padres.</p>
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
