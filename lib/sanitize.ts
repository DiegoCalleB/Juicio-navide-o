/** Normaliza texto de usuario: sin control chars, sin <>`, espacios colapsados. */
export function sanitizeText(input: string): string {
  return input
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, ' ')
    .replace(/[<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
