# Backlog

Ideas aparcadas. No están construidas ni verificadas.

## Monetización: DECIDIDO (12-nov)

- **Pasarela: Stripe** (Checkout, con Apple Pay y Google Pay). Claves en Railway, las pone Diego.
- **Gratis para todos: "Prueba mágica"**: 1 sala, texto y fotos sin límite durante 3 días. **Sin voz del personaje.** Al acabar, el aviso sale solo en el panel; el niño ve algo del personaje ("Papá Noel vuelve pronto"), nunca un muro de pago.
- **"Pase de Navidad"**: 3,99 € hasta el 1-dic, después 4,99 € (pago único). Hasta el 20-ene, todos los personajes, hermanos y salas ilimitadas (tope suave de ~10 salas por pase), sorpresas y **1 pase para regalar a otra familia** (motor viral). Se puede regalar (abuelos).
- **Sin cuentas**: tras pagar se genera un "enlace de pase" secreto (solo se guarda su hash), que llega en el recibo de Stripe. No guardamos correos.
- **Antiabuso (suave, nunca bloqueo duro por IP)**: marca en el navegador + huella cifrada (IP+UA con sal) con ~2 pruebas/mes por móvil. Aceptamos un 5–10 % de fuga.
- **Voz de los personajes: APAGADA en el lanzamiento** (decisión de Diego: si pronuncia mal, el niño lo nota). `NEXT_PUBLIC_ENABLE_VOICE` sin poner en Railway. Revisar más adelante solo con frases probadas a mano.
- Más adelante: Ratoncito Pérez ~2,99 €/año.
- Requisitos de Diego antes de cobrar: alta de autónomo o sociedad, condiciones de venta con IVA y casilla de renuncia al desistimiento (revisión de un abogado o una gestoría), cuenta de Stripe. Validar el precio con ~20 padres.

### App instalable, icono mágico y páginas compartibles (13-nov)
- **Icono nuevo** (`app/icon.svg` + PNG 192/512/maskable, apple-icon, favicon.ico): burbuja de chat con estrella dorada, cielo nocturno, destellos y rastro de polvo mágico. Iconos de cada personaje en `public/icons/characters/` (generados desde `RoyalAvatar`).
- **Instalable**: `public/sw.js` (solo página sin conexión; NO guarda salas ni enlaces), `public/offline.html`, `PwaRegister` (solo producción), `InstallApp` (botón en Android/PC y pasos en iPhone) en portada, familia y panel. **Manifiestos propios**: `/r/[token]/manifest.webmanifest` (la app se llama como el personaje y abre ese chat), `/paje/[token]/…` y `/familia/[token]/…`. Sin cachear, solo con el rol correcto.
- **Página pública /ideas-elfo** (24 noches, una URL por noche con su imagen de vista previa, compartir nativo/WhatsApp/copiar con utm_source, JSON-LD, mapa del sitio). `/?personaje=ID` deja elegido un personaje (enlaces de campaña).
- Verificado en producción (headless): el service worker se registra, controla la página y sin conexión sale el aviso, también en rutas secretas. **No verificado**: la comprobación de instalabilidad de Chrome (el Chrome sin interfaz de pruebas no procesa manifiestos). Probar en móvil real tras desplegar.
- Pendiente: analítica sin cookies que lea `utm_source`, foto real para la demo del elfo, vídeo de familia.

### Calendario, precios y portada de temporada (13-nov)
- **Precio:** 3,99 € todo el año (ya no sube a 4,99 € el 1-dic: ese día llegan los elfos, que es el pico de interés). **Black Friday: 2,99 € del 27 al 30 de noviembre**, automático (sin código), con aviso en la portada y la tarjeta del Pase. Sin "antes X €" tachado (riesgo legal por el precio previo; consultar gestoría). Configurable: `PASS_PRICE_CENTS`, `PASS_PRICE_BLACKFRIDAY_CENTS`, `BLACKFRIDAY=0`, `BLACKFRIDAY_FROM/UNTIL`.
- **Portada por fases** (`lib/brand.ts`): 1-nov→30-nov "Prepara la llegada del elfo" (con cuenta atrás hasta el 1-dic, `ELF_ARRIVAL_DATE`), 1-dic→14-dic elfo en casa, 15→25-dic Papá Noel, 26-dic→6-ene Reyes, resto Ratoncito. Cambia titular, demo y personaje preseleccionado. Pruebas con `npm run test:e2e -- --now=ISO` (reloj simulado `FAKE_NOW`, solo con almacén en memoria).
- Pendiente: página pública SEO "24 trastadas del elfo" (los datos ya existen en `lib/characters.ts`), analítica sin cookies, foto real de una trastada para la demo, banco de vídeos para redes.

