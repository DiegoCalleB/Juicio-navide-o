'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { loadFamily, saveFamily } from '@/lib/myFamily';
import { loadPass } from '@/lib/myPass';
import { PassOffer, type BillingInfo } from './PassOffer';
import { createRoomAction } from '@/app/reyes/actions';
import { Honeypot } from '@/components/ui/Honeypot';
import { CHARACTERS, CHARACTER_GROUPS, resolveCharacter, type CharacterId } from '@/lib/characters';
import { loadRooms, saveRoom } from '@/lib/myRooms';
import { createRoomSchema } from '@/lib/schemas';
import { RoyalAvatar } from './RoyalAvatar';
import { R, useLocale, useRegional } from '@/components/LocaleProvider';

type Reading = 'yes' | 'learning' | 'no';
interface Extra { name: string; characterId: CharacterId; reading: Reading }
interface CreatedRoom { name: string; characterId: CharacterId; alias: string; gender: 'm' | 'f'; child: string; parent: string }

export function CreateRoomForm({ billing }: { billing: BillingInfo }) {
  const locale = useLocale();
  const r = useRegional();
  const [pending, startTransition] = useTransition();
  const [childName, setChildName] = useState('');
  const [characterId, setCharacterId] = useState<CharacterId>('papa_noel');
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
  const [familyName, setFamilyName] = useState('');
  const [hasFamily, setHasFamily] = useState(false);
  const [savedKids, setSavedKids] = useState<string[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  useEffect(() => {
    setHasFamily(!!loadFamily());
    setSavedKids([...new Set(loadRooms().map((x) => x.childName))]);
  }, [created]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const passToken = loadPass() ?? undefined;
    const base = { consent, website: trap, locale, ...(passToken ? { passToken } : {}) };
    const kids: { name: string; characterId: CharacterId; reading: Reading; alias: string; gender: 'm' | 'f'; payload: Record<string, unknown> }[] = [];
    const isElf = characterId === 'duende_chispa';
    kids.push({
      name: childName.trim(), characterId, reading, alias, gender,
      payload: { ...base, childName, characterId, readingLevel: reading, ...(isElf ? { characterAlias: alias.trim() || undefined, characterGender: gender } : {}) },
    });
    for (const x of extras) {
      kids.push({ name: x.name.trim(), characterId: x.characterId, reading: x.reading, alias: '', gender: 'm', payload: { ...base, childName: x.name, characterId: x.characterId, readingLevel: x.reading } });
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
    const names = created.map((x) => x.name).join(', ');
    const mailSubject = `Tu enlace de Línea Mágica${familyName.trim() ? ` · ${familyName.trim()}` : ''}`;
    return (
      <div className="space-y-4 animate-pop">
        <p className="text-center font-serif text-xl text-[#f6d77a]">{multi ? '¡Las salas reales están listas!' : '¡La sala real está lista!'}</p>
        {plan === 'trial' && (
          <p className="text-center text-[13px] text-[#fff6dc]/70">Prueba gratis de 3 días, con mensajes y fotos. Puedes preparar una sala para cada peque. Después, podréis seguir con el Pase de Navidad ({billing.price}).</p>
        )}
        {error && <p role="alert" className="text-center text-sm text-[#ff8a8c]">{error}</p>}
        <div role="alert" className="rounded-2xl border-2 border-[#ff8a8c] bg-[#ff8a8c]/[.12] p-4 text-[14px] leading-snug text-[#fff6dc]">
          <p className="text-[16px] font-extrabold text-[#ff8a8c]">⚠️ Guarda el enlace de tu familia ahora</p>
          <p className="mt-1.5"><R>No hay cuenta ni contraseña: <strong>el enlace de familia es la llave de todas vuestras salas</strong>. Si lo perdéis, no podemos recuperarlo y no podréis contestar a {names}.</R></p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-[13.5px] text-[#fff6dc]/90">
            <li>Pulsa «Por WhatsApp» o «Enviármelo por correo» en el recuadro dorado, justo debajo.</li>
            <li>Mándatelo a ti mismo (o a tu pareja), no lo guardes solo en esta página.</li>
            <li><R>En este móvil quedará también en «Tus salas» de la portada, pero eso se borra si limpias el navegador.</R></li>
          </ol>
        </div>
        <div className="space-y-2.5 rounded-2xl border-2 border-[#f6d77a]/60 bg-[#f6d77a]/[.08] p-4">
          <p className="text-[15px] font-extrabold text-[#f6d77a]">⭐ Enlace de tu familia</p>
          <p className="text-[13px] leading-snug text-[#fff6dc]/75"><R>Con él recuperáis todas las salas desde cualquier móvil. No lo compartáis con los peques.</R></p>
          <p className="break-all rounded-lg bg-black/30 px-2.5 py-2 text-[11px] text-[#fff6dc]/60">{familyLink}</p>
          <div className="flex gap-2">
            <CopyButton text={familyLink} />
            <a href={`https://wa.me/?text=${encodeURIComponent(`${mailSubject}: ${familyLink}`)}`} target="_blank" rel="noopener noreferrer"
              className="grid min-h-10 flex-1 place-items-center rounded-xl bg-[#25d366] font-bold text-[#062b14] active:scale-[0.98]">
              Por WhatsApp
            </a>
          </div>
          <a href={`mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(familyLink)}`}
            className="grid min-h-10 place-items-center rounded-xl border border-[#5eead4]/40 font-semibold text-[#5eead4] active:scale-[0.98]">
            Enviármelo por correo
          </a>
        </div>
        {plan === 'pass' && <p className="text-center text-[13px] text-[#fff6dc]/70">✨ Con tu Pase de Navidad: sin límite hasta el 20 de enero.</p>}
        {created.map((room) => {
          const c = resolveCharacter(CHARACTERS[room.characterId], { alias: room.alias, gender: room.gender, locale });
          return (
            <div key={room.parent} className="space-y-3">
              <LinkCard title={r(multi ? `Móvil de ${room.name}` : `1. Móvil de ${room.name}`)} text={r(`Ábrelo en el móvil o tablet que usará. Ahí verá el chat con ${c.shortName}.`)} url={room.child} />
              <LinkCard title={multi ? `Panel de los padres de ${room.name}` : '2. Tu panel secreto de los padres'} text={`Desde aquí lees lo que escribe ${room.name} y contestas como ${c.shortName}. No lo compartas con el peque.`} url={room.parent} secret />
              <a href={room.parent} className="flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a]">
                {multi ? `Abrir el panel de ${room.name}` : 'Abrir mi panel de los padres'}
              </a>
            </div>
          );
        })}
        <Link href={familyLink.replace(/^https?:\/\/[^/]+/, '')} className="flex min-h-11 items-center justify-center rounded-2xl border border-[#f6d77a]/50 font-semibold text-[#f6d77a] active:scale-[0.99]">
          Ver todas las salas de la familia
        </Link>
        <button
          type="button"
          onClick={() => {
            setCreated(null);
            setFamilyLink(null);
            setError(null);
            setChildName('');
            setExtras([]);
            setConsent(false);
          }}
          className="min-h-11 w-full rounded-2xl border border-white/20 font-semibold text-[#fff6dc]/85 active:scale-[0.99]"
        >
          Preparar otra sala (otro peque u otro personaje)
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative space-y-5">
      <div className="space-y-1.5">
        {savedKids.length > 0 && (
          <div className="mb-2">
            <label htmlFor="kid-pick" className="block text-sm font-semibold text-[#fff6dc]/85">Tus peques</label>
            <select
              id="kid-pick"
              value={savedKids.includes(childName) ? childName : ''}
              onChange={(e) => setChildName(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-2xl border border-white/15 bg-[#120822] px-4 text-base text-[#fff6dc] focus:border-[#f6d77a] focus:outline-none"
            >
              <option value="">Otro peque…</option>
              {savedKids.map((k) => <option key={k} value={k}>{k}</option>)}
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
        {CHARACTER_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-[#f6d77a]/80">{group.label}</p>
            <div className={`grid gap-2 ${group.ids.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {group.ids.map((id) => {
                const c = resolveCharacter(CHARACTERS[id], { locale });
                const selected = characterId === id;
                return (
                  <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors ${group.ids.length === 1 ? 'flex-row' : 'flex-col text-center'} ${selected ? 'border-[#f6d77a] bg-[#f6d77a]/10' : 'border-white/10 bg-white/[.03]'}`}>
                    <input type="radio" name="character" value={id} checked={selected} onChange={() => setCharacterId(id)} className="sr-only" />
                    <RoyalAvatar character={c} size={group.ids.length === 1 ? 52 : 48} />
                    <span className={group.ids.length === 1 ? '' : 'contents'}>
                      <span className="block text-[14px] font-bold text-[#fff6dc]">{group.ids.length === 1 ? c.name : c.shortName}</span>
                      <span className="block text-[11px] leading-tight text-[#fff6dc]/55">{c.tagline}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          {group.id === 'duende' && characterId === 'duende_chispa' && (
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
          )}
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
                onChange={(e) => setExtras((list) => list.map((y, j) => (j === i ? { ...y, characterId: e.target.value as CharacterId } : y)))}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#120822] px-2 text-[14px] text-[#fff6dc]"
              >
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
          onClick={() => setExtras((list) => [...list, { name: '', characterId: 'papa_noel', reading: 'yes' }])}
          className="min-h-11 w-full rounded-2xl border border-dashed border-[#f6d77a]/50 font-semibold text-[#f6d77a] active:scale-[0.99]"
        >
          + ¿Tienes más peques? Prepara sus salas a la vez
        </button>
      )}

      {!hasFamily && (
        <div className="space-y-1.5">
          <label htmlFor="family-nick" className="block text-sm font-semibold text-[#fff6dc]/85">Apodo de la familia <span className="font-normal text-[#fff6dc]/50">(opcional)</span></label>
          <input id="family-nick" value={familyName} maxLength={30} autoComplete="off" placeholder="Los Estrella" onChange={(e) => setFamilyName(e.target.value)}
            className="min-h-12 w-full rounded-2xl border border-white/15 bg-[#120822] px-4 text-base text-[#fff6dc] placeholder:text-[#fff6dc]/30 focus:border-[#f6d77a] focus:outline-none" />
          <p className="text-xs text-[#fff6dc]/50">Mejor un apodo que un apellido. Solo lo veréis vosotros.</p>
        </div>
      )}

      <label className="flex items-start gap-3 text-[13px] leading-snug text-[#fff6dc]/75">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#f6d77a]" />
        <span>
          Soy su madre, padre o tutor. Acepto que los mensajes, audios y fotos de esta sala se guarden de forma privada, solo para esta conversación, y se borren automáticamente a los 45 días, o pasadas las fiestas (10 de enero; 20 con los Reyes) si eso es más tarde.{' '}
          <Link href="/privacidad" target="_blank" className="text-[#f6d77a] underline underline-offset-2">Más información</Link>
        </span>
      </label>

      <Honeypot value={trap} onChange={setTrap} />
      {error && <p role="alert" className="text-sm text-[#ff8a8c]">{error}</p>}
      {trialUsed && billing.enabled && <PassOffer billing={billing} title="Pase de Navidad" tone="landing" />}

      <button type="submit" disabled={pending}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg disabled:opacity-60">
        {pending ? 'Preparando la sala real…' : extras.length > 0 ? `Crear las ${extras.length + 1} salas reales` : 'Crear la sala real'}
      </button>
      {billing.enabled && !hasPass && (
        <p className="text-center text-xs text-[#fff6dc]/50">Gratis 3 días · después, Pase de Navidad {billing.price} (pago único)</p>
      )}
      {hasPass && <p className="text-center text-xs text-[#f6d77a]/80"><R>✨ Tienes un Pase de Navidad en este móvil: tu sala no tendrá límite.</R></p>}
    </form>
  );
}

function LinkCard({ title, text, url, secret = false }: { title: string; text: string; url: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* sin permisos */ }
  };
  return (
    <div className={`rounded-2xl border p-4 ${secret ? 'border-[#f6d77a]/40 bg-[#f6d77a]/[.06]' : 'border-white/10 bg-white/[.03]'}`}>
      <p className="font-bold text-[#fff6dc]">{title}</p>
      <p className="mt-1 text-[13px] leading-snug text-[#fff6dc]/65">{text}</p>
      <p className="mt-2 truncate rounded-lg bg-black/30 px-2.5 py-2 font-mono text-[11px] text-[#fff6dc]/60">{url}</p>
      <div className="mt-2.5 flex gap-2">
        <button type="button" onClick={copy} className="min-h-10 flex-1 rounded-xl bg-white/10 font-semibold text-[#fff6dc] active:scale-[0.98]">
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"
          className="grid min-h-10 flex-1 place-items-center rounded-xl bg-white/10 font-semibold text-[#fff6dc] active:scale-[0.98]">
          Enviar por WhatsApp
        </a>
      </div>
      {secret && (
        <a
          href={`mailto:?subject=${encodeURIComponent('Mi panel de padres')}&body=${encodeURIComponent(url)}`}
          className="mt-2 grid min-h-10 place-items-center rounded-xl bg-white/10 font-semibold text-[#fff6dc] active:scale-[0.98]"
        >
          Enviármelo por correo
        </a>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
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
      {copied ? '¡Copiado!' : 'Copiar enlace'}
    </button>
  );
}
