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

      <LegalSection title="Disponibilidad">
        <p>Hacemos todo lo posible para que funcione, sobre todo en Nochebuena, Navidad y Reyes, pero se ofrece “tal cual”, sin garantía de disponibilidad continua. Las funciones de voz pueden tener límites diarios; si se alcanzan, el mensaje se entrega por escrito.</p>
      </LegalSection>

      <LegalSection title="Tus contenidos">
        <p>Los mensajes, audios y fotos son tuyos. Solo los usamos para que la conversación funcione y los borramos automáticamente a los 45 días.</p>
      </LegalSection>

      <LegalSection title="Cambios y contacto">
        <p>Podemos actualizar estos términos; los cambios importantes se avisarán en la propia web.</p>
        <ContactLine />
      </LegalSection>
    </LegalPage>
  );
}
