import Link from 'next/link';
import { diaryCalendar } from '@/lib/elfDiary';
import { elfArt } from '@/lib/elfArt';

/**
 * El diario de Chispa dentro de la portada (REGLA DE ORO: solo lo que Chispa cuenta que hizo, en primera persona).
 * Las noches se abren día a día: las que aún no ha vivido Chispa salen cerradas, sin título ni pista,
 * para no adelantar nada y que los peques vuelvan cada día.
 */
export function DiarioEnPortada({ now }: { now: Date }) {
  const { mode, entries, days } = diaryCalendar(now);
  return (
    <section aria-labelledby="diario-title" className="mt-2 border-t border-white/10 pt-8 lg:mt-6">
      <div className="text-center">
        <p className="text-[11.5px] font-bold uppercase tracking-[.22em] text-[#7ee2a8]">Escrito por Chispa</p>
        <h2 id="diario-title" className="mt-1.5 font-serif text-[27px] leading-tight text-[#fff6dc] lg:text-[38px]">Mi diario de travesuras</h2>
        <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-relaxed text-[#fff6dc]/75">
          {mode === 'sample'
            ? 'El 1 de diciembre empiezo a viajar y cada noche abriré una puerta nueva. Mientras tanto, mira unas páginas del año pasado.'
            : 'Cada noche hago una trastada y abro una puerta nueva. ¡Mira cuántas llevo!'}
        </p>
      </div>

      <ol aria-label="Las noches de diciembre" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-auto lg:max-w-3xl lg:flex-wrap lg:justify-center lg:overflow-visible">
        {days.map(({ day, open }) => (
          <li key={day} className="shrink-0">
            {open ? (
              <Link href={`#noche-${day}`} aria-label={`Noche ${day}`} className="grid size-11 place-items-center rounded-xl border border-[#f6d77a]/60 bg-[#f6d77a]/15 text-[15px] font-bold text-[#f6d77a] active:scale-95">{day}</Link>
            ) : (
              <span aria-label={`Noche ${day}, todavía cerrada`} className="grid size-11 place-items-center rounded-xl border border-dashed border-white/15 text-[14px] text-[#fff6dc]/30">{day}</span>
            )}
          </li>
        ))}
      </ol>

      <ul aria-label="Páginas del diario (desliza para ver más)" className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 lg:mx-0 lg:px-0">
        {entries.map((e, i) => {
          const art = elfArt(e.day);
          return (
            <li key={e.day} id={`noche-${e.day}`} className="w-[80%] shrink-0 snap-center overflow-hidden rounded-3xl border border-[#f6d77a]/25 bg-[#081d27]/80 sm:w-[22rem]">
              {art && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={art.src} width={art.width} height={art.height} alt={e.title} loading={i < 1 ? 'eager' : 'lazy'} className="aspect-[16/9] w-full object-cover" />
              )}
              <div className="p-4">
                <p className="text-[11.5px] font-bold uppercase tracking-widest text-[#f6d77a]">{mode === 'sample' ? 'Del año pasado' : `Noche del ${e.day} de diciembre`}</p>
                <h3 className="mt-1 font-serif text-[21px] leading-tight text-[#fff6dc]">{e.title}</h3>
                <p className="mt-2 font-serif text-[16px] italic leading-relaxed text-[#fff6dc]/90">«{e.text}»</p>
                <p className="mt-2 text-right text-[13px] text-[#7ee2a8]">— Chispa</p>
              </div>
            </li>
          );
        })}
      </ul>
      {entries.length > 1 && <p aria-hidden className="text-center text-[12px] text-[#fff6dc]/45">Desliza para pasar las páginas →</p>}
    </section>
  );
}
