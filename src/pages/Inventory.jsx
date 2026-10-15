import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardEdit,
  History,
  Package,
  Plus,
  Save,
  Settings2,
  X,
} from "lucide-react";

import { createInventoryMovement } from "../services/api";
import {
  keys,
  useApiMutation,
  useInventoryMovements,
  useProducts,
} from "../hooks/queries";
import { usePagination } from "../hooks/usePagination";
import { useShortcut } from "../hooks/useShortcut";
import { formKeys } from "../hooks/useRowNavigation";
import { useFormFocus } from "../hooks/useFormFocus";
import KeyboardHelp from "../components/ui/KeyboardHelp";
import { CANCEL, SAVE } from "../utils/keyboardHelp";
import {
  formatDateTime as formatDate,
  formatMovementType as formatType,
  formatUnit,
} from "../utils/format";
import Pagination from "../components/ui/Pagination";
import { ErrorState, LoadingState } from "../components/ui/PageStates";

const EMPTY_FORM = {
  productId: "",
  type: "entry",
  quantity: "",
  reason: "",
};

function Inventory() {
  const productsQuery = useProducts();
  const movementsQuery = useInventoryMovements();

  const products = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data],
  );
  const movements = movementsQuery.data ?? [];

  const { pageItems: productPage, ...productPagination } =
    usePagination(products);
  const { pageItems: movementPage, ...movementPagination } =
    usePagination(movements);

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);

  // Teclado: N abre el movimiento manual; en el formulario Esc cancela y
  // Ctrl+Enter guarda.
  const newButtonRef = useRef(null);
  const { formRef, rememberFocus, restoreFocus } = useFormFocus(showForm);

  useShortcut("n", () => openForm(), { enabled: !showForm });

  function openForm() {
    rememberFocus();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    restoreFocus(newButtonRef);
  }

  const createMovement = useApiMutation(createInventoryMovement, {
    invalidate: [keys.inventory, keys.products, keys.reports],
  });

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const movementData = {
      productId: formData.productId,
      type: formData.type,
      quantity: Number(formData.quantity),
      reason: formData.reason || undefined,
    };

    createMovement.mutate(movementData, {
      onSuccess: (result) => {
        toast.success(`Movimiento registrado. Nuevo stock: ${result.stock}`);
        setFormData(EMPTY_FORM);
        closeForm();
      },
    });
  }

  function getProductName(productId) {
    return productsById.get(productId)?.name || "Producto eliminado";
  }

  function getProduct(productId) {
    return productsById.get(productId);
  }

  function getMovementIcon(type) {
    if (type === "entry") {
      return <ArrowDownToLine className="h-4 w-4" />;
    }

    if (type === "exit") {
      return <ArrowUpFromLine className="h-4 w-4" />;
    }

    return <Settings2 className="h-4 w-4" />;
  }

  if (productsQuery.isLoading || movementsQuery.isLoading) {
    return <LoadingState icon={Boxes} message="Cargando inventario..." />;
  }

  if (productsQuery.error || movementsQuery.error) {
    return (
      <ErrorState
        message="No se pudo cargar el inventario."
        onRetry={() => {
          productsQuery.refetch();
          movementsQuery.refetch();
        }}
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
              <Boxes className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Control
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Control de stock y movimientos de mercadería
          </p>
        </div>

        <button
          type="button"
          ref={newButtonRef}
          onClick={() => (showForm ? closeForm() : openForm())}
          aria-keyshortcuts={showForm ? undefined : "N"}
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
              Movimiento manual
            </>
          )}
        </button>
      </header>

      {/* FORMULARIO */}

      {showForm && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <ClipboardEdit className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold">Nuevo movimiento</h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Registrá una entrada, salida o ajuste de stock.
                </p>
              </div>
            </div>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            onKeyDown={formKeys(closeForm)}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* PRODUCTO */}

            <div className="flex flex-col gap-2">
              <label htmlFor="productId" className="text-sm font-semibold">
                Producto
              </label>

              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="">Seleccionar producto</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TIPO */}

            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="text-sm font-semibold">
                Tipo de movimiento
              </label>

              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="entry">Entrada</option>

                <option value="exit">Salida</option>

                <option value="adjustment">Ajuste de stock</option>
              </select>
            </div>

            {/* CANTIDAD */}

            <div className="flex flex-col gap-2">
              <label htmlFor="quantity" className="text-sm font-semibold">
                Cantidad
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="Ej: 10"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* MOTIVO */}

            <div className="flex flex-col gap-2">
              <label htmlFor="reason" className="text-sm font-semibold">
                Motivo
              </label>

              <input
                id="reason"
                name="reason"
                type="text"
                placeholder="Ej: Diferencia de inventario"
                value={formData.reason}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* BOTÓN */}

            <div className="flex items-center justify-end gap-4 pt-2 md:col-span-2">
              <KeyboardHelp items={[SAVE, CANCEL]} className="mr-auto" />

              <button
                type="submit"
                disabled={createMovement.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:w-auto dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
                Registrar movimiento
              </button>
            </div>
          </form>
        </section>
      )}

      {/* STOCK ACTUAL */}

      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold">Stock actual</h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Existencias actuales por producto
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay productos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Producto</th>

                  <th className="px-5 py-4 font-semibold">Categoría</th>

                  <th className="px-5 py-4 font-semibold">Stock</th>

                  <th className="px-5 py-4 font-semibold">Unidad</th>

                  <th className="px-5 py-4 font-semibold">Estado</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {productPage.map((product) => {
                  const stock = Number(product.stock);

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-5 py-4">
                        <strong className="font-semibold">
                          {product.name}
                        </strong>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <strong
                          className={`text-base ${
                            stock <= 0
                              ? "text-red-600 dark:text-red-400"
                              : stock <= 5
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {stock}
                        </strong>
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {formatUnit(product.unit)}
                      </td>

                      <td className="px-5 py-4">
                        {stock > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Sin stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination {...productPagination} />
      </section>

      {/* HISTORIAL */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <History className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold">Historial de movimientos</h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registro de entradas, salidas y ajustes
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {movements.length}{" "}
            {movements.length === 1 ? "movimiento" : "movimientos"}
          </span>
        </div>

        {movements.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay movimientos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Fecha</th>

                  <th className="px-5 py-4 font-semibold">Producto</th>

                  <th className="px-5 py-4 font-semibold">Tipo</th>

                  <th className="px-5 py-4 font-semibold">Cantidad</th>

                  <th className="px-5 py-4 font-semibold">Motivo</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {movementPage.map((movement) => {
                  const product = getProduct(movement.productId);

                  return (
                    <tr
                      key={movement.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(movement.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <strong className="font-semibold">
                          {getProductName(movement.productId)}
                        </strong>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            movement.type === "entry"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : movement.type === "exit"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {getMovementIcon(movement.type)}

                          {formatType(movement.type)}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {movement.quantity} {formatUnit(product?.unit)}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-gray-600 dark:text-gray-400">
                        {movement.reason || "Sin motivo"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination {...movementPagination} />
      </section>
    </div>
  );
}

export default Inventory;
