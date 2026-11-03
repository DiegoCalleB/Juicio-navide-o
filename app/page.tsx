import type { Viewport } from 'next';
import { RoyalLanding } from '@/components/features/royal-chat/RoyalLanding';

export const viewport: Viewport = { themeColor: '#1d0b3a' };

export default function HomePage() {
  return <RoyalLanding />;
}
