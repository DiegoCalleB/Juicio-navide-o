# Línea Mágica

Los padres crean una sala, eligen quién contesta (Papá Noel o un Rey Mago) y desde su móvil responden **como el personaje** al chat del niño, en tiempo real. El niño escribe, manda fotos o **audios**; los padres contestan con texto, fotos o **la voz del personaje**, y pueden **grabar su reacción** con el propio móvil.

## Pantallas
Regla de oro (ver `AGENTS.md`): nada de lo que pueda ver un peque delata la magia. La web se divide en un
**mundo mágico público** y una **zona de mayores** tras una puerta (cuenta de cabeza en 4 s, comprobada en el
servidor; 3 fallos bloquean el dispositivo y 9 la conexión, con bloqueos de 15 min, 1 h y 24 h; la sesión caduca a los 30 min sin uso o al cerrar el navegador).

| Ruta | Quién | Qué |
|---|---|---|
| `/` | Todos | Portada mágica (sin precios ni instrucciones); «Para mamás y papás» lleva a la puerta |
| `/diario-de-chispa` | Todos | Lo que el elfo Chispa cuenta que hizo cada noche |
| `/r/[token]` | Niño | Chat con el personaje |
| `/mayores` | Puerta | La pregunta y, ya dentro, el menú de la zona de mayores (salas guardadas, ideas, precios, legal) |
| `/crear`, `/precios`, `/ideas-elfo/*` | Mayores | Crear la sala, precios e ideas de trastadas |
| `/paje/[token]`, `/familia/[token]`, `/pase/*` | Mayores | Panel para contestar, familia y Pase |
| `/privacidad`, `/terminos`, `/demo/*` | Mayores | Textos legales y demo |

Para proteger una ruta nueva: añádela a `ADULT_PATHS` (`lib/adultGate.ts`) y al `matcher` de `middleware.ts`.

## Variables de entorno
Ver `.env.example`. Imprescindibles: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `FINGERPRINT_SALT`, `CRON_SECRET`. Opcionales: `NEXT_PUBLIC_SITE_URL`, `ADULT_GATE_SECRET` (firma la puerta de mayores; si falta usa `FINGERPRINT_SALT`), `ELEVENLABS_API_KEY` (voz del personaje; `NEXT_PUBLIC_ENABLE_VOICE=0` la apaga), `NEXT_PUBLIC_ENABLE_CHILD_AUDIO=0` (apaga los audios del niño).

## Ayudante de mensajes (Gemini)
Con `GEMINI_API_KEY`, el panel muestra «✨ Ayúdame a escribirlo»: los padres escriben la idea y Gemini (`GEMINI_MODEL`, por defecto `gemini-3.8-flash`, pensamiento bajo, ~2–4 s) propone 3 mensajes con la voz del personaje, en castellano de España. **No se envía el nombre del niño**: el modelo escribe «[nombre]» y el panel lo sustituye. Topes: 12 peticiones cada 10 min por sala y `GEMINI_DAILY_LIMIT` al día en total. Pruebas: `GEMINI_FAKE=1` (solo almacén en memoria).

## Voz del personaje (fase 2)
Activa por defecto (modelo `eleven_v3`); necesita `ELEVENLABS_API_KEY` con permiso de Text to Speech. `NEXT_PUBLIC_ENABLE_VOICE=0` la apaga (redeploy). Los padres eligen en cada mensaje «Con voz» o «Solo texto» y pueden **escuchar antes de enviar** (el niño recibe exactamente ese audio, sin gastar dos veces). Prueba gratis: 3 mensajes con voz; con el Pase, sin ese límite. Al abrir el sello por primera vez, el personaje **saluda al niño por su nombre**: el «¡Hola, Lucía!» se genera una vez por sala (`<sala>/saludo.mp3`, se borra con ella) y el resto está pregrabado en `public/voces/saludo/` (`node scripts/saludos.mjs` los regenera). Las voces se cambian por variable (`ELEVENLABS_VOICE_PAPA_NOEL`…) sin tocar código. Topes de coste: `VOICE_ROOM_DAILY_LIMIT` (por sala) y `VOICE_DAILY_CHAR_LIMIT` (global, por día). Si se supera un tope o ElevenLabs falla, el mensaje se entrega **por escrito** y el panel lo avisa: nunca se pierde. La sorpresa siempre va por escrito.

## Grabar la reacción (fase 2)
En el panel, “Graba su reacción”: “Con otro móvil” (recomendado) o “Con este móvil” (cámara trasera, MP4 si el navegador puede, máx. 60 s, vista previa minimizable mientras se sigue contestando). El vídeo vive solo en el móvil de los padres: se guarda o comparte desde ahí y **nunca se sube**.

## Instalable (PWA)
`manifest`, iconos y metadatos para iOS/Android: se puede añadir a la pantalla de inicio. Las rutas `/r/*` y `/paje/*` llevan `Referrer-Policy: no-referrer`, `no-store` y `noindex`.

## Modo sorpresa (grabar la reacción)
La app no graba vídeo ni usa la cámara del niño. En el panel de los padres, “Graba su reacción”: quien graba usa **otro móvil**, se pulsa “Empezar la sorpresa” y tras 5 s el mensaje llega al niño con una pantalla especial a pantalla completa (`effect = 'surprise'`).

## Base de datos
Aplicar en orden `supabase/migrations/*.sql`. Todas las tablas y buckets están sin acceso público; solo el servidor (clave secreta) accede tras validar el token de la URL.

## Tiempo real
SSE en `/api/rooms/[token]/events` (avisos `refresh` y `typing`), con sondeo de respaldo. El bus (`services/realtime.ts`) vive en memoria: válido con **una réplica**. Con varias, cambiar su implementación por Supabase Realtime Broadcast o Redis sin tocar el resto.

## Borrado automático
Programar una llamada diaria (cron de Railway o similar):
```
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://TU-DOMINIO/api/cron/cleanup
```

## Añadir un personaje
1. Una entrada en `lib/characters.ts` (nombre, colores, textos, días de vida).
2. Su voz en `lib/voice.ts`.
3. Su avatar en `components/features/royal-chat/RoyalAvatar.tsx` si no reutiliza uno.

## Pruebas E2E
Pruebas de navegador reales (dos navegadores: padres y niño) en `e2e/specs/`: portada, audios, modo sorpresa, grabación de vídeo, pulido/SEO/cabeceras, fase 1 (tiempo real, fotos, permisos, entrega diferida) y voz.
```
npx playwright install chromium   # una vez
npm run test:e2e                  # todas (menos voz real)
npm run test:e2e -- landing       # solo una
npm run test:e2e -- --voice       # incluye voz real (gasta créditos de ElevenLabs)
```
Usan el almacén en memoria: no necesitan Supabase. La prueba de fase 1 incluye una entrega diferida de 2 min.

## Desarrollo y pruebas sin Supabase
`ROOMS_STORE=memory npm run dev` usa un almacén en memoria (solo fuera de producción). Los archivos se sirven desde `/api/dev-media/...`.
