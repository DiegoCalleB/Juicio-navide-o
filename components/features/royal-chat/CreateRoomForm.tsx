'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { loadFamily, saveFamily } from '@/lib/myFamily';
import { loadKids, mergeKids, saveKids, type Kid } from '@/lib/myKids';
import { loadPass } from '@/lib/myPass';
import { PassOffer, type BillingInfo } from './PassOffer';
import { createRoomAction } from '@/app/reyes/actions';
import { Honeypot } from '@/components/ui/Honeypot';
import { CHARACTERS, CHARACTER_GROUPS, resolveCharacter, type CharacterId } from '@/lib/characters';
import { loadRooms, saveRoom } from '@/lib/myRooms';
import { createRoomSchema } from '@/lib/schemas';
import { RoyalAvatar } from './RoyalAvatar';
import { R, useLocale, useRegional } from '@/components/LocaleProvider';

const CARD = 'rounded-3xl border border-white/10 bg-[#1d0b3a]/80 p-5 shadow-2xl backdrop-blur';

type Reading = 'yes' | 'learning' | 'no';
interface Extra { name: string; characterId: CharacterId | ''; reading: Reading }
interface CreatedRoom { name: string; characterId: CharacterId; alias: string; gender: 'm' | 'f'; child: string; parent: string }

