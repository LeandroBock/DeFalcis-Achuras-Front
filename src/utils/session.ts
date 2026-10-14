// Tiempos de la sesión. La duración máxima (8 h) la fija el backend en el
// token; el cierre por inactividad lo controla la app.

export const IDLE_LIMIT_MS = 60 * 60 * 1000; // 60 minutos sin usar la app
export const IDLE_WARNING_MS = 60 * 1000; // aviso 1 minuto antes
export const EXPIRY_WARNING_MS = 5 * 60 * 1000; // aviso 5 minutos antes

export const LAST_ACTIVITY_KEY = "last_activity";

// Última vez que la persona usó la app (compartido entre pestañas).
export function markActivity(now: number = Date.now()): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  } catch {
    // Sin localStorage (modo privado estricto): se controla solo por vencimiento.
  }
}

export function lastActivity(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function clearActivity(): void {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // nada
  }
}

// Milisegundos que faltan para el cierre por inactividad.
export function idleRemaining(
  last: number | null,
  now: number = Date.now(),
): number {
  if (last === null) return IDLE_LIMIT_MS;
  return last + IDLE_LIMIT_MS - now;
}

// Milisegundos que faltan para que venza el token (campo "exp" del JWT).
// Infinity si no se puede leer: el backend decide con un 401.
export function tokenRemaining(
  token: string | null | undefined,
  now: number = Date.now(),
): number {
  if (!token) return 0;

  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: unknown };

    return typeof exp === "number" ? exp * 1000 - now : Infinity;
  } catch {
    return Infinity;
  }
}

// "4 min" / "45 s"
export function formatRemaining(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`;
}
