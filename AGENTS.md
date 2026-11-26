# Línea Mágica · Reglas del proyecto

## REGLA DE ORO (prevalece sobre cualquier otra cosa)

**Nada en la web, en la app ni en el contenido de redes puede hacer dudar a un niño de que es real.**

Para un niño, Papá Noel, los Reyes Magos, el elfo Chispa y el Ratoncito Pérez existen y le escriben de verdad.
Cualquier cosa que un peque pueda ver, leer u oír, aunque llegue por casualidad, tiene que mantener esa
fantasía intacta. Si hay duda entre «más claro para los padres» y «más seguro para la fantasía», gana la fantasía.

### Qué implica

- **Lo que ve el niño** (`/r/<token>`, el chat, el sello, las notificaciones, los audios, el saludo):
  el personaje habla siempre en primera persona y como si fuera real. Nunca aparece «app», «IA», «voz sintetizada»,
  «tus padres contestan», «mensaje programado», «paje», ni ningún aviso técnico que rompa la magia.
  Los errores y estados sin conexión se explican con magia, no con lenguaje técnico.
- **Lo que ven los padres** (`/paje/<token>`, `/familia`, `/crear`, `/precios`): están protegidos por PIN y
  por no tener enlaces públicos; aun así, un niño puede llegar a ellos. Por eso toda página que explique que
  los padres contestan, cómo se montan las trastadas o que los personajes no son reales debe estar detrás de la
  **puerta de adultos** y no debe poder abrirse por casualidad desde el móvil de un peque.
- **Nunca** escribas en ninguna página pública, metadato, vista previa de enlace (OG), `alt`, título, texto
  de compartir, sitemap o mensaje de error frases como «no somos Papá Noel», «contestas en secreto»,
  «tú escribes como si fueras…», «los padres hacen la trastada», «el elfo no se mueve solo»…
- **Redes sociales** (vídeos, textos, bios, comentarios): se publica **la magia, no el truco**. Se enseña el
  resultado («mirad lo que ha hecho Chispa esta noche»), nunca cómo se prepara ni quién lo hace. Las instrucciones
  para los padres viven solo en la parte de la web detrás de la puerta de adultos. Sin niños en pantalla.
  Pueden publicarse a cualquier hora (decisión del dueño: ya no hay que esperar a que los peques duerman).
- **Antes de dar algo por terminado** (texto, imagen, vídeo, error, correo, vista previa): pregúntate
  «¿podría un niño de 6 años leerlo o verlo y sospechar algo?». Si la respuesta no es un «no» rotundo, se cambia.

### Cómo está hecho

- **Mundo mágico (público):** `/` (portada) y `/diario-de-chispa` (lo que Chispa cuenta que hizo, noche a noche,
  sin instrucciones). Metadatos, vista previa (OG), manifiesto, sitemap y robots: neutros.
- **Chispa pregunta la edad (en la portada):** a quien llega sin haber contestado, la portada le enseña a Chispa con su
  cara: «¡Hola! Soy Chispa. ¿Cuántos años tienes?» (un peque no le miente al elfo). Menos de 18: Chispa le ofrece un
  chiste, y los enlaces para los mayores no aparecen nunca en ese dispositivo (30 días); la API de la cuenta responde 403
  y no puede volver a contestar con otra edad. 18 o más: no se le lleva a ningún sitio; la portada se vuelve a pintar con
  los dos enlaces discretos («Mi cuenta» y «Condiciones de uso») y «Mi cuenta» entra directo a la cuenta.
  Quien entra directo a `/mayores` sin contestar ve la misma pregunta de Chispa ahí. Solo se guarda una cookie firmada
  («mayor»/«menor»), nunca la edad. Código: `app/api/mayores/edad`, `lib/ageServer.ts`, `ChispaEdadTarjeta.tsx` (portada),
  `components/features/gate/EdadChispa.tsx` (`/mayores`). Nunca «mayores» ni «padres» en esos textos.
- **Puerta de adultos:** `/mayores` no pide nada más que la pregunta de Chispa: quien ya ha contestado una edad de 18 o más entra
  directo (sin cuentas de cabeza ni esperas; decisión del dueño: «solo preguntar la edad»). La sesión es una cookie firmada que caduca
  a los 30 min sin uso y al cerrar el navegador; quien dijo ser menor no entra en ese dispositivo. Código: `lib/adultGate.ts`,
  `middleware.ts`, `app/api/mayores/{edad,entrar,salir}`, `app/mayores/page.tsx`.
