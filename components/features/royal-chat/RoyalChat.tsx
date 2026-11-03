'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconBack, IconMic, IconSeal, IconStar } from './icons';
import { OrientPhoto } from './OrientPhoto';
import { RoyalAvatar } from './RoyalAvatar';
import { VoiceNote } from './VoiceNote';
import type { ChatMessage, King } from './types';

interface RoyalChatProps {
  king: King;
  childName: string;
  initialMessages: ChatMessage[];
}

const nowTime = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const MIN_RECORD_S = 0.8;

export function RoyalChat({ king, childName, initialMessages }: RoyalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [kingRecording, setKingRecording] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hint, setHint] = useState(false);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, kingRecording]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const kingReplies = useCallback(() => {
    setTimeout(() => setKingRecording(true), 700);
    setTimeout(() => {
      setKingRecording(false);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), from: 'king', kind: 'voice', duration: 16, seed: Date.now() % 9973, time: nowTime() },
      ]);
    }, 3600);
  }, []);

  const startRecord = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setHint(false);
    setRecording(true);
    startRef.current = performance.now();
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((performance.now() - startRef.current) / 1000), 100);
  };

  const stopRecord = () => {
    if (!recording) return;
    clearInterval(timerRef.current);
    setRecording(false);
    const secs = (performance.now() - startRef.current) / 1000;
    if (secs < MIN_RECORD_S) {
      setHint(true);
      setTimeout(() => setHint(false), 2200);
      return;
    }
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), from: 'child', kind: 'voice', duration: Math.max(1, Math.round(secs)), seed: Math.round(secs * 977), time: nowTime() },
    ]);
    kingReplies();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-black">
      <div className="relative flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#160a2b] text-[#2b1b0e]">
        {/* Fondo: cielo de Oriente con estrellas */}
        <div aria-hidden className="pointer-events-none absolute inset-0 royal-sky" />
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#f2c94c]/15 blur-3xl" />

        {/* Cabecera */}
        <header className="relative z-10 flex items-center gap-3 bg-gradient-to-b from-[#3b1466] to-[#2a0f4a] px-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_6px_20px_rgba(0,0,0,.35)]">
          <button type="button" aria-label="Volver" className="grid size-9 place-items-center rounded-full text-[#f6d77a] active:bg-white/10">
            <IconBack className="size-6" />
          </button>
          <RoyalAvatar king={king} size={42} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 font-serif text-[17px] font-semibold leading-tight text-[#fff6dc]">
              {king.name}
              <IconSeal className="size-4 text-[#f2c94c]" aria-label="Rey verificado de Oriente" />
            </p>
            <p className="text-[12.5px] text-[#f6d77a]/90">{kingRecording ? 'grabando un audio…' : 'en línea · desde Oriente'}</p>
          </div>
        </header>

        {/* Mensajes */}
        <main className="relative z-10 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4">
          <p className="mx-auto mb-3 flex w-fit max-w-[85%] items-center gap-1.5 rounded-xl bg-[#f6d77a]/12 px-3 py-1.5 text-center text-[11.5px] leading-snug text-[#f6d77a]">
            <IconStar className="size-3 shrink-0" /> Solo {childName} y los Reyes pueden ver estos mensajes
          </p>
          <p className="mx-auto w-fit rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white/70">Hoy</p>

          {messages.map((m) => (
            <Bubble key={m.id} message={m} king={king} />
          ))}

          {kingRecording && (
            <div className="flex animate-pop items-end gap-2">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-[#fbf5e6] px-3.5 py-2.5 shadow-md">
                <span className="relative grid size-6 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#7a3fb0]/30" />
                  <IconMic className="relative size-4 text-[#7a3fb0]" />
                </span>
                <span className="text-[13px] text-[#5b3a1e]">{king.name} está grabando un audio…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </main>

        {/* Compositor */}
        <footer className="relative z-10 flex items-end gap-2 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
          <div className="relative flex min-h-12 flex-1 items-center rounded-3xl bg-[#fbf5e6] px-4 shadow-md">
            {recording ? (
              <p className="flex items-center gap-2 text-[15px] text-[#5b3a1e]">
                <span className="size-2.5 animate-pulse rounded-full bg-[#e5383b]" />
                <span className="tabular-nums">{`0:${String(Math.floor(elapsed)).padStart(2, '0')}`}</span>
                <span className="text-[#5b3a1e]/60">Suelta para enviar</span>
              </p>
            ) : (
              <p className="select-none text-[15px] text-[#5b3a1e]/50">Mensaje para {king.name}…</p>
            )}
            {hint && (
              <span role="status" className="absolute -top-10 right-0 animate-pop rounded-xl bg-[#2a0f4a] px-3 py-1.5 text-xs text-[#f6d77a] shadow-lg">
                Mantén pulsado para hablar
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Mantén pulsado para grabar una nota de voz"
            onPointerDown={startRecord}
            onPointerUp={stopRecord}
            onPointerCancel={stopRecord}
            onContextMenu={(e) => e.preventDefault()}
            className={`grid size-12 shrink-0 touch-none select-none place-items-center rounded-full bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[#3a2208] shadow-lg shadow-black/30 transition-transform duration-150 ${recording ? 'scale-125' : 'active:scale-95'}`}
          >
            <IconMic className="size-6" />
          </button>
        </footer>
      </div>
    </div>
  );
}

function Bubble({ message, king }: { message: ChatMessage; king: King }) {
  const mine = message.from === 'child';
  const shell = mine
    ? 'ml-auto rounded-2xl rounded-br-md bg-gradient-to-b from-[#f8e08e] to-[#ecc25a] text-[#2b1b0e]'
    : 'mr-auto rounded-2xl rounded-bl-md bg-[#fbf5e6] text-[#2b1b0e]';

  return (
    <div className={`flex animate-pop ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[82%] shadow-md ${shell} ${message.kind === 'photo' ? 'overflow-hidden p-1' : 'px-3 py-2'}`}>
        {message.kind === 'text' && <p className="whitespace-pre-line text-[15px] leading-snug">{message.text}</p>}
        {message.kind === 'voice' && <VoiceNote duration={message.duration} seed={message.seed} mine={mine} king={king} />}
        {message.kind === 'photo' && (
          <figure className="w-64">
            <div className="overflow-hidden rounded-xl"><OrientPhoto /></div>
            <figcaption className="px-2 pb-1 pt-1.5 text-[14px] leading-snug">{message.caption}</figcaption>
          </figure>
        )}
        <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${mine ? 'text-[#3a2208]/60' : 'text-[#5b3a1e]/55'}`}>
          {message.time}
          {mine && (
            <span className="flex text-[#7a3fb0]" aria-label="Leído por los Reyes">
              <IconStar className="size-3" />
              <IconStar className="-ml-1 size-3" />
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
