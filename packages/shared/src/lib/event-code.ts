/**
 * Generiert einen 8-stelligen Event-Code für einfachen Zugriff
 * Format: XXX-XXXXX (z.B. "A3K-9P2QM")
 */
export function generateEventCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne O, 0, I, 1 (verwechselbar)
  const length = 8;

  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  // Format: XXX-XXXXX
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Validiert ob ein Event-Code das richtige Format hat
 */
export function isValidEventCode(code: string): boolean {
  return /^[A-Z2-9]{3}-[A-Z2-9]{5}$/.test(code);
}
