import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, LogIn, ShieldCheck } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { homePathFor } from "../config/navigation";
import { login as loginRequest } from "../services/api";

function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Volver a la pantalla que se quería abrir antes del login; si no, la
  // pantalla inicial del rol (el repartidor va a sus entregas).
  const fromPath = location.state?.from?.pathname;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await loginRequest({ email, password });

      login(data.user, data.access_token);

      navigate(fromPath || homePathFor(data.user.role), { replace: true });
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to={fromPath || homePathFor(user?.role)} replace />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-900 bg-[url('/login.jpg')] bg-cover bg-center bg-no-repeat p-4">
      <main className="flex w-full max-w-md items-center justify-center text-gray-900 transition-colors dark:text-gray-100">
        <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          {/* HEADER */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              De Falcis Achuras
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sistema de gestión
            </p>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <Mail className="h-4 w-4 text-gray-400" />
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@dfachuras.com"
                required
                autoComplete="email"
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* CONTRASEÑA */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <LockKeyhole className="h-4 w-4 text-gray-400" />
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contraseña"
                required
                autoComplete="current-password"
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* ERROR */}
            {/* Por qué se cerró la sesión (inactividad, vencimiento...) */}
            {!error && location.state?.reason && (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
              >
                {location.state.reason}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900" />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Ingresar
                </>
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-6 border-t border-gray-200 pt-5 text-center dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Acceso al sistema de gestión de DF Achuras
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
