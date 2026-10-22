import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { homePathFor } from "../config/navigation";
import { login as loginRequest } from "../services/api";
import AuthShell from "./public/AuthShell";

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
    <AuthShell
      title="Ingresar"
      subtitle="Entrá con el usuario de tu empresa."
      footer={
        <>
          <span>
            ¿No tenés cuenta? <Link to="/registro">Creá una</Link>
          </span>
          <span>
            ¿Querés verlo antes? <Link to="/demo">Probá la demo</Link>
          </span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="fx-form">
        <label className="fx-field" htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vos@tunegocio.com"
            required
            autoComplete="email"
          />
        </label>

        <label className="fx-field" htmlFor="password">
          Contraseña
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
            required
            autoComplete="current-password"
          />
        </label>

        {/* Por qué se cerró la sesión (inactividad, vencimiento...) */}
        {!error && location.state?.reason && (
          <div role="status" className="fx-alert fx-alert-info">
            {location.state.reason}
          </div>
        )}

        {error && (
          <div role="alert" className="fx-alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="fx-btn fx-btn-red fx-block"
        >
          <LogIn size={16} />
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </AuthShell>
  );
}

export default Login;
