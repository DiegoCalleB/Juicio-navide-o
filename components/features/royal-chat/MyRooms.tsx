'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { loadRooms, removeRoom, type SavedRoom } from '@/lib/myRooms';
import { RoyalAvatar } from './RoyalAvatar';

/** Salas creadas en este móvil, para volver al panel o preparar otra (otro niño, otro personaje). */
export function MyRooms() {
  const [rooms, setRooms] = useState<SavedRoom[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => setRooms(loadRooms()), []);
  if (rooms.length === 0) return null;

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-8 flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#f6d77a]/30 bg-[#f6d77a]/[.06] px-4 text-left text-[14px] font-semibold text-[#f6d77a]"
      >
        <span>Ya tengo salas en este móvil ({rooms.length})</span>
        <span aria-hidden>▾</span>
      </button>
    );
  }

  return (
    <section aria-labelledby="my-rooms" className="mb-8 rounded-3xl border border-[#f6d77a]/30 bg-[#f6d77a]/[.06] p-4">
      <h2 id="my-rooms" className="font-serif text-xl text-[#f6d77a]">Tus salas en este móvil</h2>
      <p className="mt-1 text-[13px] leading-snug text-[#fff6dc]/60">Solo para padres: no enseñes esta pantalla a los peques.</p>
      <ul className="mt-3 space-y-2.5">
        {rooms.map((r) => {
          const base = CHARACTERS[r.characterId];
          if (!base) return null;
          const c = resolveCharacter(base, { alias: r.characterAlias, gender: r.characterGender });
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