### Cambio (15-nov): familias y enlace de familia
- Cadena de enlaces **familia → panel de cada sala → niño**: el enlace de familia (43 caracteres) reconstruye todos los paneles con HMAC y el `family_seed` de cada sala; la base de datos solo guarda huellas. Migración `20261115000000_families.sql` (`family_hash`, `family_seed`, `family_name`).
- Página `/familia/[token]`: lista las salas, abre cada panel, copia el enlace del niño, cambia el apodo, y recupera "Tus salas" en un móvil nuevo. El servidor no adopta enlaces de familia inventados (solo reutiliza uno si ya existe).
- Formulario: varios peques a la vez (hasta 5), desplegable "Tus peques", apodo opcional (dentro de la página, nunca en la dirección).
- El **pase cuelga de la familia**: al desbloquear una sala se desbloquean las demás y las nuevas nacen con él (tope: `rooms_limit` del pase, 10).
- Las salas anteriores a esta migración no tienen familia; siguen funcionando con su enlace de siempre.
- Sin hacer: enviar los enlaces por correo desde el servidor (falta dominio y Resend), código escrito a mano de recuperación, reenvío del enlace del pase.

### Cambio (14-nov): prueba para todos los hijos
- Cada familia puede preparar **una sala de prueba por peque, hasta 5 por móvil y mes** (`TRIALS_PER_DEVICE`, 5 por defecto), cada una con sus 3 días. Antes eran 2. El Pase sigue siendo lo que permite seguir después. Si más adelante se quiere una primera sala gratis para siempre (modelo B/C), está descrito en la conversación y no se ha hecho.

### Estado (13-nov): HECHO, falta activar
- Código listo y probado (E2E `--billing`, 27/27 con Stripe simulado): prueba de 3 días, bloqueo suave (el niño ve "se ha ido a preparar la magia", nunca precios), Pase con Stripe Checkout, webhook firmado e idempotente, pase guardado en el móvil, "Usar mi pase en esta sala", pase de regalo por WhatsApp, tope de 2 pruebas por móvil y mes.
- Pregunta "¿Ya lee?" al crear la sala (y editable en el panel): mayúsculas automáticas y consejos al escribir.
- Para activarlo: migración `20261113000000_reading_trial_passes.sql`, variables `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PASS_SECRET` en Railway, y el webhook en Stripe. Probar primero con claves `sk_test_`.
- Pendiente: limpiar pases caducados en el cron; el Ratoncito fuera de temporada usa el mismo "Pase de Navidad" (decidir nombre y precio propios); factura o recibo con datos fiscales (gestoría); revisar las condiciones de /terminos#pase con un abogado.

## Idiomas (13-nov): fases 1 y 2 hechas, falta la fase 3 (inglés)

- **Hecho:** `lib/i18n.ts` (detección por `Accept-Language`, cookie `lm-locale` con el selector 🇪🇸/🌎 de la portada, y diccionario `regionalize` español de España → Latinoamérica). La sala guarda su `locale` (migración `20261114000000_room_locale.sql`): padres y niño ven siempre el mismo idioma, aunque abran el enlace desde otro móvil. Stripe se abre en `es` o `es-419`.
- Palabras que cambian (ampliar en `WORDS` de `lib/i18n.ts`): móvil→celular, vosotros→ustedes, coche→auto, gafas→lentes, zapatillas→zapatos, "cogido"→"agarrado" (coger es vulgar en Latinoamérica), pasta de dientes→pasta dental.
- Pendiente de decidir: **la voz**. Si algún día se activa, las voces son de España (decisión de Diego: nunca latinas). Para el público latinoamericano habría que reconsiderarlo.
- Pendiente: precio y moneda para Latinoamérica (hoy siempre euros, 3,99 €/4,99 €); legal de cada país (México, Argentina, Colombia…) con un abogado; revisar con una persona latinoamericana el tono de los textos de los personajes; la imagen de vista previa (OG) y el manifiesto de la app siguen en español de España.
- **Fase 3, inglés:** otros personajes (Santa, Elf on the Shelf, Tooth Fairy; sin Reyes), catálogo de textos aparte, otra marca y dominio, COPPA/UK AADC con abogado. Solo si España funciona.

