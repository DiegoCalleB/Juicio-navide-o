'use client';

import { useState } from 'react';
import { removeRoom } from '@/lib/myRooms';
import { CHARACTER_GROUPS, CHARACTERS, resolveCharacter, type CharacterId } from '@/lib/characters';
import type { ApiResult } from './mapping';

interface Props {
  token: string;
  childName: string;
  characterId: CharacterId;
  characterAlias?: string | null;
  characterGender?: string | null;
  readingLevel?: Reading;
}

type Reading = 'yes' | 'learning' | 'no';

/** Editar la sala (nombre y personaje) y borrarla por completo. Lo ven solo los padres. */
export function RoomAdmin({ token, childName, characterId, characterAlias = null, characterGender = null, readingLevel = 'yes' }: Props) {
  const [reading, setReading] = useState<Reading>(readingLevel);
  const [name, setName] = useState(childName);
  const [character, setCharacter] = useState<CharacterId>(characterId);
  const [alias, setAlias] = useState(characterAlias ?? '');
  const [gender, setGender] = useState<'m' | 'f'>(characterGender === 'f' ? 'f' : 'm');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [askDelete, setAskDelete] = useState(false);

  const isElf = character === 'duende_chispa';
  const elfChanged = isElf && (alias.trim() !== (characterAlias ?? '') || gender !== (characterGender === 'f' ? 'f' : 'm'));
  const changed = name.trim() !== childName || character !== characterId || elfChanged || reading !== readingLevel;

  const save = async () => {
    if (!changed || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const body: { childName?: string; characterId?: CharacterId; characterAlias?: string; characterGender?: 'm' | 'f'; readingLevel?: Reading } = {};
      if (reading !== readingLevel) body.readingLevel = reading;
      if (name.trim() !== childName) body.childName = name.trim();
      if (character !== characterId) body.characterId = character;
      if (isElf && (character !== characterId || elfChanged)) {
        if (alias.trim()) body.characterAlias = alias.trim();
        body.characterGender = gender;
      }
      const res = await fetch(`/api/rooms/${token}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json()) as ApiResult<null>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo guardar.');
      // Recargamos para que la cabecera y el tema del personaje se actualicen.
      window.location.reload();
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar.' });
      setBusy(false);
    }
  };

  const erase = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/rooms/${token}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResult<null>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo borrar.');
      removeRoom(`/paje/${token}`);
      window.location.href = '/';
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'No se pudo borrar.' });
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/15 bg-white/[.04] p-3.5 text-[13px] leading-relaxed">
      <div className="space-y-2">
        <p className="font-semibold text-[#e8f1ff]">Editar la sala</p>
        <label className="block">
          <span className="text-[12px] text-[#e8f1ff]/70">Nombre del peque</span>
          <input
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[15px] text-[#e8f1ff] focus:border-[#5eead4] focus:outline-none"
          />
        </label>
        <div role="radiogroup" aria-label="Personaje" className="space-y-1.5">
          <span className="text-[12px] text-[#e8f1ff]/70">Quién le contesta</span>
          <div className="flex flex-wrap gap-1.5">
            {CHARACTER_GROUPS.flatMap((g) => g.ids).map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={character === id}
                onClick={() => setCharacter(id)}
                className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold ${character === id ? 'bg-[#5eead4] text-[#04302b]' : 'bg-white/10 text-[#e8f1ff]/80'}`}
              >
                {resolveCharacter(CHARACTERS[id]).name}
              </button>
            ))}
          </div>
          {character !== characterId && (
            <p className="text-[12px] text-[#5eead4]">Cambiar de personaje cambia también su voz y sus colores. Los mensajes se mantienen.</p>
          )}
          {isElf && (
            <div className="space-y-2 rounded-xl bg-black/20 p-2.5">
              <label className="block">
                <span className="text-[12px] text-[#e8f1ff]/70">Nombre de vuestro elfo</span>
                <input
                  value={alias}
                  maxLength={20}
                  placeholder="Chispa"
                  onChange={(e) => setAlias(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[15px] text-[#e8f1ff] focus:border-[#5eead4] focus:outline-none"
                />
              </label>
              <div role="radiogroup" aria-label="Es un elfo o una elfa" className="flex gap-1.5">
                {([['m', 'Es un elfo'], ['f', 'Es una elfa']] as const).map(([g, label]) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={gender === g}
                    onClick={() => setGender(g)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[12.5px] font-bold ${gender === g ? 'bg-[#5eead4] text-[#04302b]' : 'bg-white/10 text-[#e8f1ff]/80'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div role="radiogroup" aria-label="¿Ya lee?" className="space-y-1.5">
          <p className="text-[12px] font-semibold text-[#e8f1ff]/70">¿{childName} ya lee?</p>
          <div className="flex gap-1.5">
            {([['yes', 'Sí'], ['learning', 'Empezando'], ['no', 'Todavía no']] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={reading === v}
                onClick={() => setReading(v)}
                className={`flex-1 rounded-full px-2 py-1.5 text-[12.5px] font-bold ${reading === v ? 'bg-[#5eead4] text-[#04302b]' : 'bg-white/10 text-[#e8f1ff]/80'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!changed || busy || name.trim().length === 0}
          className="min-h-11 w-full rounded-xl bg-[#5eead4] font-bold text-[#04302b] disabled:opacity-40"
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-3">
        <p className="font-semibold text-[#ff8a8c]">Borrar la sala</p>
        <p className="text-[#e8f1ff]/70">Se borran los mensajes, los audios y las fotos, para los dos móviles. No se puede deshacer.</p>
        {askDelete ? (
          <div role="alertdialog" aria-label="Confirmar borrado de la sala" className="flex flex-wrap items-center gap-2 rounded-xl bg-[#ff8a8c]/10 p-2.5">
            <span className="flex-1 font-semibold text-[#ff8a8c]">¿Borrar la sala de {childName} para siempre?</span>
            <button type="button" onClick={erase} disabled={busy} className="rounded-lg bg-[#ff8a8c] px-3 py-1.5 font-bold text-[#2a0a0c] disabled:opacity-50">
              {busy ? 'Borrando…' : 'Sí, borrar'}
            </button>
            <button type="button" onClick={() => setAskDelete(false)} disabled={busy} className="rounded-lg border border-white/20 px-3 py-1.5 font-semibold">
              No
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setAskDelete(true)} className="min-h-11 w-full rounded-xl border border-[#ff8a8c]/50 font-bold text-[#ff8a8c]">
            Borrar esta sala
          </button>
        )}
      </div>

      {msg && <p role={msg.tone === 'error' ? 'alert' : 'status'} className={`text-[13px] ${msg.tone === 'error' ? 'text-[#ff8a8c]' : 'text-[#5eead4]'}`}>{msg.text}</p>}
    </div>
  );
}
