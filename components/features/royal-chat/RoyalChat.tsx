'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_VOICE_SECONDS } from '@/lib/royal';
import { IconBack, IconMic, IconPen, IconSeal, IconSend, IconStar } from './icons';
import { OrientPhoto } from './OrientPhoto';
import { RoyalAvatar } from './RoyalAvatar';
import { useVoiceRecorder, type Recording } from './useVoiceRecorder';
import { VoiceNote } from './VoiceNote';
import type { ChatMessage, King } from './types';

interface RoyalChatProps {
  king: King;
  childName: string;
  messages: ChatMessage[];
  /** Qué está haciendo el Rey ahora mismo (para el indicador). */
  kingActivity: KingActivity;
  onVoice: (rec: Recording & { blob: Blob }) => void;
  onText: (text: string) => void;
  /** Demo sin micrófono real. */
  simulateRecording?: boolean;
  /** Aviso no bloqueante (errores de red, permisos…). */
  notice?: string | null;
  sending?: boolean;
}

export type KingActivity = 'recording' | 'typing' | null;

const MIN_RECORD_S = 0.8;
const MAX_TEXT = 300;

export function RoyalChat({
  king,
  childName,
  messages,
  kingActivity,
  onVoice,
  onText,
  simulateRecording = false,
  notice,
  sending = false,
}: RoyalChatProps) {
  const { recording, elapsed, error, start, stop } = useVoiceRecorder({ simulate: simulateRecording });
  const [hint, setHint] = useState(false);
  const [draft, setDraft] = useState('');
  const kingShort = king.name.replace('Rey ', '');
  const busy = kingActivity !== null;
  const endRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: firstScroll.current ? 'auto' : 'smooth', block: 'end' });
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
    <div className="fixed inset-0 z-40 flex justify-center bg-black">
      <div className="relative flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#160a2b] text-[#2b1b0e]">
        <div aria-hidden className="royal-sky pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#f2c94c]/15 blur-3xl" />

        <header className="relative z-10 flex items-center gap-3 bg-gradient-to-b from-[#3b1466] to-[#2a0f4a] px-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_6px_20px_rgba(0,0,0,.35)]">
          <span aria-hidden className="grid size-9 place-items-center rounded-full text-[#f6d77a]">
            <IconBack className="size-6" />
          </span>
          <RoyalAvatar king={king} size={42} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 font-serif text-[17px] font-semibold leading-tight text-[#fff6dc]">
              {king.name}
              <IconSeal className="size-4 text-[#f2c94c]" aria-label="Rey verificado de Oriente" />
            </p>
            <p className="text-[12.5px] text-[#f6d77a]/90" aria-live="polite">
              {kingActivity === 'recording' ? 'grabando un audio…' : kingActivity === 'typing' ? 'escribiendo…' : 'desde Oriente'}
            </p>
          </div>
        </header>

        <div role="log" aria-label="Conversación" className="relative z-10 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4">
          <p className="mx-auto mb-3 flex w-fit max-w-[85%] items-center gap-1.5 rounded-xl bg-[#f6d77a]/10 px-3 py-1.5 text-center text-[11.5px] leading-snug text-[#f6d77a]">
            <IconStar className="size-3 shrink-0" /> Solo {childName} y los Reyes pueden ver estos mensajes
          </p>

          {messages.length === 0 && !busy && (
            <div className="mx-auto mt-10 max-w-[80%] text-center text-[14px] leading-relaxed text-[#fff6dc]/80">
              <p className="font-serif text-lg text-[#f6d77a]">¡Hola, {childName}!</p>
              <p className="mt-2">Escríbele o mantén pulsado el botón dorado para mandarle un audio a {kingShort}.</p>
            </div>
          )}

          {messages.map((m) => (
            <Bubble key={m.id} message={m} king={king} />
          ))}

          {busy && (
            <div className="flex animate-pop items-end gap-2">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-[#fbf5e6] px-3.5 py-2.5 shadow-md">
                <span className="relative grid size-6 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#7a3fb0]/30" />
                  {kingActivity === 'recording' ? <IconMic className="relative size-4 text-[#7a3fb0]" /> : <IconPen className="relative size-4 text-[#7a3fb0]" />}
                </span>
                <span className="text-[13px] text-[#5b3a1e]">{king.name} está {kingActivity === 'recording' ? 'grabando un audio' : 'escribiendo'}…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {banner && (
          <p role="alert" className="relative z-10 mx-3 mb-1 rounded-xl bg-[#e5383b]/90 px-3 py-2 text-center text-[13px] text-white">
            {banner}
          </p>
        )}

        <form onSubmit={submitText} className="relative z-10 flex items-end gap-2 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
          <div className="relative flex min-h-12 flex-1 items-center rounded-3xl bg-[#fbf5e6] px-4 shadow-md">
            {recording ? (
              <p className="flex items-center gap-2 text-[15px] text-[#5b3a1e]">
                <span className="size-2.5 animate-pulse rounded-full bg-[#e5383b]" />
                <span className="tabular-nums">{`0:${String(Math.floor(elapsed)).padStart(2, '0')}`}</span>
                <span className="text-[#5b3a1e]/60">Suelta para enviar</span>
              </p>
            ) : (
              <>
                <label htmlFor="royal-draft" className="sr-only">Mensaje para {king.name}</label>
                <input
                  id="royal-draft"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={MAX_TEXT}
                  enterKeyHint="send"
                  autoComplete="off"
                  placeholder={sending ? 'Enviando a Oriente…' : `Escribe a ${kingShort}…`}
                  className="w-full bg-transparent py-3 text-[16px] text-[#2b1b0e] placeholder:text-[#5b3a1e]/45 focus:outline-none"
                />
              </>
            )}
            {hint && (
              <span role="status" className="absolute -top-10 right-0 animate-pop rounded-xl bg-[#2a0f4a] px-3 py-1.5 text-xs text-[#f6d77a] shadow-lg">
                Mantén pulsado el botón dorado
              </span>
            )}
          </div>
          {draft.trim() && !recording ? (
            <button
              type="submit"
              aria-label={`Enviar mensaje a ${king.name}`}
              disabled={sending}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[#3a2208] shadow-lg shadow-black/30 transition-transform active:scale-95 disabled:opacity-60"
            >
              <IconSend className="ml-0.5 size-5" />
            </button>
          ) : (
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
              className={`grid size-12 shrink-0 touch-none select-none place-items-center rounded-full bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[#3a2208] shadow-lg shadow-black/30 transition-transform duration-150 disabled:opacity-60 ${recording ? 'scale-125' : 'active:scale-95'}`}
            >
              <IconMic className="size-6" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function Bubble({ message, king }: { message: ChatMessage; king: King }) {
  if (message.from === 'system' && message.kind === 'text') {
    return (
      <p className="mx-auto w-fit max-w-[88%] animate-pop rounded-2xl bg-[#f6d77a]/12 px-3 py-2 text-center text-[12.5px] leading-snug text-[#f6d77a]">
        {message.text}
      </p>
    );
  }
  const mine = message.from === 'child';
  const shell = mine
    ? 'ml-auto rounded-2xl rounded-br-md bg-gradient-to-b from-[#f8e08e] to-[#ecc25a] text-[#2b1b0e]'
    : 'mr-auto rounded-2xl rounded-bl-md bg-[#fbf5e6] text-[#2b1b0e]';

  return (
    <div className={`flex animate-pop ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[82%] shadow-md ${shell} ${message.kind === 'photo' ? 'overflow-hidden p-1' : 'px-3 py-2'}`}>
        {message.kind === 'text' && <p className="whitespace-pre-line text-[15px] leading-snug">{message.text}</p>}
        {message.kind === 'voice' && <VoiceNote duration={message.duration} seed={message.seed} mine={mine} king={king} src={message.src} />}
        {message.kind === 'photo' && (
          <figure className="w-64">
            <div className="overflow-hidden rounded-xl"><OrientPhoto /></div>
            <figcaption className="px-2 pb-1 pt-1.5 text-[14px] leading-snug">{message.caption}</figcaption>
          </figure>
        )}
        <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${mine ? 'text-[#3a2208]/60' : 'text-[#5b3a1e]/55'}`}>
          {message.time}
          {mine && (
            <span className="flex text-[#7a3fb0]" aria-label="Enviado a Oriente">
              <IconStar className="size-3" />
              <IconStar className="-ml-1 size-3" />
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
