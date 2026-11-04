import { StateScreen } from '@/components/features/royal-chat/StateScreen';

export default function ParentLinkNotFound() {
  return (
    <StateScreen title="Este panel no existe o ha caducado" action={{ href: '/', label: 'Crear una sala nueva' }}>
      <p>Las salas se borran solas a los 45 días y su enlace es secreto. Si lo copiaste mal, vuelve a abrirlo desde donde lo guardaste; si no, crea una sala nueva en un minuto.</p>
    </StateScreen>
  );
}
