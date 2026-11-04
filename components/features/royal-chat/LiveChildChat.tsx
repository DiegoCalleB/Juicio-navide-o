'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterProfile } from '@/lib/characters';
import type { RoomMessageDTO } from '@/lib/royal';
import { fmtTime, startPolling, toChatMessage, type ApiResult } from './mapping';
import { RoyalChat, type KingActivity } from './RoyalChat';
import type { ChatMessage } from './types';

const KING_ACTIVITY_MS = 3500;

/** Chat del niño conectado: envía audios o texto y recibe al Rey (con "grabando…/escribiendo…"). */
export function LiveChildChat({ token, character, childName }: { token: string; character: CharacterProfile; childName: string }) {
  const [shown, setShown] = useState<ChatMessage[]>([]);
  const [local, setLocal] = useState<ChatMessage[]>([]);
  const [kingActivity, setKingActivity] = useState<KingActivity>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const loaded = useRef(false);
  const revealing = useRef(false);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/rooms/${token}/messages`, { cache: 'no-store' });
    const body = (await res.json()) as ApiResult<{ messages: RoomMessageDTO[] }>;
    if (!body.ok || !body.data) throw new Error(body.error?.message ?? 'error');
    const all = body.data.messages.map(toChatMessage).filter((m): m is ChatMessage => m !== null);
    const fresh = all.filter((m) => !seen.current.has(m.id));
    if (fresh.length === 0) return;

    const fromKing = loaded.current ? fresh.filter((m) => m.from === 'king') : [];
    const immediate = fresh.filter((m) => !fromKing.includes(m));
    immediate.forEach((m) => seen.current.add(m.id));
    if (immediate.length) setShown((s) => [...s, ...immediate]);
    loaded.current = true;

    const first = fromKing[0];
    if (first && !revealing.current) {
      revealing.current = true;
      setKingActivity(first.kind === 'voice' ? 'recording' : 'typing');
      setTimeout(() => {
        fromKing.forEach((m) => seen.current.add(m.id));
        setShown((s) => [...s, ...fromKing]);
        setKingActivity(null);
        revealing.current = false;
        navigator.vibrate?.(180);
      }, KING_ACTIVITY_MS);
    }
  }, [token]);

  useEffect(() => {
    const stop = startPolling(poll, 5000);
    return stop;
  }, [poll]);

  /** Envío optimista: se muestra al instante y se sustituye por el del servidor. */
  const send = async (optimistic: ChatMessage, request: () => Promise<Response>) => {
    setNotice(null);
    setLocal((l) => [...l, optimistic]);
    setSending(true);
    try {
      const res = await request();
      const body = (await res.json()) as ApiResult<null>;
      if (!body.ok) throw new Error(body.error?.message ?? 'No se pudo enviar.');
      await poll();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'No se pudo enviar. Inténtalo otra vez.');
    } finally {
      setLocal((l) => l.filter((m) => m.id !== optimistic.id));
      setSending(false);
    }
  };

  const now = () => fmtTime(new Date().toISOString());

  const onVoice = ({ blob, seconds }: { blob: Blob; seconds: number }) => {
    const form = new FormData();
    form.append('audio', blob, 'nota');
    form.append('duration', String(seconds));
    void send(
      { id: `local-${Date.now()}`, from: 'child', kind: 'voice', duration: Math.round(seconds), seed: Math.round(seconds * 977) || 7, src: URL.createObjectURL(blob), time: now() },
      () => fetch(`/api/rooms/${token}/voice`, { method: 'POST', body: form }),
    );
  };

  const onText = (text: string) => {
    void send(
      { id: `local-${Date.now()}`, from: 'child', kind: 'text', text, time: now() },
      () => fetch(`/api/rooms/${token}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }),
    );
  };

  return (
    <RoyalChat
      character={character}
      childName={childName}
      messages={[...shown, ...local]}
      kingActivity={kingActivity}
      onVoice={onVoice}
      onText={onText}
      notice={notice}
      sending={sending}
    />
  );
}
