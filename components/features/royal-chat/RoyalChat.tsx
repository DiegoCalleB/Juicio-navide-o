'use client';

import { useEffect, useRef, useState } from 'react';
import { CHILD_AUDIO_ENABLED } from '@/lib/features';
import { playChime } from '@/lib/chime';
import { vibrate } from '@/lib/haptics';
import { MAX_VOICE_SECONDS } from '@/lib/royal';
import { IconBack, IconCamera, IconClose, IconMic, IconPen, IconSeal, IconSend, IconStar } from './icons';
import { Garland, MagicScene } from './MagicScene';
import { voiceFollowUps } from './mapping';
import { OrientPhoto } from './OrientPhoto';
import { PhotoPicker } from './PhotoPicker';
import { RoyalAvatar } from './RoyalAvatar';
import { useVoiceRecorder, type Recording } from './useVoiceRecorder';
import { VoiceNote } from './VoiceNote';
import type { Character, ChatMessage } from './types';

interface RoyalChatProps {
  character: Character;
  childName: string;
  messages: ChatMessage[];
  /** Qué está haciendo el Rey ahora mismo (para el indicador). */
  kingActivity: KingActivity;
  onVoice: (rec: Recording & { blob: Blob }) => void;
  onText: (text: string) => void;
  /** El niño elige una foto (ya sin comprimir: lo hace el contenedor). */
  onPhoto?: (file: File) => void;
  /** Se llama al escribir (para el aviso en vivo al otro lado). */
  onTyping?: () => void;
  /** Demo sin micrófono real. */
  simulateRecording?: boolean;
  /** Aviso no bloqueante (errores de red, permisos…). */
  notice?: string | null;
  sending?: boolean;
  /** Dentro de otra página (portada): marco de móvil en vez de pantalla completa. */
  embedded?: boolean;
  /** La conexión en directo se ha perdido un rato. */
  reconnecting?: boolean;
}

export type KingActivity = 'recording' | 'typing' | null;

const MIN_RECORD_S = 0.8;
const MAX_TEXT = 300;

