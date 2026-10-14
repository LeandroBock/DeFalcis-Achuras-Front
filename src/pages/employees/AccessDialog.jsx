import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Unlock,
  X,
} from "lucide-react";

import {
  createEmployeeAccount,
  updateEmployeeAccount,
} from "../../services/api";
import { keys, useApiMutation } from "../../hooks/queries";
import { formatRole } from "../../utils/format";

// Roles que se pueden dar desde Empleados (las cuentas de super admin se
// crean aparte).
const ROLES = ["reparto", "ventas", "deposito", "finanzas", "admin"];

// Rol sugerido según el puesto.
const ROLE_BY_POSITION = {
  delivery: "reparto",
  sales: "ventas",
  warehouse: "deposito",
  administration: "admin",
};

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white";

// Contraseña fácil de dictar o tipear en el celular (sin 0/O ni 1/l).
function generatePassword(length = 10) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (value) => chars[value % chars.length]).join("");
}

const whatsappUrl = (phone, text) => {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length <= 11 ? `549${digits.slice(-10)}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

/**
 * Dar o gestionar el acceso a la app de un empleado (solo super admin):
 * crear la cuenta (por ejemplo, la de un repartidor), cambiar el rol,
 * resetear la contraseña o bloquear el acceso.
 */
function AccessDialog({ employee, onClose }) {
  const account = employee.account;

  const [email, setEmail] = useState(employee.email || "");
  const [role, setRole] = useState(
    account?.role || ROLE_BY_POSITION[employee.position] || "ventas",
  );
  const [password, setPassword] = useState(account ? "" : generatePassword());
  const [showPassword, setShowPassword] = useState(!account);
  const [error, setError] = useState("");

  // Datos de ingreso para compartir después de crear o resetear.
  const [credentials, setCredentials] = useState(null);

  const create = useApiMutation(
    (data) => createEmployeeAccount(employee.id, data),
    { invalidate: [keys.employees, keys.drivers], showError: false },
  );
  const update = useApiMutation(
    (data) => updateEmployeeAccount(employee.id, data),
    { invalidate: [keys.employees, keys.drivers], showError: false },
  );
  const busy = create.isPending || update.isPending;

  function handleCreate(event) {
    event.preventDefault();
    setError("");

    create.mutate(
      { email: email.trim(), password, role },
      {
        onSuccess: (created) =>
          setCredentials({ email: created.email, password }),
        onError: (err) => setError(err.message),
      },
    );
  }

  function changeRole(event) {
    event.preventDefault();
    update.mutate(
      { role },
      {
        onSuccess: () => toast.success("Rol actualizado"),
        onError: (err) => setError(err.message),
      },
    );
  }

  function resetPassword() {
    const newPassword = generatePassword();
    update.mutate(
      { password: newPassword },
      {
        onSuccess: () =>
          setCredentials({ email: account.email, password: newPassword }),
        onError: (err) => setError(err.message),
      },
    );
  }

  function toggleBlocked() {
    update.mutate(
      { isActive: !account.isActive },
      {
        onSuccess: () => {
          toast.success(
            account.isActive ? "Acceso bloqueado" : "Acceso desbloqueado",
          );
          onClose();
        },
        onError: (err) => setError(err.message),
      },
    );
  }

  const message = credentials
    ? `Hola ${employee.name}, ya tenés acceso a la app de DF Achuras.\n` +
      `Usuario: ${credentials.email}\nContraseña: ${credentials.password}\n` +
      `Entrá desde: ${window.location.origin}`
    : "";

  async function copyCredentials() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Datos copiados");
    } catch {
      toast.error("No se pudo copiar. Anotalos a mano.");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <KeyRound className="h-4 w-4" />
              Acceso a la app
            </p>
            <h2 className="text-lg font-bold">{employee.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {credentials ? (
          // ---------- DATOS DE INGRESO ----------
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950/30 dark:text-green-200">
              <p className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Listo. Pasale estos datos para entrar:
              </p>
              <p>
                Usuario: <strong>{credentials.email}</strong>
              </p>
              <p>
                Contraseña:{" "}
                <strong className="font-mono">{credentials.password}</strong>
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              La contraseña no se vuelve a mostrar. Si se la olvida, podés
              generarle una nueva desde acá.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={copyCredentials}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold dark:border-gray-700"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </button>
              {employee.phone && (
                <a
                  href={whatsappUrl(employee.phone, message)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
            >
              Terminar
            </button>
          </div>
        ) : !account ? (
          // ---------- CREAR ACCESO ----------
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Email (usuario)</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="repartidor@dfachuras.com"
                className={inputClass}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Contraseña</span>
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="rounded-xl border border-gray-300 px-3 dark:border-gray-700"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShowPassword(true);
                  }}
                  className="rounded-xl border border-gray-300 px-3 dark:border-gray-700"
                  aria-label="Generar otra contraseña"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <span className="mt-1 block text-xs text-gray-500">
                Mínimo 8 caracteres.
              </span>
            </label>

            <RoleSelect role={role} onChange={setRole} />

            {error && <ErrorText>{error}</ErrorText>}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
            >
              <KeyRound className="h-4 w-4" />
              {create.isPending ? "Creando..." : "Crear acceso"}
            </button>
          </form>
        ) : (
          // ---------- GESTIONAR ACCESO ----------
          <div className="space-y-5">
            <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-950">
              <p>
                Usuario: <strong>{account.email}</strong>
              </p>
              <p>
                Estado:{" "}
                <strong
                  className={
                    account.isActive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {account.isActive ? "Activo" : "Bloqueado"}
                </strong>
              </p>
            </div>

            <form onSubmit={changeRole} className="flex items-end gap-2">
              <div className="flex-1">
                <RoleSelect role={role} onChange={setRole} />
              </div>
              <button
                type="submit"
                disabled={busy || role === account.role}
                className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
              >
                Guardar
              </button>
            </form>

            {error && <ErrorText>{error}</ErrorText>}

            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row dark:border-gray-800">
              <button
                type="button"
                onClick={resetPassword}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold dark:border-gray-700"
              >
                <RefreshCw className="h-4 w-4" />
                Nueva contraseña
              </button>
              <button
                type="button"
                onClick={toggleBlocked}
                disabled={busy}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  account.isActive
                    ? "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {account.isActive ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Bloquear acceso
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Desbloquear
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleSelect({ role, onChange }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">Rol</span>
      <select
        value={role}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {ROLES.map((value) => (
          <option key={value} value={value}>
            {formatRole(value)}
          </option>
        ))}
      </select>
      {role === "reparto" && (
        <span className="mt-1 block text-xs text-gray-500">
          Solo ve sus entregas y su rendición.
        </span>
      )}
    </label>
  );
}

function ErrorText({ children }) {
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400"
    >
      {children}
    </p>
  );
}

export default AccessDialog;
