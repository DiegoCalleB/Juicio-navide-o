'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playChime } from '@/lib/chime';
import { vibrate } from '@/lib/haptics';
import type { CharacterProfile } from '@/lib/characters';
import { compressForChat } from '@/lib/image';
import type { RoomMessageDTO } from '@/lib/royal';
import { fmtTime, toChatMessage, type ApiResult } from './mapping';
import { NorthPoleIntro } from './NorthPoleIntro';
import { RoyalChat, type KingActivity } from './RoyalChat';
import { SurpriseReveal } from './SurpriseReveal';
import type { ChatMessage } from './types';
import { StateScreen } from './StateScreen';
import { useRoomEvents } from './useRoomEvents';

/** Si el personaje estaba escribiendo hace menos de esto, su mensaje aparece al instante. */
const RECENT_TYPING_MS = 12_000;
/** Si no, se simula un breve "escribiendo…" para que no aparezca de golpe. */
const FAKE_TYPING_MS = 1800;
const TYPING_SIGNAL_EVERY_MS = 2500;

const surpriseKey = (token: string) => `magic-surprise:${token.slice(-16)}`;

function surpriseSeen(token: string): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(surpriseKey(token)) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function markSurpriseSeen(token: string, id: string): void {
  try {
    const ids = [...surpriseSeen(token), id].slice(-20);
    window.localStorage.setItem(surpriseKey(token), JSON.stringify(ids));
  } catch {
    /* sin almacenamiento: como mucho se repite la sorpresa */
  }
}

/** Error con un mensaje apto para el niño (el resto se sustituye por uno genérico). */
class FriendlyError extends Error {}

/** Chat del niño conectado en tiempo real: texto, fotos (y voz si está activada). */
const CAPS_KEY = 'magic-caps';

export function LiveChildChat({ token, character, childName, initialCaps = false }: { token: string; character: CharacterProfile; childName: string; initialCaps?: boolean }) {
  const [shown, setShown] = useState<ChatMessage[]>([]);
  const [local, setLocal] = useState<ChatMessage[]>([]);
  const [revealing, setRevealing] = useState<KingActivity>(null);
  const [liveTyping, setLiveTyping] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [introOpen, setIntroOpen] = useState(true);
  const [gone, setGone] = useState(false);
  const [caps, setCaps] = useState(false);

  // Primeros lectores: MAYÚSCULAS. Viene en el enlace (?letras=mayus) o de la última vez en este dispositivo.
  useEffect(() => {
    try {
      if (initialCaps) {
        window.localStorage.setItem(CAPS_KEY, '1');
        setCaps(true);
      } else {
        setCaps(window.localStorage.getItem(CAPS_KEY) === '1');
      }
    } catch {
      setCaps(initialCaps);
    }
  }, [initialCaps]);
  const toggleCaps = () =>
    setCaps((on) => {
      try {
        window.localStorage.setItem(CAPS_KEY, on ? '0' : '1');
      } catch {
        /* sin almacenamiento */
      }
      return !on;
    });

  const seen = useRef<Set<string>>(new Set());
  const loaded = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTypingAt = useRef(0);
  const lastSignalAt = useRef(0);
  const pending = useRef<ChatMessage[]>([]);
  const versionRef = useRef('');

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
    if (special?.kind === 'text') {
      setSurprise(special.text);
      markSurpriseSeen(token, special.id);
    }
    setShown((s) => [...s, ...batch]);
    vibrate(180);
    playChime();
  }, [token]);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${token}/messages?v=${encodeURIComponent(versionRef.current)}`, { cache: 'no-store' });
    if (res.status === 404) {
      // Los padres han borrado la sala: dejamos de sondear y mostramos el aviso.
      setGone(true);
      return;
    }
    const body = (await res.json()) as ApiResult<{ version: string; unchanged?: boolean; messages?: RoomMessageDTO[] }>;
    if (!body.ok || !body.data) throw new Error(body.error?.message ?? 'error');
    versionRef.current = body.data.version;
    if (body.data.unchanged || !body.data.messages) {
      // Nada nuevo, pero la primera carga (aunque esté vacía) cuenta como historial.
      loaded.current = true;
      return;
    }

    const all = body.data.messages.map(toChatMessage).filter((m): m is ChatMessage => m !== null);
    const fresh = all.filter((m) => !seen.current.has(m.id));

    // Lo que los padres han borrado desaparece del móvil del niño, y lo corregido se actualiza en su sitio.
    const present = new Set(all.map((m) => m.id));
    const byId = new Map(all.map((m) => [m.id, m]));
    setShown((s) => {
      let changed = false;
      const next: ChatMessage[] = [];
      for (const m of s) {
        if (!present.has(m.id)) {
          changed = true;
          continue;
        }
        const latest = byId.get(m.id);
        if (latest && JSON.stringify(latest) !== JSON.stringify(m)) {
          changed = true;
          next.push(latest);
        } else {
          next.push(m);
        }
      }
      return changed ? next : s;
    });

    // La primera carga es historial (también si está vacía): lo que llegue después es "en directo".
    const firstLoad = !loaded.current;
    loaded.current = true;
    // Una sorpresa programada que llegó con la sala cerrada: se enseña a pantalla completa la primera vez.
    if (firstLoad) {
      const seenIds = surpriseSeen(token);
      const missed = all.filter((m) => m.kind === 'text' && m.effect === 'surprise' && m.from === 'king' && !seenIds.has(m.id)).pop();
      if (missed?.kind === 'text') {
        setSurprise(missed.text);
        markSurpriseSeen(token, missed.id);
      }
    }
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

  const { connected } = useRoomEvents(token, { onRefresh: refresh, onTyping: onPeerTyping });

  // Solo avisamos si la conexión lleva un rato caída (no en los primeros segundos de carga).
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if (connected) {
      setOffline(false);
      return;
    }
    const t = setTimeout(() => setOffline(true), 7000);
    return () => clearTimeout(t);
  }, [connected]);

  /** Aviso (limitado) a los padres de que el niño está escribiendo. */
  const signalTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSignalAt.current < TYPING_SIGNAL_EVERY_MS) return;
    lastSignalAt.current = now;
    void fetch(`/api/rooms/${token}/typing`, { method: 'POST' }).catch(() => undefined);
  }, [token]);

  const oops = '¡Uy! Se ha perdido tu mensaje por el camino. Inténtalo otra vez ✨';

  /** Envío optimista: se muestra al instante y se sustituye por el del servidor. */
  const send = async (optimistic: ChatMessage, request: () => Promise<Response>) => {
    setNotice(null);
    setLocal((l) => [...l, optimistic]);
    setSending(true);
    try {
      const res = await request();
      const body = (await res.json()) as ApiResult<null>;
      if (!body.ok) throw new FriendlyError(body.error?.message ?? oops);
      await refresh();
    } catch (err) {
      setNotice(err instanceof FriendlyError ? err.message : oops);
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
      setNotice(oops);
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

  if (gone) {
    return (
      <StateScreen title="Este enlace ya no funciona">
        <p>Pídele a tu familia el enlace nuevo. Si la sala se ha borrado, también tendrán que crear otra.</p>
      </StateScreen>
    );
  }

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
      reconnecting={offline}
      caps={caps}
      onToggleCaps={toggleCaps}
    />
    {introOpen && <NorthPoleIntro token={token} character={character} childName={childName} onOpen={() => setIntroOpen(false)} />}
    {surprise && !introOpen && <SurpriseReveal character={character} childName={childName} text={surprise} onClose={() => setSurprise(null)} />}
    </>
  );
}
