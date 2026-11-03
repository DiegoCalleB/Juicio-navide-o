import { CreateRoomForm } from './CreateRoomForm';

export function RoyalLanding() {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
        <header className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#f6d77a]">Mensajería Real de Oriente</p>
          <h1 className="mt-3 font-serif text-[32px] leading-tight text-[#fff6dc]">Los Reyes Magos contestan a tu hijo</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#fff6dc]/70">
            Tu peque escribe o manda notas de voz a su Rey favorito. Tú, desde tu móvil, preparas la respuesta… y le llega como si fuera el Rey.
          </p>
        </header>
        <div className="rounded-3xl border border-white/10 bg-[#1d0b3a]/80 p-5 shadow-2xl backdrop-blur">
          <CreateRoomForm />
        </div>
        <ol className="mt-8 space-y-3 text-[14px] leading-snug text-[#fff6dc]/75">
          <li><span className="font-bold text-[#f6d77a]">1.</span> Crea la sala con el nombre de tu peque y su Rey favorito.</li>
          <li><span className="font-bold text-[#f6d77a]">2.</span> Abre su enlace en el móvil o tablet que usará.</li>
          <li><span className="font-bold text-[#f6d77a]">3.</span> Desde tu panel secreto, escucha lo que dice y contesta como el Rey.</li>
        </ol>
      </div>
    </div>
  );
}