export function RoyalChat({
  character,
  childName,
  messages,
  kingActivity,
  onVoice,
  onText,
  onPhoto,
  onTyping,
  simulateRecording = false,
  notice,
  sending = false,
  embedded = false,
  reconnecting = false,
}: RoyalChatProps) {
  const { recording, elapsed, error, start, stop } = useVoiceRecorder({ simulate: simulateRecording });
  const [hint, setHint] = useState(false);
  const [draft, setDraft] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const kingShort = character.shortName;
  const { theme } = character;
  const [tapped, setTapped] = useState(0);
  const busy = kingActivity !== null;
  const logRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);

  useEffect(() => {
    const el = logRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: firstScroll.current ? 'auto' : 'smooth' });
    firstScroll.current = false;
  }, [messages.length, busy]);

  const finish = async () => {
    const rec = await stop();
    if (rec.seconds < MIN_RECORD_S) {
      setHint(true);
      setTimeout(() => setHint(false), 2200);
      return;
    }
    const blob = rec.blob ?? new Blob([], { type: 'audio/webm' });
    onVoice({ blob, seconds: Math.min(rec.seconds, MAX_VOICE_SECONDS) });
  };

  useEffect(() => {
    if (recording && elapsed >= MAX_VOICE_SECONDS) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, elapsed]);

  const banner = error ?? notice;

  const submitText = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    onText(text.slice(0, MAX_TEXT));
    setDraft('');
  };

  return (
    <div className={embedded ? 'relative flex justify-center' : 'fixed inset-0 z-40 flex justify-center bg-black'}>
      <div
        className={`relative flex w-full max-w-md flex-col overflow-hidden text-[#2b1b0e] ${embedded ? 'h-[560px] rounded-[28px] border border-white/15 shadow-2xl' : 'h-dvh'}`}
        style={{ background: theme.bg }}
      >
        <MagicScene sky={theme.sky} />

        <header className="relative z-10 flex items-center gap-3 px-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_6px_20px_rgba(0,0,0,.35)]" style={{ background: `linear-gradient(to bottom, ${theme.headerFrom}, ${theme.headerTo})` }}>
          <span aria-hidden className="grid size-9 place-items-center rounded-full text-[#f6d77a]">
            <IconBack className="size-6" />
          </span>
          <button
            type="button"
            aria-label={`Saludar a ${character.name}`}
            onClick={() => {
              setTapped((n) => n + 1);
              playChime();
              vibrate(40);
            }}
            className="relative shrink-0 rounded-full active:scale-95"
          >
            <RoyalAvatar character={character} size={42} />
            <span aria-hidden className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#3a0d12] bg-[#4cd98a] shadow-[0_0_8px_#4cd98a]" style={{ borderColor: theme.headerTo }} />
            {tapped > 0 && (
              <span key={tapped} aria-hidden className="anim-tap-line pointer-events-none absolute left-full top-1 z-20 ml-2 whitespace-nowrap rounded-2xl rounded-bl-sm bg-[#fbf5e6] px-3 py-1.5 text-[14px] font-bold text-[#2b1b0e] shadow-lg">
                {character.avatarTap}
              </span>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 font-serif text-[17px] font-semibold leading-tight text-[#fff6dc]">
              {character.name}
              <IconSeal className="size-4 text-[#f2c94c]" aria-label="Personaje verificado" />
            </p>
            <p className="text-[12.5px] text-[#f6d77a]/90" aria-live="polite">
              {kingActivity === 'recording' ? 'grabando un audio…' : kingActivity === 'typing' ? 'escribiendo…' : `desde ${character.placeLabel}`}
            </p>
          </div>
          <Garland sky={theme.sky} />
        </header>

        <div ref={logRef} role="log" aria-label="Conversación" className="kid-font relative z-10 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 pb-4 pt-7">
          <p className="mx-auto mb-3 flex w-fit max-w-[88%] items-center gap-1.5 rounded-xl bg-[#f6d77a]/10 px-3 py-1.5 text-center text-[11.5px] leading-snug text-[#f6d77a]">
            <IconStar className="size-3 shrink-0" /> Línea mágica con {character.placeLabel}: solo {childName} y {character.audience} pueden leerla
          </p>

          {messages.length === 0 && !busy && (
            <div className="mx-auto mt-6 max-w-[86%] text-center text-[15px] leading-relaxed text-[#fff6dc]/85">
              <p className="anim-float text-4xl" aria-hidden>{character.introEmoji}</p>
              <p className="mt-2 font-serif text-xl text-[#f6d77a]">¡Hola, {childName}!</p>
              <p className="mt-2">{character.selfIntro}. Me alegra mucho que me escribas.</p>
              <p className="mt-2 text-[#fff6dc]/70">{CHILD_AUDIO_ENABLED ? `Escríbeme, mándame un dibujo o mantén pulsado el botón dorado para hablarme.` : `Escríbeme o mándame una foto o un dibujo.`}</p>
            </div>
          )}

          {messages.map((m, i) => (
            <Bubble
              key={m.id}
              message={m}
              character={character}
              onOpenPhoto={setLightbox}
              followUps={m.kind === 'voice' ? voiceFollowUps(messages, i, (x) => ({ id: x.id, from: x.from, voiceSrc: x.kind === 'voice' ? x.src : undefined })) : undefined}
            />
          ))}

          {busy && (
            <div className="flex animate-pop items-end gap-2">
              <div className="flex w-fit max-w-[88%] items-center gap-2.5 rounded-2xl rounded-bl-md bg-[#fbf5e6] px-3.5 py-2.5 shadow-md">
                <span className="relative grid size-6 shrink-0 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ background: theme.robe }} />
                  {kingActivity === 'recording' ? <IconMic className="relative size-4" style={{ color: theme.robe }} /> : <IconPen className="relative size-4" style={{ color: theme.robe }} />}
                </span>
                <TypingText character={character} recording={kingActivity === 'recording'} />
                <span aria-hidden className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="anim-dot size-1.5 rounded-full" style={{ background: theme.robe, animationDelay: `${i * 0.18}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>

        {reconnecting && (
          <p role="status" className="relative z-10 mx-3 mb-1 flex items-center justify-center gap-2 rounded-xl bg-[#f6d77a]/15 px-3 py-1.5 text-center text-[12.5px] text-[#f6d77a]">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-[#f6d77a]" /> Se ha cortado la línea mágica… ¡enseguida vuelve! ✨
          </p>
        )}
        {banner && (
          <p role="alert" className="relative z-10 mx-3 mb-1 rounded-xl bg-[#e5383b]/90 px-3 py-2 text-center text-[13px] text-white">
            {banner}
          </p>
        )}

        <form onSubmit={submitText} className="relative z-10 flex items-end gap-2 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
          <div className="relative flex min-h-12 flex-1 items-center rounded-3xl bg-[#fbf5e6] pl-4 pr-1 shadow-md">
            {recording ? (
              <p className="flex items-center gap-2 text-[15px] text-[#5b3a1e]">
                <span className="size-2.5 animate-pulse rounded-full bg-[#e5383b]" />
                <span className="tabular-nums">{`0:${String(Math.floor(elapsed)).padStart(2, '0')}`}</span>
                <span className="text-[#5b3a1e]/60">Suelta para enviar</span>
              </p>
            ) : (
              <>
                <label htmlFor="royal-draft" className="sr-only">Mensaje para {character.name}</label>
                <input
                  id="royal-draft"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    onTyping?.();
                  }}
                  maxLength={MAX_TEXT}
                  enterKeyHint="send"
                  autoComplete="off"
                  placeholder={sending ? 'Enviando tu mensaje…' : `Escribe a ${kingShort}…`}
                  className="kid-font min-w-0 flex-1 bg-transparent py-3 text-[16px] text-[#2b1b0e] placeholder:text-[#5b3a1e]/45 focus:outline-none"
                />
                {onPhoto && (
                  <PhotoPicker
                    onPick={onPhoto}
                    disabled={sending}
                    label="Enviar una foto"
                    className="grid size-10 shrink-0 place-items-center rounded-full text-[#5b3a1e]/70 active:bg-black/5 disabled:opacity-50"
                  />
                )}
              </>
            )}
            {hint && (
              <span role="status" className="absolute -top-10 right-0 animate-pop rounded-xl px-3 py-1.5 text-xs text-[#f6d77a] shadow-lg" style={{ background: theme.headerTo }}>
                Mantén pulsado el botón dorado
              </span>
            )}
          </div>
          {CHILD_AUDIO_ENABLED && !draft.trim() && !recording ? (
            <button
              type="button"
              aria-label="Mantén pulsado para grabar una nota de voz"
              disabled={sending}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setHint(false);
                void start();
              }}
              onPointerUp={() => void finish()}
              onPointerCancel={() => void finish()}
              onContextMenu={(e) => e.preventDefault()}
              className="grid size-12 shrink-0 touch-none select-none place-items-center rounded-full bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[#3a2208] shadow-lg shadow-black/30 transition-transform duration-150 active:scale-95 disabled:opacity-60"
            >
              <IconMic className="size-6" />
            </button>
          ) : recording ? (
            <button
              type="button"
              aria-label="Soltar para enviar"
              onPointerUp={() => void finish()}
              onPointerCancel={() => void finish()}
              className="grid size-12 shrink-0 touch-none select-none scale-125 place-items-center rounded-full bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[#3a2208] shadow-lg shadow-black/30"
            >
              <IconMic className="size-6" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label={`Enviar mensaje a ${character.name}`}
              disabled={sending || !draft.trim()}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[#3a2208] shadow-lg shadow-black/30 transition-transform active:scale-95 disabled:opacity-50"
            >
              <IconSend className="ml-0.5 size-5" />
            </button>
          )}
        </form>

        {lightbox && (
          <div role="dialog" aria-modal="true" aria-label="Foto" className="absolute inset-0 z-30 grid place-items-center bg-black/90 p-3" onClick={() => setLightbox(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="Foto en grande" className="max-h-full max-w-full rounded-xl object-contain" />
            <button type="button" aria-label="Cerrar" className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-white/15 text-white">
              <IconClose className="size-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ message, character, onOpenPhoto, followUps }: { message: ChatMessage; character: Character; onOpenPhoto: (src: string) => void; followUps?: { id: string; src: string }[] }) {
  if (message.from === 'system' && message.kind === 'text') {
    return (
      <div className="flex animate-pop justify-start">
        <div className="relative mr-auto max-w-[82%] rounded-2xl rounded-bl-md bg-[#fbf5e6] px-3 py-2 text-[#2b1b0e] shadow-md ring-1 ring-[#f6d77a]/60">
          <p className="whitespace-pre-line text-[16.5px] leading-snug">{message.text}</p>
          <span className="mt-0.5 flex justify-end text-[10.5px] text-[#5b3a1e]/55">{message.time}</span>
        </div>
      </div>
    );
  }
  const mine = message.from === 'child';
  const shell = mine
    ? 'ml-auto rounded-2xl rounded-br-md bg-gradient-to-b from-[#f8e08e] to-[#ecc25a] text-[#2b1b0e]'
    : 'mr-auto rounded-2xl rounded-bl-md bg-[#fbf5e6] text-[#2b1b0e] anim-arrive ring-1 ring-[#f6d77a]/60';

  return (
    <div className={`flex ${mine ? 'animate-pop justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[82%] shadow-md ${shell} ${message.kind === 'photo' ? 'overflow-hidden p-1' : 'px-3 py-2'}`}>
        {!mine && message.kind === 'text' && <Sparkles />}
        {message.kind === 'text' && <p className={`whitespace-pre-line leading-snug ${mine ? 'text-[15px]' : 'text-[16.5px]'}`}>{message.text}</p>}
        {message.kind === 'voice' && <VoiceNote id={message.id} followUps={followUps} duration={message.duration} seed={message.seed} mine={mine} character={character} src={message.src} />}
        {message.kind === 'photo' && (
          <figure className="w-64">
            {message.src ? (
              <button type="button" onClick={() => onOpenPhoto(message.src!)} className="block w-full overflow-hidden rounded-xl" aria-label="Ver la foto en grande">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={message.src} alt={message.caption || 'Foto'} loading="lazy" decoding="async" className="max-h-72 w-full bg-black/10 object-cover" />
              </button>
            ) : (
              <div className="overflow-hidden rounded-xl"><OrientPhoto /></div>
            )}
            {message.caption && <figcaption className="px-2 pb-1 pt-1.5 text-[14px] leading-snug">{message.caption}</figcaption>}
          </figure>
        )}
        <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${mine ? 'text-[#3a2208]/60' : 'text-[#5b3a1e]/55'}`}>
          {message.time}
          {mine && (
            <span className="flex" style={{ color: character.theme.robe }} aria-label="Enviado">
              <IconStar className="size-3" />
              <IconStar className="-ml-1 size-3" />
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/** Mini destellos que suben cuando llega un mensaje del personaje. */
function Sparkles() {
  return (
    <span aria-hidden className="pointer-events-none absolute -top-2 left-2 right-2 h-0">
      {[8, 38, 70, 92].map((left, i) => (
        <span key={left} className="anim-spark absolute text-[13px] text-[#f2c94c]" style={{ left: `${left}%`, animationDelay: `${0.15 + i * 0.14}s` }}>✦</span>
      ))}
    </span>
  );
}

/** "Papá Noel está escribiendo…" y, pasados unos segundos, una gracia del taller. */
function TypingText({ character, recording }: { character: Character; recording: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (recording) return;
    const t = setInterval(() => setStep((n) => n + 1), 4200);
    return () => clearInterval(t);
  }, [recording]);
  const quips = character.typingQuips;
  const quip = !recording && step > 0 && quips.length > 0 ? quips[(step - 1) % quips.length] : null;
  return (
    <span className="text-[13px] text-[#5b3a1e]">
      {quip ? `${character.shortName} ${quip}` : `${character.name} está ${recording ? 'grabando un audio' : 'escribiendo'}…`}
    </span>
  );
}
