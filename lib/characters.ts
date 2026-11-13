/**
 * Registro de personajes mágicos. Añadir uno = añadir una entrada aquí
 * (+ su voz en lib/voice.ts y, si hace falta, su avatar en RoyalAvatar).
 * Sin secretos: este archivo viaja al cliente.
 */
import { regionalizeDeep, type Locale } from '@/lib/i18n';

export type AvatarKind = 'crown' | 'santa' | 'mouse' | 'elf';
export type SkyKind = 'orient' | 'snow' | 'night' | 'candy';

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

/** Una travesura del calendario: qué monta la familia y el mensaje del personaje esa mañana. */
export interface MischiefDay {
  day: number;
  /** Título corto y con gracia (para compartir). */
  title: string;
  /** Para los padres: qué escena montar por la noche. */
  idea: string;
  /** Cómo montarla, paso a paso. */
  steps: string[];
  /** Qué hace falta. */
  need: string;
  /** Minutos que se tarda en montarla. */
  minutes: number;
  /** Nivel de lío: 1 poco, 2 algo, 3 mucho. */
  mess: 1 | 2 | 3;
  /** Por qué funciona, en tono de broma. */
  why: string;
  /** Sugerencia opcional de mensaje. Los padres escriben el suyo y eligen sus fotos. `{child}`, `{elf}`, `{o}`… se rellenan. */
  suggestion: string;
}

/** Trastada exprés: para cuando no hay tiempo, ni ganas, o se ha olvidado. */
export interface QuickMischief {
  id: string;
  title: string;
  /** Qué hacer (segundos). */
  how: string;
  /** Por qué funciona, en broma. */
  joke: string;
  suggestion: string;
}

export interface MischiefCalendar {
  /** Día en que empieza ("MM-DD"). */
  startDate: string;
  days: MischiefDay[];
  /** Trastadas exprés (sin tiempo, sin ganas o se olvidó). */
  quick: QuickMischief[];
}

export interface CharacterProfile {
  id: CharacterId;
  /** "Rey Melchor", "Papá Noel" */
  name: string;
  /** "Melchor", "Papá Noel" (para frases: "¡{short} te contestará pronto!") */
  shortName: string;
  group: 'reyes' | 'noel' | 'raton' | 'duende';
  /** Con quién habla el niño en frases como "solo X y {audience} pueden leerla". */
  audience: string;
  /** "de Papá Noel", "del Rey Melchor": para "tienes un mensaje …". */
  deName: string;
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
  /** Calendario de travesuras (el duende): un mensaje por mañana con idea de escena para los padres. */
  mischief?: MischiefCalendar;
}

