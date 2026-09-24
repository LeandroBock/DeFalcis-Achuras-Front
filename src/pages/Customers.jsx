import { useEffect, useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  Users,
  X,
  FileText,
  Pencil,
} from "lucide-react";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
} from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
const [customerToDeactivate, setCustomerToDeactivate] = useState(null);
const [deactivating, setDeactivating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers();

      setCustomers(data);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  async function handleSubmit(event) {
  event.preventDefault();

  try {
    if (editingCustomer) {
      const updatedCustomer = await updateCustomer(
        editingCustomer.id,
        formData,
      );

      setCustomers(
        customers.map((customer) =>
          customer.id === editingCustomer.id
            ? updatedCustomer
            : customer,
        ),
      );
    } else {
      const newCustomer = await createCustomer(formData);

      setCustomers([...customers, newCustomer]);
    }

    handleCancel();
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        (editingCustomer
          ? "No se pudo actualizar el cliente"
          : "No se pudo crear el cliente"),
    );
  }
}

async function handleDeactivate() {
  if (!customerToDeactivate) {
    return;
  }

  try {
    setDeactivating(true);

    await deactivateCustomer(
      customerToDeactivate.id,
    );

    setCustomers(
      customers.filter(
        (customer) =>
          customer.id !== customerToDeactivate.id,
      ),
    );

    setCustomerToDeactivate(null);
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        "No se pudo desactivar el cliente",
    );
  } finally {
    setDeactivating(false);
  }
}

function handleEdit(customer) {
  setEditingCustomer(customer);

  setFormData({
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    notes: customer.notes || "",
  });

  setShowForm(true);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function handleCancel() {
  setShowForm(false);
  setEditingCustomer(null);

  setFormData({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
}

  if (loading) {
    return (
      <main className="min-h-[400px] p-6">
        <div className="flex min-h-[300px] items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
          <Users className="h-5 w-5 animate-pulse" />
          <span>Cargando clientes...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:p-6 lg:p-8">

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

          <h1 className="text-3xl font-bold tracking-tight">
            Clientes
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administración de clientes de DF Achuras
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              handleCancel();
            } else {
              setShowForm(true);
            }
          }}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
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

      {/* FORMULARIO */}

      {showForm && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold">
  {editingCustomer
    ? "Editar cliente"
    : "Nuevo cliente"}
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
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* NOMBRE */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold"
              >
                Nombre
              </label>

              <input
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
              <label
                htmlFor="phone"
                className="text-sm font-semibold"
              >
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
              <label
                htmlFor="email"
                className="text-sm font-semibold"
              >
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
              <label
                htmlFor="address"
                className="text-sm font-semibold"
              >
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
              <label
                htmlFor="notes"
                className="text-sm font-semibold"
              >
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

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end md:col-span-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
{editingCustomer
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
              <h2 className="font-bold">
                Listado de clientes
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Clientes activos de DF Achuras
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {customers.length}{" "}
            {customers.length === 1
              ? "cliente"
              : "clientes"}
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Users className="h-7 w-7" />
            </div>

            <h3 className="font-semibold">
              No hay clientes registrados
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Creá el primer cliente para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Nombre
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Teléfono
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Email
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Dirección
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Notas
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                        {customer.phone ||
                          "Sin teléfono"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                        {customer.email ||
                          "Sin email"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {customer.address ||
                        "Sin dirección"}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-gray-600 dark:text-gray-400">
                      {customer.notes ||
                        "Sin notas"}
                    </td>

                    <td className="px-5 py-4">
  <div className="flex justify-end gap-2">
    <button
      type="button"
      onClick={() => handleEdit(customer)}
      title="Editar cliente"
      className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
    >
      <Pencil className="h-4 w-4" />
    </button>

    <button
      type="button"
      onClick={() =>
        setCustomerToDeactivate(customer)
      }
      title="Desactivar cliente"
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
  onCancel={() => setCustomerToDeactivate(null)}
  loading={deactivating}
/>
    </main>
  );
}

export default Customers;