## Monetización: notas previas

- **Cobro solo en el panel de los padres** (`/paje/…`). El niño nunca ve avisos de pago:
  - Las rutas de pago aceptan solo el token de padres (con el del niño → 404).
  - La pasarela devuelve a los padres a su panel; el pago se asocia a la sala por su id interno, nunca por el token.
  - Se bloquea solo lo que decide el padre (voz del personaje, vídeo de reacción, personajes extra, duración del historial). El texto y las fotos del niño funcionan siempre, para no romper la ilusión.
  - Candado discreto en el panel, no carteles grandes (el niño podría ver el móvil).
- **Base técnica independiente de la pasarela**: columna `plan` en la sala (migración), control de funciones en el servidor, esqueleto de checkout y webhook idempotente.
- **Pasarela**: Stripe (más barato, IVA a cargo nuestro) frente a un intermediario como Lemon Squeezy o Paddle (más caro, ellos declaran el IVA). Valorar Bizum (Redsys) para España. Todo sin datos de conversión: hay que medirlo con una tanda pequeña de familias.
- **Momento del cobro**: justo después de que los padres vean la reacción del niño al primer mensaje.
- Modelo: "Pase de Navidad" por sala (hipótesis 3–5 €), recuerdo digital aparte, sala-regalo para abuelos y tíos, suscripción Ratoncito Pérez todo el año, campañas B2B. Sin publicidad en el chat del niño.
- Cuidado con: sociedad e IVA de la UE, desistimiento de 14 días en contenido digital, y el coste de voz, que crece con la viralidad.

## Limpieza del Supabase heredado (verificado el 4-nov, pendiente de decidir)

- Bucket público `evidence` con política `evidence_insert_public` (INSERT anónimo, 256 KB): quedó del "Juicio Navideño". Con la clave anon (pública) cualquiera puede subir archivos. La app actual no lo usa. Eliminar política y bucket.
- Tablas `trials` y `signatures` (1 fila cada una) también son del proyecto antiguo.
- `rooms.expires_at` tiene por defecto 45 días en la base de datos; la app lo fija ella misma (hasta pasadas las fiestas), pero conviene no depender de ello.

## Producto

- **Audio, por decidir**: notas de voz del niño como casilla por sala al crearla (hoy están activadas siempre), retención más corta para ellas (7 días) y voz del personaje como función de pago. Debe valer para niños que aún no leen.

- **Regla**: las voces de los personajes son siempre castellano de España, nunca latinas. Si ninguna candidata convence (Papá Noel y el Ratoncito siguen provisionales), diseñar una voz a medida en ElevenLabs.

- La ruta de los padres sigue llamándose `/paje/…` por dentro (nadie la ve más que los padres). Renombrarla a `/padres/…` exigiría migrar los enlaces ya compartidos.

- **Agenda mágica**: una sola entrada para el niño con varios contactos (Papá Noel, Reyes, Ratoncito Pérez) y un único panel para los padres. Hoy cada personaje es una sala aparte con su enlace. Solo merece la pena si los padres usan la app más allá de la Navidad.
- Voz del Ratoncito Pérez: la elegida (Lulu, acento latinoamericano) es provisional; probarla y, si hace falta, cambiarla con `ELEVENLABS_VOICE_RATON_PEREZ`.
- Más personajes por temporada (Conejo de Pascua, cumpleaños…).

- Notificaciones push a los padres (en iPhone solo con la PWA instalada).
- Personaje **Ratoncito Pérez**.
- Cuenta atrás "faltan N días" en la sala del niño.
- Varias réplicas: bus en tiempo real compartido (Supabase Realtime o Redis).
- Endpoint de salud (`/api/health`).

## Pendiente de verificar

- Los mensajes programados dependen del servidor: con Supabase real, comprobar que se entregan a su hora y que "cancelar" borra la fila.
- La política de borrado cambió (mínimo 45 días o pasadas las fiestas): revisar los textos legales con un profesional.

- Supabase real de extremo a extremo (esquema, triggers, permisos, advisors).
- Móviles reales (iPhone y Android) y WebKit.
- Voz definitiva de Papá Noel (`ELEVENLABS_VOICE_PAPA_NOEL`).
- Revisión legal de privacidad y términos.
- Prueba de carga real y plan de escalado para el 24–25 de diciembre.

## Ideas de magia (propuestas, sin decidir)

