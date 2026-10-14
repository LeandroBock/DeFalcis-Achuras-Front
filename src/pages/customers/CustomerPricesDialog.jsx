import { useState } from "react";
import {
  AlertTriangle,
  Pencil,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import {
  keys,
  useApiMutation,
  useCustomerPrices,
  useProducts,
} from "../../hooks/queries";
import { removeCustomerPrice, setCustomerPrice } from "../../services/api";
import { formatMoney, roundMoney } from "../../utils/format";
import { ErrorState, LoadingState } from "../../components/ui/PageStates";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white";

// Diferencia con el precio normal, para ver de un vistazo el descuento (o si
// quedó desactualizado después de un aumento).
function Difference({ normal, special }) {
  if (!normal) return null;

  const percent = Math.round(((special - normal) / normal) * 100);

  if (special >= normal) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        {special === normal
          ? "Igual al normal"
          : `${percent > 0 ? "+" : ""}${percent}%`}
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold text-green-600 dark:text-green-400">
      {percent}% ({formatMoney(special - normal)})
    </span>
  );
}

/**
 * Precios especiales de un cliente: para cada producto, un monto fijo que
 * reemplaza al precio normal. Si el producto aumenta, el especial no cambia
 * hasta que se edite acá. Ventas los ve; super admin y admin los editan.
 */
function CustomerPricesDialog({ customer, canEdit, onClose }) {
  const pricesQuery = useCustomerPrices(customer.id);
  const productsQuery = useProducts();

  const prices = pricesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const [editing, setEditing] = useState(null); // productId
  const [editPrice, setEditPrice] = useState("");
  const [newProductId, setNewProductId] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const invalidate = [keys.customerPrices(customer.id)];
  const save = useApiMutation(
    ({ productId, price }) => setCustomerPrice(customer.id, productId, price),
    { invalidate, success: "Precio especial guardado" },
  );
  const remove = useApiMutation(
    (productId) => removeCustomerPrice(customer.id, productId),
    { invalidate, success: "Precio especial quitado" },
  );

  const available = products.filter(
    (product) => !prices.some((price) => price.productId === product.id),
  );
  const selectedProduct = products.find((p) => p.id === newProductId);

  function handleAdd(event) {
    event.preventDefault();
    const price = roundMoney(newPrice);
    if (!newProductId || price <= 0) return;

    save.mutate(
      { productId: newProductId, price },
      {
        onSuccess: () => {
          setNewProductId("");
          setNewPrice("");
        },
      },
    );
  }

  function handleEdit(event, productId) {
    event.preventDefault();
    const price = roundMoney(editPrice);
    if (price <= 0) return;

    save.mutate({ productId, price }, { onSuccess: () => setEditing(null) });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-800">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <Tag className="h-4 w-4" />
              Precios especiales
            </p>
            <h2 className="text-lg font-bold">{customer.name}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              En los demás productos paga el precio normal. Si aumentás un
              producto, su precio especial no cambia hasta que lo edites.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {pricesQuery.isLoading ? (
            <LoadingState message="Cargando precios..." />
          ) : pricesQuery.error ? (
            <ErrorState
              message={pricesQuery.error.message}
              onRetry={pricesQuery.refetch}
            />
          ) : prices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              Este cliente paga el precio normal en todos los productos.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-right">Normal</th>
                  <th className="pb-2 text-right">Especial</th>
                  <th className="pb-2 text-right">Diferencia</th>
                  {canEdit && <th className="pb-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {prices.map((price) => (
                  <tr key={price.productId}>
                    <td className="py-2.5 font-medium">{price.productName}</td>
                    <td className="py-2.5 text-right text-gray-500">
                      {formatMoney(price.normalPrice)}
                    </td>
                    <td className="py-2.5 text-right">
                      {editing === price.productId ? (
                        <form
                          onSubmit={(event) =>
                            handleEdit(event, price.productId)
                          }
                          className="flex justify-end gap-1"
                        >
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editPrice}
                            onChange={(event) =>
                              setEditPrice(event.target.value)
                            }
                            autoFocus
                            aria-label={`Precio especial de ${price.productName}`}
                            className={`${inputClass} w-28 text-right`}
                          />
                          <button
                            type="submit"
                            disabled={save.isPending}
                            className="rounded-lg bg-gray-900 p-2 text-white dark:bg-white dark:text-gray-900"
                            aria-label="Guardar"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        </form>
                      ) : (
                        <strong>{formatMoney(price.price)}</strong>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Difference
                        normal={price.normalPrice}
                        special={price.price}
                      />
                    </td>
                    {canEdit && (
                      <td className="py-2.5 pl-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(price.productId);
                              setEditPrice(String(price.price));
                            }}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            aria-label={`Editar precio de ${price.productName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove.mutate(price.productId)}
                            disabled={remove.isPending}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            aria-label={`Quitar precio especial de ${price.productName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {canEdit && (
          <form
            onSubmit={handleAdd}
            className="grid gap-2 border-t border-gray-200 bg-gray-50 p-5 sm:grid-cols-[2fr_1fr_auto] sm:items-end dark:border-gray-800 dark:bg-gray-950"
          >
            <label className="text-sm">
              <span className="mb-1 block font-semibold">Producto</span>
              <select
                value={newProductId}
                onChange={(event) => setNewProductId(event.target.value)}
                className={inputClass}
              >
                <option value="">Elegí un producto</option>
                {available.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — normal {formatMoney(product.salePrice)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Precio especial</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={newPrice}
                onChange={(event) => setNewPrice(event.target.value)}
                placeholder={
                  selectedProduct
                    ? String(Number(selectedProduct.salePrice))
                    : ""
                }
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              disabled={
                !newProductId || !(Number(newPrice) > 0) || save.isPending
              }
              className="flex items-center justify-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CustomerPricesDialog;
