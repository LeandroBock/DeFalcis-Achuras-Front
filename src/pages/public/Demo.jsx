import { Link } from "react-router-dom";

import LeadForm from "../../components/public/LeadForm";
import AuthShell from "./AuthShell";

// Probar la demo. Hasta que la demo sea automática (una empresa de ejemplo
// por visitante), se piden los datos y se le manda el acceso.
function Demo() {
  return (
    <AuthShell
      title="Probar la demo"
      subtitle="Te damos acceso a una empresa de ejemplo con productos, clientes, pedidos y repartos cargados, para que pruebes todo sin miedo a romper nada."
      footer={
        <>
          <span>
            ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
          </span>
          <span>
            ¿Ya lo decidiste? <Link to="/registro">Creá tu cuenta</Link>
          </span>
        </>
      }
    >
      <div style={{ marginTop: 26 }}>
        <LeadForm
          kind="demo"
          submitLabel="Quiero probar la demo"
          successTitle="¡Gracias! Ya recibimos tus datos"
          successText="Te mandamos el acceso a la demo por WhatsApp o mail."
        />
      </div>
    </AuthShell>
  );
}

export default Demo;
