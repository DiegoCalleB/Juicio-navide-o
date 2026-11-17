import { StateScreen } from '@/components/features/royal-chat/StateScreen';

export default function ParentLinkNotFound() {
  return (
    <StateScreen title="Este panel no existe o ha caducado" action={{ href: '/', label: 'Abrir un portal nuevo' }}>
      <p>Los portales se borran solos a los 45 días y su enlace es secreto. Si lo copiaste mal, vuelve a abrirlo desde donde lo guardaste; si no, abre un portal nuevo en un minuto.</p>
    </StateScreen>
  );
}