export const CHARACTER_IDS = ['papa_noel', 'melchor', 'gaspar', 'baltasar', 'raton_perez', 'duende_chispa'] as const;
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
    deName: 'de Papá Noel',
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
    id: 'melchor', name: 'Rey Melchor', shortName: 'Melchor', group: 'reyes', audience: 'los Reyes', deName: 'del Rey Melchor',
    tagline: 'Cariñoso y abuelete', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#3b1466', headerTo: '#2a0f4a', ink: '#5b2a86', robe: '#7a3fb0' },
    expiresDays: 45, holidayEnd: '01-20', ...ORIENT_EXTRAS, moments: kingMoments,
  },
  gaspar: {
    id: 'gaspar', name: 'Rey Gaspar', shortName: 'Gaspar', group: 'reyes', audience: 'los Reyes', deName: 'del Rey Gaspar',
    tagline: 'Sereno y sabio', avatar: 'crown',
    theme: { ...ORIENT, headerFrom: '#1f5a3d', headerTo: '#153d2a', ink: '#1f5a3d', robe: '#2f6f4f' },
    expiresDays: 45, holidayEnd: '01-20', ...ORIENT_EXTRAS, moments: kingMoments,
  },
  baltasar: {
    id: 'baltasar', name: 'Rey Baltasar', shortName: 'Baltasar', group: 'reyes', audience: 'los Reyes', deName: 'del Rey Baltasar',
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
    deName: 'del Ratoncito Pérez',
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
  duende_chispa: {
    id: 'duende_chispa',
    name: '{Elfo} {elf}',
    shortName: '{elf}',
    group: 'duende',
    audience: '{elf}',
    deName: '{del} {Elfo} {elf}',
    tagline: '{Un} elf{o} muy travies{o}',
    avatar: 'elf',
    theme: { headerFrom: '#1f8f4f', headerTo: '#146b3a', bg: '#0d2b3a', sky: 'candy', ink: '#146b3a', robe: '#e5383b' },
    expiresDays: 45,
    holidayEnd: '01-10',
    busyAck: '¡Chis, chis! He recibido tu mensaje, {child}. Ahora estoy escondid{o} haciendo una travesura, pero te contesto en cuanto salga de mi escondite.',
    placeLabel: 'el rincón de los elfos',
    selfIntro: 'Soy {elf}, {el} elf{o} travies{o}',
    introEmoji: '🧝',
    avatarTap: '¡Ji, ji, ji!',
    intro: {
      connecting: 'Buscando a {elf} por toda la casa…',
      ready: '{elf} ha salido de su escondite',
      button: 'Abrir mensaje {del} {Elfo} {elf}',
    },
    typingQuips: ['se está riendo bajito…', 'escribe con los dedos pegajosos de azúcar…', 'se esconde para que no lo veas escribir…'],
    plans: [],
    photoReplies: [
      `¡Ji, ji, ji! ¡Me has pillado, {child}! Eres el mejor buscador de elfos del mundo.`,
      `¡Qué foto tan buena! Casi no me has dejado tiempo para esconderme, {child}.`,
      `Prometo que mañana me esconderé mejor. ¡Aunque a lo mejor me encuentras otra vez, {child}!`,
    ],
    moments: [
      {
        id: 'primero',
        label: 'Primer saludo',
        tip: 'Envíalo la mañana que lo "encuentre" por primera vez, o en cuanto el niño abra el enlace.',
        replies: [
          `¡Ji, ji, ji! ¿{child}? ¡Me has encontrado! Soy {elf}, {un} elf{o} muy travies{o}, y vengo a pasar la Navidad en tu casa.`,
          `Cada noche haré una travesura distinta y cada mañana me esconderé en un sitio nuevo. ¿Te apuntas a buscarme, {child}?`,
        ],
      },
      {
        id: 'travesuras',
        label: 'Travesuras',
        tip: 'Cuéntalo con tus palabras y, si puedes, manda una foto de la escena. La app solo te da ideas.',
        replies: [
          `¡Anoche me comí un montón de galletas de queso y ahora tengo hipo, {child}! ¡Hip! Mira bien dónde estoy hoy.`,
          `Hoy he hecho una travesura enorme, {child}. Pista: tiene que ver con algo que se puede abrir y cerrar. ¡Hip!`,
          `Me he puesto a jugar con tus cosas mientras dormías, {child}. ¡Pero las he dejado casi donde estaban!`,
        ],
      },
      {
        id: 'pillado',
        label: 'Me has pillado',
        replies: [
          `¡Ji, ji, ji! ¡Me has pillado, {child}! Eres más rápido que {un} elf{o} de carreras.`,
          `¡Vaya! Pensé que hoy no me encontrabas. Mañana me escondo mejor, {child}.`,
        ],
      },
      {
        id: 'charla',
        label: 'Charla',
        replies: [
          `¡Chis, chis! Hola, {child}. Estoy escondid{o} pero te escucho. ¿Qué tal has dormido?`,
          `Aquí en mi escondite huele a turrón y a galletas, {child}. No se lo digas a nadie.`,
          `Hoy me he quedado dormid{o} en un sitio rarísimo y casi me pilla tu mamá. ¡Menos mal que soy muy ágil!`,
        ],
      },
    ],
    mischief: {
      startDate: '12-01',
      quick: [
        { id: "dormido", title: "Se ha quedado dormido", how: "No lo muevas: tápalo con una servilleta o un pañuelo, como si fuera una manta.", joke: "La excusa perfecta para el día que se te olvidó. Literalmente no has hecho nada y aun así cuenta.", suggestion: "¡Buaaa! Perdona, {child}: anoche estaba tan cansad{o} de tanta travesura que me quedé dormid{o} aquí mismo. ¿He roncado mucho?" },
        { id: "huelga", title: "Elfo en huelga", how: "Un papelito al lado que diga: «EN HUELGA. Pido más galletas».", joke: "Un cartel y listo. Y además te sirve para negociar el desayuno.", suggestion: "Hoy estoy en huelga, {child}. Mis peticiones: una galleta, un abrazo y un dibujo. Cuando las cumplas, vuelvo a hacer trastadas." },
        { id: "resfriado", title: "Resfriado polar", how: "Déjalo donde esté con un pañuelo de papel arrugado al lado.", joke: "Hasta los elfos se ponen malitos. Tu peque se pasará el día cuidándolo (y tú, tan tranquilo).", suggestion: "¡Achís! Creo que me he resfriado con tanto frío, {child}. Hoy me quedo quiet{o}. ¿Me cuidas un poquito?" },
        { id: "libro", title: "Leyendo a escondidas", how: "Ponle delante el primer libro o cuento que pilles, abierto.", joke: "Cero preparación, y de paso le haces publicidad a la lectura.", suggestion: "Anoche encontré este libro y no pude parar de leer, {child}. ¿Me cuentas tú cómo termina?" },
        { id: "peluche", title: "Abrazo de peluche", how: "Siéntalo abrazado al peluche que tengas más cerca.", joke: "Lo más tierno del mes en tres segundos.", suggestion: "Esta noche hacía frío y tu peluche me ha dado un abrazo enorme, {child}. Ya somos mejores amigos." },
        { id: "galleta", title: "Pillado con la galleta", how: "Ponle una galleta, un cereal o una miga en la mano.", joke: "El clásico «yo no he sido» con las pruebas en la mano.", suggestion: "Yo no he sido, {child}. Esta galleta ya estaba en mi mano cuando me desperté. Qué misterio, ¿verdad?" },
        { id: "calcetin", title: "Atrapado en un calcetín", how: "Mételo en un calcetín (limpio, por favor) con la cabeza fuera.", joke: "Calcetín más elfo igual a carcajada asegurada. Matemáticas navideñas.", suggestion: "Me metí en tu calcetín para estar calentit{o} y ahora no sé salir, {child}. ¿Me rescatas?" },
        { id: "bocabajo", title: "Boca abajo", how: "Déjalo en el mismo sitio, pero dado la vuelta.", joke: "Dos segundos de trabajo. Y lo vende como si fuera un número de circo.", suggestion: "¡Mira, {child}! Hoy he aprendido a hacer el pino. Llevo así toda la noche. Creo que ya veo las cosas al revés." },
        { id: "desayuno", title: "Te espera en el desayuno", how: "Siéntalo junto a su taza o su bol, con una cuchara.", joke: "Lo pones mientras haces el café. Nadie sabrá que fue a las 7:58.", suggestion: "¡Buenos días, {child}! Te he guardado el sitio en el desayuno. Yo ya he desayunado: tres migas y una gota de leche." },
        { id: "zapato", title: "Dentro de una zapatilla", how: "Mételo en una de sus zapatillas o zapatos.", joke: "Se lo encontrará al calzarse. Sorpresa garantizada y cero esfuerzo.", suggestion: "¡Sorpresa, {child}! Me he escondido en tu zapatilla. Huele a aventuras. Bueno… y un poco a pie." },
        { id: "ventana", title: "Esperando la nieve", how: "Ponlo en la ventana, mirando hacia fuera.", joke: "Poético, sencillo y válido para cualquier día. Ni siquiera hace falta que nieve.", suggestion: "Me he pasado la noche mirando por la ventana, {child}, a ver si nevaba. ¿Tú crees que nevará esta Navidad?" },
        { id: "capa", title: "Superelfo", how: "Átale una servilleta o un trocito de tela al cuello, como una capa.", joke: "Con capa, cualquier día se convierte en una película de superhéroes.", suggestion: "¡Ta-chán! Soy Superelf{o}, {child}. Mis superpoderes: hacer trastadas y comer galletas a la velocidad de la luz." },
        { id: "escondite", title: "El escondite más fácil del mundo", how: "No lo muevas y deja una nota: «Hoy no me he escondido. ¿Me has encontrado igual?».", joke: "La trampa perfecta: es tan obvio que nadie lo busca ahí.", suggestion: "¡Te he engañado, {child}! Hoy me he quedado en el mismo sitio y seguro que me has buscado por toda la casa. Ji, ji, ji." },
        { id: "nota", title: "Una nota y nada más", how: "Escribe en un papel «Vuelvo enseguida. Firmado: {elf}» y déjalo donde estaba.", joke: "Para la mañana de pánico: el elfo también tiene recados.", suggestion: "Esta mañana he tenido que ir corriendo al Polo Norte a por más purpurina, {child}. ¡Vuelvo esta noche con una trastada gorda!" },
        { id: "selfie", title: "Foto con su peque", how: "Hazle una foto al elfo junto a su foto (o un dibujo suyo) y mándasela por el chat.", joke: "Con Línea Mágica ni lo tocas: el elfo escribe y manda la foto mientras tú desayunas.", suggestion: "Mira, {child}: anoche me hice una foto contigo. ¿A que salimos guapísimos? Me la quedo de recuerdo." },
      ],
      days: [
        { day: 1, title: "Ha aterrizado un elfo (y trae pasaporte)", idea: "Siéntalo junto a una maleta pequeña y su pasaporte del Polo Norte.", steps: ["Haz una maleta con una cajita y un trozo de cinta.", "Dibuja un pasaporte en un papel: foto del elfo, nombre y «Destino: casa de [nombre]».", "Déjalo todo donde tu peque desayuna."], need: "Una cajita, papel y un boli", minutes: 5, mess: 1, why: "Primera impresión: un elfo con los papeles en regla es mucho más creíble que uno indocumentado.", suggestion: "¡Hola, {child}! Anoche aterricé desde el Polo Norte y he pasado la aduana con mi pasaporte. Me llamo {elf}, me encantan las travesuras y cada mañana estaré en un sitio distinto. ¿Me buscas?" },
        { day: 2, title: "Tirolina por el salón", idea: "Colgado de una cuerda tendida entre dos sillas, como si cruzara el salón volando.", steps: ["Ata un cordel o lana entre dos sillas (o del pomo de una puerta a una silla), bien tenso y a poca altura.", "Cuelga al elfo con una pinza de la ropa o una percha pequeña.", "Ponle los brazos hacia arriba: parece que va a toda velocidad."], need: "Un cordel o lana y una pinza", minutes: 5, mess: 1, why: "El clásico absoluto de internet: parece que ha volado por tu casa y solo has gastado un trozo de cuerda.", suggestion: "¡Wiiiii! ¡He cruzado el salón en tirolina, {child}! Iba tan rápid{o} que casi me como la lámpara. ¿Mañana me cronometras?" },
        { day: 3, title: "Spa de nubes", idea: "Dentro de un bol lleno de nubes de golosina, con una toalla de papel en la cabeza.", steps: ["Llena un bol o una taza de nubes (o de bolitas de algodón).", "Mete al elfo hasta la cintura.", "Ponle una servilleta enrollada en la cabeza, como una toalla de spa."], need: "Un bol y nubes de golosina", minutes: 3, mess: 1, why: "Ningún elfo ha tenido nunca un día tan duro como para no merecerse un jacuzzi de nubes.", suggestion: "Ahhh… Anoche me di un baño de nubes, {child}. Es el spa más blandito del mundo. Puede que me haya comido dos. O siete." },
        { day: 4, title: "Se ha ido a pescar… al váter", idea: "Sentado en la taza del váter con una caña de pescar y galletitas de pececitos en el agua.", steps: ["Haz una caña con un palillo largo o un lápiz y un trozo de hilo.", "Echa unas galletitas saladas con forma de pez en el agua (o pececitos de papel).", "Sienta al elfo en el borde con la caña. Si te da cosa el váter, el fregadero vale."], need: "Un lápiz, hilo y galletitas de pececitos", minutes: 5, mess: 1, why: "La mezcla perfecta de asco y risa. En internet hay miles de fotos y todas tienen la misma cara de niño al descubrirlo.", suggestion: "¡He pescado siete peces en tu lago, {child}! Aunque el lago tenía una forma rarísima y un botón para tirar de la cadena… ¿Cómo se llama este sitio?" },
        { day: 5, title: "Misión imposible en el pasillo", idea: "Atrapado en medio de un laberinto láser de lana roja que cruza el pasillo.", steps: ["Tensa lana roja (o serpentinas) en zigzag de un lado a otro del pasillo, con cinta de carrocero.", "Deja al elfo «atrapado» en el centro.", "Por la mañana, tu peque tiene que cruzar el pasillo sin tocar los láseres."], need: "Lana roja o serpentinas y cinta de carrocero", minutes: 10, mess: 2, why: "Tu peque cruzará el pasillo como un espía. Veinte minutos de juego y el vídeo más compartido del grupo de la familia.", suggestion: "¡Socorro, {child}! Quería robar una galleta y he activado los láseres de seguridad. ¿Eres capaz de cruzar sin tocar ninguno y rescatarme?" },
        { day: 6, title: "Guerra de bolas de nieve con los peluches", idea: "Una batalla de bolas de nieve de papel entre el elfo y los peluches, con trincheras de cojines.", steps: ["Haz bolas con papel blanco arrugado (o calcetines blancos hechos una bola).", "Monta dos trincheras con cojines y reparte los peluches en dos equipos.", "Pon al elfo encima de una trinchera, con una bola en la mano."], need: "Papel blanco y cojines", minutes: 10, mess: 2, why: "Es de las favoritas en las listas de ideas: el lío es enorme, pero solo es papel.", suggestion: "¡Anoche hubo guerra de bolas de nieve, {child}! Tus peluches lanzan fatal, pero el osito tiene una puntería que da miedo. ¿Con qué equipo vas tú?" },
        { day: 7, title: "Bigotes para toda la familia", idea: "Ha dibujado bigotes y gafas en el cristal de las fotos de la familia.", steps: ["Usa un rotulador de pizarra blanca, que se borra con un pañuelo.", "Dibuja bigotes, gafas o cejas en el cristal de los marcos, nunca en la foto.", "Deja al elfo al lado, con el rotulador en la mano."], need: "Un rotulador de pizarra blanca", minutes: 5, mess: 1, why: "Arte contemporáneo. Y el abuelo con bigote rizado nunca había salido tan bien.", suggestion: "He mejorado un poco vuestras fotos, {child}. Todo el mundo está más guapo con bigote, ¿no? Bueno, la tía, igual no. Se borra, ¡lo prometo!" },
        { day: 8, title: "La nevera tiene ojos", idea: "Ojos saltones pegados en los huevos, los yogures y la fruta de la nevera.", steps: ["Pega ojos saltones (o pegatinas con ojos dibujados) en huevos, yogures, tomates…", "Mete al elfo dentro, saludando entre la comida.", "Si hay menores de tres años en casa, mejor ojos dibujados en pegatinas grandes."], need: "Ojos saltones o pegatinas", minutes: 5, mess: 1, why: "Abrir la nevera y que te miren catorce yogures. Desayuno con público.", suggestion: "Me sentía sol{o} en la nevera, {child}, así que les he puesto ojos a todos. Los yogures son muy majos. El brócoli es un poco serio." },
        { day: 9, title: "Ángel de nieve en la encimera", idea: "Tumbado en una capa de harina o azúcar sobre la encimera, dibujando un ángel de nieve.", steps: ["Esparce una capa fina de harina o azúcar en una bandeja.", "Tumba al elfo y mueve sus brazos y piernas para dejar la silueta.", "Déjalo al lado, «sacudiéndose» la harina."], need: "Harina o azúcar y una bandeja", minutes: 3, mess: 2, why: "Echaba de menos la nieve del Polo Norte. Lo entendemos todos.", suggestion: "Echaba de menos la nieve, {child}, así que he hecho un ángel con la harina. Me he quedado blanc{o} hasta las orejas. ¡Achís!" },
        { day: 10, title: "El árbol amanece nevado… de papel higiénico", idea: "Ha decorado el árbol de Navidad con papel higiénico, como si fuera nieve.", steps: ["Enrolla papel higiénico alrededor del árbol, sin apretar.", "Deja el rollo casi gastado a los pies del árbol.", "El elfo, colgado de una rama con un trozo de papel en la mano."], need: "Un rollo de papel higiénico", minutes: 5, mess: 2, why: "El rey de las travesuras: muchísimo efecto y se recoge en dos minutos.", suggestion: "¡Vuestro árbol tenía frío, {child}! Le he puesto una bufanda de papel. Ahora parece que ha nevado en el salón. ¿A que está más bonito?" },
        { day: 11, title: "Secuestro de peluche (con rescate)", idea: "Ha «secuestrado» al peluche favorito y deja una nota de rescate muy rara.", steps: ["Pon al peluche favorito en una caja o detrás de una «cárcel» de cinta.", "Escribe una nota de rescate con letras de colores: «Devolveré a [peluche] a cambio de 3 abrazos y un dibujo».", "El elfo, sentado encima de la caja con cara de malo."], need: "Una caja, cinta y papel", minutes: 5, mess: 1, why: "Es el secuestro más tierno de la historia: el rescate se paga en abrazos.", suggestion: "Tengo a tu peluche, {child}. Está bien: le he dado galletas y le he contado chistes. Te lo devuelvo a cambio de tres abrazos y un dibujo. ¿Trato hecho?" },
        { day: 12, title: "La puerta del cuarto, envuelta para regalo", idea: "La puerta de su habitación tapada con papel de regalo: para salir, tiene que romperlo.", steps: ["Cuando duerma, pega papel de regalo (o papel continuo) por fuera del marco de su puerta, con cinta de carrocero.", "Pon un cartel: «¡Rompe para salir!».", "El elfo, sentado en el pasillo esperando."], need: "Papel de regalo y cinta de carrocero", minutes: 10, mess: 2, why: "La única mañana del año en que tu peque saldrá de la cama a la primera. Grábalo.", suggestion: "¡Buenos días, {child}! Te he envuelto como un regalo. Para salir tienes que atravesar el papel como un superhéroe. ¡Te espero al otro lado!" },
        { day: 13, title: "Leche verde de elfo", idea: "Unas gotas de colorante alimentario verde en la leche del desayuno.", steps: ["Echa dos o tres gotas de colorante alimentario verde en el brik de leche y agítalo.", "Deja al elfo junto al brik, con una gota verde dibujada en la mano.", "Nada más: el efecto lo hace la cara de tu peque al servirse."], need: "Colorante alimentario verde", minutes: 2, mess: 1, why: "Mismo desayuno, cero esfuerzo, efecto máximo. La favorita de quien no tiene tiempo.", suggestion: "En el Polo Norte la leche es verde, {child}, y he querido que la probaras. Da fuerza para hacer travesuras. ¡Cuidado con el bigote verde!" },
        { day: 14, title: "Ataque de pósits", idea: "La ventana o la puerta de su cuarto llena de pósits formando un dibujo o un mensaje.", steps: ["Pega pósits en la ventana formando un árbol, una cara sonriente o la palabra HOLA.", "Escribe un par de mensajes cortos en algunos.", "Deja al elfo pegado a uno, como si fuera el último que le faltaba."], need: "Un taco de pósits", minutes: 10, mess: 1, why: "Queda espectacular en foto y sin un solo destrozo. Arte urbano, versión elfo.", suggestion: "He decorado tu ventana, {child}. Ha sido un trabajo durísimo: casi me quedo pegad{o} en un pósit para siempre. ¿Qué dice el dibujo?" },
        { day: 15, title: "Gran Premio del Pasillo", idea: "Una pista de carreras hecha con cinta en el suelo y los coches en la salida.", steps: ["Haz una carretera con cinta de carrocero en el suelo: curvas, una salida y una meta.", "Pon los coches de juguete en la parrilla de salida.", "El elfo, de piloto en el coche de delante, con un tapón como casco."], need: "Cinta de carrocero y coches de juguete", minutes: 10, mess: 1, why: "Ideal para un fin de semana: la pista dura días y el juego va solo.", suggestion: "¡Bienvenid{o} al Gran Premio del Pasillo, {child}! Yo ya he hecho la vuelta rápida. ¿Te atreves a ganarme? ¡Brrrrum!" },
        { day: 16, title: "El elfo se pone en forma (con donuts)", idea: "Haciendo pesas con dos rosquillas o donuts pequeños ensartados en un palito.", steps: ["Pon una rosquilla en cada punta de un palito o una pajita.", "Coloca al elfo levantándola, con una cinta en la frente.", "Añade una «botella de agua» (un tapón) y una toalla de servilleta."], need: "Dos rosquillas y un palito", minutes: 3, mess: 1, why: "Dieta navideña equilibrada: una pesa en cada mano.", suggestion: "¡Un, dos, un, dos! Estoy entrenando para el reparto de regalos, {child}. Las pesas de rosquilla son las mejores: cuando te cansas, te las comes." },
        { day: 17, title: "Un recado en el espejo", idea: "Un mensaje escrito en el espejo del baño, con el elfo al lado.", steps: ["Escribe en el espejo con un rotulador de pizarra o con una pastilla de jabón: «¡Hola, [nombre]!» o «Lávate los dientes».", "Añade un dibujo sencillo: un gorro, una estrella.", "El elfo, sentado en el lavabo con el «boli» en la mano."], need: "Un rotulador de pizarra o jabón", minutes: 3, mess: 1, why: "Mensajes directos y en el sitio donde nadie puede ignorarlos.", suggestion: "Te he dejado un recado en el espejo, {child}. Es mi primera vez escribiendo al revés y me ha costado muchísimo. ¿Lo entiendes?" },
        { day: 18, title: "Aterrizaje en paracaídas", idea: "Bajando de la barra de la cortina en un paracaídas hecho con una servilleta.", steps: ["Ata cuatro hilos a las esquinas de una servilleta y únelos al elfo.", "Cuélgalo de la barra de la cortina o de una estantería alta, con el paracaídas abierto.", "Nada de lámparas: mejor un sitio que no se caliente."], need: "Una servilleta e hilo", minutes: 5, mess: 1, why: "Parece que ha saltado desde el techo, y en la foto queda de película de acción.", suggestion: "¡Geronimooo! He saltado en paracaídas desde lo más alto de tu casa, {child}. Aterrizar todavía no lo controlo. ¿Me ayudas a bajar?" },
        { day: 19, title: "Ha puesto la casa boca abajo", idea: "Cuadros torcidos, cojines del revés y el elfo colgado cabeza abajo.", steps: ["Gira las fotos y los cuadros que se puedan mover, y pon los cojines del revés.", "Da la vuelta a algún objeto ligero: la cesta del pan, un peluche.", "Cuelga al elfo boca abajo de una percha o del pomo de un armario."], need: "Nada: solo lo que tienes en casa", minutes: 10, mess: 2, why: "Tu peque tardará un buen rato en encontrar todos los cambios. Es un juego de las siete diferencias a tamaño casa.", suggestion: "Hoy me he despertado boca abajo y he pensado: ¿y si toda la casa también? ¡Ahora todo está del revés, {child}! ¿Cuántas cosas encuentras?" },
        { day: 20, title: "Concierto de rock con los peluches", idea: "El elfo de estrella del rock, con los peluches de público.", steps: ["Coloca al elfo encima de una caja (el escenario) con una guitarra: un tenedor, un peine o una cuchara.", "Reparte los peluches delante, mirándolo.", "Añade una «entrada» de papel para tu peque: «Concierto de {elf}. Fila 1»."], need: "Una caja, un tenedor y peluches", minutes: 5, mess: 1, why: "Lleva el sello de estrella del rock: tu peque querrá su autógrafo antes del desayuno.", suggestion: "¡Gracias, gracias! Anoche di mi primer concierto, {child}, y tus peluches gritaban como locos. Te he dejado una entrada para el próximo. ¡Primera fila!" },
        { day: 21, title: "Rastro de huellas de nieve", idea: "Huellas pequeñas de harina desde la ventana hasta el árbol, como si hubiera entrado de noche.", steps: ["Moja la yema de un dedo en harina y marca huellas: dos toques juntos por cada paso.", "Haz el camino desde la ventana (o la puerta de casa) hasta donde dejes al elfo.", "Termina con una mancha más grande donde «resbaló»."], need: "Harina", minutes: 5, mess: 2, why: "Detectives en pijama: tu peque seguirá el rastro hasta encontrarlo.", suggestion: "Anoche fuera estaba nevando y he entrado con los pies llenos de nieve, {child}. He dejado huellas por todas partes. ¡Síguelas y descubre dónde me he escondido!" },
        { day: 22, title: "Sesión de cine con los peluches", idea: "Viendo una «película» con palomitas y los peluches en fila, como en el cine.", steps: ["Coloca los peluches en fila delante de la tele (apagada) o de un dibujo que haga de pantalla.", "Pon un cuenco pequeño de palomitas y al elfo en primera fila.", "Si quieres, una entrada de cine dibujada para tu peque."], need: "Palomitas y peluches", minutes: 5, mess: 1, why: "Plan de viernes noche de toda la vida, versión elfo. Y deja el plan del día montado.", suggestion: "Anoche hicimos noche de cine, {child}. Tu oso lloró en la parte triste y el conejo se comió todas las palomitas. ¿Hacemos otra esta noche, contigo?" },
        { day: 23, title: "Se ha envuelto a sí mismo", idea: "Envuelto en papel de regalo con un lazo y una nota: «No abrir hasta… ahora».", steps: ["Envuelve al elfo en papel de regalo dejando la cabeza fuera.", "Ponle un lazo y una etiqueta: «Para [nombre], de {elf}».", "Déjalo bajo el árbol, entre los regalos."], need: "Papel de regalo y un lazo", minutes: 5, mess: 1, why: "Llevaba tantos días ayudando a envolver regalos que al final se ha envuelto a sí mismo. Le pasa a cualquiera.", suggestion: "Estaba ayudando a envolver regalos, {child}, y… ¡creo que me he envuelto a mí mism{o}! ¿Me ayudas a salir? Pero no tires del lazo, que me hace cosquillas." },
        { day: 24, title: "Despedida con maleta", idea: "Sentado junto a su maleta con una nota de despedida y una pequeña sorpresa.", steps: ["Vuelve a sacar la maleta del primer día.", "Escribe una nota de despedida y deja una chocolatina, un dibujo o una foto de todas sus trastadas.", "Que quede claro: vuelve el año que viene."], need: "La maleta del primer día y papel", minutes: 5, mess: 1, why: "El final que hace llorar a los padres más que a los niños. Ten pañuelos.", suggestion: "¡Feliz Nochebuena, {child}! Esta noche vuelvo al Polo Norte a ayudar con los regalos. Me lo he pasado genial contigo. Te dejo una sorpresa. ¡Hasta el año que viene!" },
      ],
    },
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

export type ElfGender = 'm' | 'f';

/**
 * Adapta un personaje a su sala. Hoy solo el elfo cambia: cada familia le pone nombre y elige si es chico o chica.
 * Los textos usan marcas: {elf} nombre, {Elfo}, {o}, {el}, {un}, {del}.
 */
export function resolveCharacter(c: CharacterProfile, opts?: { alias?: string | null; gender?: string | null; locale?: Locale }): CharacterProfile {
  const locale = opts?.locale ?? 'es';
  if (c.group !== 'duende') return regionalizeDeep(c, locale);
  const alias = opts?.alias?.trim() || 'Chispa';
  const f = opts?.gender === 'f';
  const map = (t: string) =>
    t
      .replaceAll('{elf}', alias)
      .replaceAll('{Elfo}', f ? 'Elfa' : 'Elfo')
      .replaceAll('{o}', f ? 'a' : 'o')
      .replaceAll('{el}', f ? 'la' : 'el')
      .replaceAll('{un}', f ? 'una' : 'un')
      .replaceAll('{Un}', f ? 'Una' : 'Un')
      .replaceAll('{del}', f ? 'de la' : 'del');
  const deep = (v: unknown): unknown => {
    if (typeof v === 'string') return map(v);
    if (Array.isArray(v)) return v.map(deep);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, deep(x)]));
    return v;
  };
  return regionalizeDeep(deep(c) as CharacterProfile, locale);
}

export function isCharacterId(value: string): value is CharacterId {
  return (CHARACTER_IDS as readonly string[]).includes(value);
}

/** Personajes agrupados para el selector. */
export const CHARACTER_GROUPS: { id: 'noel' | 'reyes' | 'raton' | 'duende'; label: string; ids: CharacterId[] }[] = [
  { id: 'duende', label: 'El elfo travieso', ids: ['duende_chispa'] },
  { id: 'noel', label: 'Papá Noel', ids: ['papa_noel'] },
  { id: 'reyes', label: 'Los Reyes Magos', ids: ['melchor', 'gaspar', 'baltasar'] },
  { id: 'raton', label: 'Cuando se cae un diente', ids: ['raton_perez'] },
];

/** Rellena las plantillas con el nombre del niño. */
export function fillChild(template: string, child: string): string {
  return template.replaceAll('{child}', child);
}
