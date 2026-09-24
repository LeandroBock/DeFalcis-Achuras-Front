import { useEffect, useState } from "react";

import {
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Truck,
  UserRound,
  Users,
  X,
  FileText,
  Trash2,
  Pencil,
} from "lucide-react";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
} from "../services/api";
import ConfirmModal from "../components/ConfirmModal";


function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
const [editingSupplier, setEditingSupplier] = useState(null);
const [supplierToDeactivate, setSupplierToDeactivate] =
  useState(null);
const [deactivating, setDeactivating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      setLoading(true);
      setError("");

      const data = await getSuppliers();

      setSuppliers(data);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los proveedores.");
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
    if (editingSupplier) {
      const updatedSupplier =
        await updateSupplier(
          editingSupplier.id,
          formData,
        );

      setSuppliers(
        suppliers.map((supplier) =>
          supplier.id === editingSupplier.id
            ? updatedSupplier
            : supplier,
        ),
      );
    } else {
      const newSupplier =
        await createSupplier(formData);

      setSuppliers([
        ...suppliers,
        newSupplier,
      ]);
    }

    handleCancel();
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        (editingSupplier
          ? "No se pudo actualizar el proveedor"
          : "No se pudo crear el proveedor"),
    );
  }
}

async function handleDeactivate() {
  if (!supplierToDeactivate) {
    return;
  }

  try {
    setDeactivating(true);

    await deactivateSupplier(
      supplierToDeactivate.id,
    );

    setSuppliers(
      suppliers.filter(
        (supplier) =>
          supplier.id !==
          supplierToDeactivate.id,
      ),
    );

    setSupplierToDeactivate(null);
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        "No se pudo desactivar el proveedor",
    );
  } finally {
    setDeactivating(false);
  }
}

function handleEdit(supplier) {
  setEditingSupplier(supplier);

  setFormData({
    name: supplier.name || "",
    contactName: supplier.contactName || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    address: supplier.address || "",
    notes: supplier.notes || "",
  });

  setShowForm(true);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function handleCancel() {
  setShowForm(false);
  setEditingSupplier(null);
  setError(""); // ✨ Limpia el error al cerrar/cancelar
  setFormData({
    name: "",
    contactName: "",
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
          <Truck className="h-5 w-5 animate-pulse" />
          <span>Cargando proveedores...</span>
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
              <Truck className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              DF Achuras
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Proveedores
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administración de proveedores de DF Achuras
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
          className="flex w-fit items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nuevo proveedor
            </>
          )}
        </button>
      </header>

      {/* FORMULARIO */}
      {showForm && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <Truck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
  {editingSupplier
    ? "Editar proveedor"
    : "Nuevo proveedor"}
</h2>

<p className="text-sm text-gray-500 dark:text-gray-400">
  {editingSupplier
    ? "Modificá los datos del proveedor."
    : "Completá los datos del proveedor."}
</p>
            </div>
          </div>
{/* Coloca esto justo encima de tu etiqueta <form> */}
{error && (
  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
    ⚠️ {error}
  </div>
)}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* NOMBRE */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <Truck className="h-4 w-4 text-gray-400" />
                Nombre
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Nombre del proveedor"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* CONTACTO */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="contactName"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <UserRound className="h-4 w-4 text-gray-400" />
                Persona de contacto
              </label>

              <input
                id="contactName"
                name="contactName"
                type="text"
                placeholder="Nombre del contacto"
                value={formData.contactName}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* TELÉFONO */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="phone"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <Phone className="h-4 w-4 text-gray-400" />
                Teléfono
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Ej: 3415551234"
                value={formData.phone}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

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
                name="email"
                type="email"
                placeholder="proveedor@email.com"
                value={formData.email}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* DIRECCIÓN */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="address"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <MapPin className="h-4 w-4 text-gray-400" />
                Dirección
              </label>

              <input
                id="address"
                name="address"
                type="text"
                placeholder="Dirección"
                value={formData.address}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* NOTAS */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="notes"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Notas
              </label>

              <textarea
                id="notes"
                name="notes"
                placeholder="Notas del proveedor"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* BOTONES */}
            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                className="flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
{editingSupplier
  ? "Actualizar proveedor"
  : "Guardar proveedor"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="flex w-fit items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* LISTADO */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Listado de proveedores
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Proveedores activos registrados.
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {suppliers.length}{" "}
            {suppliers.length === 1 ? "proveedor" : "proveedores"}
          </span>
        </div>

        {suppliers.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Truck className="h-7 w-7" />
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white">
              No hay proveedores registrados
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Agregá tu primer proveedor utilizando el botón "Nuevo proveedor".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Proveedor
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Contacto
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Teléfono
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Email
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Dirección
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Notas
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white dark:bg-white dark:text-gray-900">
                          {supplier.name?.charAt(0)?.toUpperCase() || "P"}
                        </div>

                        <strong className="font-semibold text-gray-900 dark:text-white">
                          {supplier.name}
                        </strong>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {supplier.contactName || "Sin contacto"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {supplier.phone || "Sin teléfono"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {supplier.email || "Sin email"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {supplier.address || "Sin dirección"}
                    </td>

                    <td className="max-w-xs px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {supplier.notes || "Sin notas"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => handleEdit(supplier)}
    title="Editar proveedor"
    className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
  >
    <Pencil className="h-4 w-4" />
  </button>

  <button
    type="button"
    onClick={() =>
      setSupplierToDeactivate(supplier)
    }
    title="Desactivar proveedor"
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
  isOpen={!!supplierToDeactivate}
  title="¿Desactivar proveedor?"
  message={
    supplierToDeactivate
      ? `¿Estás seguro de que querés desactivar a "${supplierToDeactivate.name}"? El proveedor dejará de aparecer en el listado de proveedores activos.`
      : ""
  }
  onConfirm={handleDeactivate}
  onCancel={() =>
    setSupplierToDeactivate(null)
  }
  loading={deactivating}
/>
    </main>
  );
}

export default Suppliers;