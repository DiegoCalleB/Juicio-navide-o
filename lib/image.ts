const MAX_SIDE = 600;
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void };

const looksLikeImage = (file: File) => file.type.startsWith('image/') || (!file.type && /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name));

/**
 * Abre la foto de forma que funcione también con las de los móviles nuevos (48 MP, HEIC):
 * primero createImageBitmap (respetando la orientación) y, si falla, el <img> clásico.
 */
async function decodeImage(file: File): Promise<Decoded> {
  const fromBitmap = (b: ImageBitmap): Decoded => ({ source: b, width: b.width, height: b.height, close: () => b.close() });
  if (typeof createImageBitmap === 'function') {
    try {
      return fromBitmap(await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions));
    } catch {
      /* se prueba con <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    if (!img.naturalWidth) throw new Error('empty');
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(/hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type)
      ? 'Este navegador no abre fotos HEIC. Prueba con «Hacer una foto» o haz una captura de la foto y envíala.'
      : 'No se pudo abrir esta foto. Prueba con otra o haz una captura de pantalla de ella.');
  }
}

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
  if (!looksLikeImage(file)) throw new Error('El archivo no es una imagen.');
  if (file.size > 80 * 1024 * 1024) throw new Error('La imagen es demasiado grande.');

  const img = await decodeImage(file);
  try {
    // Si una reducción grande falla por memoria (iPhone), se reintenta más pequeña.
    for (const side of [CHAT_MAX_SIDE, 720]) {
      const scale = Math.min(1, side / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Tu navegador no soporta canvas.');
      ctx.drawImage(img.source, 0, 0, w, h);

      for (const quality of [0.82, 0.7, 0.55]) {
        let blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
        if (!blob || blob.type !== 'image/webp') {
          blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
        }
        if (blob && blob.size > 0 && blob.size <= CHAT_MAX_BYTES && (blob.type === 'image/webp' || blob.type === 'image/jpeg')) return blob;
      }
      canvas.width = canvas.height = 0; // libera memoria en Safari
    }
    throw new Error('No se pudo reducir la imagen.');
  } finally {
    img.close();
  }
}
