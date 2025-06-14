export function formatAsPemKey(base64: string): string {
    const pem = `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC`;
    return pem.trim();
}
