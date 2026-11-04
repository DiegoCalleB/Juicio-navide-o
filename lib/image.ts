const MAX_SIDE = 600;
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/** Redimensiona (lado máx. 600px) y recodifica a WebP en el navegador. */
export async function compressToWebp(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('La imagen supera 10 MB.');

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Tu navegador no soporta canvas.');
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.8));
    if (!blob || blob.type !== 'image/webp') throw new Error('No se pudo comprimir la imagen.');
    return blob;
  } finally {
    bitmap.close();
  }
}

const CHAT_MAX_SIDE = 960;
const CHAT_MAX_BYTES = 1_400_000;

/**
 * Para el chat: lado máx. 960px, WebP si el navegador lo codifica y JPEG si no
 * (Safari). Reduce la calidad hasta quedar por debajo del tope del servidor.
 */
export async function compressForChat(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.');
  if (file.size > 25 * 1024 * 1024) throw new Error('La imagen es demasiado grande.');

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, CHAT_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Tu navegador no soporta canvas.');
    ctx.drawImage(bitmap, 0, 0, w, h);

    for (const quality of [0.82, 0.7, 0.55]) {
      let blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
      if (!blob || blob.type !== 'image/webp') {
        blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
      }
      if (blob && blob.size <= CHAT_MAX_BYTES) return blob;
    }
    throw new Error('No se pudo reducir la imagen.');
  } finally {
    bitmap.close();
  }
}
