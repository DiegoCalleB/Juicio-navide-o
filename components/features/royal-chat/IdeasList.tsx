'use client';

import type { CharacterProfile } from '@/lib/characters';
import { IconClose } from './icons';

interface Props {
  character: CharacterProfile;
  /** Idea elegida ahora mismo (día). */
  selectedDay: number | null;
  onPick: (day: number) => void;
  onClose: () => void;
}

/** Ideas de travesuras para montar por la noche. Los padres eligen la que quieren y escriben su propio mensaje. */
export function IdeasList({ character, selectedDay, onPick, onClose }: Props) {
  const cal = character.mischief;
  if (!cal) return null;
  const [m, d] = cal.startDate.split('-').map(Number) as [number, number];
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), m - 1, d + cal.days.length);
  const year = now.getTime() > lastDay.getTime() ? now.getFullYear() + 1 : now.getFullYear();
  const dateOf = (day: number) => new Date(year, m - 1, d + day - 1).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div role="dialog" aria-modal="true" aria-label="Ideas de travesuras" className="absolute inset-0 z-40 flex items-end bg-black/70">
      <div className="flex max-h-[92%] w-full flex-col rounded-t-3xl border-t border-white/15 bg-[#121d33] shadow-2xl">
        <div className="flex items-start gap-3 px-4 pb-2 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[22px] leading-tight text-[#e8f1ff]">Ideas de travesuras</h2>
            <p className="mt-1 text-[13px] leading-snug text-[#e8f1ff]/65">
              Monta la escena por la noche. Tú decides qué escribir y qué foto mandar: luego puedes programar el mensaje para la mañana.
            </p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
            <IconClose className="size-5" />
          </button>
        </div>
        <ul className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {cal.days.map((day) => (
            <li key={day.day} className={`rounded-2xl border p-3 ${selectedDay === day.day ? 'border-[#5eead4] bg-[#5eead4]/10' : 'border-white/10 bg-white/[.04]'}`}>
              <div className="flex items-center gap-2 text-[12px] text-[#e8f1ff]/60">
                <span className="font-bold text-[#5eead4]">Día {day.day}</span>
                <span>{dateOf(day.day)}</span>
              </div>
              <p className="mt-1 text-[15px] font-bold leading-snug text-[#e8f1ff]">{day.title}</p>
              <p className="mt-0.5 text-[13.5px] leading-snug text-[#e8f1ff]/80">{day.idea} <span className="text-[#e8f1ff]/50">· {day.minutes} min · {day.need}</span></p>
              <button
                type="button"
                onClick={() => {
                  onPick(day.day);
                  onClose();
                }}
                className={`mt-2 min-h-10 w-full rounded-xl border text-[13px] font-bold ${selectedDay === day.day ? 'border-[#5eead4] bg-[#5eead4] text-[#04302b]' : 'border-white/20 text-[#e8f1ff]/85'}`}
              >
                {selectedDay === day.day ? 'Idea elegida ✓' : 'Usar esta idea'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
