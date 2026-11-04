import Link from 'next/link';
import { CHARACTERS } from '@/lib/characters';
import { CreateRoomForm } from './CreateRoomForm';
import { DemoChat } from './DemoChat';
import { DEMO_NOEL } from './demoData';

export function RoyalLanding() {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
        <header className="mb-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#f6d77a]">Mensajería mágica de Navidad</p>
          <h1 className="mt-3 font-serif text-[32px] leading-tight text-[#fff6dc]">Que antes de abrir los regalos, hable con Papá Noel</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#fff6dc]/70">
            Tu peque le escribe a Papá Noel (o a los Reyes Magos) y recibe su respuesta en directo. Tú la escribes desde tu móvil y a él le llega como si fuera el personaje.
          </p>
        </header>

        <section aria-labelledby="demo-title" className="mb-8">
          <h2 id="demo-title" className="mb-3 text-center text-[13px] font-semibold uppercase tracking-widest text-[#fff6dc]/60">
            Esto es lo que verá tu hijo · pruébalo
          </h2>
          <DemoChat embedded character={CHARACTERS.papa_noel} childName="Lucía" initial={DEMO_NOEL} />
        </section>

        <div className="mb-3 text-center">
          <h2 className="font-serif text-2xl text-[#fff6dc]">Crea la sala de tu peque</h2>
          <p className="mt-1 text-[14px] text-[#fff6dc]/60">Gratis, sin registrarte. Tarda un minuto.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#1d0b3a]/80 p-5 shadow-2xl backdrop-blur">
          <CreateRoomForm />
        </div>
        <ol className="mt-8 space-y-3 text-[14px] leading-snug text-[#fff6dc]/75">
          <li><span className="font-bold text-[#f6d77a]">1.</span> Crea la sala con el nombre de tu peque y elige quién le contesta.</li>
          <li><span className="font-bold text-[#f6d77a]">2.</span> Abre su enlace en el móvil o tablet que usará.</li>
          <li><span className="font-bold text-[#f6d77a]">3.</span> Desde tu panel secreto, lee lo que escribe y contesta como si fueras él.</li>
        </ol>

        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <nav aria-label="Información legal" className="flex justify-center gap-5">
            <Link href="/privacidad" className="underline-offset-2 hover:underline">Privacidad</Link>
            <Link href="/terminos" className="underline-offset-2 hover:underline">Términos de uso</Link>
          </nav>
          <p className="mt-2">No somos Papá Noel ni los Reyes Magos, pero hacemos lo que podemos ✨</p>
        </footer>
      </div>
    </div>
  );
}
