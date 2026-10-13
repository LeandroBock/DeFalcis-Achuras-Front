// Lee el campo "exp" de un JWT sin validarlo (eso lo hace el backend).
// Si el token no es un JWT o no tiene exp, se considera vigente y
// el backend decidirá con un 401.
export function isTokenExpired(
  token: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!token) {
    return true;
  }

  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: unknown };

    if (typeof exp !== "number") {
      return false;
    }

    return exp * 1000 <= now;
  } catch {
    return false;
  }
}
