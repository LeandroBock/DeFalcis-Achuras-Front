import { useEffect, useRef, useState } from "react";
import { Clock, LogOut } from "lucide-react";

import { EXPIRED_REASON, IDLE_REASON, useAuth } from "../context/AuthContext";
import { getToken } from "../services/http";
import {
  EXPIRY_WARNING_MS,
  IDLE_WARNING_MS,
  formatRemaining,
  idleRemaining,
  lastActivity,
  markActivity,
  tokenRemaining,
} from "../utils/session";

// Actividad real de la persona (no cuentan las consultas automáticas).
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"];
const ACTIVITY_THROTTLE_MS = 10_000;

/**
 * Cierra la sesión después de 60 minutos sin usar la app o cuando vence el
 * token (8 horas), avisando antes: 1 minuto antes del cierre por
 * inactividad (con "Seguir conectado") y 5 minutos antes del vencimiento.
 */
function SessionWatcher() {
  const { logout } = useAuth();
  const [now, setNow] = useState(() => Date.now());
  const lastMark = useRef(0);

  // Registrar actividad (como mucho cada 10 s, para no escribir de más).
  useEffect(() => {
    function onActivity() {
      const current = Date.now();
      if (current - lastMark.current > ACTIVITY_THROTTLE_MS) {
        lastMark.current = current;
        markActivity(current);
      }
    }

    ACTIVITY_EVENTS.forEach((type) =>
      window.addEventListener(type, onActivity, { passive: true }),
    );
    return () =>
      ACTIVITY_EVENTS.forEach((type) =>
        window.removeEventListener(type, onActivity),
      );
  }, []);

  // Revisar cada segundo (y al volver a la pestaña o desbloquear el celular).
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const idleLeft = idleRemaining(lastActivity(), now);
  const tokenLeft = tokenRemaining(getToken(), now);

  useEffect(() => {
    if (tokenLeft <= 0) {
      logout(EXPIRED_REASON);
    } else if (idleLeft <= 0) {
      logout(IDLE_REASON);
    }
  }, [idleLeft, tokenLeft, logout]);

  if (idleLeft > 0 && idleLeft <= IDLE_WARNING_MS) {
    return (
      <div
        role="alertdialog"
        aria-labelledby="idle-title"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm"
      >
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900">
          <Clock className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h2 id="idle-title" className="text-lg font-bold">
            ¿Seguís ahí?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Por seguridad, la sesión se va a cerrar por inactividad en{" "}
            <strong>{formatRemaining(idleLeft)}</strong>.
          </p>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => logout()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold dark:border-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => {
                markActivity();
                setNow(Date.now());
              }}
              className="flex-1 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
            >
              Seguir conectado
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tokenLeft > 0 && tokenLeft <= EXPIRY_WARNING_MS) {
    return (
      <div
        role="status"
        className="fixed inset-x-0 top-0 z-[150] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950"
      >
        <Clock className="h-4 w-4" />
        Tu sesión vence en {formatRemaining(tokenLeft)}. Guardá lo que estés
        haciendo: vas a tener que volver a ingresar.
      </div>
    );
  }

  return null;
}

export default SessionWatcher;
