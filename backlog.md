# Backlog

Ideas aparcadas. No están construidas ni verificadas.

## Monetización (pendiente de decidir pasarela y precios)

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
