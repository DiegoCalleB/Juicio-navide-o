import { StateScreen } from '@/components/features/royal-chat/StateScreen';

export default function ChildLinkNotFound() {
  return (
    <StateScreen title="Se ha perdido el camino" action={{ href: '/', label: 'Volver' }}>
      <p>La nieve ha tapado el sendero hasta mí. Pídele a tu familia que te enseñe el camino otra vez.</p>
    </StateScreen>
  );
}
