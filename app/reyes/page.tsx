import type { Metadata, Viewport } from 'next';
import { CreateRoomForm } from '@/components/features/royal-chat/CreateRoomForm';

export const metadata: Metadata = {
  title: 'Mensajería Real de Oriente',
  description: 'Tu hijo manda notas de voz a su Rey Mago favorito… y el Rey le contesta con su voz.',
};
export const viewport: Viewport = { themeColor: '#1d0b3a' };

export default function ReyesPage() {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
        <header className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#f6d77a]">Mensajería Real de Oriente</p>
          <h1 className="mt-3 font-serif text-[32px] leading-tight text-[#fff6dc]">Los Reyes Magos contestan a tu hijo</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#fff6dc]/70">
            Tu peque manda notas de voz a su Rey favorito. Tú, desde tu móvil, escribes la respuesta… y le llega con la voz del Rey.
          </p>
        </header>
        <div className="rounded-3xl border border-white/10 bg-[#1d0b3a]/80 p-5 shadow-2xl backdrop-blur">
          <CreateRoomForm />
        </div>
      </div>
    </div>
  );
}
