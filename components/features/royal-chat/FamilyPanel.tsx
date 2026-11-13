'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { R, useLocale } from '@/components/LocaleProvider';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { saveFamily } from '@/lib/myFamily';
import { saveKids } from '@/lib/myKids';
import { saveRoom } from '@/lib/myRooms';
import type { FamilyView } from '@/services/rooms';
import { InstallApp } from '@/components/features/InstallApp';
import { PassOffer, type BillingInfo } from './PassOffer';
import { PinSettings } from './PinSettings';
import { useAutoLock } from './useAutoLock';
import { RoyalAvatar } from './RoyalAvatar';

function timeLeft(iso: string): string {
  const h = Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 3_600_000));
  if (h < 24) return h === 1 ? 'queda menos de 1 hora' : `quedan ${h} horas`;
  const d = Math.ceil(h / 24);
  return d === 1 ? 'queda 1 día' : `quedan ${d} días`;
}

function accessLabel(a: FamilyView['rooms'][number]['access']): { text: string; tone: string } {
  if (a.plan === 'pass') return { text: '✨ Con Pase de Navidad', tone: 'text-[#f6d77a]' };
  if (a.plan === 'trial' && a.trialEndsAt) {
    return a.locked
      ? { text: 'Prueba terminada', tone: 'text-[#ff8a8c]' }
      : { text: `Prueba gratis · ${timeLeft(a.trialEndsAt)}`, tone: 'text-[#5eead4]' };
  }
  return { text: 'Sin límite', tone: 'text-[#7ee2a8]' };
}