export function CreateRoomForm({ billing, defaultCharacter, initialCharacter }: { billing: BillingInfo; defaultCharacter?: CharacterId; initialCharacter?: CharacterId }) {
  // `defaultCharacter` ya no se marca solo: se destaca como "De temporada" y se obliga a elegir, para que se vean todas las opciones.
  const locale = useLocale();
  const r = useRegional();
  const [pending, startTransition] = useTransition();
  const [childName, setChildName] = useState('');
  const [characterId, setCharacterId] = useState<CharacterId | null>(initialCharacter ?? null);
  const [alias, setAlias] = useState('');
  const [gender, setGender] = useState<'m' | 'f'>('m');
  const [reading, setReading] = useState<Reading>('yes');
  const [consent, setConsent] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [plan, setPlan] = useState<'free' | 'trial' | 'pass'>('free');
  const [hasPass, setHasPass] = useState(false);
  useEffect(() => setHasPass(!!loadPass()), []);
  const [trap, setTrap] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedRoom[] | null>(null);
  const [familyLink, setFamilyLink] = useState<string | null>(null);
  const [savedKids, setSavedKids] = useState<Kid[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  /** El selector de personajes se pliega al elegir uno, para que se vea lo que sigue. */
  const [pickerOpen, setPickerOpen] = useState(!initialCharacter);
  const [familyName, setFamilyName] = useState('');
  const [hasFamily, setHasFamily] = useState(true);
  const doneRef = useRef<HTMLDivElement>(null);
  // Al crear, la confirmación se coloca arriba de la pantalla: es lo siguiente que hay que hacer.
  useEffect(() => {
    if (created) doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [created]);
  useEffect(() => {
    // Peques conocidos: la lista propia de este móvil + las salas guardadas + (si hay familia) los de la familia en el servidor.
    const local = mergeKids(loadKids(), loadRooms().map((x) => ({ name: x.childName, reading: 'yes' as const })));
    setSavedKids(local);
    const fam = loadFamily();
    if (fam) {
      fetch(`/api/family/${fam}`)
        .then((res) => res.json() as Promise<{ ok: boolean; data?: { kids?: Kid[] } }>)
        .then((j) => {
          if (j.ok && j.data?.kids) {
            const merged = mergeKids(j.data.kids, local);
            setSavedKids(merged);
            saveKids(merged);
          }
        })
        .catch(() => {});
    }
    setHasFamily(!!loadFamily());
  }, [created]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const passToken = loadPass() ?? undefined;
    const base = { consent, website: trap, locale, ...(passToken ? { passToken } : {}) };
    const kids: { name: string; characterId: CharacterId; reading: Reading; alias: string; gender: 'm' | 'f'; payload: Record<string, unknown> }[] = [];
    if (!characterId) {
      setPickerOpen(true);
      setError('Elige quién le va a contestar a tu peque.');
      return;
    }
    const isElf = characterId === 'duende_chispa';
    kids.push({
      name: childName.trim(), characterId, reading, alias, gender,
      payload: { ...base, childName, characterId, readingLevel: reading, ...(isElf ? { characterAlias: alias.trim() || undefined, characterGender: gender } : {}) },
    });
    for (const x of extras) {
      if (!x.characterId) {
        setError(`Elige quién le contesta a ${x.name.trim() || 'el otro peque'}.`);
        return;
      }
      kids.push({ name: x.name.trim(), characterId: x.characterId as CharacterId, reading: x.reading, alias: '', gender: 'm', payload: { ...base, childName: x.name, characterId: x.characterId, readingLevel: x.reading } });
    }
    // Se valida todo antes de crear nada: o salen todas las salas o ninguna por un dato mal puesto.
    for (const k of kids) {
      const check = createRoomSchema.safeParse(k.payload);
      if (!check.success) {
        const f = check.error.flatten().fieldErrors;
        setError(f.childName?.[0] ?? f.consent?.[0] ?? 'Revisa los datos.');
        return;
      }
    }
    startTransition(async () => {
      const origin = window.location.origin;
      let familyToken = loadFamily() ?? undefined;
      const done: CreatedRoom[] = [];
      let lastPlan: 'free' | 'trial' | 'pass' = 'free';
      for (const [i, k] of kids.entries()) {
        const res = await createRoomAction({ ...k.payload, ...(familyToken ? { familyToken } : {}), ...(i === 0 && !familyToken && familyName.trim() ? { familyName: familyName.trim() } : {}) });
        if (!res.ok) {
          if (res.error.code === 'TRIAL_USED') setTrialUsed(true);
          setError(done.length > 0 ? `${res.error.message} (Se han creado ${done.length} de ${kids.length} salas.)` : res.error.message);
          break;
        }
        familyToken = res.data.familyToken;
        saveFamily(familyToken);
        lastPlan = res.data.plan;
        const aliasOut = k.characterId === 'duende_chispa' ? (k.alias.trim() || undefined) : undefined;
        const genderOut = k.characterId === 'duende_chispa' ? k.gender : undefined;
        saveKids([{ name: k.name, reading: k.reading }]);
        saveRoom({ childName: k.name, characterId: k.characterId, characterAlias: aliasOut, characterGender: genderOut, parentPath: `/paje/${res.data.parentToken}`, childPath: `/r/${res.data.childToken}`, createdAt: new Date().toISOString() });
        done.push({ name: k.name, characterId: k.characterId, alias: k.alias, gender: k.gender, child: `${origin}/r/${res.data.childToken}`, parent: `${origin}/paje/${res.data.parentToken}` });
      }
      if (done.length > 0 && familyToken) {
        setPlan(lastPlan);
        setFamilyLink(`${origin}/familia/${familyToken}`);
        setCreated(done);
      }
    });
  };

  if (created && familyLink) {
    const multi = created.length > 1;
    const first = created[0];
    const firstChar = first ? resolveCharacter(CHARACTERS[first.characterId], { alias: first.alias, gender: first.gender, locale }) : null;
    const mailSubject = `Tu enlace de Línea Mágica${familyName.trim() ? ` · ${familyName.trim()}` : ''}`;
    const familyPath = familyLink.replace(/^https?:\/\/[^/]+/, '');
    return (
      <div ref={doneRef} className={`${CARD} scroll-mt-4 space-y-4 animate-pop`}>
        <div className="text-center">
          <p aria-hidden className="text-4xl">🎉</p>
          <p className="mt-1 font-serif text-[22px] leading-tight text-[#f6d77a]">{multi ? '¡Las salas están listas!' : '¡La sala está lista!'}</p>
          <p className="mt-1 text-[13.5px] text-[#fff6dc]/70">
            {multi ? `${created.map((x) => x.name).join(', ')} ya pueden escribir.` : `${first?.name} ya puede escribir a ${firstChar?.shortName}.`}
            {plan === 'trial' && ' Prueba gratis de 3 días.'}
            {plan === 'pass' && ' ✨ Con tu Pase de Navidad.'}
          </p>
        </div>
        {error && <p role="alert" className="text-center text-sm text-[#ff8a8c]">{error}</p>}

        <section data-family-link={familyLink} className="rounded-2xl border-2 border-[#f6d77a] bg-[#f6d77a]/[.09] p-4">
          <p className="text-[15.5px] font-extrabold text-[#f6d77a]">🔑 Guarda el enlace de tu familia ahora</p>
          <p className="mt-1 text-[13px] leading-snug text-[#fff6dc]/80">
            <R>Es la única llave de vuestras salas: no hay cuenta ni contraseña. Mándatelo y podrás volver desde cualquier móvil.</R>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
            <a href={`https://wa.me/?text=${encodeURIComponent(`${mailSubject}: ${familyLink}`)}`} target="_blank" rel="noopener noreferrer"
              className="col-span-3 grid min-h-11 place-items-center rounded-xl bg-[#25d366] font-bold text-[#062b14] active:scale-[0.98]">
              Mandármelo por WhatsApp
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(familyLink)}`}
              className="col-span-2 grid min-h-10 place-items-center rounded-xl bg-white/10 font-semibold text-[#fff6dc] active:scale-[0.98]">
              Enviármelo por correo
            </a>
            <CopyButton text={familyLink} label="Copiar" />
          </div>
        </section>

        <ul className="space-y-2.5" aria-label="Salas creadas">
          {created.map((room) => {
            const c = resolveCharacter(CHARACTERS[room.characterId], { alias: room.alias, gender: room.gender, locale });
            const childMsg = `${r(`Abre este enlace en el móvil de ${room.name}`)}: ${room.child}`;
            return (
              <li key={room.parent} data-child-link={room.child} className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
                <div className="flex items-center gap-3">
                  <RoyalAvatar character={c} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-[#fff6dc]">{room.name}</p>
                    <p className="truncate text-[12.5px] text-[#fff6dc]/60">con {c.name}</p>
                  </div>
                </div>
                <a href={room.parent} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] active:scale-[0.99]">
                  {multi ? `Abrir el panel de ${room.name}` : 'Abrir mi panel de los padres'}
                </a>
                <p className="mt-2.5 text-[12px] text-[#fff6dc]/60"><R>{`Enlace para el móvil de ${room.name}:`}</R></p>
                <div className="mt-1 flex gap-2 text-[13px]">
                  <a href={`https://wa.me/?text=${encodeURIComponent(childMsg)}`} target="_blank" rel="noopener noreferrer"
                    className="grid min-h-10 flex-1 place-items-center rounded-xl bg-white/10 font-semibold text-[#fff6dc] active:scale-[0.98]">
                    Enviar por WhatsApp
                  </a>
                  <CopyButton text={room.child} label="Copiar" />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col items-center gap-2 pt-1 text-[13.5px]">
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setFamilyLink(null);
              setError(null);
              setChildName('');
              setExtras([]);
              setCharacterId(null);
              setPickerOpen(true);
              setConsent(false);
            }}
            className="min-h-11 w-full rounded-2xl border border-white/20 font-semibold text-[#fff6dc]/85 active:scale-[0.99]"
          >
            Preparar otra sala (otro peque u otro personaje)
          </button>
          <Link href={familyPath} className="py-1 text-[#f6d77a] underline underline-offset-2">
            Ver todas las salas de la familia
          </Link>
        </div>
      </div>
    );
  }

  const elfBlock = characterId === 'duende_chispa' && (
            <div className="mt-2 space-y-3 rounded-2xl border border-[#f6d77a]/25 bg-[#f6d77a]/[.05] p-4">
              <p className="text-sm font-semibold text-[#fff6dc]/90">Vuestro elfo travieso</p>
              <div className="space-y-1.5">
                <label htmlFor="elf-alias" className="block text-[13px] text-[#fff6dc]/75"><R>Nombre (el que queráis)</R></label>
                <input
                  id="elf-alias"
                  value={alias}
                  maxLength={20}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Chispa"
                  autoComplete="off"
                  className="min-h-12 w-full rounded-2xl border border-white/15 bg-[#120822] px-4 text-base text-[#fff6dc] placeholder:text-[#fff6dc]/30 focus:border-[#f6d77a] focus:outline-none"
                />
              </div>
              <div role="radiogroup" aria-label="Es un elfo o una elfa" className="flex gap-2">
                {([['m', 'Es un elfo'], ['f', 'Es una elfa']] as const).map(([g, label]) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={gender === g}
                    onClick={() => setGender(g)}
                    className={`min-h-11 flex-1 rounded-2xl border text-[14px] font-bold ${gender === g ? 'border-[#f6d77a] bg-[#f6d77a]/15 text-[#fff6dc]' : 'border-white/10 bg-white/[.03] text-[#fff6dc]/70'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
  );
  const picked = characterId ? resolveCharacter(CHARACTERS[characterId], { alias, gender, locale }) : null;

  return (
    <>
    <div className="mb-3 text-center">
      <h2 className="font-serif text-2xl text-[#fff6dc]">Crea la sala de tu peque</h2>
      <p className="mt-1 text-[13.5px] text-[#fff6dc]/60">Sin registrarte. Tarda un minuto.</p>
    </div>
    <form onSubmit={submit} noValidate className={`${CARD} relative space-y-5`}>
      <div className="space-y-1.5">
        {savedKids.length > 0 && (
          <div className="mb-2">
            <label htmlFor="kid-pick" className="block text-sm font-semibold text-[#fff6dc]/85">Tus peques</label>
            <select
              id="kid-pick"
              value={savedKids.some((k) => k.name === childName) ? childName : ''}
              onChange={(e) => {
                const kid = savedKids.find((k) => k.name === e.target.value);
                setChildName(e.target.value);
                if (kid) setReading(kid.reading);
              }}
              className="mt-1 min-h-12 w-full rounded-2xl border border-white/15 bg-[#120822] px-4 text-base text-[#fff6dc] focus:border-[#f6d77a] focus:outline-none"
            >
              <option value="">Otro peque…</option>
              {savedKids.map((k) => <option key={k.name} value={k.name}>{k.name}</option>)}
            </select>
          </div>
        )}
        <label htmlFor="child" className="block text-sm font-semibold text-[#fff6dc]/85">Nombre del niño o niña</label>
        <input id="child" value={childName} onChange={(e) => setChildName(e.target.value)} maxLength={30} autoComplete="off"
          placeholder="Lucía" className="min-h-12 w-full rounded-2xl border border-white/15 bg-[#120822] px-4 text-base text-[#fff6dc] placeholder:text-[#fff6dc]/30 focus:border-[#f6d77a] focus:outline-none" />
        <p className="text-xs text-[#fff6dc]/50">Solo el nombre de pila. Nunca pedimos apellidos ni dirección.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1.5 text-sm font-semibold text-[#fff6dc]/85">¿Quién le va a contestar?</legend>
        {!pickerOpen && picked && characterId && (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-[#f6d77a] bg-[#f6d77a]/10 p-3">
              <RoyalAvatar character={picked} size={52} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#fff6dc]">{characterId === 'duende_chispa' ? 'Elfo travieso' : picked.name}</p>
                <p className="text-[12px] leading-tight text-[#fff6dc]/60">{picked.tagline}</p>
              </div>
              <button type="button" onClick={() => setPickerOpen(true)} aria-label="Cambiar de personaje" className="shrink-0 rounded-full border border-white/25 px-3 py-1.5 text-[13px] font-semibold text-[#fff6dc] active:scale-95">
                Cambiar
              </button>
            </div>
            {elfBlock}
          </>
        )}
        {pickerOpen && CHARACTER_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-[#f6d77a]/80">{group.label}</p>
            <div className={`grid gap-2 ${group.ids.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {group.ids.map((id) => {
                const c = resolveCharacter(CHARACTERS[id], { locale });
                const selected = characterId === id;
                return (
                  <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors ${group.ids.length === 1 ? 'flex-row' : 'flex-col text-center'} ${selected ? 'border-[#f6d77a] bg-[#f6d77a]/10' : 'border-white/10 bg-white/[.03]'}`}>
                    <input type="radio" name="character" value={id} checked={selected} onChange={() => setCharacterId(id)} onClick={() => setPickerOpen(false)} className="sr-only" />
                    <RoyalAvatar character={c} size={group.ids.length === 1 ? 52 : 48} />
                    {defaultCharacter === id && (
                      <span className="rounded-full bg-[#7ee2a8]/15 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-[#7ee2a8]">De temporada</span>
                    )}
                    <span className={group.ids.length === 1 ? '' : 'contents'}>
                      <span className="block text-[14px] font-bold text-[#fff6dc]">{group.ids.length === 1 ? c.name : c.shortName}</span>
                      <span className="block text-[11px] leading-tight text-[#fff6dc]/55">{c.tagline}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          {group.id === 'duende' && elfBlock}
          </div>
        ))}
      </fieldset>

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-semibold text-[#fff6dc]/85">¿{childName.trim() || 'Tu peque'} ya lee?</legend>
        <div role="radiogroup" aria-label="Nivel de lectura" className="grid grid-cols-3 gap-2">
          {([['yes', 'Sí'], ['learning', 'Está empezando'], ['no', 'Todavía no']] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={reading === v}
              onClick={() => setReading(v)}
              className={`min-h-11 rounded-2xl border px-1 text-[13px] font-bold leading-tight ${reading === v ? 'border-[#f6d77a] bg-[#f6d77a]/15 text-[#fff6dc]' : 'border-white/10 bg-white/[.03] text-[#fff6dc]/70'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {reading !== 'yes' && (
          <p className="text-xs leading-snug text-[#fff6dc]/55">
            {reading === 'learning'
              ? 'Verá todo en MAYÚSCULAS y te daremos consejos para escribirle frases fáciles. ¡Querrá leer cada mensaje!'
              : 'Verá todo en MAYÚSCULAS. Leedlo juntos y usad fotos: él puede contestar con notas de voz.'}
          </p>
        )}
      </fieldset>

      {extras.map((x, i) => (
        <fieldset key={i} className="space-y-2 rounded-2xl border border-white/10 bg-white/[.03] p-3.5">
          <legend className="px-1 text-sm font-semibold text-[#fff6dc]/85">Otro peque ({i + 2})</legend>
          {savedKids.filter((k) => k.name !== childName && !extras.some((y, j) => j !== i && y.name === k.name)).length > 0 && (
            <select
              aria-label={`Elegir el peque ${i + 2} de tu lista`}
              value=""
              onChange={(e) => {
                const kid = savedKids.find((k) => k.name === e.target.value);
                if (kid) setExtras((list) => list.map((y, j) => (j === i ? { ...y, name: kid.name, reading: kid.reading } : y)));
              }}
              className="min-h-11 w-full rounded-xl border border-white/15 bg-[#120822] px-3 text-[14px] text-[#fff6dc]"
            >
              <option value="">Elegir de tus peques…</option>
              {savedKids.filter((k) => k.name !== childName && !extras.some((y, j) => j !== i && y.name === k.name)).map((k) => <option key={k.name} value={k.name}>{k.name}</option>)}
            </select>
          )}
          <label htmlFor={`extra-name-${i}`} className="sr-only">Nombre del otro peque {i + 2}</label>
          <input
            id={`extra-name-${i}`}
            value={x.name}
            maxLength={30}
            autoComplete="off"
            placeholder="Mateo"
            onChange={(e) => setExtras((list) => list.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))}
            className="min-h-12 w-full rounded-2xl border border-white/15 bg-[#120822] px-4 text-base text-[#fff6dc] placeholder:text-[#fff6dc]/30 focus:border-[#f6d77a] focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[12px] text-[#fff6dc]/65">
              Le contesta
              <select
                value={x.characterId}
                onChange={(e) => setExtras((list) => list.map((y, j) => (j === i ? { ...y, characterId: e.target.value as CharacterId | '' } : y)))}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#120822] px-2 text-[14px] text-[#fff6dc]"
              >
                <option value="">Elige…</option>
                {CHARACTER_GROUPS.flatMap((g) => g.ids).map((id) => <option key={id} value={id}>{resolveCharacter(CHARACTERS[id], { locale }).name}</option>)}
              </select>
            </label>
            <label className="text-[12px] text-[#fff6dc]/65">
              ¿Ya lee?
              <select
                value={x.reading}
                onChange={(e) => setExtras((list) => list.map((y, j) => (j === i ? { ...y, reading: e.target.value as Reading } : y)))}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#120822] px-2 text-[14px] text-[#fff6dc]"
              >
                <option value="yes">Sí</option>
                <option value="learning">Está empezando</option>
                <option value="no">Todavía no</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={() => setExtras((list) => list.filter((_, j) => j !== i))} className="text-[12.5px] text-[#ff8a8c] underline underline-offset-2">
            Quitar este peque
          </button>
        </fieldset>
      ))}
      {extras.length < 4 && (
        <button
          type="button"
          onClick={() => setExtras((list) => [...list, { name: '', characterId: '', reading: 'yes' }])}
          className="min-h-11 w-full rounded-2xl border border-dashed border-[#f6d77a]/40 text-[14px] font-semibold text-[#f6d77a]/90 active:scale-[0.99]"
        >
          + Añadir otro peque (salas a la vez)
        </button>
      )}


      {!hasFamily && (
        <div className="space-y-1">
          <label htmlFor="family-nick" className="block text-sm font-semibold text-[#fff6dc]/85">Apodo de la familia <span className="font-normal text-[#fff6dc]/50">(opcional)</span></label>
          <input id="family-nick" value={familyName} maxLength={30} autoComplete="off" placeholder="Los Estrella" onChange={(e) => setFamilyName(e.target.value)}
            className="min-h-11 w-full rounded-2xl border border-white/15 bg-[#120822] px-4 text-base text-[#fff6dc] placeholder:text-[#fff6dc]/30 focus:border-[#f6d77a] focus:outline-none" />
        </div>
      )}

      <label className="flex items-start gap-3 text-[13px] leading-snug text-[#fff6dc]/75">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#f6d77a]" />
        <span>
          Soy su madre, padre o tutor. Acepto que los mensajes, audios y fotos se guarden en privado, solo para esta conversación, y se borren solos a los 45 días o pasadas las fiestas.{' '}
          <Link href="/privacidad" target="_blank" className="text-[#f6d77a] underline underline-offset-2">Más información</Link>
        </span>
      </label>

      <Honeypot value={trap} onChange={setTrap} />
      {error && <p role="alert" className="text-sm text-[#ff8a8c]">{error}</p>}
      {trialUsed && billing.enabled && <PassOffer billing={billing} title="Pase de Navidad" tone="landing" />}

      <button type="submit" disabled={pending}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg disabled:opacity-60">
        {pending ? 'Preparando la sala…' : extras.length > 0 ? `Crear las ${extras.length + 1} salas` : 'Crear la sala'}
      </button>
      {billing.enabled && !hasPass && (
        <p className="text-center text-xs text-[#fff6dc]/50">Gratis 3 días · después, Pase de Navidad {billing.price} (pago único)</p>
      )}
      {hasPass && <p className="text-center text-xs text-[#f6d77a]/80"><R>✨ Tienes un Pase de Navidad en este móvil: tu sala no tendrá límite.</R></p>}
    </form>
    </>
  );
}

function CopyButton({ text, label = 'Copiar enlace' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch { /* sin permisos */ }
      }}
      className="min-h-10 flex-1 rounded-xl bg-white/10 font-semibold text-[#fff6dc] active:scale-[0.98]"
    >
      {copied ? '¡Copiado!' : label}
    </button>
  );
}
