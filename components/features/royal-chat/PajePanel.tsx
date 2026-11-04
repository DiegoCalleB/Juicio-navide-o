'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fillChild, type CharacterProfile } from '@/lib/characters';
import { KING_VOICE_ENABLED } from '@/lib/features';
import { compressForChat } from '@/lib/image';
import { REPLY_DELAYS, type ReplyDelay, type RoomMessageDTO } from '@/lib/royal';
import { IconCamera, IconClose, IconFilm, IconSeal } from './icons';
import { fmtTime, seedFrom, type ApiResult } from './mapping';
import { RoyalAvatar } from './RoyalAvatar';
import { useRoomEvents } from './useRoomEvents';
import { VoiceNote } from './VoiceNote';

const MAX_CHARS = 300;
const COUNTDOWN_SECONDS = 5;
const TYPING_SIGNAL_EVERY_MS = 2500;
const DELAY_LABEL: Record<ReplyDelay, string> = { 0: 'Ahora', 2: '2 min', 10: '10 min', 30: '30 min' };

interface PajePanelProps {
  token: string;
  childLink: string;
  character: CharacterProfile;
  childName: string;
}

/** Panel secreto de los padres: ven lo que escribe el niño y contestan como el personaje. */
export function PajePanel({ token, childLink, character, childName }: PajePanelProps) {
  const [messages, setMessages] = useState<RoomMessageDTO[]>([]);
  const [text, setText] = useState('');
  const [delay, setDelay] = useState<ReplyDelay>(0);
  const [mode, setMode] = useState<'voice' | 'text'>('text');
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [childTyping, setChildTyping] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [surpriseSent, setSurpriseSent] = useState(false);
  const [shared, setShared] = useState(false);
  const [momentId, setMomentId] = useState(character.moments[0]?.id ?? 'charla');

  const childCount = useRef(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSignalAt = useRef(0);
  const short = character.shortName;

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${token}/messages`, { cache: 'no-store' });
    const body = (await res.json()) as ApiResult<{ messages: RoomMessageDTO[] }>;
    if (!body.ok || !body.data) return;
    const list = body.data.messages;
    const fromChild = list.filter((m) => m.from === 'child').length;
    if (childCount.current >= 0 && fromChild > childCount.current) {
      navigator.vibrate?.([120, 80, 120]);
      document.title = `🔔 Nuevo mensaje de ${childName}`;
      setChildTyping(false);
    }
    childCount.current = fromChild;
    setMessages(list);
  }, [token, childName]);

  const onChildTyping = useCallback(() => {
    setChildTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setChildTyping(false), 4500);
  }, []);

  const { connected } = useRoomEvents(token, { onRefresh: refresh, onTyping: onChildTyping });

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  // Mantiene la pantalla encendida mientras el panel está abierto (para no perder mensajes del niño).
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) await l.release();
        else lock = l;
      } catch {
        /* no soportado o denegado: el panel sigue funcionando */
      }
    };
    void request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, []);
  useEffect(() => {
    const reset = () => {
      if (document.visibilityState === 'visible') document.title = 'Panel de los padres';
    };
    document.addEventListener('visibilitychange', reset);
    return () => document.removeEventListener('visibilitychange', reset);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, childTyping]);
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const signalTyping = () => {
    const now = Date.now();
    if (now - lastSignalAt.current < TYPING_SIGNAL_EVERY_MS) return;
    lastSignalAt.current = now;
    void fetch(`/api/rooms/${token}/typing`, { method: 'POST' }).catch(() => undefined);
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setNotice(null);
    try {
      const blob = await compressForChat(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
    } catch (err) {
      setNotice({ ok: false, msg: err instanceof Error ? err.message : 'No se pudo preparar la foto.' });
    }
  };

  const canSend = (text.trim().length > 0 || photo !== null) && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setNotice(null);
    try {
      let res: Response;
      if (photo) {
        const form = new FormData();
        form.append('image', photo.blob, 'foto');
        form.append('caption', text.trim());
        form.append('delayMinutes', String(delay));
        res = await fetch(`/api/rooms/${token}/photo`, { method: 'POST', body: form });
      } else {
        res = await fetch(`/api/rooms/${token}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), delayMinutes: delay, mode: KING_VOICE_ENABLED ? mode : 'text' }),
        });
      }
      const json = (await res.json()) as ApiResult<null>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo enviar.');
      setText('');
      setPhoto(null);
      setNotice({ ok: true, msg: delay === 0 ? `${short} ya ha contestado.` : `${short} contestará en ${delay} min.` });
      await refresh();
    } catch (err) {
      setNotice({ ok: false, msg: err instanceof Error ? err.message : 'No se pudo enviar.' });
    } finally {
      setSending(false);
    }
  };

  /** Envía el mensaje con efecto de sorpresa (lo usa la cuenta atrás). */
  const sendSurprise = useCallback(async (message: string) => {
    try {
      const res = await fetch(`/api/rooms/${token}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, delayMinutes: 0, mode: 'text', surprise: true }),
      });
      const json = (await res.json()) as ApiResult<null>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo enviar.');
      setText('');
      setSurpriseSent(true);
      await refresh();
    } catch (err) {
      setNotice({ ok: false, msg: err instanceof Error ? err.message : 'No se pudo enviar la sorpresa.' });
    } finally {
      setCountdown(null);
    }
  }, [token, refresh]);

  const surpriseText = useRef('');
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      void sendSurprise(surpriseText.current);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, sendSurprise]);

  const startSurprise = () => {
    if (!text.trim() || photo) return;
    surpriseText.current = text.trim();
    setSurpriseSent(false);
    setNotice(null);
    setCountdown(COUNTDOWN_SECONDS);
  };

  const shareApp = async () => {
    const url = window.location.origin;
    const msg = `Mira lo que hemos hecho: ${character.name} le escribe a ${childName} en directo y su cara no tiene precio. Pruébalo gratis:`;
    try {
      if (navigator.share) await navigator.share({ title: 'Mensajería Mágica de Navidad', text: msg, url });
      else await navigator.clipboard.writeText(`${msg} ${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* cancelado */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(childLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permisos */
    }
  };

  const activeMoment = character.moments.find((m) => m.id === momentId) ?? character.moments[0];
  const voiceNow = KING_VOICE_ENABLED && mode === 'voice' && !photo;

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-black">
      <div className="relative flex h-dvh w-full max-w-md flex-col bg-[#120822] text-[#fff6dc]">
        <header
          className="flex items-center gap-3 border-b border-white/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
          style={{ background: character.theme.headerTo }}
        >
          <RoyalAvatar character={character} size={40} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#f6d77a]">
              <IconSeal className="size-3.5" /> Panel de los padres
            </p>
            <p className="truncate text-[15px] font-semibold">Contestas como {character.name} a {childName}</p>
          </div>
          <span
            title={connected ? 'Conectado en tiempo real' : 'Reconectando…'}
            className={`size-2.5 shrink-0 rounded-full ${connected ? 'bg-[#7ee2a8]' : 'animate-pulse bg-[#f6d77a]'}`}
            role="status"
            aria-label={connected ? 'Conectado en tiempo real' : 'Reconectando'}
          />
        </header>

        <div role="log" aria-label="Conversación" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <section className="rounded-2xl border border-[#f6d77a]/25 bg-[#f6d77a]/[.07] p-3.5 text-[13px] leading-relaxed">
            <p className="font-semibold text-[#f6d77a]">Enlace para el móvil de {childName}</p>
            <p className="mt-1 text-[#fff6dc]/70">Ábrelo en el móvil o la tablet que usará. No compartas esta página: es tu panel secreto.</p>
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={copyLink} className="min-h-10 flex-1 rounded-xl bg-[#f6d77a] px-3 font-bold text-[#2a0f4a] active:scale-[0.98]">
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(childLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid min-h-10 flex-1 place-items-center rounded-xl border border-[#f6d77a]/40 px-3 font-bold text-[#f6d77a] active:scale-[0.98]"
              >
                Enviármelo
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[.04] p-3.5 text-[13px] leading-relaxed">
            <p className="flex items-center gap-2 font-semibold text-[#f6d77a]">
              <IconFilm className="size-5" /> Graba su reacción
            </p>
            <p className="mt-1 text-[#fff6dc]/75">
              Lo mejor: que otra persona grabe con <strong>otro móvil</strong>. Así tú no tocas nada, sale buena imagen y se oye al niño.
            </p>
            <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-[#fff6dc]/70">
              <li>Escribe abajo el mensaje de la sorpresa.</li>
              <li>Pulsa “Empezar la sorpresa”.</li>
              <li>Quien graba tiene {COUNTDOWN_SECONDS} segundos para enfocar al niño.</li>
            </ol>
            <button
              type="button"
              onClick={startSurprise}
              disabled={!text.trim() || photo !== null || countdown !== null}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f6d77a]/50 font-bold text-[#f6d77a] disabled:opacity-40 active:scale-[0.98]"
            >
              <IconFilm className="size-5" /> Empezar la sorpresa
            </button>
            {!text.trim() && <p className="mt-1.5 text-center text-[11.5px] text-[#fff6dc]/45">Primero escribe el mensaje de abajo.</p>}
            {surpriseSent && (
              <div role="status" className="mt-3 animate-pop rounded-xl bg-[#7ee2a8]/10 p-3 text-center">
                <p className="font-semibold text-[#7ee2a8]">¡Sorpresa enviada! Sigue grabando.</p>
                <p className="mt-1 text-[12.5px] text-[#fff6dc]/70">Si te ha salido bien, súbelo y enseña la app a otros padres:</p>
                <button type="button" onClick={shareApp} className="mt-2 min-h-10 rounded-xl bg-[#f6d77a] px-4 font-bold text-[#2a0f4a] active:scale-[0.98]">
                  {shared ? '¡Listo!' : 'Compartir la app'}
                </button>
              </div>
            )}
          </section>

          {messages.length === 0 && (
            <p className="py-8 text-center text-[14px] text-[#fff6dc]/60">
              Aún no hay mensajes. Cuando {childName} escriba, lo verás aquí al instante.
            </p>
          )}

          {messages.map((m) => (
            <PanelMessage key={m.id} m={m} character={character} childName={childName} onOpenPhoto={setLightbox} />
          ))}

          {childTyping && (
            <p role="status" className="animate-pop text-[13px] italic text-[#f6d77a]">
              {childName} está escribiendo…
            </p>
          )}
          <div ref={endRef} />
        </div>

        <footer className="space-y-2.5 border-t border-white/10 bg-[#1d0b3a] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div role="tablist" aria-label="Momento" className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]">
            {character.moments.map((mo) => (
              <button
                key={mo.id}
                type="button"
                role="tab"
                aria-selected={momentId === mo.id}
                onClick={() => setMomentId(mo.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold transition-colors ${momentId === mo.id ? 'bg-[#f6d77a] text-[#2a0f4a]' : 'bg-white/8 text-[#fff6dc]/70'}`}
              >
                {mo.label}
              </button>
            ))}
          </div>
          {activeMoment?.tip && <p className="text-[11.5px] leading-snug text-[#f6d77a]/80">💡 {activeMoment.tip}</p>}
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
            {(activeMoment?.replies ?? []).map((tpl) => fillChild(tpl, childName)).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setText(q.slice(0, MAX_CHARS))}
                className="max-w-[14rem] shrink-0 truncate rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12.5px] text-[#fff6dc]/85 active:bg-white/10"
              >
                {q}
              </button>
            ))}
          </div>

          {photo && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="Foto adjunta" className="size-14 rounded-xl object-cover" />
              <p className="flex-1 text-[13px] text-[#fff6dc]/80">Foto lista. El texto de abajo irá como pie de foto.</p>
              <button type="button" aria-label="Quitar la foto" onClick={() => setPhoto(null)} className="grid size-9 place-items-center rounded-full bg-white/10">
                <IconClose className="size-5" />
              </button>
            </div>
          )}

          <div className="relative">
            <label htmlFor="reply" className="sr-only">Mensaje de {character.name}</label>
            <textarea
              id="reply"
              rows={3}
              maxLength={MAX_CHARS}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                signalTyping();
              }}
              placeholder={photo ? 'Pie de foto (opcional)…' : `Escribe el mensaje de ${short}…`}
              className="w-full resize-none rounded-2xl border border-white/15 bg-[#120822] px-3.5 py-3 pr-12 text-[15px] text-[#fff6dc] placeholder:text-[#fff6dc]/35 focus:border-[#f6d77a] focus:outline-none"
            />
            <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="sr-only" tabIndex={-1} aria-hidden data-testid="photo-input" />
            <button
              type="button"
              aria-label="Adjuntar una foto"
              onClick={() => fileRef.current?.click()}
              className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-[#f6d77a] active:bg-white/10"
            >
              <IconCamera className="size-6" />
            </button>
            <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums text-[#fff6dc]/40">{text.length}/{MAX_CHARS}</span>
          </div>

          {KING_VOICE_ENABLED && !photo && (
            <div className="flex items-center gap-2">
              <span className="w-14 text-[12px] text-[#fff6dc]/60">Como</span>
              <div role="radiogroup" aria-label="Formato de la respuesta" className="flex flex-1 gap-1 rounded-xl bg-white/5 p-1">
                {(['voice', 'text'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${mode === m ? 'bg-[#f6d77a] text-[#2a0f4a]' : 'text-[#fff6dc]/70'}`}
                  >
                    {m === 'voice' ? 'Nota de voz' : 'Por escrito'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="w-14 text-[12px] text-[#fff6dc]/60">Llega en</span>
            <div role="radiogroup" aria-label="Cuándo llega la respuesta" className="flex flex-1 gap-1 rounded-xl bg-white/5 p-1">
              {REPLY_DELAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={delay === d}
                  onClick={() => setDelay(d)}
                  className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${delay === d ? 'bg-[#f6d77a] text-[#2a0f4a]' : 'text-[#fff6dc]/70'}`}
                >
                  {DELAY_LABEL[d]}
                </button>
              ))}
            </div>
          </div>

          {notice && <p role="status" className={`text-center text-[13px] ${notice.ok ? 'text-[#7ee2a8]' : 'text-[#ff8a8c]'}`}>{notice.msg}</p>}

          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg disabled:opacity-50 active:scale-[0.99]"
          >
            {sending
              ? voiceNow ? `Grabando la voz de ${short}…` : 'Enviando…'
              : photo ? `Enviar foto como ${short}` : voiceNow ? `Enviar con la voz de ${short}` : `Enviar como ${short}`}
          </button>
        </footer>

        {countdown !== null && (
          <div role="alertdialog" aria-modal="true" aria-label="Cuenta atrás" className="absolute inset-0 z-40 grid place-items-center bg-black/95 p-6 text-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f6d77a]">Empieza a grabar</p>
              <p aria-live="assertive" className="my-6 font-serif text-[120px] leading-none text-[#fff6dc]">{countdown > 0 ? countdown : '✨'}</p>
              <p className="text-[15px] text-[#fff6dc]/70">Enfoca al niño con el otro móvil. La sorpresa llega en cuanto llegue a cero.</p>
              <button type="button" onClick={() => setCountdown(null)} className="mt-6 min-h-11 rounded-xl border border-white/25 px-5 font-semibold text-[#fff6dc]/80">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {lightbox && (
          <div role="dialog" aria-modal="true" aria-label="Foto" className="absolute inset-0 z-30 grid place-items-center bg-black/90 p-3" onClick={() => setLightbox(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="Foto en grande" className="max-h-full max-w-full rounded-xl object-contain" />
            <button type="button" aria-label="Cerrar" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/15 text-white">
              <IconClose className="size-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelMessage({
  m,
  character,
  childName,
  onOpenPhoto,
}: {
  m: RoomMessageDTO;
  character: CharacterProfile;
  childName: string;
  onOpenPhoto: (src: string) => void;
}) {
  if (m.from === 'system') {
    return <p className="mx-auto w-fit max-w-[90%] rounded-xl bg-white/5 px-3 py-1.5 text-center text-[11.5px] text-[#fff6dc]/50">Aviso automático enviado: “{m.text}”</p>;
  }
  const child = m.from === 'child';
  return (
    <div className={`flex ${child ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[88%] rounded-2xl px-3 py-2 shadow ${child ? 'rounded-bl-md bg-[#f8e08e] text-[#2b1b0e]' : 'rounded-br-md bg-[#fbf5e6] text-[#2b1b0e]'}`}>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide opacity-60">{child ? childName : character.name}</p>
        {m.kind === 'voice' && <VoiceNote duration={m.duration ?? 5} seed={seedFrom(m.id)} mine={child} character={character} src={m.audioUrl} />}
        {m.kind === 'photo' && m.imageUrl && (
          <button type="button" onClick={() => onOpenPhoto(m.imageUrl!)} className="block w-56 overflow-hidden rounded-xl" aria-label="Ver la foto en grande">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.imageUrl} alt={m.text || 'Foto'} loading="lazy" decoding="async" className="max-h-60 w-full object-cover" />
          </button>
        )}
        {m.text && (m.kind === 'text' || m.kind === 'photo') && <p className="mt-1 whitespace-pre-line text-[15px] leading-snug">{m.text}</p>}
        {m.kind === 'voice' && !child && m.text && <p className="mt-1.5 border-t border-black/10 pt-1.5 text-[13px] leading-snug text-[#5b3a1e]">“{m.text}”</p>}
        <p className="mt-1 text-right text-[10.5px] opacity-60">{m.pending ? `Se entregará a las ${fmtTime(m.at)}` : fmtTime(m.at)}</p>
      </div>
    </div>
  );
}
