import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
} from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import { useShortcut } from "../hooks/useShortcut";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

function Kbd({ children }) {
  return (
    <kbd className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium dark:border-gray-700">
      {children}
    </kbd>
  );
}

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Error al cargar la lista: reemplaza la pantalla (con botón Reintentar)
  const [loadError, setLoadError] = useState("");

  // Error al guardar o desactivar: se muestra como aviso sin perder el formulario
  const [actionError, setActionError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [customerToDeactivate, setCustomerToDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  // Fila de la tabla que recibe Tab (roving tabindex)
  const [activeRow, setActiveRow] = useState(0);

  // Fila (o botón "Nuevo") que debe recibir el foco después de borrar
  const [pendingFocus, setPendingFocus] = useState(null);

  const sectionRef = useRef(null);
  const nameInputRef = useRef(null);
  const newButtonRef = useRef(null);
  const rowRefs = useRef([]);
  const formReturnFocus = useRef(null);
  const confirmReturnFocus = useRef(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  // Al abrir el formulario (o cambiar de cliente a editar):
  // llevarlo a la vista y poner el foco en "Nombre"
  useEffect(() => {
    if (!showForm) {
      return;
    }

    sectionRef.current?.scrollIntoView({ block: "start" });
    nameInputRef.current?.focus({ preventScroll: true });
  }, [showForm, editingCustomer]);

  // Después de desactivar: foco a la fila siguiente, o a "Nuevo cliente"
  // si ya no quedan clientes
  useEffect(() => {
    if (pendingFocus === null) {
      return;
    }

    const target =
      pendingFocus >= 0
        ? rowRefs.current[pendingFocus]
        : newButtonRef.current;

    target?.focus();
    setPendingFocus(null);
  }, [pendingFocus]);

  // Atajo: N abre el formulario de nuevo cliente
  useShortcut("n", () => openForm(), { enabled: !showForm && !loading });

  async function loadCustomers() {
    try {
      setLoading(true);
      setLoadError("");

      const data = await getCustomers();

      setCustomers(data);
    } catch (error) {
      console.error(error);
      setLoadError("No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // ---------- FORMULARIO ----------

  function openForm(customer = null) {
    formReturnFocus.current = document.activeElement;

    setActionError("");
    setEditingCustomer(customer);

    setFormData(
      customer
        ? {
            name: customer.name || "",
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || "",
            notes: customer.notes || "",
          }
        : emptyForm,
    );

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData(emptyForm);
    setActionError("");

    // Devolver el foco a donde estaba (fila o botón "Nuevo cliente")
    requestAnimationFrame(() => {
      const previous = formReturnFocus.current;

      const target =
        previous && document.contains(previous)
          ? previous
          : newButtonRef.current;

      target?.focus();
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      if (editingCustomer) {
        const updatedCustomer = await updateCustomer(
          editingCustomer.id,
          formData,
        );

        setCustomers((current) =>
          current.map((customer) =>
            customer.id === editingCustomer.id
              ? updatedCustomer
              : customer,
          ),
        );
      } else {
        const newCustomer = await createCustomer(formData);

        setCustomers((current) => [...current, newCustomer]);
      }

      closeForm();
    } catch (error) {
      console.error(error);

      setActionError(
        error.message ||
          (editingCustomer
            ? "No se pudo actualizar el cliente"
            : "No se pudo crear el cliente"),
      );
    } finally {
      setSaving(false);
    }
  }

  // Esc cancela, Ctrl/Cmd + Enter guarda (también desde "Notas")
  function handleFormKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeForm();
      return;
    }

    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  }

  // ---------- DESACTIVAR ----------

  function requestDeactivate(customer) {
    confirmReturnFocus.current = document.activeElement;

    setActionError("");
    setCustomerToDeactivate(customer);
  }

  function cancelDeactivate() {
    setCustomerToDeactivate(null);

    // Esperar a que el modal se cierre antes de mover el foco
    requestAnimationFrame(() => {
      confirmReturnFocus.current?.focus();
    });
  }

  async function handleDeactivate() {
    if (!customerToDeactivate) {
      return;
    }

    try {
      setDeactivating(true);

      await deactivateCustomer(customerToDeactivate.id);

      const index = customers.findIndex(
        (customer) => customer.id === customerToDeactivate.id,
      );
      const remaining = customers.length - 1;

      setCustomers((current) =>
        current.filter(
          (customer) => customer.id !== customerToDeactivate.id,
        ),
      );

      setCustomerToDeactivate(null);

      setPendingFocus(
        remaining === 0 ? -1 : Math.min(index, remaining - 1),
      );
    } catch (error) {
      console.error(error);

      setActionError(
        error.message || "No se pudo desactivar el cliente",
      );

      cancelDeactivate();
    } finally {
      setDeactivating(false);
    }
  }

  // ---------- TABLA ----------

  function focusRow(index) {
    rowRefs.current[index]?.focus();
  }

  // Flechas, Home y End mueven entre filas; Enter edita; Supr desactiva
  function handleRowKeyDown(event, index, customer) {
    // Si el foco está en un botón de la fila, dejar que actúe él
    if (event.target !== event.currentTarget) {
      return;
    }

    const last = customers.length - 1;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusRow(Math.min(index + 1, last));
        break;

      case "ArrowUp":
        event.preventDefault();
        focusRow(Math.max(index - 1, 0));
        break;

      case "Home":
        event.preventDefault();
        focusRow(0);
        break;

      case "End":
        event.preventDefault();
        focusRow(last);
        break;

      case "Enter":
        event.preventDefault();
        openForm(customer);
        break;

      // Backspace también, para teclados de Mac sin tecla Supr
      case "Delete":
      case "Backspace":
        event.preventDefault();
        requestDeactivate(customer);
        break;

      default:
        break;
    }
  }

  const safeActiveRow = Math.min(
    activeRow,
    Math.max(customers.length - 1, 0),
  );

  // ---------- ESTADOS DE CARGA Y ERROR ----------

  if (loading) {
    return (
      <div className="min-h-[400px] p-6">
        <div
          role="status"
          className="flex min-h-[300px] items-center justify-center gap-3 text-gray-500 dark:text-gray-400"
        >
          <Users className="h-5 w-5 animate-pulse" />
          <span>Cargando clientes...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
        >
          {loadError}
        </div>

        <button
          type="button"
          onClick={loadCustomers}
          autoFocus
          className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:p-6 lg:p-8">
      {/* HEADER */}

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-gray-900 p-2 text-white dark:bg-white dark:text-gray-900">
              <Users className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Gestión
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administración de clientes de DF Achuras
          </p>
        </div>

        <button
          ref={newButtonRef}
          type="button"
          onClick={() => (showForm ? closeForm() : openForm())}
          aria-expanded={showForm}
          aria-controls="customer-form"
          aria-keyshortcuts="N"
          title={showForm ? "Cancelar (Esc)" : "Nuevo cliente (N)"}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
            showForm
              ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          }`}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </>
          )}
        </button>
      </header>

      {/* AVISO DE ERROR (guardar / desactivar) */}

      {actionError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
        >
          {actionError}
        </div>
      )}

      {/* FORMULARIO */}

      {showForm && (
        <section
          id="customer-form"
          ref={sectionRef}
          aria-labelledby="customer-form-title"
          className="mb-8 scroll-mt-20 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 id="customer-form-title" className="text-xl font-bold">
                {editingCustomer ? "Editar cliente" : "Nuevo cliente"}
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {editingCustomer
                  ? "Modificá los datos del cliente."
                  : "Completá los datos del cliente."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={handleFormKeyDown}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* NOMBRE */}

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-semibold">
                Nombre
              </label>

              <input
                ref={nameInputRef}
                id="name"
                name="name"
                type="text"
                placeholder="Nombre del cliente"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* TELÉFONO */}

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-semibold">
                Teléfono
              </label>

              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Ej: 3415551234"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                />
              </div>
            </div>

            {/* EMAIL */}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-semibold">
                Email
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                />
              </div>
            </div>

            {/* DIRECCIÓN */}

            <div className="flex flex-col gap-2">
              <label htmlFor="address" className="text-sm font-semibold">
                Dirección
              </label>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Dirección de entrega"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                />
              </div>
            </div>

            {/* NOTAS */}

            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="notes" className="text-sm font-semibold">
                Notas
              </label>

              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />

                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Notas del cliente"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                />
              </div>
            </div>

            {/* ACCIONES */}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end md:col-span-2">
              <p className="hidden items-center gap-1.5 text-xs text-gray-500 sm:mr-auto sm:flex dark:text-gray-400">
                <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> guardar
                <span aria-hidden="true" className="mx-1">
                  ·
                </span>
                <Kbd>Esc</Kbd> cancelar
              </p>

              <button
                type="button"
                onClick={closeForm}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Guardando..."
                  : editingCustomer
                    ? "Actualizar cliente"
                    : "Guardar cliente"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* LISTADO */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold">Listado de clientes</h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Clientes activos de DF Achuras
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {customers.length}{" "}
            {customers.length === 1 ? "cliente" : "clientes"}
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Users className="h-7 w-7" />
            </div>

            <h3 className="font-semibold">No hay clientes registrados</h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Creá el primer cliente para comenzar.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Nombre
                    </th>

                    <th scope="col" className="px-5 py-4 font-semibold">
                      Teléfono
                    </th>

                    <th scope="col" className="px-5 py-4 font-semibold">
                      Email
                    </th>

                    <th scope="col" className="px-5 py-4 font-semibold">
                      Dirección
                    </th>

                    <th scope="col" className="px-5 py-4 font-semibold">
                      Notas
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-4 text-right font-semibold"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {customers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      ref={(element) => {
                        rowRefs.current[index] = element;
                      }}
                      tabIndex={index === safeActiveRow ? 0 : -1}
                      onFocus={(event) => {
                        if (event.target === event.currentTarget) {
                          setActiveRow(index);
                        }
                      }}
                      onKeyDown={(event) =>
                        handleRowKeyDown(event, index, customer)
                      }
                      className="transition hover:bg-gray-50 focus-visible:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-400 dark:hover:bg-gray-800/50 dark:focus-visible:bg-gray-800"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            <UserRound className="h-4 w-4" />
                          </div>

                          <strong className="font-semibold text-gray-900 dark:text-white">
                            {customer.name}
                          </strong>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                          {customer.phone || "Sin teléfono"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                          {customer.email || "Sin email"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {customer.address || "Sin dirección"}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-gray-600 dark:text-gray-400">
                        {customer.notes || "Sin notas"}
                      </td>

                      {/* Con teclado se usa Enter (editar) y Supr (desactivar)
                          sobre la fila, por eso estos botones no reciben Tab:
                          así recorrer la tabla es una sola parada, no dos por fila. */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => openForm(customer)}
                            title="Editar cliente (Enter)"
                            aria-label={`Editar ${customer.name}`}
                            className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => requestDeactivate(customer)}
                            title="Desactivar cliente (Supr)"
                            aria-label={`Desactivar ${customer.name}`}
                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AYUDA DE TECLADO */}

            <div className="hidden flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-200 px-5 py-3 text-xs text-gray-500 sm:flex dark:border-gray-800 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> moverse
              </span>

              <span className="flex items-center gap-1.5">
                <Kbd>Enter</Kbd> editar
              </span>

              <span className="flex items-center gap-1.5">
                <Kbd>Supr</Kbd> desactivar
              </span>

              <span className="flex items-center gap-1.5">
                <Kbd>N</Kbd> nuevo cliente
              </span>
            </div>
          </>
        )}
      </section>

      <ConfirmModal
        isOpen={!!customerToDeactivate}
        title="¿Desactivar cliente?"
        message={
          customerToDeactivate
            ? `¿Estás seguro de que querés desactivar a "${customerToDeactivate.name}"? El cliente dejará de aparecer en el listado de clientes activos.`
            : ""
        }
        onConfirm={handleDeactivate}
        onCancel={cancelDeactivate}
        loading={deactivating}
      />
    </div>
  );
}

export default Customers;
