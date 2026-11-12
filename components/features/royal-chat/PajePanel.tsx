'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { vibrate } from '@/lib/haptics';
import { fillChild, type CharacterProfile } from '@/lib/characters';
import { KING_VOICE_ENABLED } from '@/lib/features';
import { compressForChat } from '@/lib/image';
import { REPLY_DELAYS, type ReplyDelay, type RoomMessageDTO } from '@/lib/royal';
import { IconCamera, IconClose, IconFilm, IconSeal } from './icons';
import { fmtTime, seedFrom, voiceFollowUps, type ApiResult } from './mapping';
import { ReactionCamera } from './ReactionCamera';
import { ReactionReview } from './ReactionReview';
import { IdeasList } from './IdeasList';
import { PhotoPicker } from './PhotoPicker';
import { RoomAdmin } from './RoomAdmin';
import { PassOffer, type BillingInfo } from './PassOffer';
import { loadFamily } from '@/lib/myFamily';
import { loadRooms, saveRoom } from '@/lib/myRooms';
import { RoyalAvatar } from './RoyalAvatar';
import { SchedulePlanner } from './SchedulePlanner';
import { useReactionRecorder } from './useReactionRecorder';
import { useRoomEvents } from './useRoomEvents';
import { VoiceNote } from './VoiceNote';
import { R, useRegional } from '@/components/LocaleProvider';

const MAX_CHARS = 300;
const COUNTDOWN_SECONDS = 5;
const TYPING_SIGNAL_EVERY_MS = 2500;
const DELAY_LABEL: Record<ReplyDelay, string> = { 0: 'Ahora', 2: '2 min', 10: '10 min', 30: '30 min' };

interface PajePanelProps {
  token: string;
  childLink: string;
  character: CharacterProfile;
  childName: string;
  /** Solo el elfo: nombre y género que eligió la familia. */
  characterAlias?: string | null;
  characterGender?: string | null;
  /** ¿Lee ya el niño? Ajusta consejos y mayúsculas. */
  readingLevel?: 'yes' | 'learning' | 'no';
  billing?: BillingInfo;
}

interface Access {
  plan: 'free' | 'trial' | 'pass';
  trialEndsAt: string | null;
  locked: boolean;
}

/** "quedan 2 días" / "quedan 5 horas" */
function timeLeft(iso: string): string {
  const ms = Date.parse(iso) - Date.now();
  const h = Math.max(1, Math.ceil(ms / 3_600_000));
  if (h < 24) return h === 1 ? 'queda menos de 1 hora' : `quedan ${h} horas`;
  const d = Math.ceil(h / 24);
  return d === 1 ? 'queda 1 día' : `quedan ${d} días`;
}

