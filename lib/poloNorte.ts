/**
 * Contenido del Rincón del Polo Norte (público, REGLA DE ORO en AGENTS.md): chistes, adivinanzas, renos y mapa.
 * Todo en el mundo mágico, sin formularios, sin datos del niño y sin una palabra sobre cómo funciona la magia.
 */
export interface Joke {
  q: string;
  a: string;
}
export interface Riddle {
  q: string;
  a: string;
}
export interface Reindeer {
  name: string;
  line: string;
}
export interface Place {
  name: string;
  text: string;
}

export const JOKES: Joke[] = [
  { q: '¿Qué le dice un muñeco de nieve a otro?', a: '«¿Tú también hueles a zanahoria?»' },
  { q: '¿Qué le dice un árbol de Navidad a otro?', a: '«¡Qué bien me sientan estas luces!»' },
  { q: '¿Cómo se despide un elfo?', a: '«¡Hasta la vista, cascabel!»' },
  { q: '¿Cuál es el postre favorito de los elfos?', a: 'Las galletas de jengibre. ¡Y las de chocolate! Y las de…' },
  { q: '¿Por qué los renos no necesitan despertador?', a: 'Porque ya llevan cascabeles que suenan a las siete.' },
  { q: '¿Qué hace un copo de nieve cuando se cansa?', a: 'Se sienta a descansar… ¡en el montón de nieve!' },
  { q: '¿Por qué Papá Noel tiene tan buena memoria?', a: 'Porque apunta todo en una lista. ¡Y la revisa dos veces!' },
  { q: '¿Qué le dijo una galleta a otra?', a: '«¡No me muerdas, que me da la risa!»' },
  { q: '¿Qué hace un elfo cuando tiene frío?', a: 'Se pone el gorro, la bufanda… ¡y otro gorro encima!' },
  { q: '¿Cuál es el animal más veloz del Polo Norte?', a: 'El reno que huele las galletas.' },
  { q: '¿Por qué el elfo llevaba una escalera?', a: 'Para llegar a lo más alto de la lista de los buenos.' },
  { q: '¿Qué canta un copo de nieve?', a: '«Nieve, nieve, nieve, que no llegue la primavera».' },
];

export const RIDDLES: Riddle[] = [
  { q: 'Gorro rojo, barba blanca y un saco lleno de regalos. ¿Quién soy?', a: 'Papá Noel.' },
  { q: 'Soy blanco y frío, con nariz de zanahoria y bufanda. ¿Qué soy?', a: 'Un muñeco de nieve.' },
  { q: 'Caigo del cielo, ligero y blanco; si me tocas, me derrito. ¿Qué soy?', a: 'Un copo de nieve.' },
  { q: 'Brillo en lo alto del árbol y tengo cinco puntas. ¿Qué soy?', a: 'La estrella.' },
  { q: 'Tiro del trineo por el cielo y tengo cuernos. ¿Quién soy?', a: 'Un reno.' },
  { q: 'Me cuelgan junto a la chimenea para guardar sorpresas. ¿Qué soy?', a: 'Un calcetín.' },
  { q: 'Venimos de Oriente siguiendo una estrella, con oro, incienso y mirra. ¿Quiénes somos?', a: 'Los Reyes Magos.' },
  { q: 'Soy pequeñito, me cuelo bajo tu almohada y me llevo los dientes. ¿Quién soy?', a: 'El Ratoncito Pérez.' },
];

export const REINDEER: Reindeer[] = [
  { name: 'Veloz', line: 'El más rápido de todos. Siempre llega el primero… y el primero a las galletas.' },
  { name: 'Bailarín', line: 'No puede ver nieve sin ponerse a bailar.' },
  { name: 'Saltarín', line: 'Salta los charcos de hielo de un brinco. Bueno, casi siempre.' },
  { name: 'Zorrita', line: 'La más lista del establo. Se sabe todos los caminos de memoria.' },
  { name: 'Cometa', line: 'Cuando corre, deja detrás una estela de luz.' },
  { name: 'Cupido', line: 'El más cariñoso. Reparte lametones a todo el mundo.' },
  { name: 'Trueno', line: 'Cuando aterriza se oye en todo el Polo Norte.' },
  { name: 'Relámpago', line: 'Va tan rápido que a veces se adelanta a su propia sombra.' },
];

export const PLACES: Place[] = [
  { name: 'El taller de los juguetes', text: 'Huele a madera y a pintura fresca. Los elfos trabajan aquí todo el año, ¡y siempre hay música!' },
  { name: 'Los establos de los renos', text: 'Paja calentita, zanahorias y ocho camas muy revueltas. Es el lugar más ruidoso de todo el Polo Norte.' },
  { name: 'La cocina de las galletas', text: 'Siempre hay una bandeja en el horno. Dicen que el jengibre sabe mejor si lo amasa un elfo cantando.' },
  { name: 'La oficina de las cartas', text: 'Aquí llegan cartas de todas partes del mundo. Hay una montaña de sobres con sellos de colores.' },
  { name: 'El faro de la aurora', text: 'Desde lo alto se ven luces verdes y rosas bailando en el cielo. Es el mejor sitio para pedir un deseo.' },
  { name: 'La gruta de Papá Noel', text: 'Un sillón enorme junto a la chimenea, un reloj que hace «tic-tac» y una lista muy, muy larga.' },
];
