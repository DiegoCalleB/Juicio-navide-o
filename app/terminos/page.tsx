import type { Metadata } from 'next';
import { ContactLine, LegalPage, LegalSection } from '@/components/features/LegalPage';

export const metadata: Metadata = { title: 'Términos de uso' };

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso" intro="Reglas sencillas para que la magia funcione bien y sea segura para los niños.">
      <LegalSection title="Qué es este servicio">
        <p>Una herramienta de entretenimiento familiar: los padres escriben, desde su móvil, los mensajes que su hijo recibe como si vinieran de Papá Noel o de los Reyes Magos. No somos ni representamos a ningún personaje real ni de marca.</p>
      </LegalSection>

      <LegalSection title="Quién puede usarlo">
        <p>Solo personas mayores de edad. El niño usa la app siempre bajo la supervisión de un adulto, que es el responsable de crear la sala y de lo que se escribe en ella.</p>
      </LegalSection>

      <LegalSection title="Lo que no se puede hacer">
        <ul className="list-disc space-y-1 pl-5">
          <li>Usar la app para acosar, asustar, engañar con fines dañinos o dirigirse a niños que no sean de tu familia.</li>
          <li>Enviar contenido ilegal, ofensivo o que muestre a menores de forma inapropiada.</li>
          <li>Intentar acceder a salas ajenas, saturar el servicio o saltarse sus límites.</li>
        </ul>
        <p>Podemos limitar o cerrar salas que incumplan estas reglas.</p>
      </LegalSection>

      <LegalSection id="pase" title="Prueba gratis y Pase de Navidad">
        <p>Cada familia puede probar gratis una sala durante 3 días con mensajes escritos y fotos. Después, para seguir escribiendo, hace falta el Pase de Navidad. Durante la prueba y después, el niño puede seguir leyendo lo que ya se ha escrito.</p>
        <p>El Pase de Navidad es un <strong>pago único</strong> (no es una suscripción), con el IVA incluido en el precio que se muestra antes de pagar. Incluye salas sin límite de tiempo hasta el 20 de enero con todos los personajes navideños, para los hermanos de la familia (hasta 10 salas), y un pase de regalo para otra familia. El pago lo gestiona Stripe; no vemos ni guardamos los datos de tu tarjeta.</p>
        <p>Como es contenido digital que se activa en el momento, al comprarlo pides expresamente que se active ya y aceptas que pierdes el derecho de desistimiento de 14 días. Si algo no funciona por un fallo nuestro, escríbenos y lo solucionamos o te devolvemos el dinero.</p>
        <p>El pase y sus enlaces son personales: no se pueden revender. Los enlaces de pase son secretos y quien los tenga puede usarlos, así que guárdalos bien.</p>
      </LegalSection>

      <LegalSection title="Disponibilidad">
        <p>Hacemos todo lo posible para que funcione, sobre todo en Nochebuena, Navidad y Reyes, pero se ofrece “tal cual”, sin garantía de disponibilidad continua. Las funciones de voz pueden tener límites diarios; si se alcanzan, el mensaje se entrega por escrito.</p>
      </LegalSection>

      <LegalSection title="Tus contenidos">
        <p>Los mensajes, audios y fotos son tuyos. Solo los usamos para que la conversación funcione y los borramos automáticamente a los 45 días de crearse la sala, o pasadas las fiestas (el 10 de enero; el 20 con los Reyes) si eso es más tarde.</p>
      </LegalSection>

      <LegalSection title="Cambios y contacto">
        <p>Podemos actualizar estos términos; los cambios importantes se avisarán en la propia web.</p>
        <ContactLine />
      </LegalSection>
    </LegalPage>
  );
}
