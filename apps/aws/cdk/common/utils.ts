export function formatAsPemKey(base64: string): string {
  return `
  -----BEGIN PUBLIC KEY-----
  ${base64}
  -----END PUBLIC KEY-----
  `.trim();
}