- **Disuadir a los peques:** lo más vistoso de la portada es mágico (el diario de Chispa, el chat de ejemplo, los
  rincones del Polo Norte) y el acceso de los mayores son dos enlaces normales pero aburridos («Mi cuenta» arriba a la
  derecha y «Condiciones de uso» abajo, 13-15 px, nunca dorados ni grandes) que solo se pintan si Chispa ya ha
  preguntado la edad y la respuesta es de mayor. Antes de la puerta nunca aparecen
  «mayores», «adultos», «mamás y papás», «zona secreta» ni nada que despierte curiosidad (tampoco en el manifiesto,
  los atajos de la app o el título de la pestaña): la puerta se llama «Acceso a la cuenta». La prueba `magia` lo vigila.
- **Zona de mayores (detrás de la puerta):** `/crear`, `/precios`, `/ideas-elfo/*`, `/familia/*`, `/paje/*`,
  `/pase/*`, `/privacidad`, `/terminos`, `/demo/*`. Para añadir una ruta, ponla en `ADULT_PATHS` y en el
  `matcher` del middleware. Las instrucciones nunca se comparten en redes desde la web (sin botones de compartir).

### Cómo comprobarlo

- `npm run test:e2e -- magia`: navega como un niño y falla si cualquier página pública, metadato, manifiesto,
  sitemap, robots o el portal del niño contiene una frase de la lista `DELATAN`, o si alguna ruta de mayores se abre
  sin la puerta. Si aparece una frase nueva peligrosa, añádela a esa lista.
- Revisar los textos nuevos con la lista de frases prohibidas de arriba.
- Cualquier cambio en `lib/characters.ts`, mensajes del niño o páginas públicas requiere esta revisión.

## Otras reglas del proyecto

- Voces siempre en castellano de España. Nunca acento latinoamericano.
- Web/PWA solo. Sin nombres, datos ni fotos de niños fuera de lo necesario; nunca niños en pantalla en redes.
- No crear PRs sin que se pidan. Sin cambios destructivos en Supabase sin confirmación.
- Los secretos (Railway, Stripe, claves de API) los pone el usuario; nunca pedirlos ni verlos en el chat.
- Nada que parezca «hecho con IA» a la vista: sin avisos de IA ni ✨ decorativos en la interfaz.
- Métricas (`lib/metrics.ts`, `/metricas`): solo contadores propios sin cookies ni terceros; nunca guardar IP, edad ni datos de niños. El panel va con `METRICS_TOKEN` y no se enlaza ni indexa.

## Marketing: el listón (decisión del dueño)

**Objetivo:** que la estrategia de marketing digital de Línea Mágica sea de nivel sobresaliente (matrícula de honor): rigurosa,
medible y bien documentada, y que sirva también como caso de estudio para el máster de marketing digital con IA del dueño.
Es una exigencia de calidad, no una promesa de resultados: nunca se inventan cifras ni se prometen ventas.

Toda propuesta de marketing (planes, calendarios, vídeos, anuncios, textos) debe traer, además de las piezas:

1. **Público y mensaje:** a quién habla (padres, 25-45, España), qué problema resuelve y una frase única de valor.
2. **Embudo con métricas reales:** de «han entrado» a «han comprado», con las cifras del panel `/metricas`, por red y por vídeo (`?src=`).
3. **Hipótesis y experimentos:** qué se prueba (gancho, nombre, regalo, hora, formato), cómo se mide y qué decisión se toma con el resultado.
4. **Calendario y recursos:** quién hace qué, cuánto tiempo y cuánto cuesta (créditos de generación, anuncios).
5. **Riesgos y límites:** plataformas (restricciones de anuncios, enlaces), legal (RGPD, menores) y la REGLA DE ORO.
6. **Registro de aprendizaje:** al cerrar cada semana, anotar qué funcionó, qué no y qué se repite, con datos.

Reglas que no se saltan por el marketing: la magia ante todo (sin explicar el truco en público), sin niños reales en pantalla,
sin datos personales ni de niños, y honestidad con los padres (lo que se promete en el anuncio existe en el producto).
