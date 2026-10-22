import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

import { createLead } from "../../services/api";

const EMPTY = {
  name: "",
  business: "",
  email: "",
  phone: "",
  city: "",
  message: "",
};

/**
 * Formulario de interesados de la portada (contacto, crear cuenta, demo).
 * Guarda los datos en el backend; el root los ve en "Interesados".
 *
 * fields: qué campos opcionales mostrar ("city", "message").
 */
function LeadForm({
  kind = "contact",
  fields = [],
  submitLabel = "Enviar",
  successTitle = "¡Gracias!",
  successText = "Te escribimos a la brevedad.",
  messageLabel = "¿Qué necesitás?",
}) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.trim() && !form.phone.trim()) {
      setError("Dejanos un email o un WhatsApp para poder responderte.");
      return;
    }

    setStatus("sending");

    try {
      await createLead({
        kind,
        ...Object.fromEntries(
          Object.entries(form)
            .map(([key, value]) => [key, value.trim()])
            .filter(([, value]) => value),
        ),
      });
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="fx-success" role="status">
        <CheckCircle2 size={44} />
        <h3>{successTitle}</h3>
        <p>{successText}</p>
      </div>
    );
  }

  return (
    <form className="fx-form" onSubmit={handleSubmit} noValidate>
      <div className="fx-form-2">
        <label className="fx-field">
          Nombre y apellido
          <input
            required
            maxLength={100}
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
          />
        </label>
        <label className="fx-field">
          Tu negocio
          <input
            maxLength={120}
            autoComplete="organization"
            placeholder="Ej: Carnicería El Novillo"
            value={form.business}
            onChange={set("business")}
          />
        </label>
      </div>

      <div className="fx-form-2">
        <label className="fx-field">
          WhatsApp
          <input
            type="tel"
            maxLength={30}
            autoComplete="tel"
            placeholder="341 155556789"
            value={form.phone}
            onChange={set("phone")}
          />
        </label>
        <label className="fx-field">
          Email
          <input
            type="email"
            maxLength={150}
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
          />
        </label>
      </div>

      {fields.includes("city") && (
        <label className="fx-field">
          Ciudad
          <input
            maxLength={100}
            autoComplete="address-level2"
            value={form.city}
            onChange={set("city")}
          />
        </label>
      )}

      {fields.includes("message") && (
        <label className="fx-field">
          {messageLabel}
          <textarea
            maxLength={2000}
            value={form.message}
            onChange={set("message")}
          />
        </label>
      )}

      {error && (
        <p className="fx-alert" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="fx-btn fx-btn-red fx-block"
        disabled={status === "sending" || !form.name.trim()}
      >
        <Send size={16} />
        {status === "sending" ? "Enviando..." : submitLabel}
      </button>
    </form>
  );
}

export default LeadForm;
