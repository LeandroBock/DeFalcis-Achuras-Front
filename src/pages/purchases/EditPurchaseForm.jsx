import { useState } from "react";
import { FileText, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { updatePurchase } from "../../services/api";
import { invalidation, useApiMutation } from "../../hooks/queries";
import { formatMoney, multiplyMoney, sumMoney } from "../../utils/format";
import {
  PAYMENT_METHODS,
  inputClass,
  isValidCost,
  isValidQuantity,
  labelClass,
} from "./shared";
import { formKeys } from "../../hooks/useRowNavigation";
import KeyboardHelp from "../../components/ui/KeyboardHelp";
import { CANCEL, SAVE } from "../../utils/keyboardHelp";

/**
 * Edición de una compra existente.
 * Se monta con key={purchase.id}: al cambiar de compra el estado arranca de cero.
 */

function EditPurchaseForm({
  formRef,
  purchase,
  initialItems,
  suppliers,
  products,
  onClose,
}) {
  const [supplierId, setSupplierId] = useState(purchase.supplierId ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    purchase.paymentMethod ?? "transfer",
  );
  const [notes, setNotes] = useState(purchase.notes ?? "");
  const [items, setItems] = useState(initialItems);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const update = useApiMutation(({ id, data }) => updatePurchase(id, data), {
    invalidate: invalidation.AFTER_PURCHASE,
    success: "Compra actualizada",
  });

  function getProductName(id) {
    return products.find((product) => product.id === id)?.name ?? "Producto";
  }

  function addItem() {
    if (!productId || quantity === "" || unitCost === "") {
      toast.error("Seleccioná un producto, una cantidad y un costo.");
      return;
    }

    if (!isValidQuantity(quantity) || !isValidCost(unitCost)) {
      toast.error("Ingresá una cantidad mayor que cero y un costo válido.");
      return;
    }

    if (!products.some((product) => product.id === productId)) {
      toast.error("El producto seleccionado no está disponible.");
      return;
    }

    setItems((previous) => [
      ...previous,
      {
        productId,
        productName: getProductName(productId),
        quantity: Number(quantity),
        unitCost: Number(unitCost),
      },
    ]);

    setProductId("");
    setQuantity("");
    setUnitCost("");
  }

  function updateItem(index, field, value) {
    setItems((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "productId") {
          return {
            ...item,
            productId: value,
            productName: getProductName(value),
          };
        }

        return {
          ...item,
          [field]: value === "" ? "" : Number(value),
        };
      }),
    );
  }

  function removeItem(index) {
    setItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function getSubtotal(item) {
    return multiplyMoney(item.quantity || 0, item.unitCost || 0);
  }

  const total = sumMoney(items.map(getSubtotal));

  function handleSubmit(event) {
    event.preventDefault();

    if (!supplierId) {
      toast.error("Seleccioná un proveedor.");
      return;
    }

    if (items.length === 0) {
      toast.error("La compra debe tener al menos un producto.");
      return;
    }

    const validItems = items.every(
      (item) =>
        item.productId &&
        isValidQuantity(item.quantity) &&
        isValidCost(item.unitCost),
    );

    if (!validItems) {
      toast.error("Revisá las cantidades y los costos de los productos.");
      return;
    }

    update.mutate(
      {
        id: purchase.id,
        data: {
          supplierId,
          paymentMethod,
          notes,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            unitCost: Number(item.unitCost),
          })),
        },
      },
      { onSuccess: onClose },
    );
  }

  const saving = update.isPending;

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <Pencil className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Editar compra
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Modificá los datos y los productos de la compra.
          </p>
        </div>
      </div>

      <p className="mb-5 break-all text-xs text-gray-500 dark:text-gray-400">
        Compra: {purchase.id}
      </p>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={formKeys(onClose)}
        className="flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-supplier" className={labelClass}>
              Proveedor
            </label>
            <select
              id="edit-supplier"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              required
              className={inputClass}
            >
              <option value="">Seleccioná un proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-payment-method" className={labelClass}>
              Forma de pago
            </label>
            <select
              id="edit-payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className={inputClass}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50 sm:p-5">
          <h3 className="mb-4 font-bold text-gray-900 dark:text-white">
            Productos de la compra
          </h3>

          <div className="flex flex-col gap-4">
            {items.map((item, index) => (
              <div
                key={`${item.productId}-${index}`}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`edit-item-${index}-product`}
                      className={labelClass}
                    >
                      Producto
                    </label>
                    <select
                      id={`edit-item-${index}-product`}
                      value={item.productId}
                      onChange={(event) =>
                        updateItem(index, "productId", event.target.value)
                      }
                      className={inputClass}
                    >
                      {!products.some(
                        (product) => product.id === item.productId,
                      ) && (
                        <option value={item.productId}>
                          {item.productName}
                        </option>
                      )}
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`edit-item-${index}-quantity`}
                      className={labelClass}
                    >
                      Cantidad
                    </label>
                    <input
                      id={`edit-item-${index}-quantity`}
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, "quantity", event.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`edit-item-${index}-cost`}
                      className={labelClass}
                    >
                      Costo unitario
                    </label>
                    <input
                      id={`edit-item-${index}-cost`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(event) =>
                        updateItem(index, "unitCost", event.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    title="Quitar producto"
                    aria-label={`Quitar ${item.productName}`}
                    className="flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-right text-sm text-gray-600 dark:text-gray-300">
                  Subtotal: <strong>{formatMoney(getSubtotal(item))}</strong>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Agregar otro producto
            </h4>

            <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-new-product" className={labelClass}>
                  Producto
                </label>
                <select
                  id="edit-new-product"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccioná un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-new-quantity" className={labelClass}>
                  Cantidad
                </label>
                <input
                  id="edit-new-quantity"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-new-cost" className={labelClass}>
                  Costo unitario
                </label>
                <input
                  id="edit-new-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                onClick={addItem}
                title="Agregar producto"
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-800 sm:justify-end">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Total recalculado
            </span>
            <strong className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatMoney(total)}
            </strong>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="purchase-edit-notes"
            className={`flex items-center gap-2 ${labelClass}`}
          >
            <FileText className="h-4 w-4 text-gray-400" />
            Notas y descripción
          </label>
          <textarea
            id="purchase-edit-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Observaciones de la compra"
            className={`resize-y ${inputClass}`}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="flex w-fit items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex w-fit items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>

          <KeyboardHelp items={[SAVE, CANCEL]} className="sm:ml-auto" />
        </div>
      </form>
    </section>
  );
}

export default EditPurchaseForm;
