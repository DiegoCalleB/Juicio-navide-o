'use client';

import { useMemo, useState } from 'react';
import { fillChild, type CharacterProfile } from '@/lib/characters';
import { IconClose } from './icons';
import type { ApiResult } from './mapping';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Próximo "MM-DD"; si ya pasó pero seguimos dentro de la campaña, empieza mañana. */
function defaultStart(mmdd: string, days: number, now = new Date()): string {
  const [m, d] = mmdd.split('-').map(Number) as [number, number];
  const thisYear = new Date(now.getFullYear(), m - 1, d);
  const end = new Date(thisYear.getFullYear(), thisYear.getMonth(), thisYear.getDate() + days);
  if (now.getTime() < thisYear.getTime()) return toDateInput(thisYear);
  if (now.getTime() < end.getTime()) return toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  return toDateInput(new Date(now.getFullYear() + 1, m - 1, d));
}

interface Row {
  on: boolean;
  text: string;
}

interface Props {
  token: string;
  character: CharacterProfile;
  childName: string;
  onClose: () => void;
  onDone: (count: number, limited: boolean) => void;
}

/** Calendario de travesuras: un mensaje por mañana, con la idea de escena para montar la noche anterior. */
export function MischiefPlanner({ token, character, childName, onClose, onDone }: Props) {
  const cal = character.mischief;
  const [start, setStart] = useState(() => (cal ? defaultStart(cal.startDate, cal.days.length) : ''));
  const [time, setTime] = useState(cal?.time ?? '08:00');
  const [rows, setRows] = useState<Row[]>(() => (cal ? cal.days.map((d) => ({ on: true, text: fillChild(d.text, childName) })) : []));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const whenOf = (offset: number): Date | null => {
    const base = new Date(`${start}T${time}`);
    if (Number.isNaN(base.getTime())) return null;
    return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, base.getHours(), base.getMinutes());
  };

  const plan = useMemo(() => {
    if (!cal) return [];
    return cal.days.map((d, i) => {
      const when = whenOf(d.day - 1);
      const past = !when || when.getTime() < Date.now() + 90_000;
      return { day: d, when, past, row: rows[i] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cal, rows, start, time]);

  const chosen = plan.filter((p) => p.row?.on && !p.past && p.row.text.trim());

  const submit = async () => {
    if (chosen.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const items = chosen.map((p) => ({ text: p.row!.text.trim(), scheduledAt: p.when!.toISOString(), surprise: p.day.surprise || undefined }));
      const res = await fetch(`/api/rooms/${token}/schedule`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
      const json = (await res.json()) as ApiResult<{ scheduled: number; limited: boolean }>;
      if (!json.ok || !json.data) throw new Error(json.error?.message ?? 'No se pudo programar.');
      onDone(json.data.scheduled, json.data.limited);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo programar.');
    } finally {
      setBusy(false);
    }
  };

  if (!cal) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Calendario de travesuras" className="absolute inset-0 z-40 flex items-end bg-black/70">
      <div className="flex max-h-[94%] w-full flex-col rounded-t-3xl border-t border-white/15 bg-[#121d33] shadow-2xl">
        <div className="flex items-start gap-3 px-4 pb-2 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[22px] leading-tight text-[#e8f1ff]">Calendario de travesuras</h2>
            <p className="mt-1 text-[13px] leading-snug text-[#e8f1ff]/65">
              Un mensaje de {character.shortName} cada mañana. Cada día trae la escena que puedes montar por la noche. Los mensajes llegan solos aunque no abras el panel.
            </p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
            <IconClose className="size-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 px-4 pb-2 text-[13px] text-[#e8f1ff]/75">
          <label className="flex items-center gap-2">
            <span>Empieza el</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[15px] text-[#e8f1ff] [color-scheme:dark]" />
          </label>
          <label className="flex items-center gap-2">
            <span>A las</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-h-11 rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[15px] font-semibold text-[#5eead4] [color-scheme:dark]" />
          </label>
        </div>

        <ul className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-3">
          {plan.map((p, i) => (
            <li key={p.day.day} className={`rounded-2xl border p-3 ${p.row?.on && !p.past ? 'border-[#5eead4]/35 bg-white/[.05]' : 'border-white/10 bg-white/[.02] opacity-55'}`}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!p.row?.on && !p.past}
                  disabled={p.past}
                  onChange={(e) => setRows((r) => r.map((x, k) => (k === i ? { ...x, on: e.target.checked } : x)))}
                  aria-label={`Programar el día ${p.day.day}`}
                  className="size-5 accent-[#5eead4]"
                />
                <span className="font-semibold text-[#5eead4]">Día {p.day.day}</span>
                <span className="text-[12px] text-[#e8f1ff]/60">
                  {p.when ? p.when.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                  {p.past ? ' · ya pasó' : ''}
                </span>
                {p.day.surprise && <span className="ml-auto rounded-full bg-[#5eead4]/15 px-2 py-0.5 text-[11px] font-bold text-[#5eead4]">🎁 Sorpresa</span>}
              </div>
              <p className="mt-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-[12.5px] text-[#e8f1ff]/75">
                <span className="font-semibold text-[#e8f1ff]/90">Tu parte (por la noche): </span>
                {p.day.idea}
              </p>
              <textarea
                value={p.row?.text ?? ''}
                maxLength={300}
                rows={3}
                onChange={(e) => setRows((r) => r.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))}
                aria-label={`Mensaje del día ${p.day.day}`}
                className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-[#0a1220] px-3 py-2 text-[14px] leading-snug text-[#e8f1ff] focus:border-[#5eead4] focus:outline-none"
              />
            </li>
          ))}
        </ul>

        {error && <p role="alert" className="px-4 pb-2 text-[13px] text-[#ff8a8c]">{error}</p>}
        <div className="border-t border-white/10 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 text-[12px] leading-snug text-[#e8f1ff]/55">Los mensajes se envían por escrito (con voz serían muchos). Puedes cancelar cualquiera desde el panel antes de que llegue.</p>
          <button
            type="button"
            onClick={submit}
            disabled={busy || chosen.length === 0}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#5eead4] to-[#14b8a6] font-bold text-[#04302b] shadow-lg disabled:opacity-50"
          >
            {busy ? 'Programando…' : chosen.length === 0 ? 'Elige algún día' : `Programar ${chosen.length} mensaje${chosen.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
