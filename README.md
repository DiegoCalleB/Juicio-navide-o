# Mensajería Mágica de Navidad

Los padres crean una sala, eligen quién contesta (Papá Noel o un Rey Mago) y desde su móvil responden **como el personaje** al chat del niño, en tiempo real. Fase 1b: el niño escribe, manda fotos o **audios**; los padres contestan con texto y fotos. La voz sintetizada del personaje queda tras un interruptor.

## Pantallas
| Ruta | Quién | Qué |
|---|---|---|
| `/` | Padres | Elegir personaje y crear la sala |
| `/r/[token]` | Niño | Chat con el personaje |
| `/paje/[token]` | Padres | Panel secreto: ven lo que escribe el niño y contestan |
| `/privacidad` | Todos | Qué se guarda y cuánto tiempo |
| `/demo/mensajeria?p=papa_noel` | — | Demo sin servidor |
| `/juicio` | — | El juego anterior (aparcado) |

## Variables de entorno
Ver `.env.example`. Imprescindibles: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `FINGERPRINT_SALT`, `CRON_SECRET`. Opcionales: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ENABLE_VOICE=1` (+ `ELEVENLABS_API_KEY`, respuesta con voz del personaje), `NEXT_PUBLIC_ENABLE_CHILD_AUDIO=0` (apaga los audios del niño).

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

## Desarrollo y pruebas sin Supabase
`ROOMS_STORE=memory npm run dev` usa un almacén en memoria (solo fuera de producción). Los archivos se sirven desde `/api/dev-media/...`.
