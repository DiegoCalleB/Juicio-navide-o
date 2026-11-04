import type { ChatMessage } from './types';

export const DEMO_REYES: ChatMessage[] = [
  { id: '1', from: 'king', kind: 'text', time: '19:41', text: '¡Hola, Lucía! Soy Melchor ✨\nMis pajes me acaban de traer tu carta desde Madrid.' },
  { id: '2', from: 'king', kind: 'voice', time: '19:41', duration: 18, seed: 4211 },
  { id: '3', from: 'king', kind: 'photo', time: '19:42', caption: 'Así se ve el palacio esta noche. Los camellos ya están preparando el viaje 🐪' },
  { id: '4', from: 'child', kind: 'voice', time: '19:43', duration: 7, seed: 977 },
  { id: '5', from: 'king', kind: 'text', time: '19:43', text: '¡Qué bien suena tu voz, Lucía! Gaspar y Baltasar te mandan un abrazo.' },
];

export const DEMO_NOEL: ChatMessage[] = [
  { id: '1', from: 'king', kind: 'text', time: '08:02', text: '¡Jo, jo, jo! ¡Feliz Navidad, Lucía! 🎅' },
  { id: '2', from: 'king', kind: 'text', time: '08:02', text: 'Anoche pasé por tu casa y dejé los regalos junto al árbol. Antes de abrirlos, cuéntame: ¿qué tal has dormido?' },
  { id: '3', from: 'child', kind: 'text', time: '08:03', text: '¡Muy bien! ¿Rodolfo se comió la zanahoria?' },
  { id: '4', from: 'king', kind: 'text', time: '08:03', text: '¡Hasta la última miga! Te manda un saludo con su nariz roja.' },
];

export const DEMO_RATON: ChatMessage[] = [
  { id: '1', from: 'king', kind: 'text', time: '20:15', text: '¡Quic, quic! ¿Lucía? ¡Me ha dicho Quesito que se te ha caído un diente! 🦷' },
  { id: '2', from: 'child', kind: 'text', time: '20:16', text: '¡Sí! Se me ha caído jugando. ¿Vendrás esta noche?' },
  { id: '3', from: 'king', kind: 'text', time: '20:16', text: 'Pon el diente bajo la almohada y duérmete prontito. Yo paso por los tejados con mi saquito de monedas.' },
];

export const demoFor = (group: 'noel' | 'reyes' | 'raton'): ChatMessage[] => (group === 'noel' ? DEMO_NOEL : group === 'raton' ? DEMO_RATON : DEMO_REYES);