/** Todas las salas de la familia, reconstruidas desde el enlace de familia. */
export function FamilyPanel({ familyToken, family, origin, billing, hasPin = false }: { familyToken: string; family: FamilyView; origin: string; billing: BillingInfo; hasPin?: boolean }) {
  // El PIN se pone y se quita con el enlace de padres de cualquiera de las salas (el de familia solo lo pide).
  const panelToken = family.rooms[0]?.parentToken ?? '';
  useAutoLock(hasPin, familyToken);
  const locale = useLocale();
  const familyLink = `${origin}/familia/${familyToken}`;
  const [name, setName] = useState(family.name ?? '');
  const [savedName, setSavedName] = useState(family.name ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);

  // Este móvil recuerda la familia y todas sus salas (así "Tus salas" se recupera en un móvil nuevo).
  useEffect(() => {
    saveFamily(familyToken);
    saveKids(family.rooms.map((r) => ({ name: r.childName, reading: r.readingLevel })));
    for (const room of [...family.rooms].reverse()) {
      saveRoom({
        childName: room.childName,
        characterId: room.character,
        characterAlias: room.characterAlias ?? undefined,
        characterGender: room.characterGender === 'f' ? 'f' : room.characterGender === 'm' ? 'm' : undefined,
        parentPath: `/paje/${room.parentToken}`,
        childPath: `/r/${room.childToken}`,
        createdAt: new Date().toISOString(),
      });
    }
  }, [familyToken, family.rooms]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      /* sin permisos */
    }
  };

  const rename = async () => {
    const trimmed = name.trim();
    if (trimmed === savedName) return;
    setMsg(null);
    try {
      const res = await fetch(`/api/family/${familyToken}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: trimmed }) });
      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo guardar.');
      setSavedName(trimmed);
      setMsg('Guardado.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };

  const title = savedName || 'Tu familia';
  const mailSubject = `Tu enlace de Línea Mágica${savedName ? ` · ${savedName}` : ''}`;
  const trialRoom = family.rooms.find((r) => r.access.plan === 'trial');
  const openChildLink = (token: string) => `${origin}/r/${token}`;
  const startAnother = () => {
    saveFamily(familyToken);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#0a1220] text-[#e8f1ff]">
      <div className="mx-auto w-full max-w-md space-y-4 px-4 lg:grid lg:max-w-4xl lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0 lg:px-8 lg:pt-14 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8">
        <header className="text-center lg:col-span-2 lg:mb-2">
          <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#5eead4]">🔒 Zona secreta de los padres</p>
          <h1 className="mt-2 font-serif text-3xl">{title}</h1>
          <p className="mt-1 text-[13.5px] opacity-70"><R>Aquí están todas vuestras salas. Los peques no ven esta pantalla.</R></p>
        </header>

        <ul className={`space-y-3 lg:col-span-2 lg:grid lg:gap-4 lg:space-y-0 ${family.rooms.length > 1 ? 'lg:grid-cols-2' : 'lg:mx-auto lg:w-full lg:max-w-md'}`} aria-label="Salas de la familia">
          {family.rooms.map((room) => {
            const c = resolveCharacter(CHARACTERS[room.character], { alias: room.characterAlias, gender: room.characterGender, locale });
            const acc = accessLabel(room.access);
            const childLink = openChildLink(room.childToken);
            return (
              <li key={room.parentToken} className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
                <div className="flex items-center gap-3">
                  <RoyalAvatar character={c} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold">{room.childName}</p>
                    <p className="truncate text-[12.5px] opacity-65">con {c.name}</p>
                    <p className={`text-[12px] font-semibold ${acc.tone}`}>{acc.text}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[13.5px]">
                  <Link href={`/paje/${room.parentToken}`} className="grid min-h-11 place-items-center rounded-xl bg-[#5eead4] font-bold text-[#04302b] active:scale-[0.98]">
                    Abrir panel de {room.childName}
                  </Link>
                  <button type="button" onClick={() => copy(`c-${room.parentToken}`, childLink)} className="min-h-11 rounded-xl bg-white/10 font-semibold active:scale-[0.98]">
                    {copied === `c-${room.parentToken}` ? '¡Copiado!' : 'Copiar enlace del peque'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {billing.enabled && trialRoom && (offerOpen ? (
          <div className="lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-md"><PassOffer billing={billing} roomToken={trialRoom.parentToken} title="Pase de Navidad para toda la familia" tone="panel" /></div>
        ) : (
          <button type="button" onClick={() => setOfferOpen(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl lg:col-span-2 border border-[#5eead4]/40 bg-[#5eead4]/[.06] px-4 text-[14px] font-semibold text-[#5eead4] active:scale-[0.99]">
            ✨ Pase de Navidad para toda la familia · {billing.price}
          </button>
        ))}

        <Link href="/#crear" onClick={startAnother} className="flex min-h-12 items-center justify-center rounded-2xl lg:col-span-2 border border-[#f6d77a]/50 px-4 text-center font-bold text-[#f6d77a] active:scale-[0.98]">
          + Preparar otra sala
        </Link>

        <section role="note" className="space-y-2.5 rounded-2xl border-2 border-[#f6d77a]/60 bg-[#f6d77a]/[.08] p-4 text-[13.5px] leading-snug">
          <p className="text-[15px] font-extrabold text-[#f6d77a]">⭐ Guarda este enlace</p>
          <p className="opacity-85"><R>Con él recuperáis todas las salas desde cualquier móvil, aunque borréis el navegador. Mandáoslo por WhatsApp o por correo y no lo compartáis con los peques.</R></p>
          <div className="flex gap-2">
            <button type="button" onClick={() => copy('family', familyLink)} className="min-h-10 flex-1 rounded-xl bg-white/10 font-semibold active:scale-[0.98]">
              {copied === 'family' ? '¡Copiado!' : 'Copiar enlace'}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${mailSubject}: ${familyLink}`)}`} target="_blank" rel="noopener noreferrer" className="grid min-h-10 flex-1 place-items-center rounded-xl bg-[#25d366] font-bold text-[#062b14] active:scale-[0.98]">
              Por WhatsApp
            </a>
          </div>
          <a href={`mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(familyLink)}`} className="grid min-h-10 place-items-center rounded-xl border border-[#5eead4]/40 font-semibold text-[#5eead4] active:scale-[0.98]">
            Enviármelo por correo
          </a>
        </section>

        {panelToken && <PinSettings token={panelToken} hasPin={hasPin} intro="Si tu peque coge tu móvil, no podrá ver vuestras salas ni lo que escribes. El PIN vale para todas." />}

        <InstallApp what="tus salas" tone="panel" />

        <section aria-label="Apodo de la familia" className="space-y-1.5 rounded-2xl border border-white/10 bg-white/[.03] p-3.5 text-[13px]">
          <label htmlFor="family-name" className="font-semibold">Apodo de la familia <span className="font-normal opacity-60">(opcional)</span></label>
          <div className="flex gap-2">
            <input
              id="family-name"
              value={name}
              maxLength={30}
              placeholder="Los Estrella"
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[15px] focus:border-[#5eead4] focus:outline-none"
            />
            <button type="button" onClick={rename} disabled={name.trim() === savedName} className="rounded-xl bg-[#5eead4] px-4 font-bold text-[#04302b] disabled:opacity-40">
              Guardar
            </button>
          </div>
          <p className="text-[11.5px] opacity-55"><R>Solo se ve en esta página y en el asunto del correo. Mejor un apodo que un apellido.</R></p>
          {msg && <p role="status" className="text-[12px] text-[#7ee2a8]">{msg}</p>}
        </section>
      </div>
    </div>
  );
}
