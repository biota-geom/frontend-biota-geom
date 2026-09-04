export interface DecodedTokenPayload {
  sub: string;
  typ: 'access' | 'refresh';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export function decodeJwtPayload(token: string): DecodedTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    return JSON.parse(atob(padded)) as DecodedTokenPayload;
  } catch {
    return null;
  }
}

/** `skewSeconds` treats a token as expired slightly before its real `exp`, so a request in flight doesn't race the clock. */
export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;

  const nowSeconds = Date.now() / 1000;
  return payload.exp - skewSeconds <= nowSeconds;
}
