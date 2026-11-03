'use client';

import { useState } from 'react';
import { RoyalChat } from './RoyalChat';
import { fmtTime } from './mapping';
import type { ChatMessage, King } from './types';

/** Demo sin backend: simula grabación y respuesta del Rey. */
export function DemoChat({ king, childName, initial }: { king: King; childName: string; initial: ChatMessage[] }) {
  const [messages, setMessages] = useState(initial);
  const [kingRecording, setKingRecording] = useState(false);
  const now = () => fmtTime(new Date().toISOString());

  return (
    <RoyalChat
      king={king}
      childName={childName}
      messages={messages}
      kingRecording={kingRecording}
      simulateRecording
      onVoice={({ seconds }) => {
        setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'child', kind: 'voice', duration: Math.max(1, Math.round(seconds)), seed: Math.round(seconds * 977), time: now() }]);
        setTimeout(() => setKingRecording(true), 700);
        setTimeout(() => {
          setKingRecording(false);
          setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'king', kind: 'voice', duration: 16, seed: Date.now() % 9973, time: now() }]);
        }, 3600);
      }}
    />
  );
}
