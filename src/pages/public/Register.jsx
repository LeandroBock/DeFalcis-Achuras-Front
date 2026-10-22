import { Link } from "react-router-dom";

import LeadForm from "../../components/public/LeadForm";
import AuthShell from "./AuthShell";

// Crear cuenta. Por ahora las cuentas se activan a mano: se guardan los datos
// como interesado y el root da de alta la empresa.
function Register() {
  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Contanos de tu negocio. Estamos activando las primeras cuentas personalmente: te escribimos en el día con tu acceso."
      footer={
        <>
          <span>
            ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
          </span>
          <span>
            ¿Querés verlo antes? <Link to="/demo">Probá la demo</Link>
          </span>
        </>
      }
    >
      <div style={{ marginTop: 26 }}>
        <LeadForm
          kind="signup"
          fields={["city", "message"]}
          messageLabel="¿Cuántos clientes y repartidores tenés? (opcional)"
          submitLabel="Crear mi cuenta"
          successTitle="¡Listo! Recibimos tu pedido de cuenta"
          successText="Te escribimos en el día con tu usuario para empezar a usar FAENA."
        />
      </div>
    </AuthShell>
  );
}

export default Register;
