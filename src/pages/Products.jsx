import { useRef, useState } from "react";
import { Package, Plus, Save, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import {
  createProduct,
  updateProduct,
  deactivateProduct,
} from "../services/api";
import { keys, useApiMutation, useProducts } from "../hooks/queries";
import { usePagination } from "../hooks/usePagination";
import { useShortcut } from "../hooks/useShortcut";
import { formKeys, useRowNavigation } from "../hooks/useRowNavigation";
import { useFormFocus } from "../hooks/useFormFocus";
import KeyboardHelp from "../components/ui/KeyboardHelp";
import { CANCEL, MOVE, ROW_FOCUS, SAVE } from "../utils/keyboardHelp";
import { formatMoney, roundMoney } from "../utils/format";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/ui/Pagination";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/PageStates";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  unit: "kg",
  salePrice: "",
  costPrice: "",
  stock: "",
};

function Products() {
  const { data: products = [], isLoading, error, refetch } = useProducts();
  const { pageItems, ...pagination } = usePagination(products);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDeactivate, setProductToDeactivate] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  // Teclado, como en Clientes: flechas en la tabla, Enter edita, Supr
  // desactiva, N nuevo; en el formulario Esc cancela y Ctrl+Enter guarda.
  const newButtonRef = useRef(null);
  const rows = useRowNavigation(pageItems.length, {
    fallbackRef: newButtonRef,
  });
  const { formRef, rememberFocus, restoreFocus } = useFormFocus(showForm);

  useShortcut("n", () => openNew(), { enabled: !showForm });

  function openNew() {
    rememberFocus();
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  }

  const saveProduct = useApiMutation(
    ({ id, data }) => (id ? updateProduct(id, data) : createProduct(data)),
    { invalidate: [keys.products, keys.inventory] },
  );

  const deactivate = useApiMutation(deactivateProduct, {
    invalidate: [keys.products],
    success: "Producto desactivado",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleEdit(product) {
    rememberFocus();
    setEditingProduct(product);
    setShowForm(true);

    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      unit: product.unit,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      stock: product.stock,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleDeactivate() {
    if (!productToDeactivate) {
      return;
    }

    deactivate.mutate(productToDeactivate.id, {
      onSuccess: () => {
        rows.focusAfterChange();
        setProductToDeactivate(null);
      },
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const { stock, ...fields } = formData;
    const productData = {
      ...fields,
      salePrice: roundMoney(formData.salePrice),
      costPrice: roundMoney(formData.costPrice),
      // Al editar no se manda el stock: cambiar el precio no lo toca (aunque
      // esté en negativo) y no pisa lo que descontaron las entregas mientras
      // el formulario estaba abierto. El stock se corrige en Inventario.
      ...(editingProduct ? {} : { stock: Number(stock) || 0 }),
    };

    saveProduct.mutate(
      { id: editingProduct?.id, data: productData },
      {
        onSuccess: () => {
          toast.success(
            editingProduct ? "Producto actualizado" : "Producto creado",
          );
          handleCancel();
        },
      },
    );
  }

  function handleCancel() {
    setShowForm(false);
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    restoreFocus(newButtonRef);
  }

  if (isLoading) {
    return <LoadingState icon={Package} message="Cargando productos..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="No se pudieron cargar los productos."
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
              <Package className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Gestión
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administración de productos
          </p>
        </div>

        <button
          type="button"
          ref={newButtonRef}
          onClick={() => (showForm ? handleCancel() : openNew())}
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
              Nuevo producto
            </>
          )}
        </button>
      </header>

      {/* FORMULARIO */}

      {showForm && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              {editingProduct ? "Editar producto" : "Nuevo producto"}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Completá los datos del producto.
            </p>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            onKeyDown={formKeys(handleCancel)}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* NOMBRE */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Nombre</label>

              <input
                name="name"
                placeholder="Ej: Chinchulines"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* CATEGORÍA */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Categoría</label>

              <input
                name="category"
                placeholder="Ej: Achuras"
                value={formData.category}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* DESCRIPCIÓN */}

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold">Descripción</label>

              <input
                name="description"
                placeholder="Descripción del producto"
                value={formData.description}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* UNIDAD */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Unidad de venta</label>

              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="kg">Kilogramos</option>
                <option value="unit">Unidad</option>
              </select>
            </div>

            {/* STOCK */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                {editingProduct ? "Stock actual" : "Stock inicial"}
              </label>

              {editingProduct ? (
                <p
                  className={`rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 ${
                    Number(formData.stock) < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {formData.stock}{" "}
                  <span className="text-xs text-gray-400">
                    · se ajusta desde Inventario
                  </span>
                </p>
              ) : (
                <input
                  name="stock"
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={handleChange}
                  step="0.001"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                />
              )}
            </div>

            {/* PRECIO VENTA */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Precio de venta</label>

              <input
                name="salePrice"
                type="number"
                placeholder="0"
                value={formData.salePrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* PRECIO COSTO */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Precio de costo</label>

              <input
                name="costPrice"
                type="number"
                placeholder="0"
                value={formData.costPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* BOTONES */}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center md:col-span-2 md:justify-end">
              <KeyboardHelp items={[SAVE, CANCEL]} className="sm:mr-auto" />

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
                disabled={saveProduct.isPending}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
                {editingProduct ? "Guardar cambios" : "Guardar producto"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* LISTADO */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* HEADER TABLA */}

        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h2 className="font-bold">Listado de productos</h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Productos activos
            </p>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay productos registrados"
            description="Creá el primer producto para comenzar."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Producto</th>

                  <th className="px-5 py-4 font-semibold">Categoría</th>

                  <th className="px-5 py-4 font-semibold">Unidad</th>

                  <th className="px-5 py-4 font-semibold">Precio venta</th>

                  <th className="px-5 py-4 font-semibold">Costo</th>

                  <th className="px-5 py-4 font-semibold">Stock</th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {pageItems.map((product, index) => (
                  <tr
                    key={product.id}
                    {...rows.rowProps(index, {
                      Enter: () => handleEdit(product),
                      Delete: () => setProductToDeactivate(product),
                    })}
                    className={`transition hover:bg-gray-50 dark:hover:bg-gray-800/50 ${ROW_FOCUS}`}
                  >
                    {/* PRODUCTO */}

                    <td className="px-5 py-4">
                      <div>
                        <strong className="font-semibold text-gray-900 dark:text-white">
                          {product.name}
                        </strong>

                        {product.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* CATEGORÍA */}

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {product.category}
                      </span>
                    </td>

                    {/* UNIDAD */}

                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {product.unit === "kg" ? "Kg" : "Unidad"}
                      </span>
                    </td>

                    {/* PRECIO */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatMoney(product.salePrice)}
                      </span>
                    </td>

                    {/* COSTO */}

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {formatMoney(product.costPrice)}
                    </td>

                    {/* STOCK */}

                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${
                          Number(product.stock) <= 0
                            ? "text-red-600 dark:text-red-400"
                            : Number(product.stock) <= 5
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* ACCIONES */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => handleEdit(product)}
                          title="Editar producto (Enter)"
                          aria-label={`Editar ${product.name}`}
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setProductToDeactivate(product)}
                          title="Desactivar producto (Supr)"
                          aria-label={`Desactivar ${product.name}`}
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

        {products.length > 0 && (
          <KeyboardHelp
            className="border-t border-gray-200 px-5 py-3 dark:border-gray-800"
            items={[
              MOVE,
              [["Enter"], "editar"],
              [["Supr"], "desactivar"],
              [["N"], "nuevo producto"],
            ]}
          />
        )}

        <Pagination {...pagination} />
      </section>
      <ConfirmModal
        isOpen={!!productToDeactivate}
        title="¿Desactivar producto?"
        message={
          productToDeactivate
            ? `¿Estás seguro de que querés desactivar "${productToDeactivate.name}"? El producto dejará de aparecer en el listado de productos activos.`
            : ""
        }
        onConfirm={handleDeactivate}
        onCancel={() => setProductToDeactivate(null)}
        loading={deactivate.isPending}
      />
    </div>
  );
}

export default Products;
