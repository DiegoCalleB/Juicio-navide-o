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