1. **Ficha mágica** (prioridad alta). Al crear la sala, los padres rellenan cinco datos: mascota, juguete favorito, mejor amigo, algo que aprendió este año y algo que le da miedo. Las plantillas los usan ("he visto que este año aprendiste a montar en bici"). Lo específico que solo sabe el niño hace que se lo crea más que algo genérico.
2. **Carta ritual.** El niño escribe o dicta su carta, la mete en un sobre con sello y la ve volar. Papá Noel contesta con otra carta que se despliega. Los padres reciben la lista de regalos ordenada, que les sirve para comprarlos.
3. **Libro de los niños buenos.** Pantalla en la que Papá Noel enseña la página del niño, con su nombre, lo bueno que ha hecho (lo escriben los padres) y un sello. Se abre como un libro. Muy compartible.
4. **Acciones para el niño, no solo chat.** En Nochebuena dejar una zanahoria a Rodolfo, y a la mañana siguiente aparece mordida. Con el Ratoncito, dejar el diente bajo la almohada y aparece la moneda. Gestos pequeños con animación que hacen la app más un juego.
5. **Trineo en directo.** El 24 de diciembre, cuenta atrás y mapa estilizado ("Papá Noel ya sobrevuela tu ciudad"). Sincronizado con los mensajes programados.
6. **Pruebas físicas.** Biblioteca de imágenes y sellos para que los padres envíen "huellas de reno en la nieve" o "la galleta mordida", y un sello de Polo Norte para sus propias fotos.

**No hacer todavía:** vídeo de Papá Noel con cara animada. Es caro y un fallo de sincronización lo vuelve inquietante.

**Advertencia:** los padres deben escribir como personaje, no como padres. Una guía corta en el panel: contestar con calma, sin emojis, con pequeños errores y con unos minutos de retraso.

**Orden sugerido:** ficha mágica y carta primero (más impacto por menos esfuerzo).

## Ubicación en tiempo real (idea, NO construir sin revisión legal y de seguridad)

**Idea:** que el niño (o los padres) vean dónde está Papá Noel o el Ratoncito "en directo".

**Riesgos graves:**
- Compartir la ubicación real de un menor, aunque sea "de juguete", crea un riesgo de seguridad: cualquiera con el enlace podría saber dónde está el niño.
- El enlace del niño es una credencial de acceso. Si se reenvía o se filtra, la ubicación queda expuesta.
- El tratamiento de datos de geolocalización de menores es categoría de especial cuidado en el RGPD. Exige base legal, evaluación de impacto y consentimiento informado.
- Con un personaje que "conoce" al niño, una ubicación en vivo puede aprovecharse para contactar o seguirle, y sería difícil de justificar ante una familia o ante la prensa.

**Alternativa segura (la que sí tiene sentido):**
- Trineo en directo con una ruta **ficticia** (ver idea 5 de "Ideas de magia"): un mapa estilizado que avanza por el tiempo y por los mensajes programados, sin usar la posición real de nadie.
- Si algún día se quiere algo con la ubicación real, solo para los padres, con precisión de ciudad (no de calle), sin persistencia, sin enlace del niño y tras revisión legal y de seguridad.

**Decisión pendiente:** no construir nada de esto antes de la revisión legal.

## Modo audio (activar)

- Hoy la voz del personaje está detrás de `NEXT_PUBLIC_ENABLE_VOICE=1` (se lee al compilar: hay que redeployar). Necesita `ELEVENLABS_API_KEY` en el servidor. Con la variable apagada, el panel no muestra el selector "Nota de voz / Por escrito".
- **Decidido: apagada en el lanzamiento.** Antes: ¿activarla para todas las salas, o elegirla por sala (con cobro)? Con topes actuales: 40 respuestas por sala y día, 150.000 caracteres al día en total.

## Antes de desplegar (orden obligatorio)

- **Aplicar la migración `supabase/migrations/20261109000000_message_edit.sql`** en Supabase ANTES de desplegar el código: el código lee la columna `edited_at`. Sin ella, la app falla al leer mensajes.
- Retirado el "Juicio Navideño" (`/juicio`). Pendiente de decidir en Supabase: borrar las tablas `trials` y `signatures` y el bucket público `evidence` (son destructivos; hay que confirmarlos).

## Elfo travieso (Chispa): pendiente

