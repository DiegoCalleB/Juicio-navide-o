'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { vibrate } from '@/lib/haptics';
import type { CharacterProfile } from '@/lib/characters';
import { compressForChat } from '@/lib/image';
import type { RoomMessageDTO } from '@/lib/royal';
import { fmtTime, toChatMessage, type ApiResult } from './mapping';
import { RoyalChat, type KingActivity } from './RoyalChat';
import { SurpriseReveal } from './SurpriseReveal';
import type { ChatMessage } from './types';
import { useRoomEvents } from './useRoomEvents';

/** Si el personaje estaba escribiendo hace menos de esto, su mensaje aparece al instante. */
const RECENT_TYPING_MS = 12_000;
/** Si no, se simula un breve "escribiendo…" para que no aparezca de golpe. */
const FAKE_TYPING_MS = 1800;
const TYPING_SIGNAL_EVERY_MS = 2500;

/** Chat del niño conectado en tiempo real: texto, fotos (y voz si está activada). */
export function LiveChildChat({ token, character, childName }: { token: string; character: CharacterProfile; childName: string }) {
  const [shown, setShown] = useState<ChatMessage[]>([]);
  const [local, setLocal] = useState<ChatMessage[]>([]);
  const [revealing, setRevealing] = useState<KingActivity>(null);
  const [liveTyping, setLiveTyping] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const seen = useRef<Set<string>>(new Set());
  const loaded = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTypingAt = useRef(0);
  const lastSignalAt = useRef(0);
  const pending = useRef<ChatMessage[]>([]);

  useEffect(() => () => {
    clearTimeout(revealTimer.current);
    clearTimeout(typingTimer.current);
  }, []);

  /** Muestra todo lo pendiente del personaje, en orden, sin perder nada si llegan varios seguidos. */
  const flushPending = useCallback(() => {
    clearTimeout(revealTimer.current);
    revealTimer.current = undefined;
    const batch = pending.current;
    pending.current = [];
    setRevealing(null);
    setLiveTyping(false);
    if (batch.length === 0) return;
    const special = batch.find((m) => m.kind === 'text' && m.effect === 'surprise');
    if (special?.kind === 'text') setSurprise(special.text);
    setShown((s) => [...s, ...batch]);
    vibrate(180);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${token}/messages`, { cache: 'no-store' });
    const body = (await res.json()) as ApiResult<{ messages: RoomMessageDTO[] }>;
    if (!body.ok || !body.data) throw new Error(body.error?.message ?? 'error');

    const all = body.data.messages.map(toChatMessage).filter((m): m is ChatMessage => m !== null);
    const fresh = all.filter((m) => !seen.current.has(m.id));

    // La primera carga es historial (también si está vacía): lo que llegue después es "en directo".
    const firstLoad = !loaded.current;
    loaded.current = true;
    if (fresh.length === 0) return;
    const fromCharacter = firstLoad ? [] : fresh.filter((m) => m.from === 'king');
    const immediate = fresh.filter((m) => !fromCharacter.includes(m));

    immediate.forEach((m) => seen.current.add(m.id));
    if (immediate.length > 0) setShown((s) => [...s, ...immediate]);

    if (fromCharacter.length > 0) {
      // Marcamos ya como vistos para no duplicar mientras llega el efecto.
      fromCharacter.forEach((m) => seen.current.add(m.id));
      pending.current.push(...fromCharacter);
      const hasSurprise = fromCharacter.some((m) => m.kind === 'text' && m.effect === 'surprise');
      if (hasSurprise || Date.now() - lastTypingAt.current < RECENT_TYPING_MS) {
        flushPending();
      } else if (!revealTimer.current) {
        setRevealing(pending.current[0]?.kind === 'voice' ? 'recording' : 'typing');
        revealTimer.current = setTimeout(flushPending, FAKE_TYPING_MS);
      }
    }
  }, [token, flushPending]);

  const onPeerTyping = useCallback(() => {
    lastTypingAt.current = Date.now();
    setLiveTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setLiveTyping(false), 4500);
  }, []);

  useRoomEvents(token, { onRefresh: refresh, onTyping: onPeerTyping });

  /** Aviso (limitado) a los padres de que el niño está escribiendo. */
  const signalTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSignalAt.current < TYPING_SIGNAL_EVERY_MS) return;
    lastSignalAt.current = now;
    void fetch(`/api/rooms/${token}/typing`, { method: 'POST' }).catch(() => undefined);
  }, [token]);

  /** Envío optimista: se muestra al instante y se sustituye por el del servidor. */
  const send = async (optimistic: ChatMessage, request: () => Promise<Response>) => {
    setNotice(null);
    setLocal((l) => [...l, optimistic]);
    setSending(true);
    try {
      const res = await request();
      const body = (await res.json()) as ApiResult<null>;
      if (!body.ok) throw new Error(body.error?.message ?? 'No se pudo enviar.');
      await refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'No se pudo enviar. Inténtalo otra vez.');
    } finally {
      setLocal((l) => l.filter((m) => m.id !== optimistic.id));
      setSending(false);
    }
  };

  const now = () => fmtTime(new Date().toISOString());

  const onText = (text: string) => {
    void send(
      { id: `local-${Date.now()}`, from: 'child', kind: 'text', text, time: now() },
      () =>
        fetch(`/api/rooms/${token}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        }),
    );
  };

  const onPhoto = async (file: File) => {
    setNotice(null);
    try {
      const blob = await compressForChat(file);
      const form = new FormData();
      form.append('image', blob, 'foto');
      await send(
        { id: `local-${Date.now()}`, from: 'child', kind: 'photo', caption: '', src: URL.createObjectURL(blob), time: now() },
        () => fetch(`/api/rooms/${token}/photo`, { method: 'POST', body: form }),
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'No se pudo preparar la foto.');
    }
  };

  const onVoice = ({ blob, seconds }: { blob: Blob; seconds: number }) => {
    const form = new FormData();
    form.append('audio', blob, 'nota');
    form.append('duration', String(seconds));
    void send(
      { id: `local-${Date.now()}`, from: 'child', kind: 'voice', duration: Math.round(seconds), seed: Math.round(seconds * 977) || 7, src: URL.createObjectURL(blob), time: now() },
      () => fetch(`/api/rooms/${token}/voice`, { method: 'POST', body: form }),
    );
  };

  const activity: KingActivity = revealing ?? (liveTyping ? 'typing' : null);

  return (
    <>
    <RoyalChat
      character={character}
      childName={childName}
      messages={[...shown, ...local]}
      kingActivity={activity}
      onVoice={onVoice}
      onText={onText}
      onPhoto={onPhoto}
      onTyping={signalTyping}
      notice={notice}
      sending={sending}
    />
    {surprise && <SurpriseReveal character={character} childName={childName} text={surprise} onClose={() => setSurprise(null)} />}
    </>
  );
}
