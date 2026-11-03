'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KingProfile, RoomMessageDTO } from '@/lib/royal';
import { fmtTime, startPolling, toChatMessage, type ApiResult } from './mapping';
import { RoyalChat } from './RoyalChat';
import type { ChatMessage } from './types';

const KING_TYPING_MS = 3500;

/** Chat del niño conectado: sube notas de voz y recibe las del Rey (con "grabando un audio…"). */
export function LiveChildChat({ token, king, childName }: { token: string; king: KingProfile; childName: string }) {
  const [shown, setShown] = useState<ChatMessage[]>([]);
  const [local, setLocal] = useState<ChatMessage[]>([]);
  const [kingRecording, setKingRecording] = useState(false);
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

    if (fromKing.length && !revealing.current) {
      revealing.current = true;
      setKingRecording(true);
      setTimeout(() => {
        fromKing.forEach((m) => seen.current.add(m.id));
        setShown((s) => [...s, ...fromKing]);
        setKingRecording(false);
        revealing.current = false;
        navigator.vibrate?.(180);
      }, KING_TYPING_MS);
    }
  }, [token]);

  useEffect(() => {
    const stop = startPolling(poll, 5000);
    return stop;
  }, [poll]);

  const onVoice = async ({ blob, seconds }: { blob: Blob; seconds: number }) => {
    setNotice(null);
    const localId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: localId, from: 'child', kind: 'voice', duration: Math.round(seconds),
      seed: Math.round(seconds * 977) || 7, src: URL.createObjectURL(blob), time: fmtTime(new Date().toISOString()),
    };
    setLocal((l) => [...l, optimistic]);
    setSending(true);
    try {
      const form = new FormData();
      form.append('audio', blob, 'nota');
      form.append('duration', String(seconds));
      const res = await fetch(`/api/rooms/${token}/voice`, { method: 'POST', body: form });
      const body = (await res.json()) as ApiResult<null>;
      if (!body.ok) throw new Error(body.error?.message ?? 'No se pudo enviar.');
      await poll();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'No se pudo enviar. Inténtalo otra vez.');
    } finally {
      setLocal((l) => l.filter((m) => m.id !== localId));
      setSending(false);
    }
  };

  return (
    <RoyalChat
      king={king}
      childName={childName}
      messages={[...shown, ...local]}
      kingRecording={kingRecording}
      onVoice={onVoice}
      notice={notice}
      sending={sending}
    />
  );
}
