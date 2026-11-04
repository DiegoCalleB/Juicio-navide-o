import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const IconBack = (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><path d="M15 18l-6-6 6-6" /></svg>);
export const IconMic = (p: P) => (<svg viewBox="0 0 24 24" {...base} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>);
export const IconPlay = (p: P) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>);
export const IconPause = (p: P) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6.5" y="5" width="4" height="14" rx="1.2" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" /></svg>);
export const IconStar = (p: P) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7 6.3 20.1l1.5-6.5-5-4.4 6.6-.6z" /></svg>);
export const IconSeal = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path fill="currentColor" d="M12 1.5l2.3 2 3-.5.9 2.9 2.8 1.2-.6 3 1.6 2.6-2.3 2-.1 3-3 .5-1.6 2.6-2.9-1-2.9 1-1.6-2.6-3-.5-.1-3-2.3-2L2.6 10l-.6-3 2.8-1.2.9-2.9 3 .5z" />
    <path fill="#2a0f4a" d="M12 7.2l1.3 2.9 3.1.3-2.4 2.1.7 3.1L12 14l-2.7 1.6.7-3.1-2.4-2.1 3.1-.3z" />
  </svg>
);
export const IconCamel = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4 9.5c0-1 .8-1.8 1.8-1.8.6 0 1 .3 1.3.7l.6 1c.3-1.6 1.4-3.4 3-3.4 1.4 0 2 1.2 2.4 2.4.4-1 1.1-1.9 2.3-1.9 1.6 0 2.4 1.6 2.6 3.2l.4 2.4 1.6-1.1c.5-.3 1.1-.1 1.3.4.2.4 0 .9-.4 1.1l-2.5 1.6c-.3 1.4-1.3 2.4-2.6 2.8v3.6h-1.5v-3.4h-4.6v3.4H8.2v-3.6c-1.2-.5-2-1.6-2.2-3l-.3-2.6-.9.3C4.4 11.3 4 10.5 4 9.5z" />
  </svg>
);
export const IconSend = (p: P) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M3.4 20.4l17.4-7.5a1 1 0 0 0 0-1.8L3.4 3.6a1 1 0 0 0-1.4 1.1L3.8 11l9.2 1-9.2 1-1.8 6.3a1 1 0 0 0 1.4 1.1z" /></svg>);
export const IconPen = (p: P) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>);
export const IconCamera = (p: P) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>);
export const IconClose = (p: P) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconFilm = (p: P) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4" /></svg>);
