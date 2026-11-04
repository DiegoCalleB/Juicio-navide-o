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

export interface CharacterMoment {
  id: string;
  label: string;
  /** Consejo que se muestra al elegir el momento. */
  tip?: string;
  replies: string[];
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
  /** Mensajes preparados por momento (Nochebuena, mañana de regalos…). `{child}` = nombre del niño. Solo datos. */
  moments: CharacterMoment[];
}

export const CHARACTER_IDS = ['papa_noel', 'melchor', 'gaspar', 'baltasar'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

const ORIENT = { bg: '#160a2b', sky: 'orient' as const, headerFrom: '#3b1466', headerTo: '#2a0f4a' };

const kingChat = [
  `¡Hola, {child}! Qué alegría escucharte. Aquí en Oriente hace un frío que pela, pero los camellos están contentísimos.`,
  `Hemos recibido tu carta, {child}. La estamos leyendo con muchísima atención.`,
  `Me han contado mis pajes que este año te has portado muy bien, {child}. ¡Sigue así!`,
  `Los camellos te mandan saludos. ¿Les dejarás un poquito de agua la noche de Reyes?`,
  `Recuerda irte pronto a la cama la noche del cinco, que si estás despierto no podemos pasar.`,
];

const kingMoments: CharacterMoment[] = [
  { id: 'charla', label: 'Charla', replies: kingChat },
  {
    id: 'noche',
    label: 'Noche de Reyes',
    replies: [
      'Esta noche pasamos por tu casa, {child}. Deja los zapatos preparados y un poquito de agua para los camellos.',
      'Los camellos están cansadísimos, pero muy contentos. Acuéstate pronto, {child}, que si estás despierto no podemos entrar.',
      'Estamos ya cerquita de tu ciudad, {child}. ¡Qué ilusión!',
    ],
  },
  {
    id: 'manana',
    label: 'Mañana de Reyes',
    tip: 'Usa el modo sorpresa para el mensaje de abrir los regalos.',
    replies: [
      '¡Feliz día de Reyes, {child}! Anoche dejamos los regalos en tu casa. Antes de abrirlos, cuéntame: ¿qué tal has dormido?',
      '¡Ya puedes abrir los regalos, {child}! Disfrútalos mucho y cuídalos.',
      'Los camellos han dejado huellas por todas partes. ¡Hasta el año que viene, {child}!',
    ],
  },
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
    moments: [
      {
        id: 'charla',
        label: 'Charla',
        replies: [
          `¡Jo, jo, jo! Hola, {child}. Aquí en el Polo Norte hace un frío que pela, pero los renos están contentísimos.`,
          `He recibido tu carta, {child}. Los duendes y yo la estamos leyendo con muchísima atención.`,
          `Mis duendes me han contado que este año te has portado muy bien, {child}. ¡Sigue así!`,
          `Rodolfo te manda un saludo con su nariz roja. ¿Le dejarás unas zanahorias la noche de Navidad?`,
        ],
      },
      {
        id: 'nochebuena',
        label: 'Nochebuena',
        replies: [
          `¡Jo, jo, jo! Esta noche salgo con el trineo, {child}. Acuéstate prontito, que si estás despierto no puedo pasar.`,
          `Ya estoy repartiendo regalos por tu barrio, {child}. ¡Qué frío hace aquí arriba!`,
          `Rodolfo se ha comido las zanahorias que dejaste, {child}. ¡Estaban riquísimas! Gracias.`,
        ],
      },
      {
        id: 'manana',
        label: 'Mañana de Navidad',
        tip: 'Usa el modo sorpresa para el mensaje de abrir los regalos.',
        replies: [
          `¡Feliz Navidad, {child}! Anoche pasé por tu casa y dejé los regalos junto al árbol. Antes de abrirlos, cuéntame: ¿qué tal has dormido?`,
          `¿Has visto cómo Rodolfo ha mordisqueado la zanahoria? Mira bien cerca del árbol, {child}…`,
          `¡Ya puedes abrir los regalos, {child}! Ábrelos con mucha ilusión y dale las gracias a tu familia. ¡Jo, jo, jo!`,
          `Ha sido un placer, {child}. Nos vemos el año que viene. ¡Feliz Navidad!`,
        ],
      },
    ],
  },
  melchor: {
    id: 'melchor', name: 'Rey Melchor', shortName: 'Melchor', group: 'reyes',
    tagline: 'Cariñoso y abuelete', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#3b1466', headerTo: '#2a0f4a', ink: '#5b2a86', robe: '#7a3fb0' },
    expiresDays: 45, busyExcuse: 'Los Reyes estamos muy ocupados preparando los regalos', moments: kingMoments,
  },
  gaspar: {
    id: 'gaspar', name: 'Rey Gaspar', shortName: 'Gaspar', group: 'reyes',
    tagline: 'Sereno y sabio', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#1f5a3d', headerTo: '#153d2a', ink: '#1f5a3d', robe: '#2f6f4f' },
    expiresDays: 45, busyExcuse: 'Los Reyes estamos muy ocupados preparando los regalos', moments: kingMoments,
  },
  baltasar: {
    id: 'baltasar', name: 'Rey Baltasar', shortName: 'Baltasar', group: 'reyes',
    tagline: 'Alegre y bonachón', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#8a2330', headerTo: '#5d1620', ink: '#8a2330', robe: '#a8323a' },
    expiresDays: 45, busyExcuse: 'Los Reyes estamos muy ocupados preparando los regalos', moments: kingMoments,
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
