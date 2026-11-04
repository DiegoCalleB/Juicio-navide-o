'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RecPhase = 'idle' | 'preparing' | 'ready' | 'recording' | 'review';
export type Facing = 'environment' | 'user';

export interface ReactionResult {
  blob: Blob;
  url: string;
  ext: 'mp4' | 'webm';
  seconds: number;
}

export const MAX_REACTION_SECONDS = 60;

/** MP4 primero: es lo que aceptan Instagram, TikTok y WhatsApp sin conversiones. */
const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
}

function friendlyError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permite el acceso a la cámara y al micrófono en tu navegador para poder grabar.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No se ha encontrado una cámara en este dispositivo.';
    case 'NotReadableError':
    case 'AbortError':
      return 'La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo.';
    default:
      return 'No se ha podido abrir la cámara.';
  }
}

/**
 * Graba la reacción del niño con la cámara del móvil de los padres.
 * El vídeo vive solo en memoria del navegador: no se sube a ningún servidor.
 */
export function useReactionRecorder() {
  const [phase, setPhase] = useState<RecPhase>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReactionResult | null>(null);
  const [supported, setSupported] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setSupported(typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const clearResultUrl = useCallback(() => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  /** Abre la cámara y muestra la vista previa. Devuelve false si no se pudo. */
  const prepare = useCallback(
    async (wanted: Facing = facing): Promise<boolean> => {
      setError(null);
      setPhase('preparing');
      releaseStream();
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: wanted }, width: { ideal: 720 }, height: { ideal: 1280 }, frameRate: { ideal: 30 } },
          audio: true,
        });
        streamRef.current = s;
        setStream(s);
        setFacing(wanted);
        setPhase('ready');
        return true;
      } catch (err) {
        setError(friendlyError(err));
        setPhase('idle');
        return false;
      }
    },
    [facing, releaseStream],
  );

  const flip = useCallback(() => prepare(facing === 'environment' ? 'user' : 'environment'), [facing, prepare]);

  const finalize = useCallback(
    (mime: string | undefined, recMime: string) => {
      clearInterval(timerRef.current);
      const type = recMime || mime || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      const seconds = Math.min(MAX_REACTION_SECONDS, (performance.now() - startedAtRef.current) / 1000);
      releaseStream();
      if (blob.size === 0) {
        setError('No se ha grabado nada. Inténtalo de nuevo.');
        setPhase('idle');
        return;
      }
      clearResultUrl();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, ext: type.includes('mp4') ? 'mp4' : 'webm', seconds });
      setPhase('review');
    },
    [clearResultUrl, releaseStream],
  );

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);

  /** Empieza a grabar (la vista previa debe estar lista). */
  const start = useCallback((): boolean => {
    const s = streamRef.current;
    if (!s || typeof MediaRecorder === 'undefined') return false;
    const mime = pickMime();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(s, {
        ...(mime ? { mimeType: mime } : {}),
        videoBitsPerSecond: 2_500_000,
        audioBitsPerSecond: 128_000,
      });
    } catch {
      setError('Este navegador no puede grabar vídeo.');
      return false;
    }
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => finalize(mime, rec.mimeType);
    rec.onerror = () => {
      setError('Ha fallado la grabación.');
      releaseStream();
      setPhase('idle');
    };
    recorderRef.current = rec;
    startedAtRef.current = performance.now();
    setElapsed(0);
    rec.start(1000);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const sec = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(sec);
      if (sec >= MAX_REACTION_SECONDS) stop();
    }, 200);
    setPhase('recording');
    return true;
  }, [finalize, releaseStream, stop]);

  /** Cierra la cámara sin grabar (cancelar la cuenta atrás). */
  const cancelPrepared = useCallback(() => {
    releaseStream();
    setPhase('idle');
  }, [releaseStream]);

  const discard = useCallback(() => {
    clearResultUrl();
    setResult(null);
    setPhase('idle');
  }, [clearResultUrl]);

  return { phase, stream, facing, elapsed, error, result, supported, prepare, flip, start, stop, cancelPrepared, discard };
}
