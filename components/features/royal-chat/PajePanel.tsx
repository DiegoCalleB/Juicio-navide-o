'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { REPLY_DELAYS, type KingProfile, type ReplyDelay, type RoomMessageDTO } from '@/lib/royal';
import { IconSeal } from './icons';
import { fmtTime, seedFrom, startPolling, type ApiResult } from './mapping';
import { RoyalAvatar } from './RoyalAvatar';
import { VoiceNote } from './VoiceNote';

const MAX_CHARS = 300;

const QUICK = (name: string) => [
  `¡Hola, ${name}! Qué alegría escucharte. Aquí en Oriente hace un frío que pela, pero los camellos están contentísimos.`,
  `Hemos recibido tu carta, ${name}. La estamos leyendo con muchísima atención.`,
  `Me han contado mis pajes que este año te has portado muy bien, ${name}. ¡Sigue así!`,
  `Los camellos te mandan saludos. ¿Les dejarás un poquito de agua la noche de Reyes?`,
  `Recuerda irte pronto a la cama la noche del cinco, que si estás despierto no podemos pasar.`,
];

const DELAY_LABEL: Record<ReplyDelay, string> = { 0: 'Ahora', 2: '2 min', 10: '10 min', 30: '30 min' };

interface PajePanelProps {
  token: string;
  childLink: string;
  king: KingProfile;
  childName: string;
}

