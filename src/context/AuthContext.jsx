import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import {
  TOKEN_KEY,
  buildUrl,
  getToken,
  setUnauthorizedHandler,
} from "../services/http";
import { isTokenExpired } from "../utils/token";
import {
  clearActivity,
  idleRemaining,
  lastActivity,
  markActivity,
} from "../utils/session";

const USER_KEY = "user";

export const IDLE_REASON = "Se cerró la sesión por inactividad (60 minutos).";
export const EXPIRED_REASON = "Tu sesión venció. Volvé a ingresar.";

const AuthContext = createContext();

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearActivity();
}

// Avisa al backend para que el token deje de servir aunque no haya vencido.
// Es "best effort": si falla, el token igual vence a las 8 horas.
function revokeOnServer(token) {
  if (!token) return;

  fetch(buildUrl("/auth/logout"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => {});
}

// Al abrir la app: si el token venció o pasó más de una hora sin usarla, la
// sesión ya no vale.
function readStoredUser() {
  const token = getToken();

  if (!token) return null;

  if (isTokenExpired(token) || idleRemaining(lastActivity()) <= 0) {
    revokeOnServer(token);
    clearStoredSession();
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback((userData, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    markActivity();

    setUser(userData);
  }, []);

  // reason: mensaje para mostrar en el login (inactividad, vencimiento...).
  const logout = useCallback(
    (reason) => {
      revokeOnServer(getToken());
      clearStoredSession();

      setUser(null);

      // Que el próximo usuario no vea datos cacheados del anterior
      queryClient.clear();

      navigate("/login", {
        replace: true,
        state: typeof reason === "string" ? { reason } : undefined,
      });
    },
    [navigate, queryClient],
  );

  // Cualquier 401 del backend cierra la sesión
  useEffect(() => {
    setUnauthorizedHandler(() => logout(EXPIRED_REASON));

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Si se cierra la sesión en otra pestaña, se cierra también en esta.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === TOKEN_KEY && !event.newValue && user) {
        setUser(null);
        queryClient.clear();
        navigate("/login", { replace: true });
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [navigate, queryClient, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !isTokenExpired(getToken()),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
