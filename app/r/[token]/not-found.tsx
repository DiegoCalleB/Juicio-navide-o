import { StateScreen } from '@/components/features/royal-chat/StateScreen';

export default function ChildLinkNotFound() {
  return (
    <StateScreen title="Este enlace no funciona" action={{ href: '/', label: 'Ir al inicio' }}>
      <p>Puede que esté mal copiado o que la conversación ya haya terminado. Pídele a un adulto de tu familia que te envíe el enlace otra vez.</p>
    </StateScreen>
  );
}