/** Panel secreto de los padres: escuchan al niño y contestan con la voz del Rey. */
export function PajePanel({ token, childLink, king, childName }: PajePanelProps) {
  const [messages, setMessages] = useState<RoomMessageDTO[]>([]);
  const [text, setText] = useState('');
  const [delay, setDelay] = useState<ReplyDelay>(2);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const childCount = useRef(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const kingShort = king.name.replace('Rey ', '');

  const poll = useCallback(async () => {
    const res = await fetch(`/api/rooms/${token}/messages`, { cache: 'no-store' });
    const body = (await res.json()) as ApiResult<{ messages: RoomMessageDTO[] }>;
    if (!body.ok || !body.data) return;
    const list = body.data.messages;
    const fromChild = list.filter((m) => m.from === 'child').length;
    if (childCount.current >= 0 && fromChild > childCount.current) {
      navigator.vibrate?.([120, 80, 120]);
      document.title = `🔔 ${childName} ha mandado un audio`;
    }
    childCount.current = fromChild;
    setMessages(list);
  }, [token, childName]);

  useEffect(() => {
    const stop = startPolling(poll, 4000);
    return stop;
  }, [poll]);
  useEffect(() => {
    const reset = () => { if (document.visibilityState === 'visible') document.title = 'Panel del Paje Real'; };
    document.addEventListener('visibilitychange', reset);
    return () => document.removeEventListener('visibilitychange', reset);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/rooms/${token}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body, delayMinutes: delay }),
      });
      const json = (await res.json()) as ApiResult<null>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo enviar.');
      setText('');
      setNotice({ ok: true, msg: delay === 0 ? `${kingShort} ya ha contestado.` : `${kingShort} contestará en ${delay} min.` });
      await poll();
    } catch (err) {
      setNotice({ ok: false, msg: err instanceof Error ? err.message : 'No se pudo enviar.' });
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(childLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* sin permisos */ }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-black">
      <div className="relative flex h-dvh w-full max-w-md flex-col bg-[#120822] text-[#fff6dc]">
        <header className="flex items-center gap-3 border-b border-white/10 bg-[#1d0b3a] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <RoyalAvatar king={king} size={40} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#f6d77a]">
              <IconSeal className="size-3.5" /> Panel del Paje Real
            </p>
            <p className="truncate text-[15px] font-semibold">Contestas como {king.name} a {childName}</p>
          </div>
        </header>

        <div role="log" aria-label="Conversación" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <section className="rounded-2xl border border-[#f6d77a]/25 bg-[#f6d77a]/[.07] p-3.5 text-[13px] leading-relaxed">
            <p className="font-semibold text-[#f6d77a]">Enlace para el móvil de {childName}</p>
            <p className="mt-1 text-[#fff6dc]/70">Ábrelo en el móvil o la tablet que usará. No compartas esta página: es tu panel secreto.</p>
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={copyLink} className="min-h-10 flex-1 rounded-xl bg-[#f6d77a] px-3 font-bold text-[#2a0f4a] active:scale-[0.98]">
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(childLink)}`} target="_blank" rel="noopener noreferrer"
                className="grid min-h-10 flex-1 place-items-center rounded-xl border border-[#f6d77a]/40 px-3 font-bold text-[#f6d77a] active:scale-[0.98]">
                Enviármelo
              </a>
            </div>
          </section>

          {messages.length === 0 && (
            <p className="py-8 text-center text-[14px] text-[#fff6dc]/60">
              Aún no hay mensajes. Cuando {childName} mande un audio, te vibrará el móvil.
            </p>
          )}

          {messages.map((m) => (
            <PanelMessage key={m.id} m={m} king={king} childName={childName} />
          ))}
          <div ref={endRef} />
        </div>

        <footer className="space-y-2.5 border-t border-white/10 bg-[#1d0b3a] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
            {QUICK(childName).map((q) => (
              <button key={q} type="button" onClick={() => setText(q.slice(0, MAX_CHARS))}
                className="shrink-0 max-w-[14rem] truncate rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12.5px] text-[#fff6dc]/85 active:bg-white/10">
                {q}
              </button>
            ))}
          </div>

          <div className="relative">
            <label htmlFor="reply" className="sr-only">Mensaje de {king.name}</label>
            <textarea id="reply" rows={3} maxLength={MAX_CHARS} value={text} onChange={(e) => setText(e.target.value)}
              placeholder={`Escribe lo que dirá ${kingShort}… llegará como nota de voz`}
              className="w-full resize-none rounded-2xl border border-white/15 bg-[#120822] px-3.5 py-3 text-[15px] text-[#fff6dc] placeholder:text-[#fff6dc]/35 focus:border-[#f6d77a] focus:outline-none" />
            <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums text-[#fff6dc]/40">{text.length}/{MAX_CHARS}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#fff6dc]/60">Llega en</span>
            <div role="radiogroup" aria-label="Cuándo llega la respuesta" className="flex flex-1 gap-1 rounded-xl bg-white/5 p-1">
              {REPLY_DELAYS.map((d) => (
                <button key={d} type="button" role="radio" aria-checked={delay === d} onClick={() => setDelay(d)}
                  className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${delay === d ? 'bg-[#f6d77a] text-[#2a0f4a]' : 'text-[#fff6dc]/70'}`}>
                  {DELAY_LABEL[d]}
                </button>
              ))}
            </div>
          </div>

          {notice && (
            <p role="status" className={`text-center text-[13px] ${notice.ok ? 'text-[#7ee2a8]' : 'text-[#ff8a8c]'}`}>{notice.msg}</p>
          )}

          <button type="button" onClick={send} disabled={!text.trim() || sending}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg disabled:opacity-50 active:scale-[0.99]">
            {sending ? `Grabando la voz de ${kingShort}…` : `Enviar con la voz de ${kingShort}`}
          </button>
        </footer>
      </div>
    </div>
  );
}

function PanelMessage({ m, king, childName }: { m: RoomMessageDTO; king: KingProfile; childName: string }) {
  if (m.from === 'system') {
    return <p className="mx-auto w-fit max-w-[90%] rounded-xl bg-white/5 px-3 py-1.5 text-center text-[11.5px] text-[#fff6dc]/50">Aviso automático enviado: “{m.text}”</p>;
  }
  const child = m.from === 'child';
  return (
    <div className={`flex ${child ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[88%] rounded-2xl px-3 py-2 shadow ${child ? 'rounded-bl-md bg-[#f8e08e] text-[#2b1b0e]' : 'rounded-br-md bg-[#fbf5e6] text-[#2b1b0e]'}`}>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide opacity-60">{child ? childName : king.name}</p>
        {m.kind === 'voice' && (
          <VoiceNote duration={m.duration ?? 5} seed={seedFrom(m.id)} mine={child} king={king} src={m.audioUrl} />
        )}
        {!child && m.text && <p className="mt-1.5 border-t border-black/10 pt-1.5 text-[13px] leading-snug text-[#5b3a1e]">“{m.text}”</p>}
        <p className="mt-1 text-right text-[10.5px] opacity-60">
          {m.pending ? `Se entregará a las ${fmtTime(m.at)}` : fmtTime(m.at)}
        </p>
      </div>
    </div>
  );
}
