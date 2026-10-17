import { useId, useRef, useState } from "react";
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
  useCustomerPricing,
  useProducts,
} from "../../hooks/queries";
import { removeCustomerPrice, setCustomerPrice } from "../../services/api";
import { formatMoney, roundMoney } from "../../utils/format";
import Modal from "../../components/Modal";
import { ErrorState, LoadingState } from "../../components/ui/PageStates";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white";

const DISCOUNT = "discount";
const FIXED = "fixed";

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

// { price } o { discountPercent } según el modo elegido.
function toPayload(mode, value) {
  const number = roundMoney(value);
  if (!(number > 0)) return null;
  if (mode === DISCOUNT) {
    return number <= 100 ? { discountPercent: number } : null;
  }
  return { price: number };
}

function ModeSelect({ value, onChange, label }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className={`${inputClass} w-auto`}
    >
      <option value={DISCOUNT}>% desc.</option>
      <option value={FIXED}>$ fijo</option>
    </select>
  );
}

/**
 * Precios especiales de un cliente, por producto: un porcentaje de descuento
 * que se aplica DESPUÉS del precio de su lista (o del normal si no tiene
 * lista), o un precio fijo que reemplaza a todo. Ventas los ve; super admin y
 * admin los editan.
 */
function CustomerPricesDialog({ customer, canEdit, onClose }) {
  const titleId = useId();
  const pricesQuery = useCustomerPrices(customer.id);
  const pricingQuery = useCustomerPricing(customer.id);
  const productsQuery = useProducts();

  const prices = pricesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const priceList = pricingQuery.data?.priceList ?? null;
  const pricing = pricingQuery.data?.prices ?? {};

  const [editing, setEditing] = useState(null); // productId
  const [editMode, setEditMode] = useState(DISCOUNT);
  const [editValue, setEditValue] = useState("");
  const [newProductId, setNewProductId] = useState("");
  const [newMode, setNewMode] = useState(DISCOUNT);
  const [newValue, setNewValue] = useState("");

  // Para no perder el foco cuando desaparece el elemento enfocado (al guardar
  // una edición o quitar un precio).
  const productSelectRef = useRef(null);
  const focusEditButton = (productId) =>
    requestAnimationFrame(() =>
      document.querySelector(`[data-edit-price="${productId}"]`)?.focus(),
    );
  const focusProductSelect = () =>
    requestAnimationFrame(() => productSelectRef.current?.focus());

  const invalidate = [
    keys.customerPrices(customer.id),
    keys.customerPricing(customer.id),
  ];
  const save = useApiMutation(
    ({ productId, data }) => setCustomerPrice(customer.id, productId, data),
    { invalidate, success: "Precio especial guardado" },
  );
  const remove = useApiMutation(
    (productId) => removeCustomerPrice(customer.id, productId),
    { invalidate, success: "Precio especial quitado" },
  );

  const available = products.filter(
    (product) => !prices.some((price) => price.productId === product.id),
  );

  // Precio de lista de un producto sin precio especial (o el normal).
  const listPriceOf = (product) =>
    pricing[product.id]?.price ?? Number(product.salePrice);

  const selectedProduct = products.find((p) => p.id === newProductId);
  const selectedListPrice = selectedProduct
    ? listPriceOf(selectedProduct)
    : null;
  const newPayload = toPayload(newMode, newValue);
  const preview =
    selectedListPrice !== null && newPayload
      ? (newPayload.price ??
        roundMoney(selectedListPrice * (1 - newPayload.discountPercent / 100)))
      : null;

  function handleAdd(event) {
    event.preventDefault();
    if (!newProductId || !newPayload) return;

    save.mutate(
      { productId: newProductId, data: newPayload },
      {
        onSuccess: () => {
          setNewProductId("");
          setNewValue("");
          focusProductSelect();
        },
      },
    );
  }

  function handleEdit(event, productId) {
    event.preventDefault();
    const data = toPayload(editMode, editValue);
    if (!data) return;

    save.mutate(
      { productId, data },
      {
        onSuccess: () => {
          setEditing(null);
          focusEditButton(productId);
        },
      },
    );
  }

  return (
    <Modal
      onClose={onClose}
      closeDisabled={save.isPending || remove.isPending}
      labelledBy={titleId}
      className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-800">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Tag className="h-4 w-4" />
            Precios especiales
          </p>
          <h2 id={titleId} className="text-lg font-bold">
            {customer.name}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {priceList ? (
              <>
                Se le cobra con la lista <strong>{priceList.name}</strong>. El
                descuento de cada producto se aplica después del precio de la
                lista.
              </>
            ) : (
              "No tiene lista de precios: el descuento se aplica sobre el precio normal."
            )}{" "}
            Un precio fijo no cambia hasta que lo edites.
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
            {priceList
              ? `Este cliente paga el precio de la lista ${priceList.name} en todos los productos.`
              : "Este cliente paga el precio normal en todos los productos."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-right">Normal</th>
                  {priceList && <th className="pb-2 text-right">Lista</th>}
                  <th className="pb-2 text-right">Especial</th>
                  <th className="pb-2 text-right">Paga</th>
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
                    {priceList && (
                      <td className="py-2.5 text-right text-gray-500">
                        {formatMoney(price.listPrice)}
                      </td>
                    )}
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
                            max={editMode === DISCOUNT ? "100" : undefined}
                            step="0.01"
                            value={editValue}
                            onChange={(event) =>
                              setEditValue(event.target.value)
                            }
                            autoFocus
                            // Esc cancela la edición (no cierra el diálogo).
                            data-own-escape
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                event.preventDefault();
                                setEditing(null);
                                focusEditButton(price.productId);
                              }
                            }}
                            aria-label={`Precio especial de ${price.productName}`}
                            className={`${inputClass} w-24 text-right`}
                          />
                          <ModeSelect
                            value={editMode}
                            onChange={setEditMode}
                            label={`Tipo de precio especial de ${price.productName}`}
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
                      ) : price.discountPercent !== null ? (
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          −{price.discountPercent}%
                        </span>
                      ) : (
                        <span className="font-semibold">
                          Fijo {formatMoney(price.fixedPrice)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <strong>{formatMoney(price.price)}</strong>
                      <div>
                        <Difference
                          normal={price.normalPrice}
                          special={price.price}
                        />
                      </div>
                    </td>
                    {canEdit && (
                      <td className="py-2.5 pl-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const isDiscount = price.discountPercent !== null;
                              setEditing(price.productId);
                              setEditMode(isDiscount ? DISCOUNT : FIXED);
                              setEditValue(
                                String(
                                  isDiscount
                                    ? price.discountPercent
                                    : price.fixedPrice,
                                ),
                              );
                            }}
                            data-edit-price={price.productId}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            aria-label={`Editar precio de ${price.productName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              remove.mutate(price.productId, {
                                onSuccess: focusProductSelect,
                              })
                            }
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
          </div>
        )}
      </div>

      {canEdit && (
        <form
          onSubmit={handleAdd}
          className="space-y-2 border-t border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950"
        >
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto_auto] sm:items-end">
            <label className="text-sm">
              <span className="mb-1 block font-semibold">Producto</span>
              <select
                ref={productSelectRef}
                value={newProductId}
                onChange={(event) => setNewProductId(event.target.value)}
                className={inputClass}
              >
                <option value="">Elegí un producto</option>
                {available.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {priceList ? "lista" : "normal"}{" "}
                    {formatMoney(listPriceOf(product))}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">
                {newMode === DISCOUNT ? "Descuento (%)" : "Precio fijo"}
              </span>
              <input
                type="number"
                min="0.01"
                max={newMode === DISCOUNT ? "100" : undefined}
                step="0.01"
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                placeholder={
                  newMode === DISCOUNT
                    ? "Ej: 5"
                    : selectedListPrice !== null
                      ? String(selectedListPrice)
                      : ""
                }
                className={inputClass}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Tipo</span>
              <ModeSelect
                value={newMode}
                onChange={setNewMode}
                label="Tipo de precio especial"
              />
            </label>

            <button
              type="submit"
              disabled={!newProductId || !newPayload || save.isPending}
              className="flex items-center justify-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>

          {preview !== null && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Va a pagar <strong>{formatMoney(preview)}</strong>
              {newPayload?.discountPercent
                ? ` (${formatMoney(selectedListPrice)} ${priceList ? "de la lista" : "normal"} − ${newPayload.discountPercent}%)`
                : ""}
              .
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}

export default CustomerPricesDialog;
