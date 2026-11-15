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
  Se publica por la noche, cuando los peques duermen.
- **Antes de dar algo por terminado** (texto, imagen, vídeo, error, correo, vista previa): pregúntate
  «¿podría un niño de 6 años leerlo o verlo y sospechar algo?». Si la respuesta no es un «no» rotundo, se cambia.

### Cómo está hecho

- **Mundo mágico (público):** `/` (portada) y `/diario-de-chispa` (lo que Chispa cuenta que hizo, noche a noche,
  sin instrucciones). Metadatos, vista previa (OG), manifiesto, sitemap y robots: neutros.
- **Puerta de adultos:** `/mayores` pide una cuenta de cabeza con 20 s (comprobada en el servidor con un token
  firmado; 3 fallos = 15 min bloqueada). La sesión es una cookie firmada que caduca a los 30 min sin uso y al
  cerrar el navegador. Código: `lib/adultGate.ts`, `middleware.ts`, `app/api/mayores/*`, `app/mayores/page.tsx`.
- **Zona de mayores (detrás de la puerta):** `/crear`, `/precios`, `/ideas-elfo/*`, `/familia/*`, `/paje/*`,
  `/pase/*`, `/privacidad`, `/terminos`, `/demo/*`. Para añadir una ruta, ponla en `ADULT_PATHS` y en el
  `matcher` del middleware. Las instrucciones nunca se comparten en redes desde la web (sin botones de compartir).

### Cómo comprobarlo

- `npm run test:e2e -- magia`: navega como un niño y falla si cualquier página pública, metadato, manifiesto,
  sitemap, robots o la sala del niño contiene una frase de la lista `DELATAN`, o si alguna ruta de mayores se abre
  sin la puerta. Si aparece una frase nueva peligrosa, añádela a esa lista.
- Revisar los textos nuevos con la lista de frases prohibidas de arriba.
- Cualquier cambio en `lib/characters.ts`, mensajes del niño o páginas públicas requiere esta revisión.

## Otras reglas del proyecto

- Voces siempre en castellano de España. Nunca acento latinoamericano.
- Web/PWA solo. Sin nombres, datos ni fotos de niños fuera de lo necesario; nunca niños en pantalla en redes.
- No crear PRs sin que se pidan. Sin cambios destructivos en Supabase sin confirmación.
- Los secretos (Railway, Stripe, claves de API) los pone el usuario; nunca pedirlos ni verlos en el chat.
- Nada que parezca «hecho con IA» a la vista: sin avisos de IA ni ✨ decorativos en la interfaz.
