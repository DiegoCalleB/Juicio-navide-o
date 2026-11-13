'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { loadFamily } from '@/lib/myFamily';
import { isLockedDevice } from '@/lib/myLock';
import { loadRooms, removeRoom, type SavedRoom } from '@/lib/myRooms';
import { RoyalAvatar } from './RoyalAvatar';
import { R, useLocale } from '@/components/LocaleProvider';

/** Salas creadas en este móvil, para volver al panel o preparar otra (otro niño, otro personaje). */
export function MyRooms() {
  const locale = useLocale();
  const [rooms, setRooms] = useState<SavedRoom[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [familyToken, setFamilyToken] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    setRooms(loadRooms());
    setFamilyToken(loadFamily());
    setLocked(isLockedDevice());
  }, []);
  if (rooms.length === 0) return null;
  // Móvil con PIN de padres: nada de nombres, personajes ni enlaces a la vista. Solo una puerta discreta que pide el PIN.
  if (locked) {
    return (
      <div className="mb-8 text-center">
        <Link href={familyToken ? `/familia/${familyToken}` : (rooms[0]?.parentPath ?? '/')} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-[13.5px] font-semibold text-[#fff6dc]/80 active:scale-95">
          <span aria-hidden>🔒</span> Zona de los padres
        </Link>
      </div>
    );
  }

  const copyChild = async (r: SavedRoom) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${r.childPath}`);
      setCopied(r.parentPath);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* sin permisos */
    }
  };

  if (!open) {
    return (
      <div className="mb-8 space-y-1.5">
        {familyToken && (
          <Link
            href={`/familia/${familyToken}`}
            className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#f6d77a]/40 bg-[#f6d77a]/[.08] px-4 text-left active:scale-[0.99]"
          >
            <span aria-hidden className="text-2xl">👨‍👩‍👧</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-[#f6d77a]">Tu familia</span>
              <span className="block text-[12.5px] text-[#fff6dc]/60">{rooms.length === 1 ? '1 sala' : `${rooms.length} salas`} · abrir paneles y enlaces</span>
            </span>
            <span aria-hidden className="text-[#f6d77a]">→</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={familyToken
            ? 'w-full py-1 text-center text-[12.5px] text-[#fff6dc]/55 underline underline-offset-2'
            : 'flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#f6d77a]/30 bg-[#f6d77a]/[.06] px-4 text-left text-[14px] font-semibold text-[#f6d77a]'}
        >
          <span><R>Ya tengo salas en este móvil ({rooms.length})</R></span>
          {!familyToken && <span aria-hidden>▾</span>}
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="my-rooms" className="mb-8 rounded-3xl border border-[#f6d77a]/30 bg-[#f6d77a]/[.06] p-4">
      <h2 id="my-rooms" className="font-serif text-xl text-[#f6d77a]"><R>Tus salas en este móvil</R></h2>
      {familyToken && (
        <Link href={`/familia/${familyToken}`} className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-[#f6d77a]/50 text-[14px] font-bold text-[#f6d77a] active:scale-[0.98]">
          👨‍👩‍👧 Ver todas las salas de mi familia
        </Link>
      )}
      <p className="mt-1 text-[13px] leading-snug text-[#fff6dc]/60">Solo para padres: no enseñes esta pantalla a los peques.</p>
      <ul className="mt-3 space-y-2.5">
        {rooms.map((r) => {
          const base = CHARACTERS[r.characterId];
          if (!base) return null;
          const c = resolveCharacter(base, { alias: r.characterAlias, gender: r.characterGender, locale });
          return (
            <li key={r.parentPath} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-3">
                <RoyalAvatar character={c} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#fff6dc]">{r.childName}</p>
                  <p className="truncate text-[12.5px] text-[#fff6dc]/60">con {c.name}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Quitar la sala de ${r.childName} de la lista`}
                  onClick={() => setRooms((list) => (removeRoom(r.parentPath), list.filter((x) => x.parentPath !== r.parentPath)))}
                  className="shrink-0 px-2 text-[12px] text-[#fff6dc]/40 underline-offset-2 hover:underline"
                >
                  Quitar
                </button>
              </div>
              <div className="mt-2.5 flex gap-2">
                <Link href={r.parentPath} className="grid min-h-10 flex-1 place-items-center rounded-xl bg-[#f6d77a] px-3 text-[14px] font-bold text-[#2a0f4a] active:scale-[0.98]">
                  Abrir panel de los padres
                </Link>
                <button type="button" onClick={() => copyChild(r)} className="min-h-10 flex-1 rounded-xl border border-white/20 px-3 text-[14px] font-semibold text-[#fff6dc] active:scale-[0.98]">
                  {copied === r.parentPath ? '¡Copiado!' : 'Copiar enlace del niño'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
