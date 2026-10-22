import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { FaenaLogo } from "../../components/brand/Faena";
import "../../landing.css";

const POINTS = [
  "Notas de pedido y rutas de reparto",
  "Pesaje y cobro en la entrega",
  "Cuenta corriente y facturación electrónica",
  "Recibos por WhatsApp",
];

/**
 * Pantallas de ingreso (ingresar, crear cuenta, demo): panel de la marca a la
 * izquierda y el formulario a la derecha. En el celular, solo el formulario.
 */
function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="fx fx-auth">
      <aside className="fx-auth-brand">
        <Link to="/" aria-label="FAENA, volver a la portada">
          <FaenaLogo size={44} tone="light" tagline />
        </Link>

        <div>
          <h2>
            Tu negocio de carne, <em>del pedido a la cobranza.</em>
          </h2>
          <ul>
            {POINTS.map((point) => (
              <li key={point}>
                <CheckCircle2 size={18} />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <small>© {new Date().getFullYear()} FAENA</small>
      </aside>

      <main className="fx-auth-main">
        <div className="fx-auth-box">
          <div className="fx-auth-mobile-logo">
            <Link to="/" aria-label="FAENA, volver a la portada">
              <FaenaLogo size={40} />
            </Link>
          </div>

          <Link to="/" className="fx-back">
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>

          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}

          {children}

          {footer && <div className="fx-auth-links">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export default AuthShell;
