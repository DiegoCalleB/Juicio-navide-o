'use client';

import { useState, useTransition } from 'react';
import { createRoomAction } from '@/app/reyes/actions';
import { Honeypot } from '@/components/ui/Honeypot';
import { CHARACTERS, CHARACTER_GROUPS, type CharacterId } from '@/lib/characters';
import { createRoomSchema } from '@/lib/schemas';
import { RoyalAvatar } from './RoyalAvatar';

export function CreateRoomForm() {
  const [pending, startTransition] = useTransition();
  const [childName, setChildName] = useState('');
  const [characterId, setCharacterId] = useState<CharacterId>('papa_noel');
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<{ child: string; parent: string } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = { childName, characterId, consent, website: trap };
    const check = createRoomSchema.safeParse(payload);
    if (!check.success) {
      const f = check.error.flatten().fieldErrors;
      setError(f.childName?.[0] ?? f.consent?.[0] ?? 'Revisa los datos.');
      return;
    }
    startTransition(async () => {
      const res = await createRoomAction(payload);
      if (!res.ok) return setError(res.error.message);
      const origin = window.location.origin;
      setLinks({ child: `${origin}/r/${res.data.childToken}`, parent: `${origin}/paje/${res.data.parentToken}` });
    });
  };

  if (links) {
    return (
      <div className="space-y-4 animate-pop">
        <p className="text-center font-serif text-xl text-[#f6d77a]">¡La sala real está lista!</p>
        <LinkCard title={`1. Móvil de ${childName.trim()}`} text="Ábrelo en el móvil o tablet que usará. Ahí verá el chat con su Rey." url={links.child} />
        <LinkCard title="2. Tu panel secreto de Paje Real" text="Desde aquí escuchas sus audios y contestas como el Rey. Guárdalo y no lo compartas." url={links.parent} secret />
        <a href={links.parent} className="flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a]">
          Abrir mi panel de Paje Real
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="child" className="block text-sm font-semibold text-[#fff6dc]/85">Nombre del niño o niña</label>
        <input id="child" value={childName} onChange={(e) => setChildName(e.target.value)} maxLength={30} autoComplete="off"
          placeholder="Lucía" className="min-h-12 w-full rounded-2xl border border-white/15 bg-[#120822] px-4 text-base text-[#fff6dc] placeholder:text-[#fff6dc]/30 focus:border-[#f6d77a] focus:outline-none" />
        <p className="text-xs text-[#fff6dc]/50">Solo el nombre de pila. Nunca pedimos apellidos, fotos ni dirección.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1.5 text-sm font-semibold text-[#fff6dc]/85">¿Quién le va a contestar?</legend>
        {CHARACTER_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-[#f6d77a]/80">{group.label}</p>
            <div className={`grid gap-2 ${group.ids.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {group.ids.map((id) => {
                const c = CHARACTERS[id];
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
          </div>
        ))}
      </fieldset>

      <label className="flex items-start gap-3 text-[13px] leading-snug text-[#fff6dc]/75">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#f6d77a]" />
        <span>Soy su madre, padre o tutor. Acepto que sus notas de voz se guarden de forma privada solo para esta sala y se borren automáticamente después de Reyes.</span>
      </label>

      <Honeypot value={trap} onChange={setTrap} />
      {error && <p role="alert" className="text-sm text-[#ff8a8c]">{error}</p>}

      <button type="submit" disabled={pending}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg disabled:opacity-60">
        {pending ? 'Preparando la sala real…' : 'Crear la sala real'}
      </button>
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
    </div>
  );
}
