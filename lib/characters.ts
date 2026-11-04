/**
 * Registro de personajes mágicos. Añadir uno = añadir una entrada aquí
 * (+ su voz en lib/voice.ts y, si hace falta, su avatar en RoyalAvatar).
 * Sin secretos: este archivo viaja al cliente.
 */

export type AvatarKind = 'crown' | 'santa' | 'mouse';
export type SkyKind = 'orient' | 'snow' | 'night';

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
  /** Día del año "MM-DD" (se usa el próximo que llegue), o "hoy" / "manana". */
  date: string;
  items: PlanItem[];
}

export interface CharacterProfile {
  id: CharacterId;
  /** "Rey Melchor", "Papá Noel" */
  name: string;
  /** "Melchor", "Papá Noel" (para frases: "¡{short} te contestará pronto!") */
  shortName: string;
  group: 'reyes' | 'noel' | 'raton';
  /** Con quién habla el niño en frases como "solo X y {audience} pueden leerla". */
  audience: string;
  tagline: string;
  avatar: AvatarKind;
  theme: CharacterTheme;
  /** Días mínimos que vive la sala antes de borrarse. */
  expiresDays: number;
  /** "MM-DD": la sala vive, como poco, hasta pasadas las fiestas (si caen en los próximos ~4 meses). Sin él, solo cuenta `expiresDays`. */
  holidayEnd?: string;
  /** Acuse automático en primera persona cuando el niño escribe y los padres aún no han contestado ("{child}" = nombre). */
  busyAck: string;
  /** "el Polo Norte", "Oriente": para frases ("desde …", "hacia …"). */
  placeLabel: string;
  /** Cómo se presenta en la sala vacía: "Soy Papá Noel". */
  selfIntro: string;
  /** Emoji de la pantalla de conexión. */
  introEmoji: string;
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

export const CHARACTER_IDS = ['papa_noel', 'melchor', 'gaspar', 'baltasar', 'raton_perez'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

const ORIENT = { bg: '#160a2b', sky: 'orient' as const, headerFrom: '#3b1466', headerTo: '#2a0f4a' };

const ORIENT_EXTRAS = {
  placeLabel: 'Oriente',
  selfIntro: 'Soy tu Rey Mago',
  introEmoji: '⭐',
  avatarTap: '¡Que la estrella te guíe!',
  intro: {
    connecting: 'Conectando con Oriente…',
    ready: 'La estrella de Oriente ha encontrado tu casa',
    button: 'Abrir mensaje de los Reyes',
  },
  busyAck: 'Hemos recibido tu mensaje, {child}. Ahora estamos preparando los regalos, pero te contestaremos en cuanto podamos.',
  typingQuips: ['está firmando con su pluma de oro…', 'escribe mientras los camellos miran…', 'se está colocando bien la corona…'],
  plans: [
    {
      id: 'noche',
      label: 'Noche de Reyes',
      date: '01-05',
      items: [
        { time: '18:30', text: `Estamos preparando los camellos, {child}. Los pajes han cargado los regalos y no paran de contarlos. ¡Qué nervios!` },
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
      `¿{child}? ¡Qué alegría! Mis pajes me avisaron de que ibas a escribirnos y los camellos han levantado las orejas de la emoción.`,
      `Tu nombre está en nuestro libro de oro, {child}. Cuéntame, ¿qué tal estás?`,
    ],
  },
  {
    id: 'preguntas',
    label: 'Preguntas',
    tip: 'Pregunta con curiosidad, sin interrogar. Lo que cuente es para ayudarle, nunca para regañarle: si se siente juzgado, dejará de contártelo.',
    replies: [
      `¿Cuál ha sido el mejor momento de tu año, {child}? Mis pajes lo apuntan en el libro de oro.`,
      `Cuéntanos, {child}: ¿qué es lo que más te gusta hacer cuando juegas? Así sabremos qué regalos te harían más feliz.`,
      `¿Quién ha sido tu mejor amigo o amiga este año, {child}? Seguro que es muy afortunado de tenerte.`,
      `¿Has ayudado a alguien este año, {child}? Los Reyes admiramos mucho a los niños generosos.`,
      `Si pudieras pedir un deseo que no fuera un juguete, ¿cuál sería, {child}?`,
      `¿Hay algo que te preocupe o te dé un poquito de miedo? Puedes contárnoslo, y también a mamá y papá, que te quieren muchísimo.`,
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
    audience: 'Papá Noel',
    tagline: 'Desde el Polo Norte, con sus renos',
    avatar: 'santa',
    theme: { headerFrom: '#9b1c24', headerTo: '#6b1218', bg: '#0e2418', sky: 'snow', ink: '#8a1a1f', robe: '#c62828' },
    expiresDays: 45,
    holidayEnd: '01-10',
    busyAck: '¡Jo, jo, jo! He recibido tu mensaje, {child}. Ahora estoy en el taller con mucho trabajo, pero te contesto en cuanto pueda.',
    placeLabel: 'el Polo Norte',
    selfIntro: 'Soy Papá Noel',
    introEmoji: '❄️',
    avatarTap: '¡Jo, jo, jo!',
    intro: {
      connecting: 'Conectando con el Polo Norte…',
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
          `¡Jo, jo, jo! ¿{child}? ¿Eres tú de verdad? ¡Un duende me dijo que me ibas a escribir y casi se me cae el chocolate caliente!`,
          `Estoy sentado en mi sillón del taller, con las botas calentitas y los duendes empaquetando a mi alrededor. ¿Qué tal estás, {child}?`,
          `Tengo tu nombre apuntado en mi libro grande, {child}. Y te cuento un secreto: está en la página de los que se portan bien.`,
        ],
      },
      {
        id: 'taller',
        label: 'Cosas del taller',
        replies: [
          `¡Jo, jo, jo! Un duende ha probado un caramelo del taller y se le ha puesto la lengua verde. No para de reírse, {child}.`,
          `Se me ha enredado la barba con una guirnalda, {child}. Los duendes llevan un rato intentando desenredarme. ¡Jo, jo, jo!`,
          `Los duendes me han dejado las botas llenas de purpurina. Dejo brillitos por todo el Polo Norte, {child}.`,
          `Rodolfo se ha puesto celoso porque hoy te escribo a ti. Le he dado una zanahoria extra para que se le pase, {child}.`,
        ],
      },
      {
        id: 'preguntas',
        label: 'Preguntas',
        tip: 'Pregunta con curiosidad, sin interrogar. Lo que cuente es para ayudarle, nunca para regañarle: si se siente juzgado, dejará de contártelo.',
        replies: [
          `¿Cuál ha sido el mejor momento de tu año, {child}? Los duendes apuntan los más bonitos en un cuaderno.`,
          `Cuéntame, ¿qué es lo que más te gusta hacer cuando juegas, {child}? Así sé qué regalos te harían más feliz.`,
          `¿Quién ha sido tu mejor amigo o amiga este año? Seguro que es muy afortunado de tenerte.`,
          `¿Has ayudado a alguien este año, {child}? Me encanta saber las cosas buenas que hacen los niños.`,
          `Si pudieras pedir un deseo que no fuera un juguete, ¿cuál sería, {child}?`,
          `¿Hay algo que te preocupe o te dé un poquito de miedo? Puedes contármelo, y también a mamá y papá, que te quieren muchísimo.`,
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
    id: 'melchor', name: 'Rey Melchor', shortName: 'Melchor', group: 'reyes', audience: 'los Reyes',
    tagline: 'Cariñoso y abuelete', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#3b1466', headerTo: '#2a0f4a', ink: '#5b2a86', robe: '#7a3fb0' },
    expiresDays: 45, holidayEnd: '01-20', ...ORIENT_EXTRAS, moments: kingMoments,
  },
  gaspar: {
    id: 'gaspar', name: 'Rey Gaspar', shortName: 'Gaspar', group: 'reyes', audience: 'los Reyes',
    tagline: 'Sereno y sabio', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#1f5a3d', headerTo: '#153d2a', ink: '#1f5a3d', robe: '#2f6f4f' },
    expiresDays: 45, holidayEnd: '01-20', ...ORIENT_EXTRAS, moments: kingMoments,
  },
  baltasar: {
    id: 'baltasar', name: 'Rey Baltasar', shortName: 'Baltasar', group: 'reyes', audience: 'los Reyes',
    tagline: 'Alegre y bonachón', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#8a2330', headerTo: '#5d1620', ink: '#8a2330', robe: '#a8323a' },
    expiresDays: 45, holidayEnd: '01-20', ...ORIENT_EXTRAS, moments: kingMoments,
  },
  raton_perez: {
    id: 'raton_perez',
    name: 'Ratoncito Pérez',
    shortName: 'Ratoncito Pérez',
    group: 'raton',
    audience: 'el Ratoncito Pérez',
    tagline: 'Recoge dientes y deja monedas',
    avatar: 'mouse',
    theme: { headerFrom: '#6a4fb3', headerTo: '#43348a', bg: '#171a45', sky: 'night', ink: '#4a3a99', robe: '#8566d6' },
    expiresDays: 30,
    busyAck: '¡Quic, quic! He recibido tu mensaje, {child}. Ahora estoy recogiendo dientes por las casas, pero te contesto en cuanto pueda.',
    placeLabel: 'la Casita del Ratoncito',
    selfIntro: 'Soy el Ratoncito Pérez',
    introEmoji: '🦷',
    avatarTap: '¡Quic, quic!',
    intro: {
      connecting: 'Buscando la Casita del Ratoncito…',
      ready: 'La línea con la Casita del Ratoncito está abierta',
      button: 'Abrir mensaje del Ratoncito Pérez',
    },
    typingQuips: ['está buscando sus gafitas…', 'escribe con su plumita diminuta…', 'se ha enredado el bigote con la pluma…'],
    plans: [
      {
        id: 'noche',
        label: 'Esta noche',
        date: 'hoy',
        items: [
          { time: '21:30', text: `¡Quic, quic! Ya salgo de mi casita con la bolsita de monedas, {child}. Cuando te duermas, paso a buscar tu diente.` },
          { time: '23:00', text: `Estoy llegando a tu calle, {child}. Duérmete prontito, que a los ratones nos da vergüenza entrar si estás despierto.` },
        ],
      },
      {
        id: 'manana',
        label: 'Mañana por la mañana',
        date: 'manana',
        items: [
          { time: '08:00', surprise: true, text: `¡Buenos días, {child}! Anoche pasé por tu casa y encontré tu diente. Mira debajo de tu almohada, que te he dejado una sorpresa. ¡Quic, quic!` },
          { time: '10:30', text: `¿Has encontrado mi regalito, {child}? Con tu diente estoy construyendo un palacio muy brillante en mi casita. ¡Gracias!` },
        ],
      },
    ],
    photoReplies: [
      `¡Menudo dientazo, {child}! Es el diente más bonito que he visto esta semana.`,
      `¡Qué foto tan buena, {child}! Mis ratoncitos y yo nos hemos reído mucho. ¡Quic, quic!`,
      `Gracias por enseñármelo, {child}. Con un diente así, mi palacio va a quedar precioso.`,
    ],
    moments: [
      {
        id: 'primero',
        label: 'Primer saludo',
        tip: 'Envíalo en cuanto el niño abra el enlace, mejor justo después de que se le caiga el diente.',
        replies: [
          `¡Quic, quic! ¿{child}? ¡Me ha dicho un pajarito que se te ha caído un diente! Se me han puesto los bigotes de punta de la emoción.`,
          `Estoy en mi casita, con mis gafitas y mi saquito de monedas, preparándolo todo. ¿Me cuentas cómo ha sido, {child}?`,
          `¡Enhorabuena, {child}! Un diente que se cae es un niño que crece. ¡Qué orgulloso estoy!`,
        ],
      },
      {
        id: 'diente',
        label: 'Se cayó el diente',
        replies: [
          `Guarda el diente en una cajita o en un vasito y ponlo debajo de tu almohada, {child}. Esta noche paso a buscarlo.`,
          `¿Te lo has enjuagado bien, {child}? A mí me gustan los dientes limpios y brillantes para mi palacio.`,
          `Los ratones somos muy silenciosos. Seguro que ni te enteras cuando paso a por él. ¡Quic, quic!`,
        ],
      },
      {
        id: 'dientes',
        label: 'Cuidar los dientes',
        replies: [
          `¿Te lavas los dientes todas las noches, {child}? A los ratones nos encantan los dientes sanos y brillantes.`,
          `Un truco de ratón: cepíllate dos minutos, ¡lo que dura una canción pequeñita!, y verás qué sonrisa tan bonita tienes.`,
          `Cuéntame, {child}: ¿cuál es tu pasta de dientes favorita? Yo, la de queso... bueno, no, era broma. ¡Quic, quic!`,
        ],
      },
      {
        id: 'noche',
        label: 'Esa noche',
        replies: [
          `Esta noche paso por tu casa, {child}. Pon el diente bajo la almohada y duérmete prontito.`,
          `Ya estoy de camino, {child}. Voy por los tejados con mi saquito de monedas. ¡Qué ilusión!`,
        ],
      },
      {
        id: 'manana',
        label: 'A la mañana siguiente',
        tip: 'Usa el modo sorpresa para el mensaje de la mañana y graba su cara al mirar bajo la almohada.',
        replies: [
          `¡Buenos días, {child}! Anoche pasé por tu casa. Mira debajo de tu almohada, que te he dejado algo. ¡Quic, quic!`,
          `¿Has encontrado mi regalito, {child}? Gracias por tu diente. Con él estoy construyendo un palacio de dientes brillantes.`,
          `Hasta la próxima vez, {child}. ¡Que te crezca un diente fuerte y bonito!`,
        ],
      },
      {
        id: 'charla',
        label: 'Charla',
        replies: [
          `¡Quic, quic! Hola, {child}. Aquí en mi casita huele a queso y a galletas. ¿Y por tu casa?`,
          `Un pajarito me ha contado que eres un niño muy valiente, {child}. Seguro que el próximo diente también te sale fenomenal.`,
          `Hoy he recogido muchísimos dientes. Mi palacio ya tiene hasta tres torres, {child}.`,
        ],
      },
    ],
  },
};

/**
 * Cuándo se borra una sala: a los `expiresDays` días o, si es más tarde, pasadas las
 * fiestas (para que una sala creada en noviembre no desaparezca antes de Navidad).
 */
export function roomExpiresAt(character: CharacterProfile, now: Date = new Date()): Date {
  const min = new Date(now.getTime() + character.expiresDays * 86_400_000);
  if (!character.holidayEnd) return min;
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
export const CHARACTER_GROUPS: { id: 'noel' | 'reyes' | 'raton'; label: string; ids: CharacterId[] }[] = [
  { id: 'noel', label: 'Papá Noel', ids: ['papa_noel'] },
  { id: 'reyes', label: 'Los Reyes Magos', ids: ['melchor', 'gaspar', 'baltasar'] },
  { id: 'raton', label: 'Cuando se cae un diente', ids: ['raton_perez'] },
];

/** Rellena las plantillas con el nombre del niño. */
export function fillChild(template: string, child: string): string {
  return template.replaceAll('{child}', child);
}
