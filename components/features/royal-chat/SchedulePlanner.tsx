'use client';

import { useMemo, useState } from 'react';
import { fillChild, type CharacterPlan, type CharacterProfile } from '@/lib/characters';
import { IconClose } from './icons';
import type { ApiResult } from './mapping';

const MAX_CHARS = 300;

interface Row {
  on: boolean;
  time: string;
  text: string;
  surprise: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Próxima fecha "MM-DD" (hoy cuenta si aún no ha terminado). */
function nextOccurrence(mmdd: string, now = new Date()): string {
  if (mmdd === 'hoy') return toDateInput(now);
  if (mmdd === 'manana') return toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const [m, d] = mmdd.split('-').map(Number) as [number, number];
  const thisYear = new Date(now.getFullYear(), m - 1, d, 23, 59);
  return toDateInput(thisYear.getTime() >= now.getTime() ? thisYear : new Date(now.getFullYear() + 1, m - 1, d));
}

const rowsOf = (plan: CharacterPlan, childName: string): Row[] =>
  plan.items.map((i) => ({ on: true, time: i.time, text: fillChild(i.text, childName), surprise: !!i.surprise }));

interface Props {
  token: string;
  character: CharacterProfile;
  childName: string;
  /** Formato elegido en el panel (la sorpresa siempre va por escrito). */
  mode: 'voice' | 'text';
  onClose: () => void;
  /** Se llama al terminar con cuántos mensajes se programaron. */
  onDone: (count: number) => void;
}

/** Hoja para programar con antelación los mensajes de Nochebuena, la mañana de regalos, etc. */
export function SchedulePlanner({ token, character, childName, mode, onClose, onDone }: Props) {
  const [planId, setPlanId] = useState(character.plans[0]?.id ?? '');
  const plan = character.plans.find((p) => p.id === planId) ?? character.plans[0];
  const [dates, setDates] = useState<Record<string, string>>(() => Object.fromEntries(character.plans.map((p) => [p.id, nextOccurrence(p.date)])));
  const [rows, setRows] = useState<Record<string, Row[]>>(() => Object.fromEntries(character.plans.map((p) => [p.id, rowsOf(p, childName)])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = plan ? (rows[plan.id] ?? []) : [];
  const date = plan ? (dates[plan.id] ?? '') : '';
  const chosen = useMemo(() => current.filter((r) => r.on && r.text.trim()), [current]);

  const setRow = (i: number, patch: Partial<Row>) => {
    if (!plan) return;
    setRows((all) => ({ ...all, [plan.id]: (all[plan.id] ?? []).map((r, k) => (k === i ? { ...r, ...patch } : r)) }));
  };

  const submit = async () => {
    if (!plan || chosen.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    let done = 0;
    try {
      for (const r of chosen) {
        const when = new Date(`${date}T${r.time}`);
        if (Number.isNaN(when.getTime())) throw new Error('Revisa la fecha y las horas.');
        const res = await fetch(`/api/rooms/${token}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: r.text.trim(), delayMinutes: 0, mode: r.surprise ? 'text' : mode, surprise: r.surprise || undefined, scheduledAt: when.toISOString() }),
        });
        const json = (await res.json()) as ApiResult<unknown>;
        if (!json.ok) throw new Error(`${r.time}: ${json.error?.message ?? 'no se pudo programar.'}`);
        done++;
      }
      onDone(done);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : 'No se pudo programar.'}${done > 0 ? ` (${done} ya quedaron programados.)` : ''}`);
      if (done > 0) onDone(done);
    } finally {
      setBusy(false);
    }
  };

  if (!plan) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Programar mensajes" className="absolute inset-0 z-40 flex items-end bg-black/70">
      <div className="flex max-h-[92%] w-full flex-col rounded-t-3xl border-t border-white/15 bg-[#121d33] shadow-2xl">
        <div className="flex items-start gap-3 px-4 pb-2 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[22px] leading-tight text-[#e8f1ff]">Prepara la magia con tiempo</h2>
            <p className="mt-1 text-[13px] leading-snug text-[#e8f1ff]/65">
              Los mensajes llegarán solos a su hora, aunque no tengas el panel abierto. Puedes cambiar el texto y las horas.
            </p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
            <IconClose className="size-5" />
          </button>
        </div>

        {character.plans.length > 1 && (
          <div role="tablist" aria-label="Qué programar" className="flex gap-1.5 px-4 pb-2">
            {character.plans.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={planId === p.id}
                onClick={() => setPlanId(p.id)}
                className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold ${planId === p.id ? 'bg-[#5eead4] text-[#04302b]' : 'bg-white/10 text-[#e8f1ff]/75'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
          <label className="flex items-center gap-3 text-[13px] text-[#e8f1ff]/75">
            <span className="w-12">Día</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDates((d) => ({ ...d, [plan.id]: e.target.value }))}
              className="min-h-11 flex-1 rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[15px] text-[#e8f1ff] [color-scheme:dark]"
            />
          </label>

          {current.map((r, i) => (
            <div key={i} className={`rounded-2xl border p-3 ${r.on ? 'border-[#5eead4]/35 bg-white/[.05]' : 'border-white/10 bg-white/[.02] opacity-60'}`}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={r.on}
                  onChange={(e) => setRow(i, { on: e.target.checked })}
                  aria-label={`Programar el mensaje de las ${r.time}`}
                  className="size-5 accent-[#5eead4]"
                />
                <input
                  type="time"
                  value={r.time}
                  onChange={(e) => setRow(i, { time: e.target.value })}
                  aria-label="Hora de entrega"
                  className="min-h-10 rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[15px] font-semibold text-[#5eead4] [color-scheme:dark]"
                />
                {r.surprise && <span className="rounded-full bg-[#5eead4]/15 px-2.5 py-1 text-[11.5px] font-bold text-[#5eead4]">🎁 Pantalla de sorpresa</span>}
              </div>
              <textarea
                value={r.text}
                maxLength={MAX_CHARS}
                rows={3}
                onChange={(e) => setRow(i, { text: e.target.value })}
                aria-label={`Texto del mensaje de las ${r.time}`}
                className="mt-2.5 w-full resize-none rounded-xl border border-white/15 bg-[#0a1220] px-3 py-2 text-[14px] leading-snug text-[#e8f1ff] focus:border-[#5eead4] focus:outline-none"
              />
            </div>
          ))}

          <p className="text-[12px] leading-snug text-[#e8f1ff]/50">
            {mode === 'voice' ? 'Los normales irán con la voz de ' + character.shortName + '; ' : ''}la sorpresa siempre va por escrito. Si el niño tiene la sala cerrada, lo verá al abrirla; la sorpresa le saldrá a pantalla completa la primera vez.
          </p>
          {error && <p role="alert" className="text-[13px] text-[#ff8a8c]">{error}</p>}
        </div>

        <div className="border-t border-white/10 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={submit}
            disabled={busy || chosen.length === 0 || !date}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#5eead4] to-[#14b8a6] font-bold text-[#04302b] shadow-lg disabled:opacity-50 active:scale-[0.99]"
          >
            {busy ? 'Programando…' : chosen.length === 0 ? 'Elige algún mensaje' : `Programar ${chosen.length} mensaje${chosen.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
