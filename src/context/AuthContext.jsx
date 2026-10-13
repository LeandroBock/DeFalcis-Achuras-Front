import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { TOKEN_KEY, getToken, setUnauthorizedHandler } from "../services/http";
import { isTokenExpired } from "../utils/token";

const USER_KEY = "user";

const AuthContext = createContext();

function readStoredUser() {
  if (isTokenExpired(getToken())) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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

    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setUser(null);

    // Que el próximo usuario no vea datos cacheados del anterior
    queryClient.clear();

    navigate("/login", { replace: true });
  }, [navigate, queryClient]);

  // Cualquier 401 del backend cierra la sesión
  useEffect(() => {
    setUnauthorizedHandler(logout);

    return () => setUnauthorizedHandler(null);
  }, [logout]);

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
