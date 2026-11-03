'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Recording {
  blob: Blob | null;
  seconds: number;
}

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
}

/**
 * Grabación con MediaRecorder. `simulate` permite la demo sin micrófono.
 * Libera el micrófono al terminar (stop de las pistas).
 */
export function useVoiceRecorder({ simulate = false }: { simulate?: boolean } = {}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const cancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    cancelledRef.current = false;
    if (!simulate) {
      const mime = pickMime();
      if (!navigator.mediaDevices?.getUserMedia || !mime) {
        setError('Este móvil no permite grabar notas de voz.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32_000 });
        chunksRef.current = [];
        rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
        rec.start(250);
        recorderRef.current = rec;
      } catch {
        setError('Pide a un adulto que permita usar el micrófono.');
        return;
      }
    }
    startedAtRef.current = performance.now();
    setElapsed(0);
    setRecording(true);
    timerRef.current = setInterval(() => setElapsed((performance.now() - startedAtRef.current) / 1000), 100);
  }, [simulate]);

  const stop = useCallback(async (): Promise<Recording> => {
    cancelledRef.current = true;
    clearInterval(timerRef.current);
    if (!startedAtRef.current) return { blob: null, seconds: 0 };
    const seconds = (performance.now() - startedAtRef.current) / 1000;
    startedAtRef.current = 0;
    setRecording(false);

    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') {
      cleanup();
      return { blob: null, seconds };
    }
    const blob = await new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType }));
      rec.stop();
    });
    cleanup();
    return { blob, seconds };
  }, [cleanup]);

  return { recording, elapsed, error, start, stop };
}