- La voz (Dani, castellano) es provisional; no la he escuchado.
- Nombre "Chispa" propuesto por mí: cambiable en `lib/characters.ts`.
- El calendario programa los mensajes por escrito; la voz de 24 mensajes gastaría demasiado.
- Marca: evitar el nombre y el aspecto de "Elf on the Shelf". No usar frases de vigilancia o amenaza ("te vigilo para Papá Noel").
- Ideas siguientes: avisar a los padres por la noche con la escena de mañana, y una página para compartir fotos de travesuras sin la cara del niño.

- **Migraciones a aplicar antes de desplegar, por orden:** `20261109000000_message_edit.sql` y `20261110000000_elf_alias.sql` (nombre y género del elfo). Ambas son aditivas.
- El calendario ya no programa 24 mensajes escritos por nosotros: la app propone la escena y los padres escriben y eligen las fotos, programándolas para cuando quieran.

## Bloqueo de padres con PIN

- **Migración a aplicar ANTES de desplegar:** `20261116000000_parent_pin.sql` (columnas `parent_pin` y `pin_recovery` en `rooms`; aditiva). El código las lee.
- El PIN (4–6 cifras) y el código de rescate se guardan solo como hash (scrypt). Nadie, tampoco nosotros, puede recuperarlos: si se pierden ambos, no hay vuelta atrás.
- Con PIN, el servidor no envía NINGÚN dato del panel ni de la familia sin la cookie de desbloqueo (`lm_u_*`, httpOnly, firmada, 30 min). Punto único de control: `findRoomByToken`.
- Límite de intentos en memoria (5 fallos → 15 min, se duplica hasta 6 h). Vale con una sola réplica; con varias habría que moverlo a la base de datos.
- Bloqueo automático al volver a la app tras más de 1 minuto fuera. Botón 🔒 en el panel.
- En el móvil con PIN la portada solo enseña "Zona de los padres" (marca local `magic-lock`; no oculta nombres de peques ni salas).
- Límite honesto: durante los 30 minutos posteriores a meter el PIN, el panel está abierto en ese móvil.
- Pendiente: mencionar el PIN y la cookie `lm_u_*` en la política de privacidad si se revisa el texto legal.

## Diseño para ordenadores

- Portada a dos columnas desde 1024 px (texto y botón a la izquierda, demo a la derecha), planes en dos columnas, formulario centrado. En móvil sigue igual.
- Panel de padres: ventana de 4xl centrada con tarjetas de preparativos en dos columnas. Familia: salas en dos columnas (centrada si hay una). Sala del peque: marco de móvil centrado.
- Prueba `desktop`: sin desbordes horizontales a 1440, 1024, 768 y 390 px en 7 pantallas.
- Pendiente: lista de personajes del formulario en rejilla en escritorio; probar en un ordenador real con pantalla muy ancha (>1920 px) y en Safari.

## Las 24 trastadas (versión viral)

- Reescritas con los clásicos que más se repiten en internet (tirolina, pesca en el váter, láseres de lana, bigotes en las fotos, nevera con ojos, puerta envuelta, leche verde…), adaptadas a seguras y baratas. No hay un ranking oficial de "las más virales": es una selección editorial.
- Cada una: título con gracia, paso a paso, material, minutos, nivel de lío, "por qué arrasa" y mensaje del elfo. El panel de padres usa la misma fuente.
- Compartir: menú nativo con la imagen (Instagram, TikTok, estados), WhatsApp, Pinterest (con imagen vertical), Facebook, X, Telegram, copiar enlace y guardar imagen. Todo con utm_source. Etiqueta #TrastadasDelElfo.
- Imagen vertical 1000x1500 por trastada: `/ideas-elfo/N/imagen` (`?descargar=1` para bajarla).
- Ideas siguientes: compartir la foto real de la trastada desde el panel (sin la cara del peque), un reto en redes con premio, y medir en analítica qué red trae más visitas.
- 15 trastadas exprés ("sin tiempo / se me olvidó"): página `/ideas-elfo/sin-tiempo` con chuleta vertical para Pinterest (`/ideas-elfo/sin-tiempo/imagen`) y pestaña "⚡ Sin tiempo" en el panel de padres que rellena el mensaje.
- Ilustraciones con IA por trastada (elfo propio "Chispa", rojo, sin copiar el muñeco de la marca): `public/elfo/trastadas/N.jpg` (1024x768). Se convierten con `node scripts/elf-art.mjs <png> <noche>`. Si existe, sale en la lista, en la página de la noche (con "Ilustración creada con IA"), en la imagen para Pinterest y en la vista previa de WhatsApp. Generadas en Fish Audio (gpt-image-2, plan gratis: 3 al día).
