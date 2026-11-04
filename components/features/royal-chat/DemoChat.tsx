'use client';

import { useState } from 'react';
import { RoyalChat, type KingActivity } from './RoyalChat';
import { fmtTime } from './mapping';
import type { Character, ChatMessage } from './types';

/** Demo sin backend: simula audios/textos del niño y la respuesta del Rey. */
export function DemoChat({ character, childName, initial, embedded = false }: { character: Character; childName: string; initial: ChatMessage[]; embedded?: boolean }) {
  const [messages, setMessages] = useState(initial);
  const [activity, setActivity] = useState<KingActivity>(null);
  const now = () => fmtTime(new Date().toISOString());

  const kingAnswers = (reply: ChatMessage) => {
    setTimeout(() => setActivity(reply.kind === 'voice' ? 'recording' : 'typing'), 700);
    setTimeout(() => {
      setActivity(null);
      setMessages((m) => [...m, reply]);
    }, 3600);
  };

  return (
    <RoyalChat
      character={character}
      childName={childName}
      messages={messages}
      kingActivity={activity}
      simulateRecording
      embedded={embedded}
      onVoice={({ seconds }) => {
        setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'child', kind: 'voice', duration: Math.max(1, Math.round(seconds)), seed: Math.round(seconds * 977), time: now() }]);
        kingAnswers({ id: crypto.randomUUID(), from: 'king', kind: 'voice', duration: 16, seed: Date.now() % 9973, time: now() });
      }}
      onText={(text) => {
        setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'child', kind: 'text', text, time: now() }]);
        kingAnswers({ id: crypto.randomUUID(), from: 'king', kind: 'text', text: character.group === 'noel' ? `¡Qué bonito lo que me cuentas, ${childName}! Se lo diré a Rodolfo y a los duendes ✨` : character.group === 'raton' ? `¡Qué bonito lo que me cuentas, ${childName}! Se lo diré a Quesito y a los ratoncitos ✨` : `¡Qué bonito lo que me cuentas, ${childName}! Se lo diré a Gaspar y a Baltasar ✨`, time: now() });
      }}
    />
  );
}
