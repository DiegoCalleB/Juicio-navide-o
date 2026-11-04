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

export interface PlanItem {
  /** Hora local "HH:MM". */
  time: string;
  text: string;
  /** Pantalla de sorpresa a pantalla completa en el móvil del niño. */
  surprise?: boolean;
}

export interface CharacterPlan {
  id: string;
  label: string;
  /** Día del año "MM-DD" (se usa el próximo que llegue). */
  date: string;
  items: PlanItem[];
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
  /** Días mínimos que vive la sala antes de borrarse. */
  expiresDays: number;
  /** "MM-DD": la sala vive, como poco, hasta pasadas las fiestas (si caen en los próximos ~4 meses). */
  holidayEnd: string;
  /** Frase en tercera persona para "{personaje} está ocupado" (el duende o paje avisa al niño). */
  busyExcuse: string;
  /** Quién abre la línea mágica y atiende al niño mientras llega el personaje. */
  helper: { name: string; role: string };
  /** "el Polo Norte", "Oriente": para frases ("desde …", "hacia …"). */
  placeLabel: string;
  /** "los duendes" / "los pajes": quienes cuidan la línea mágica. */
  crew: string;
  /** Lo que dice al tocar su foto. */
  avatarTap: string;
  /** Textos de la pantalla de entrada del niño. Solo datos. */
  intro: { connecting: string; ready: string; button: string };
  /** Frases graciosas que rotan mientras el personaje escribe. */
  typingQuips: string[];
  /** Guiones listos para programar con antelación (Nochebuena, mañana de regalos…). */
  plans: CharacterPlan[];
  /** Respuestas para cuando el niño manda una foto o un dibujo. */
  photoReplies: string[];
  /** Mensajes preparados por momento (Nochebuena, mañana de regalos…). `{child}` = nombre del niño. Solo datos. */
  moments: CharacterMoment[];
}