/** Panel secreto de los padres: ven lo que escribe el niño y contestan como el personaje. */
export function PajePanel({ token, childLink, character, childName, characterAlias = null, characterGender = null, readingLevel = 'yes', billing }: PajePanelProps) {
  const r = useRegional();
  const [access, setAccess] = useState<Access>({ plan: 'free', trialEndsAt: null, locked: false });
  const [offerOpen, setOfferOpen] = useState(false);
  const [familyHref, setFamilyHref] = useState<string | null>(null);
  useEffect(() => {
    const f = loadFamily();
    setFamilyHref(f ? `/familia/${f}` : null);
  }, []);
  // Si la prueba termina con el panel abierto, se muestra la oferta en ese momento.
  useEffect(() => {
    if (access.plan !== 'trial' || access.locked || !access.trialEndsAt) return;
    const ms = Date.parse(access.trialEndsAt) - Date.now();
    if (ms > 2_147_000_000) return;
    const t = setTimeout(() => setAccess((a) => ({ ...a, locked: true })), Math.max(0, ms) + 1000);
    return () => clearTimeout(t);
  }, [access]);
  const [messages, setMessages] = useState<RoomMessageDTO[]>([]);
  const [text, setText] = useState('');
  const [delay, setDelay] = useState<ReplyDelay>(0);
  const [mode, setMode] = useState<'voice' | 'text'>(KING_VOICE_ENABLED ? 'voice' : 'text');
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [sending, setSending] = useState(false);
  type Tone = 'ok' | 'warn' | 'error';
  const [notice, setNotice] = useState<{ tone: Tone; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [childTyping, setChildTyping] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [surpriseSent, setSurpriseSent] = useState(false);
  const [shared, setShared] = useState(false);
  const [recordHere, setRecordHere] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [presence, setPresence] = useState<{ online: boolean; openedAt?: string } | null>(null);
  const openedSeen = useRef<string | undefined>(undefined);
  const [planner, setPlanner] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  /** Idea de travesura elegida a mano (si no, la de hoy). */
  const [pickedDay, setPickedDay] = useState<number | null>(null);
  /** Programar para otro momento (fecha y hora a elegir). */
  const [whenCustom, setWhenCustom] = useState(false);
  const [whenValue, setWhenValue] = useState('');
  /** Primeros lectores: el enlace del niño abre con todo en MAYÚSCULAS. */
  const [capsLink, setCapsLink] = useState(readingLevel !== 'yes');
  const [askRotate, setAskRotate] = useState(false);
  const [rotating, setRotating] = useState(false);
  const shareLink = capsLink ? `${childLink}?letras=mayus` : childLink;
  /** null = automático: abierto al principio, plegado cuando el niño ya ha abierto o ha escrito. */
  const [setupOpen, setSetupOpen] = useState<boolean | null>(null);
  const rec = useReactionRecorder();
  const [momentId, setMomentId] = useState(character.moments[0]?.id ?? 'charla');

  const childCount = useRef(-1);
  const versionRef = useRef('');
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSignalAt = useRef(0);
  const short = character.shortName;

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${token}/messages?v=${encodeURIComponent(versionRef.current)}`, { cache: 'no-store' });
    const body = (await res.json()) as ApiResult<{ version: string; unchanged?: boolean; messages?: RoomMessageDTO[]; access?: Access }>;
    if (!body.ok || !body.data) return;
    if (body.data.access) {
      const a = body.data.access;
      setAccess((prev) => (prev.plan === a.plan && prev.locked === a.locked && prev.trialEndsAt === a.trialEndsAt ? prev : a));
    }
    versionRef.current = body.data.version;
    if (body.data.unchanged || !body.data.messages) return;
    const list = body.data.messages;
    const fromChild = list.filter((m) => m.from === 'child').length;
    if (childCount.current >= 0 && fromChild > childCount.current) {
      vibrate([120, 80, 120]);
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

  const onPresence = useCallback(
    (p: { online: boolean; openedAt?: string }) => {
      setPresence(p);
      if (p.openedAt && p.openedAt !== openedSeen.current) {
        const first = openedSeen.current === undefined;
        openedSeen.current = p.openedAt;
        // Si los padres entran después de que el niño abriera, no hace falta alarma.
        if (!first || Date.now() - Date.parse(p.openedAt) < 20_000) {
          vibrate([200, 100, 200]);
          document.title = `🎁 ¡${childName} ha abierto el mensaje!`;
        }
      }
    },
    [childName],
  );

  const { connected } = useRoomEvents(token, { onRefresh: refresh, onTyping: onChildTyping, onPresence });

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

  const pickPhotoFile = async (file: File) => {
    setNotice(null);
    try {
      const blob = await compressForChat(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
    } catch (err) {
      setNotice({ tone: 'error', msg: err instanceof Error ? err.message : 'No se pudo preparar la foto.' });
    }
  };

  const canSend = (text.trim().length > 0 || photo !== null) && !sending;

  const send = async () => {
    if (!canSend) return;
    let scheduledAt: string | undefined;
    if (whenCustom) {
      const t = whenValue ? new Date(whenValue) : null;
      if (!t || Number.isNaN(t.getTime()) || t.getTime() < Date.now() + 90_000) {
        setNotice({ tone: 'error', msg: 'Elige una fecha y hora futuras (al menos dentro de 2 minutos).' });
        return;
      }
      scheduledAt = t.toISOString();
    }
    setSending(true);
    setNotice(null);
    try {
      let res: Response;
      if (photo) {
        const form = new FormData();
        form.append('image', photo.blob, 'foto');
        form.append('caption', text.trim());
        form.append('delayMinutes', scheduledAt ? '0' : String(delay));
        if (scheduledAt) form.append('scheduledAt', scheduledAt);
        res = await fetch(`/api/rooms/${token}/photo`, { method: 'POST', body: form });
      } else {
        res = await fetch(`/api/rooms/${token}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), delayMinutes: scheduledAt ? 0 : delay, mode: KING_VOICE_ENABLED ? mode : 'text', ...(scheduledAt ? { scheduledAt } : {}) }),
        });
      }
      const json = (await res.json()) as ApiResult<{ delivered: 'voice' | 'text'; fallback?: 'limit' | 'unavailable' }>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo enviar.');
      setText('');
      setPhoto(null);
      // Tras programar, el siguiente mensaje vuelve a enviarse al momento (así no se programa otro sin querer).
      setWhenCustom(false);
      setWhenValue('');
      const when = scheduledAt
        ? `${short} lo enviará ${fmtWhen(scheduledAt)}.`
        : delay === 0
          ? `${short} ya ha contestado.`
          : `${short} contestará en ${delay} min.`;
      const fb = json.data?.fallback;
      if (fb) {
        setNotice({
          tone: 'warn',
          msg: `${fb === 'limit' ? 'Se ha alcanzado el límite diario de voz' : 'La voz no está disponible ahora'}: se ha enviado por escrito. ${when}`,
        });
      } else {
        setNotice({ tone: 'ok', msg: when });
      }
      await refresh();
    } catch (err) {
      setNotice({ tone: 'error', msg: err instanceof Error ? err.message : 'No se pudo enviar.' });
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
      setNotice({ tone: 'error', msg: err instanceof Error ? err.message : 'No se pudo enviar la sorpresa.' });
    } finally {
      setCountdown(null);
    }
  }, [token, refresh]);

  const surpriseText = useRef('');
  const recRef = useRef(rec);
  const firedRef = useRef(false);
  useEffect(() => {
    recRef.current = rec;
  });

  // Cuenta atrás: al llegar a cero se dispara UNA sola vez (grabación local + envío de la sorpresa).
  useEffect(() => {
    if (countdown === null) {
      firedRef.current = false;
      return;
    }
    if (countdown <= 0) {
      if (firedRef.current) return;
      firedRef.current = true;
      if (recordHere && recRef.current.phase === 'ready') {
        setMinimized(false);
        recRef.current.start();
      }
      void sendSurprise(surpriseText.current);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, sendSurprise, recordHere]);

  const startSurprise = async () => {
    if (!text.trim() || photo) return;
    surpriseText.current = text.trim();
    setSurpriseSent(false);
    setNotice(null);
    if (recordHere) {
      const ok = await rec.prepare();
      if (!ok) return; // el error se muestra en la tarjeta
    }
    setCountdown(COUNTDOWN_SECONDS);
  };

  const cancelCountdown = () => {
    setCountdown(null);
    if (rec.phase === 'ready') rec.cancelPrepared();
  };

  // Aviso del navegador si se intenta salir con un vídeo grabándose o sin guardar.
  useEffect(() => {
    if (rec.phase !== 'recording' && rec.phase !== 'review') return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [rec.phase]);

  const shareApp = async () => {
    const url = window.location.origin;
    const msg = `Mira lo que hemos hecho: ${character.name} le escribe a ${childName} en directo y su cara no tiene precio. Pruébalo gratis en Línea Mágica:`;
    try {
      if (navigator.share) await navigator.share({ title: 'Línea Mágica', text: msg, url });
      else await navigator.clipboard.writeText(`${msg} ${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* cancelado */
    }
  };

  const rotateLink = async () => {
    if (rotating) return;
    setRotating(true);
    try {
      const res = await fetch(`/api/rooms/${token}/child-link`, { method: 'POST' });
      const json = (await res.json()) as ApiResult<{ childPath: string }>;
      if (!json.ok || !json.data) throw new Error(json.error?.message ?? 'No se pudo cambiar el enlace.');
      // Mantiene "Tus salas" al día y recarga para mostrar el enlace nuevo.
      const mine = loadRooms().find((r) => r.parentPath === `/paje/${token}`);
      if (mine) saveRoom({ ...mine, childPath: json.data.childPath });
      window.location.reload();
    } catch (err) {
      setNotice({ tone: 'error', msg: err instanceof Error ? err.message : 'No se pudo cambiar el enlace.' });
      setRotating(false);
      setAskRotate(false);
    }
  };

  const savePanel = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice({ tone: 'ok', msg: 'Enlace del panel copiado. Guárdalo en tus notas o mándatelo.' });
    } catch {
      /* sin permisos del portapapeles */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permisos */
    }
  };

  // Idea de travesura: la elegida a mano o la de hoy (solo mientras dura la campaña).
  const todayMischief = (() => {
    const cal = character.mischief;
    if (!cal) return null;
    const [m, d] = cal.startDate.split('-').map(Number) as [number, number];
    const now = new Date();
    const start = new Date(now.getFullYear(), m - 1, d);
    const n = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - start.getTime()) / 86_400_000) + 1;
    return cal.days.find((x) => x.day === (pickedDay ?? n)) ?? null;
  })();

  const setupVisible = setupOpen ?? (messages.length === 0 && !presence?.openedAt);
  const lastChild = [...messages].reverse().findIndex((m) => m.from === 'child');
  const lastKing = [...messages].reverse().findIndex((m) => m.from === 'king');
  const lastChildMsg = lastChild >= 0 ? [...messages].reverse()[lastChild] : undefined;
  const photoWaiting = lastChildMsg?.kind === 'photo' && (lastKing < 0 || lastKing > lastChild);

  const editMessage = async (id: string, text: string) => {
    try {
      const res = await fetch(`/api/rooms/${token}/message/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as ApiResult<null>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo editar.');
      setNotice({ tone: 'ok', msg: 'Mensaje corregido. Así lo verá el peque.' });
      await refresh();
      return true;
    } catch (err) {
      setNotice({ tone: 'error', msg: err instanceof Error ? err.message : 'No se pudo editar.' });
      return false;
    }
  };

  const eraseMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/rooms/${token}/erase/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResult<null>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo borrar.');
      setNotice({ tone: 'ok', msg: r('Mensaje borrado. Ya no aparece en ninguno de los dos móviles.') });
      await refresh();
    } catch (err) {
      setNotice({ tone: 'error', msg: err instanceof Error ? err.message : 'No se pudo borrar.' });
    }
  };

  const cancelPending = async (id: string) => {
    try {
      const res = await fetch(`/api/rooms/${token}/pending/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResult<null>;
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo cancelar.');
      setNotice({ tone: 'ok', msg: 'Mensaje programado cancelado.' });
      await refresh();
    } catch (err) {
      setNotice({ tone: 'error', msg: err instanceof Error ? err.message : 'No se pudo cancelar.' });
    }
  };

  const activeMoment = character.moments.find((m) => m.id === momentId) ?? character.moments[0];
  const voiceNow = KING_VOICE_ENABLED && mode === 'voice' && !photo;

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-black">
      <div className="relative flex h-dvh w-full max-w-md flex-col bg-[#0a1220] text-[#e8f1ff]">
        <div className="flex items-center justify-center gap-2 bg-[#5eead4] px-3 pb-1.5 pt-[max(0.4rem,env(safe-area-inset-top))] text-[10.5px] font-bold uppercase tracking-[.08em] text-[#04302b]">
          <span aria-hidden>🔒</span> Zona secreta de los padres · {childName} no ve esta pantalla
        </div>
        <header className="flex items-center gap-3 border-b border-[#5eead4]/20 bg-[#121d33] px-4 pb-3 pt-3">
          <RoyalAvatar character={character} size={40} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#5eead4]">
              <IconSeal className="size-3.5" /> Panel de los padres
            </p>
            <p className="truncate text-[15px] font-semibold">Contestas como {character.name} a {childName}</p>
          </div>
          {!connected && <span className="text-[11px] font-semibold text-[#5eead4]">Reconectando…</span>}
          <span
            title={connected ? 'Conectado en tiempo real' : 'Reconectando…'}
            className={`size-2.5 shrink-0 rounded-full ${connected ? 'bg-[#7ee2a8]' : 'animate-pulse bg-[#5eead4]'}`}
            role="status"
            aria-label={connected ? 'Conectado en tiempo real' : 'Reconectando'}
          />
        </header>

        {access.plan === 'trial' && !access.locked && access.trialEndsAt && billing?.enabled && (
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#f6d77a]/[.07] px-4 py-1.5 text-[12.5px]">
            <p className="min-w-0 flex-1 text-[#e8f1ff]/80">
              Prueba gratis · {timeLeft(access.trialEndsAt)}
            </p>
            <button type="button" onClick={() => setOfferOpen((v) => !v)} className="shrink-0 rounded-full border border-[#f6d77a]/60 px-3 py-0.5 text-[12px] font-bold text-[#f6d77a]">
              {offerOpen ? 'Cerrar' : `Pase ${billing.price}`}
            </button>
          </div>
        )}
        {offerOpen && !access.locked && billing?.enabled && access.plan === 'trial' && (
          <div className="border-b border-white/10 bg-[#0d1628] p-3">
            <PassOffer billing={billing} roomToken={token} childName={childName} title="Pase de Navidad" onUnlocked={() => { setOfferOpen(false); versionRef.current = ''; void refresh(); }} />
          </div>
        )}

        {presence && (
          <div role="status" aria-live="polite" className={`flex items-center gap-2.5 border-b border-white/10 px-4 py-2 text-[13px] ${presence.openedAt ? 'bg-[#7ee2a8]/10' : 'bg-white/[.03]'}`}>
            <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${presence.online ? 'bg-[#7ee2a8] shadow-[0_0_8px_#7ee2a8]' : 'bg-white/25'}`} />
            <p className="min-w-0 flex-1 leading-snug text-[#e8f1ff]/85">
              {presence.openedAt
                ? <><span className="font-semibold text-[#7ee2a8]">🎁 {childName} ha abierto el mensaje</span> a las {fmtTime(presence.openedAt)}{presence.online ? '' : ' · ahora no está en la sala'}</>
                : presence.online
                  ? <>{childName} está en la sala, esperando a {short} ✨</>
                  : <>{childName} aún no ha abierto el enlace</>}
            </p>
            {presence.openedAt && messages.length === 0 && (
              <button type="button" onClick={() => setMomentId('primero')} className="shrink-0 rounded-full bg-[#5eead4] px-3 py-1 text-[12px] font-bold text-[#04302b] active:scale-95">
                Primer saludo
              </button>
            )}
          </div>
        )}

        <div role="log" aria-label="Conversación" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <button
            type="button"
            aria-expanded={setupVisible}
            aria-controls="panel-setup"
            onClick={() => setSetupOpen(!setupVisible)}
            className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-white/15 bg-white/[.04] px-3.5 text-left text-[13px] font-semibold text-[#5eead4]"
          >
            <span className="flex-1">Preparativos · enlace del niño y grabar su reacción</span>
            <span aria-hidden className={`transition-transform ${setupVisible ? 'rotate-180' : ''}`}>▾</span>
          </button>

          <div id="panel-setup" hidden={!setupVisible} className="space-y-3" onClickCapture={() => setSetupOpen((v) => v ?? true)} onFocusCapture={() => setSetupOpen((v) => v ?? true)}>
          <section className="rounded-2xl border border-[#5eead4]/25 bg-[#5eead4]/[.07] p-3.5 text-[13px] leading-relaxed">
            <p className="font-semibold text-[#5eead4]"><R>Enlace para el móvil de {childName}</R></p>
            <p className="mt-1 text-[#e8f1ff]/70"><R>Ábrelo en el móvil o la tablet que usará. No compartas esta página: es tu panel secreto.</R></p>
            <label htmlFor="caps-link" className="mt-2.5 flex cursor-pointer items-start gap-2.5 rounded-xl bg-black/20 p-2.5 text-[#e8f1ff]/85">
              <input id="caps-link" type="checkbox" checked={capsLink} onChange={(e) => setCapsLink(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#5eead4]" />
              <span>
                <strong className="font-semibold">Primeros lectores: letra MAYÚSCULA.</strong> El enlace abre con todo el texto en mayúsculas (el niño también puede cambiarlo con el botón «Aa» de la cabecera).
              </span>
            </label>
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={copyLink} className="min-h-10 flex-1 rounded-xl bg-[#5eead4] px-3 font-bold text-[#04302b] active:scale-[0.98]">
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid min-h-10 flex-1 place-items-center rounded-xl border border-[#5eead4]/40 px-3 font-bold text-[#5eead4] active:scale-[0.98]"
              >
                Enviármelo
              </a>
            </div>
            {askRotate ? (
              <div role="alertdialog" aria-label="Confirmar cambio de enlace" className="mt-3 space-y-2 rounded-xl bg-[#ff8a8c]/10 p-2.5">
                <p className="font-semibold text-[#ff8a8c]"><R>El enlace actual dejará de funcionar. Tendrás que abrir el nuevo en el móvil de {childName}.</R></p>
                <div className="flex gap-2">
                  <button type="button" onClick={rotateLink} disabled={rotating} className="flex-1 rounded-lg bg-[#ff8a8c] py-1.5 font-bold text-[#2a0a0c] disabled:opacity-50">
                    {rotating ? 'Cambiando…' : 'Sí, cambiar'}
                  </button>
                  <button type="button" onClick={() => setAskRotate(false)} disabled={rotating} className="rounded-lg border border-white/20 px-3 py-1.5 font-semibold">
                    No
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setAskRotate(true)} className="mt-2.5 text-[12px] text-[#e8f1ff]/55 underline underline-offset-2">
                ¿Se ha compartido por error? Cambiar el enlace
              </button>
            )}
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[.04] p-3.5 text-[13px] leading-relaxed">
            <p className="flex items-center gap-2 font-semibold text-[#5eead4]">
              <IconFilm className="size-5" /> Graba su reacción
            </p>
            <div role="radiogroup" aria-label="Cómo grabar" className="mt-2 flex gap-1 rounded-xl bg-white/5 p-1">
              {[
                { v: false, label: r('Con otro móvil') },
                { v: true, label: r('Con este móvil') },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={recordHere === o.v}
                  onClick={() => setRecordHere(o.v)}
                  disabled={o.v && !rec.supported}
                  className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors disabled:opacity-40 ${recordHere === o.v ? 'bg-[#5eead4] text-[#04302b]' : 'text-[#e8f1ff]/70'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[#e8f1ff]/75">
              {recordHere ? (
                <R>Se graba con la <strong>cámara trasera de este móvil</strong>. Apúntalo al niño y verás la imagen mientras contestas. El vídeo se queda en tu móvil: no se sube a ningún sitio.</R>
              ) : (
                <R>Lo mejor para la calidad: que otra persona grabe con <strong>otro móvil</strong>. Así tú no tocas nada y sale buena imagen.</R>
              )}
            </p>
            {rec.error && <p role="alert" className="mt-2 text-[12.5px] text-[#ff8a8c]">{rec.error}</p>}
            <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-[#e8f1ff]/70">
              <li>Escribe abajo el mensaje de la sorpresa.</li>
              <li>Pulsa “Empezar la sorpresa”.</li>
              <li>{recordHere ? `Tienes ${COUNTDOWN_SECONDS} segundos para apuntar la cámara al niño.` : `Quien graba tiene ${COUNTDOWN_SECONDS} segundos para enfocar al niño.`}</li>
            </ol>
            <button
              type="button"
              onClick={startSurprise}
              disabled={!text.trim() || photo !== null || countdown !== null || rec.phase === 'preparing' || rec.phase === 'recording'}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#5eead4]/50 font-bold text-[#5eead4] disabled:opacity-40 active:scale-[0.98]"
            >
              <IconFilm className="size-5" /> {rec.phase === 'preparing' ? 'Abriendo la cámara…' : 'Empezar la sorpresa'}
            </button>
            {!text.trim() && <p className="mt-1.5 text-center text-[11.5px] text-[#e8f1ff]/45">Primero escribe el mensaje de abajo.</p>}
            {surpriseSent && (
              <div role="status" className="mt-3 animate-pop rounded-xl bg-[#7ee2a8]/10 p-3 text-center">
                <p className="font-semibold text-[#7ee2a8]">¡Sorpresa enviada! Sigue grabando.</p>
                <p className="mt-1 text-[12.5px] text-[#e8f1ff]/70">Si te ha salido bien, súbelo y enseña la app a otros padres:</p>
                <button type="button" onClick={shareApp} className="mt-2 min-h-10 rounded-xl bg-[#5eead4] px-4 font-bold text-[#04302b] active:scale-[0.98]">
                  {shared ? '¡Listo!' : 'Compartir la app'}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[.04] p-3.5 text-[13px] leading-relaxed">
            <p className="font-semibold text-[#e8f1ff]">Guarda este panel</p>
            <p className="mt-1 text-[#e8f1ff]/70">{familyHref ? 'Es la llave de esta sala. Para todas las salas de la familia, guarda el enlace de familia.' : 'Es tu única llave: si pierdes este enlace no se puede recuperar. Mándatelo para tenerlo a mano.'}</p>
            {familyHref && (
              <a href={familyHref} className="mt-2 grid min-h-10 place-items-center rounded-xl border border-[#f6d77a]/50 font-semibold text-[#f6d77a] active:scale-[0.98]">
                ⭐ Ver el enlace de mi familia
              </a>
            )}
            <div className="mt-2.5 flex gap-2">
              <button type="button" onClick={savePanel} className="min-h-10 flex-1 rounded-xl bg-white/10 font-semibold text-[#e8f1ff] active:scale-[0.98]">
                Copiar el del panel
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = `mailto:?subject=${encodeURIComponent(`Mi panel de ${childName}`)}&body=${encodeURIComponent(window.location.href)}`;
                }}
                className="min-h-10 flex-1 rounded-xl border border-[#5eead4]/40 font-semibold text-[#5eead4] active:scale-[0.98]"
              >
                Enviármelo por correo
              </button>
            </div>
          </section>

          <RoomAdmin token={token} childName={childName} characterId={character.id} characterAlias={characterAlias} characterGender={characterGender} readingLevel={readingLevel} />
          </div>

          {todayMischief && (
            <section aria-label="Idea de travesura" className="rounded-2xl border border-[#5eead4]/35 bg-[#5eead4]/[.07] p-3.5 text-[13px] leading-relaxed">
              <p className="font-semibold text-[#5eead4]">🧝 Idea de travesura · día {todayMischief.day}</p>
              <p className="mt-1 text-[#e8f1ff]/80"><strong className="font-semibold">Monta esta noche:</strong> {todayMischief.idea}</p>
              <p className="mt-1 text-[12px] text-[#e8f1ff]/55">Después haz una foto, escribe lo que quieras y prográmalo para la mañana.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setIdeasOpen(true)} className="min-h-10 flex-1 rounded-xl border border-white/20 font-semibold text-[#e8f1ff]/85 active:scale-[0.98]">
                  Otras ideas
                </button>
                <button
                  type="button"
                  onClick={() => setText(fillChild(todayMischief.suggestion, childName).slice(0, MAX_CHARS))}
                  className="min-h-10 flex-1 rounded-xl border border-[#5eead4]/50 font-bold text-[#5eead4] active:scale-[0.98]"
                >
                  Ver una sugerencia de mensaje
                </button>
              </div>
            </section>
          )}

          {messages.length === 0 && (
            <p className="py-8 text-center text-[14px] text-[#e8f1ff]/60">
              Aún no hay mensajes. Cuando {childName} escriba, lo verás aquí al instante.
            </p>
          )}

          {messages.map((m, i) => (
            <PanelMessage key={m.id} m={m} character={character} childName={childName} onOpenPhoto={setLightbox} onCancel={cancelPending} onErase={eraseMessage} onEdit={editMessage} followUps={m.kind === 'voice' ? voiceFollowUps(messages, i, (x) => ({ id: x.id, from: x.from, voiceSrc: x.kind === 'voice' ? x.audioUrl : undefined })) : undefined} />
          ))}

          {childTyping && (
            <p role="status" className="animate-pop text-[13px] italic text-[#5eead4]">
              {childName} está escribiendo…
            </p>
          )}
          <div ref={endRef} />
        </div>

        {access.locked && billing ? (
        <footer className="space-y-2 border-t border-white/10 bg-[#121d33] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <PassOffer
            billing={billing}
            roomToken={token}
            childName={childName}
            title="La prueba gratis ha terminado"
            onUnlocked={() => {
              versionRef.current = '';
              void refresh();
            }}
          />
          <p className="text-center text-[11.5px] text-[#e8f1ff]/55"><R>{childName} puede seguir leyendo todo lo que ya le habéis escrito. Ve que {short} «ha ido a preparar la magia».</R></p>
        </footer>
        ) : (
        <footer className="space-y-2.5 border-t border-white/10 bg-[#121d33] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div role="tablist" aria-label="Momento" className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]">
            {character.moments.map((mo) => (
              <button
                key={mo.id}
                type="button"
                role="tab"
                aria-selected={momentId === mo.id}
                onClick={() => setMomentId(mo.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold transition-colors ${momentId === mo.id ? 'bg-[#5eead4] text-[#04302b]' : 'bg-white/8 text-[#e8f1ff]/70'}`}
              >
                {mo.label}
              </button>
            ))}
            {character.plans.length > 0 && (
              <button
                type="button"
                onClick={() => setPlanner(true)}
                className="shrink-0 rounded-full border border-[#5eead4]/50 px-3 py-1 text-[12px] font-bold text-[#5eead4]"
              >
                📅 Programar
              </button>
            )}
            {character.mischief && (
              <button
                type="button"
                onClick={() => setIdeasOpen(true)}
                className="shrink-0 rounded-full border border-[#5eead4]/50 px-3 py-1 text-[12px] font-bold text-[#5eead4]"
              >
                💡 Ideas de travesuras
              </button>
            )}
          </div>
          {photoWaiting && (
            <div className="rounded-2xl border border-[#5eead4]/35 bg-[#5eead4]/[.08] p-2.5">
              <p className="px-1 text-[12px] font-bold text-[#5eead4]">📸 {childName} ha enviado una foto o dibujo. Responde con ilusión:</p>
              <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
                {character.photoReplies.map((tpl) => fillChild(tpl, childName)).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setText(q.slice(0, MAX_CHARS))}
                    className="max-w-[14rem] shrink-0 truncate rounded-full border border-[#5eead4]/40 bg-white/5 px-3 py-1.5 text-[12.5px] text-[#e8f1ff] active:bg-white/10"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeMoment?.tip && <p className="text-[11.5px] leading-snug text-[#5eead4]/80">💡 {activeMoment.tip}</p>}
          {readingLevel === 'learning' && (
            <p className="text-[11.5px] leading-snug text-[#f6d77a]/85">✏️ Está aprendiendo a leer: frases cortas y palabras sencillas. Lo verá en MAYÚSCULAS.</p>
          )}
          {readingLevel === 'no' && (
            <p className="text-[11.5px] leading-snug text-[#f6d77a]/85">📖 Todavía no lee: que se lo lea en voz alta quien esté a su lado. Las fotos ayudan mucho.</p>
          )}
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
            {(activeMoment?.replies ?? []).map((tpl) => fillChild(tpl, childName)).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setText(q.slice(0, MAX_CHARS))}
                className="max-w-[14rem] shrink-0 truncate rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12.5px] text-[#e8f1ff]/85 active:bg-white/10"
              >
                {q}
              </button>
            ))}
          </div>

          {photo && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="Foto adjunta" className="size-14 rounded-xl object-cover" />
              <p className="flex-1 text-[13px] text-[#e8f1ff]/80">Foto lista. El texto de abajo irá como pie de foto.</p>
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
              className="w-full resize-none rounded-2xl border border-white/15 bg-[#0a1220] px-3.5 py-3 pr-12 text-[15px] text-[#e8f1ff] placeholder:text-[#e8f1ff]/35 focus:border-[#5eead4] focus:outline-none"
            />
            <div className="absolute right-2 top-2">
              <PhotoPicker
                onPick={pickPhotoFile}
                label="Adjuntar una foto"
                className="grid size-9 place-items-center rounded-full text-[#5eead4] active:bg-white/10"
              />
            </div>
            <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums text-[#e8f1ff]/40">{text.length}/{MAX_CHARS}</span>
          </div>

          {KING_VOICE_ENABLED && !photo && (
            <div className="flex items-center gap-2">
              <span className="w-14 text-[12px] text-[#e8f1ff]/60">Como</span>
              <div role="radiogroup" aria-label="Formato de la respuesta" className="flex flex-1 gap-1 rounded-xl bg-white/5 p-1">
                {(['voice', 'text'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${mode === m ? 'bg-[#5eead4] text-[#04302b]' : 'text-[#e8f1ff]/70'}`}
                  >
                    {m === 'voice' ? 'Nota de voz' : 'Por escrito'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="w-14 text-[12px] text-[#e8f1ff]/60">Llega en</span>
            <div role="radiogroup" aria-label="Cuándo llega la respuesta" className="flex flex-1 gap-1 rounded-xl bg-white/5 p-1">
              {REPLY_DELAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={delay === d}
                  onClick={() => {
                    setDelay(d);
                    setWhenCustom(false);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${!whenCustom && delay === d ? 'bg-[#5eead4] text-[#04302b]' : 'text-[#e8f1ff]/70'}`}
                >
                  {DELAY_LABEL[d]}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={whenCustom}
                onClick={() => setWhenCustom(true)}
                className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${whenCustom ? 'bg-[#5eead4] text-[#04302b]' : 'text-[#e8f1ff]/70'}`}
              >
                Otro día
              </button>
            </div>
          </div>
          {whenCustom && (
            <div className="space-y-1.5 rounded-xl bg-white/5 p-2.5">
              <label htmlFor="when-custom" className="block text-[12px] text-[#e8f1ff]/70">Cuándo le llega (fecha y hora)</label>
              <input
                id="when-custom"
                type="datetime-local"
                value={whenValue}
                onChange={(e) => setWhenValue(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[15px] text-[#e8f1ff] [color-scheme:dark]"
              />
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  t.setDate(t.getDate() + 1);
                  t.setHours(8, 0, 0, 0);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  setWhenValue(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T08:00`);
                }}
                className="rounded-full border border-[#5eead4]/50 px-3 py-1 text-[12px] font-bold text-[#5eead4]"
              >
                Mañana a las 8:00
              </button>
            </div>
          )}

          {notice && <p role="status" className={`text-center text-[13px] ${notice.tone === 'ok' ? 'text-[#7ee2a8]' : notice.tone === 'warn' ? 'text-[#5eead4]' : 'text-[#ff8a8c]'}`}>{notice.msg}</p>}

          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#5eead4] to-[#14b8a6] font-bold text-[#04302b] shadow-lg disabled:opacity-50 active:scale-[0.99]"
          >
            {sending
              ? voiceNow ? `Grabando la voz de ${short}…` : 'Enviando…'
              : photo ? `Enviar foto como ${short}` : voiceNow ? `Enviar con la voz de ${short}` : `Enviar como ${short}`}
          </button>
        </footer>
        )}

        {ideasOpen && <IdeasList character={character} selectedDay={todayMischief?.day ?? null} onPick={setPickedDay} onClose={() => setIdeasOpen(false)} />}

        {planner && (
          <SchedulePlanner
            token={token}
            character={character}
            childName={childName}
            mode={KING_VOICE_ENABLED ? mode : 'text'}
            onClose={() => setPlanner(false)}
            onDone={(n) => {
              setPlanner(false);
              setNotice({ tone: 'ok', msg: `${n} mensaje${n === 1 ? '' : 's'} programado${n === 1 ? '' : 's'}. ${short} los enviará a su hora.` });
              void refresh();
            }}
          />
        )}

        {recordHere && (rec.phase === 'ready' || rec.phase === 'recording') && (
          <ReactionCamera
            stream={rec.stream}
            phase={rec.phase}
            facing={rec.facing}
            countdown={countdown}
            elapsed={rec.elapsed}
            minimized={minimized && rec.phase === 'recording'}
            onToggleMinimize={() => setMinimized((m) => !m)}
            onFlip={() => void rec.flip()}
            onStop={() => {
              rec.stop();
              setMinimized(false);
            }}
            onCancel={cancelCountdown}
          />
        )}

        {rec.phase === 'review' && rec.result && <ReactionReview result={rec.result} childName={childName} onDiscard={rec.discard} />}

        {countdown !== null && !(recordHere && rec.phase !== 'idle') && (
          <div role="alertdialog" aria-modal="true" aria-label="Cuenta atrás" className="absolute inset-0 z-40 grid place-items-center bg-black/95 p-6 text-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.2em] text-[#5eead4]">Empieza a grabar</p>
              <p aria-live="assertive" className="my-6 font-serif text-[120px] leading-none text-[#e8f1ff]">{countdown > 0 ? countdown : '✨'}</p>
              <p className="text-[15px] text-[#e8f1ff]/70"><R>Enfoca al niño con el otro móvil. La sorpresa llega en cuanto llegue a cero.</R></p>
              <button type="button" onClick={cancelCountdown} className="mt-6 min-h-11 rounded-xl border border-white/25 px-5 font-semibold text-[#e8f1ff]/80">
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
  onCancel,
  onErase,
  onEdit,
  followUps,
}: {
  m: RoomMessageDTO;
  character: CharacterProfile;
  childName: string;
  onOpenPhoto: (src: string) => void;
  onCancel: (id: string) => void;
  onErase: (id: string) => void;
  onEdit: (id: string, text: string) => Promise<boolean>;
  followUps?: { id: string; src: string }[];
}) {
  const [asking, setAsking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.text ?? '');
  const editable = m.from !== 'child' && !m.pending && (m.kind === 'text' || m.kind === 'photo');
  if (m.from === 'system') {
    return <p className="mx-auto w-fit max-w-[90%] rounded-xl bg-white/5 px-3 py-1.5 text-center text-[11.5px] text-[#e8f1ff]/50">Aviso automático enviado: “{m.text}”</p>;
  }
  const child = m.from === 'child';
  return (
    <div className={`flex ${child ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[88%] rounded-2xl px-3 py-2 shadow ${child ? 'rounded-bl-md bg-[#fde68a] text-[#2b1b0e]' : 'rounded-br-md bg-[#eaf2ff] text-[#2b1b0e]'}`}>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide opacity-60">{child ? childName : character.name}</p>
        {m.kind === 'voice' && <VoiceNote id={m.id} followUps={followUps} duration={m.duration ?? 5} seed={seedFrom(m.id)} mine={child} character={character} src={m.audioUrl} />}
        {m.kind === 'photo' && m.imageUrl && (
          <button type="button" onClick={() => onOpenPhoto(m.imageUrl!)} className="block w-56 overflow-hidden rounded-xl" aria-label="Ver la foto en grande">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.imageUrl} alt={m.text || 'Foto'} loading="lazy" decoding="async" className="max-h-60 w-full object-cover" />
          </button>
        )}
        {m.text && (m.kind === 'text' || m.kind === 'photo') && <p className="mt-1 whitespace-pre-line text-[15px] leading-snug">{m.text}</p>}
        {m.kind === 'voice' && !child && m.text && <p className="mt-1.5 border-t border-black/10 pt-1.5 text-[13px] leading-snug text-[#5b3a1e]">“{m.text}”</p>}
        <p className="mt-1 text-right text-[10.5px] opacity-60">{m.pending ? `Se entregará ${fmtWhen(m.at)}` : fmtTime(m.at)}</p>
        {m.pending && !child && (
          <button type="button" onClick={() => onCancel(m.id)} className="mt-1.5 w-full rounded-lg border border-black/15 py-1 text-[12px] font-semibold text-[#8a1a1f] active:bg-black/5">
            Cancelar este mensaje
          </button>
        )}
        {editable && !editing && (
          <button type="button" onClick={() => { setDraft(m.text ?? ''); setEditing(true); }} className="mt-1.5 w-full rounded-lg py-1 text-[11.5px] font-semibold text-[#5b3a1e]/80 underline-offset-2 hover:underline">
            Corregir texto
          </button>
        )}
        {editable && editing && (
          <div className="mt-1.5 space-y-1.5">
            <label className="sr-only" htmlFor={`edit-${m.id}`}>Texto corregido</label>
            <textarea
              id={`edit-${m.id}`}
              value={draft}
              maxLength={300}
              rows={3}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full resize-none rounded-lg border border-black/20 bg-white px-2 py-1.5 text-[14px] text-[#2b1b0e]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={m.kind === 'text' && draft.trim().length === 0}
                onClick={async () => { if (await onEdit(m.id, draft.trim())) setEditing(false); }}
                className="flex-1 rounded-md bg-[#8a1a1f] py-1 text-[12px] font-bold text-white disabled:opacity-40"
              >
                Guardar corrección
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-black/15 px-2.5 py-1 text-[12px] font-semibold">Cancelar</button>
            </div>
          </div>
        )}
        {!m.pending && (
          asking ? (
            <div role="alertdialog" aria-label="Confirmar borrado" className="mt-1.5 flex items-center gap-2 rounded-lg bg-black/5 px-2 py-1.5 text-[12px] text-[#8a1a1f]">
              <span className="flex-1 font-semibold">¿Borrar este mensaje para los dos?</span>
              <button type="button" onClick={() => { setAsking(false); onErase(m.id); }} className="rounded-md bg-[#8a1a1f] px-2.5 py-1 font-bold text-white">Sí, borrar</button>
              <button type="button" onClick={() => setAsking(false)} className="rounded-md border border-black/15 px-2.5 py-1 font-semibold">No</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAsking(true)} className="mt-1.5 w-full rounded-lg py-1 text-[11.5px] font-semibold text-[#5b3a1e]/70 underline-offset-2 hover:underline">
              Borrar mensaje
            </button>
          )
        )}
      </div>
    </div>
  );
}

/** "a las 21:30" si es hoy; "el 24 dic a las 21:30" si no. */
function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = fmtTime(iso);
  if (d.toDateString() === now.toDateString()) return `a las ${time}`;
  const day = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
  return `el ${day} a las ${time}`;
}
