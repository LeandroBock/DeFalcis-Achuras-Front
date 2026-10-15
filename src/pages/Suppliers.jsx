import { useRef, useState } from "react";
import { toast } from "sonner";

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
  createSupplier,
  updateSupplier,
  deactivateSupplier,
} from "../services/api";
import { keys, useApiMutation, useSuppliers } from "../hooks/queries";
import { usePagination } from "../hooks/usePagination";
import { useShortcut } from "../hooks/useShortcut";
import { formKeys, useRowNavigation } from "../hooks/useRowNavigation";
import { useFormFocus } from "../hooks/useFormFocus";
import KeyboardHelp from "../components/ui/KeyboardHelp";
import { CANCEL, MOVE, ROW_FOCUS, SAVE } from "../utils/keyboardHelp";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/ui/Pagination";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/PageStates";

const EMPTY_FORM = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

function Suppliers() {
  const { data: suppliers = [], isLoading, error, refetch } = useSuppliers();
  const { pageItems, ...pagination } = usePagination(suppliers);

  // Error al guardar: se muestra dentro del formulario sin perder lo cargado
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierToDeactivate, setSupplierToDeactivate] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Teclado, como en Clientes: flechas en la tabla, Enter edita, Supr
  // desactivar, N nuevo; en el formulario Esc cancela y Ctrl+Enter guarda.
  const newButtonRef = useRef(null);
  const rows = useRowNavigation(pageItems.length, {
    fallbackRef: newButtonRef,
  });
  const { formRef, rememberFocus, restoreFocus } = useFormFocus(showForm);

  useShortcut("n", () => openNew(), { enabled: !showForm });

  function openNew() {
    rememberFocus();
    setEditingSupplier(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  }

  const saveSupplier = useApiMutation(
    ({ id, data }) => (id ? updateSupplier(id, data) : createSupplier(data)),
    { invalidate: [keys.suppliers], showError: false },
  );

  const deactivate = useApiMutation(deactivateSupplier, {
    invalidate: [keys.suppliers],
    success: "Proveedor desactivado",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    saveSupplier.mutate(
      { id: editingSupplier?.id, data: formData },
      {
        onSuccess: () => {
          toast.success(
            editingSupplier ? "Proveedor actualizado" : "Proveedor creado",
          );
          handleCancel();
        },
        onError: (error) => setFormError(error.message),
      },
    );
  }

  function handleDeactivate() {
    if (!supplierToDeactivate) {
      return;
    }

    deactivate.mutate(supplierToDeactivate.id, {
      onSuccess: () => {
        rows.focusAfterChange();
        setSupplierToDeactivate(null);
      },
    });
  }

  function handleEdit(supplier) {
    rememberFocus();
    setEditingSupplier(supplier);
    setFormError("");

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
    setFormError("");
    setFormData(EMPTY_FORM);
    restoreFocus(newButtonRef);
  }

  if (isLoading) {
    return <LoadingState icon={Truck} message="Cargando proveedores..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="No se pudieron cargar los proveedores."
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
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

          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administración de proveedores de DF Achuras
          </p>
        </div>

        <button
          type="button"
          ref={newButtonRef}
          onClick={() => (showForm ? handleCancel() : openNew())}
          aria-keyshortcuts={showForm ? undefined : "N"}
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
                {editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editingSupplier
                  ? "Modificá los datos del proveedor."
                  : "Completá los datos del proveedor."}
              </p>
            </div>
          </div>
          {/* Coloca esto justo encima de tu etiqueta <form> */}
          {formError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
            >
              ⚠️ {formError}
            </div>
          )}
          <form
            ref={formRef}
            onKeyDown={formKeys(handleCancel)}
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
            <div className="flex items-center gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saveSupplier.isPending}
                className="flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
                {editingSupplier ? "Actualizar proveedor" : "Guardar proveedor"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="flex w-fit items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>

              <KeyboardHelp items={[SAVE, CANCEL]} className="sm:ml-auto" />
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
          <EmptyState
            icon={Truck}
            title="No hay proveedores registrados"
            description='Agregá tu primer proveedor utilizando el botón "Nuevo proveedor".'
          />
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
                {pageItems.map((supplier, index) => (
                  <tr
                    key={supplier.id}
                    {...rows.rowProps(index, {
                      Enter: () => handleEdit(supplier),
                      Delete: () => setSupplierToDeactivate(supplier),
                    })}
                    className={`border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${ROW_FOCUS}`}
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
                          tabIndex={-1}
                          onClick={() => handleEdit(supplier)}
                          title="Editar proveedor (Enter)"
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setSupplierToDeactivate(supplier)}
                          title="Desactivar proveedor (Supr)"
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

        {suppliers.length > 0 && (
          <KeyboardHelp
            className="border-t border-gray-200 px-5 py-3 dark:border-gray-800"
            items={[
              MOVE,
              [["Enter"], "editar"],
              [["Supr"], "desactivar"],
              [["N"], "nuevo proveedor"],
            ]}
          />
        )}

        <Pagination {...pagination} />
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
        onCancel={() => setSupplierToDeactivate(null)}
        loading={deactivate.isPending}
      />
    </div>
  );
}

export default Suppliers;