export const CHARACTER_IDS = ['papa_noel', 'melchor', 'gaspar', 'baltasar'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

const ORIENT = { bg: '#160a2b', sky: 'orient' as const, headerFrom: '#3b1466', headerTo: '#2a0f4a' };

const ORIENT_EXTRAS = {
  helper: { name: 'Zafiro', role: 'paje real' },
  placeLabel: 'Oriente',
  crew: 'los pajes',
  avatarTap: '¡Que la estrella te guíe!',
  intro: {
    connecting: 'Los pajes reales están encendiendo la estrella que guía los mensajes…',
    ready: 'La estrella de Oriente ha encontrado tu casa',
    button: 'Abrir mensaje de los Reyes',
  },
  typingQuips: ['está firmando con su pluma de oro…', 'escribe mientras los camellos miran…', 'se está colocando bien la corona…'],
  plans: [
    {
      id: 'noche',
      label: 'Noche de Reyes',
      date: '01-05',
      items: [
        { time: '18:30', text: `Estamos preparando los camellos, {child}. Los pajes han cargado los regalos y Zafiro no para de contarlos. ¡Qué nervios!` },
        { time: '21:30', text: `Estamos ya cerquita de tu ciudad, {child}. Deja los zapatos preparados y un poquito de agua para los camellos.` },
        { time: '23:00', text: `Los camellos están cansadísimos, pero muy contentos. Acuéstate pronto, {child}, que si estás despierto no podemos entrar.` },
      ],
    },
    {
      id: 'manana',
      label: 'Mañana de Reyes',
      date: '01-06',
      items: [
        { time: '08:30', surprise: true, text: `¡Feliz día de Reyes, {child}! Anoche dejamos los regalos en tu casa. Antes de abrirlos, cuéntame: ¿qué tal has dormido?` },
        { time: '11:00', text: `Esperamos que te estén gustando los regalos, {child}. Cuídalos mucho y dale las gracias a tu familia. ¡Hasta el año que viene!` },
      ],
    },
  ],
  photoReplies: [
    `¡Qué bonito, {child}! Se lo he enseñado a los otros Reyes y todos dicen que tienes muchísimo talento.`,
    `Mis pajes lo han colgado en la pared del palacio. ¡Gracias por enseñárnoslo, {child}!`,
    `Los camellos también lo han mirado con mucha atención. ¿Me cuentas qué es, {child}?`,
  ],
};

const kingChat = [
  `¡Hola, {child}! Qué alegría escucharte. Aquí en Oriente hace un frío que pela, pero los camellos están contentísimos.`,
  `Hemos recibido tu carta, {child}. La estamos leyendo con muchísima atención.`,
  `Me han contado mis pajes que este año te has portado muy bien, {child}. ¡Sigue así!`,
  `Los camellos te mandan saludos. ¿Les dejarás un poquito de agua la noche de Reyes?`,
  `Recuerda irte pronto a la cama la noche del cinco, que si estás despierto no podemos pasar.`,
];

const kingMoments: CharacterMoment[] = [
  {
    id: 'primero',
    label: 'Primer saludo',
    tip: 'El primero es el que más cuenta: envíalo en cuanto el niño abra el enlace.',
    replies: [
      `¿{child}? ¡Qué alegría! Zafiro, mi paje, me avisó de que ibas a escribirnos y los camellos han levantado las orejas de la emoción.`,
      `Tu nombre está en nuestro libro de oro, {child}. Cuéntame, ¿qué tal estás?`,
    ],
  },
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
    holidayEnd: '01-10',
    busyExcuse: 'Papá Noel está en el taller con los duendes',
    helper: { name: 'Cascabel', role: 'duende de las comunicaciones' },
    placeLabel: 'el Polo Norte',
    crew: 'los duendes',
    avatarTap: '¡Jo, jo, jo!',
    intro: {
      connecting: 'Los duendes de Laponia están encendiendo la línea mágica…',
      ready: 'La línea con el Polo Norte está abierta',
      button: 'Abrir mensaje de Papá Noel',
    },
    typingQuips: ['se está limpiando las gafitas…', 'teclea despacito con los guantes puestos…', 'escribe con Rodolfo mirándole por encima del hombro…'],
    plans: [
      {
        id: 'nochebuena',
        label: 'Nochebuena',
        date: '12-24',
        items: [
          { time: '18:30', text: `¡Jo, jo, jo! Ya estoy cargando el trineo, {child}. Los duendes me han ayudado a meter todos los regalos y Rodolfo está nerviosísimo.` },
          { time: '21:00', text: `Rodolfo y yo despegamos ya del Polo Norte, {child}. ¡Qué frío hace aquí arriba! Prepara las zanahorias y acuéstate prontito.` },
          { time: '22:30', text: `Ya sobrevuelo tu ciudad, {child}. Se ven las lucecitas de todas las casas. Duérmete pronto, que si estás despierto no puedo pasar. ¡Jo, jo, jo!` },
        ],
      },
      {
        id: 'navidad',
        label: 'Mañana de Navidad',
        date: '12-25',
        items: [
          { time: '08:30', surprise: true, text: `¡Feliz Navidad, {child}! Anoche pasé por tu casa y dejé los regalos junto al árbol. Antes de abrirlos, cuéntame: ¿qué tal has dormido?` },
          { time: '11:00', text: `¿Qué es lo que más te ha gustado, {child}? Cuéntamelo, que los duendes y yo estamos deseando saberlo. ¡Jo, jo, jo!` },
        ],
      },
    ],
    photoReplies: [
      `¡Qué dibujo tan bonito, {child}! Lo voy a colgar en la pared de mi taller, junto a los de los demás niños.`,
      `¡Jo, jo, jo! Los duendes se han quedado con la boca abierta al ver tu foto, {child}. ¡Qué bien te ha salido!`,
      `Rodolfo dice que le encanta. Me lo guardo en el bolsillo del abrigo para enseñárselo a la Señora Noel.`,
      `Gracias por enseñármelo, {child}. ¿Me cuentas qué es lo que más te gusta de lo que has hecho?`,
    ],
    moments: [
      {
        id: 'primero',
        label: 'Primer saludo',
        tip: 'El primero es el que más cuenta: envíalo en cuanto el niño abra el enlace.',
        replies: [
          `¡Jo, jo, jo! ¿{child}? ¿Eres tú de verdad? ¡Cascabel me dijo que me ibas a escribir y casi se me cae el chocolate caliente!`,
          `Estoy sentado en mi sillón del taller, con las botas calentitas y los duendes empaquetando a mi alrededor. ¿Qué tal estás, {child}?`,
          `Tengo tu nombre apuntado en mi libro grande, {child}. Y te cuento un secreto: está en la página de los que se portan bien.`,
        ],
      },
      {
        id: 'taller',
        label: 'Cosas del taller',
        replies: [
          `¡Jo, jo, jo! Cascabel ha probado un caramelo del taller y se le ha puesto la lengua verde. No para de reírse, {child}.`,
          `Se me ha enredado la barba con una guirnalda, {child}. Los duendes llevan un rato intentando desenredarme. ¡Jo, jo, jo!`,
          `Los duendes me han dejado las botas llenas de purpurina. Dejo brillitos por todo el Polo Norte, {child}.`,
          `Rodolfo se ha puesto celoso porque hoy te escribo a ti. Le he dado una zanahoria extra para que se le pase, {child}.`,
        ],
      },
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
    expiresDays: 45, holidayEnd: '01-20', busyExcuse: 'Los Reyes están preparando los regalos con sus pajes', ...ORIENT_EXTRAS, moments: kingMoments,
  },
  gaspar: {
    id: 'gaspar', name: 'Rey Gaspar', shortName: 'Gaspar', group: 'reyes',
    tagline: 'Sereno y sabio', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#1f5a3d', headerTo: '#153d2a', ink: '#1f5a3d', robe: '#2f6f4f' },
    expiresDays: 45, holidayEnd: '01-20', busyExcuse: 'Los Reyes están preparando los regalos con sus pajes', ...ORIENT_EXTRAS, moments: kingMoments,
  },
  baltasar: {
    id: 'baltasar', name: 'Rey Baltasar', shortName: 'Baltasar', group: 'reyes',
    tagline: 'Alegre y bonachón', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#8a2330', headerTo: '#5d1620', ink: '#8a2330', robe: '#a8323a' },
    expiresDays: 45, holidayEnd: '01-20', busyExcuse: 'Los Reyes están preparando los regalos con sus pajes', ...ORIENT_EXTRAS, moments: kingMoments,
  },
};

/**
 * Cuándo se borra una sala: a los `expiresDays` días o, si es más tarde, pasadas las
 * fiestas (para que una sala creada en noviembre no desaparezca antes de Navidad).
 */
export function roomExpiresAt(character: CharacterProfile, now: Date = new Date()): Date {
  const min = new Date(now.getTime() + character.expiresDays * 86_400_000);
  const [m, d] = character.holidayEnd.split('-').map(Number) as [number, number];
  let end = new Date(Date.UTC(now.getUTCFullYear(), m - 1, d, 23, 59));
  if (end.getTime() < now.getTime()) end = new Date(Date.UTC(now.getUTCFullYear() + 1, m - 1, d, 23, 59));
  const within = end.getTime() - now.getTime() <= 120 * 86_400_000;
  return within && end.getTime() > min.getTime() ? end : min;
}

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
