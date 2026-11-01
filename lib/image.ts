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
