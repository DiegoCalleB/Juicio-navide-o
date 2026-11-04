/**
 * Registro de personajes mágicos. Añadir uno = añadir una entrada aquí
 * (+ su voz en lib/voice.ts y, si hace falta, su avatar en RoyalAvatar).
 * Sin secretos: este archivo viaja al cliente.
 */

export type AvatarKind = 'crown' | 'santa';
export type SkyKind = 'orient' | 'snow';

export interface CharacterTheme {
  /** Degradado de la cabecera. */
  headerFrom: string;
  headerTo: string;
  /** Fondo de la pantalla. */
  bg: string;
  sky: SkyKind;
  /** Color de tinta de notas de voz/recibos del personaje. */
  ink: string;
  /** Color principal del avatar. */
  robe: string;
}

export interface CharacterProfile {
  id: CharacterId;
  /** "Rey Melchor", "Papá Noel" */
  name: string;
  /** "Melchor", "Papá Noel" (para frases: "¡{short} te contestará pronto!") */
  shortName: string;
  group: 'reyes' | 'noel';
  tagline: string;
  avatar: AvatarKind;
  theme: CharacterTheme;
  /** Días que vive la sala antes de borrarse. */
  expiresDays: number;
  /** Texto para "{personaje} está ocupado". */
  busyExcuse: string;
  /** Respuestas rápidas del panel. `{child}` se sustituye por el nombre del niño. Solo datos (serializable). */
  quickReplies: string[];
}

export const CHARACTER_IDS = ['papa_noel', 'melchor', 'gaspar', 'baltasar'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

const ORIENT = { bg: '#160a2b', sky: 'orient' as const, headerFrom: '#3b1466', headerTo: '#2a0f4a' };

const kingQuick = [
  `¡Hola, {child}! Qué alegría escucharte. Aquí en Oriente hace un frío que pela, pero los camellos están contentísimos.`,
  `Hemos recibido tu carta, {child}. La estamos leyendo con muchísima atención.`,
  `Me han contado mis pajes que este año te has portado muy bien, {child}. ¡Sigue así!`,
  `Los camellos te mandan saludos. ¿Les dejarás un poquito de agua la noche de Reyes?`,
  `Recuerda irte pronto a la cama la noche del cinco, que si estás despierto no podemos pasar.`,
];

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  papa_noel: {
    id: 'papa_noel',
    name: 'Papá Noel',
    shortName: 'Papá Noel',
    group: 'noel',
    tagline: 'Desde el Polo Norte, con sus renos',
    avatar: 'santa',
    theme: { headerFrom: '#9b1c24', headerTo: '#6b1218', bg: '#0e2418', sky: 'snow', ink: '#8a1a1f', robe: '#c62828' },
    expiresDays: 45,
    busyExcuse: 'Estoy muy ocupado en el taller con los duendes',
    quickReplies: [
      `¡Jo, jo, jo! Hola, {child}. Aquí en el Polo Norte hace un frío que pela, pero los renos están contentísimos.`,
      `He recibido tu carta, {child}. Los duendes y yo la estamos leyendo con muchísima atención.`,
      `Mis duendes me han contado que este año te has portado muy bien, {child}. ¡Sigue así!`,
      `Rodolfo te manda un saludo con su nariz roja. ¿Le dejarás unas zanahorias la noche de Navidad?`,
      `Recuerda irte pronto a la cama la noche del veinticuatro, que si estás despierto no puedo pasar.`,
    ],
  },
  melchor: {
    id: 'melchor', name: 'Rey Melchor', shortName: 'Melchor', group: 'reyes',
    tagline: 'Cariñoso y abuelete', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#3b1466', headerTo: '#2a0f4a', ink: '#5b2a86', robe: '#7a3fb0' },
    expiresDays: 45, busyExcuse: 'Los Reyes estamos muy ocupados preparando los regalos', quickReplies: kingQuick,
  },
  gaspar: {
    id: 'gaspar', name: 'Rey Gaspar', shortName: 'Gaspar', group: 'reyes',
    tagline: 'Sereno y sabio', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#1f5a3d', headerTo: '#153d2a', ink: '#1f5a3d', robe: '#2f6f4f' },
    expiresDays: 45, busyExcuse: 'Los Reyes estamos muy ocupados preparando los regalos', quickReplies: kingQuick,
  },
  baltasar: {
    id: 'baltasar', name: 'Rey Baltasar', shortName: 'Baltasar', group: 'reyes',
    tagline: 'Alegre y bonachón', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#8a2330', headerTo: '#5d1620', ink: '#8a2330', robe: '#a8323a' },
    expiresDays: 45, busyExcuse: 'Los Reyes estamos muy ocupados preparando los regalos', quickReplies: kingQuick,
  },
};

export function isCharacterId(value: string): value is CharacterId {
  return (CHARACTER_IDS as readonly string[]).includes(value);
}

/** Personajes agrupados para el selector. */
export const CHARACTER_GROUPS: { id: 'noel' | 'reyes'; label: string; ids: CharacterId[] }[] = [
  { id: 'noel', label: 'Papá Noel', ids: ['papa_noel'] },
  { id: 'reyes', label: 'Los Reyes Magos', ids: ['melchor', 'gaspar', 'baltasar'] },
];

/** Rellena las plantillas con el nombre del niño. */
export function fillChild(template: string, child: string): string {
  return template.replaceAll('{child}', child);
}
