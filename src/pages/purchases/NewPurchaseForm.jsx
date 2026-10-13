import { useState } from "react";
import {
  ClipboardList,
  CreditCard,
  FileText,
  Package,
  Plus,
  Save,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { createPurchase } from "../../services/api";
import { invalidation, useApiMutation } from "../../hooks/queries";
import {
  formatMoney,
  multiplyMoney,
  roundMoney,
  sumMoney,
} from "../../utils/format";
import {
  PAYMENT_METHODS,
  inputClass,
  isValidCost,
  isValidQuantity,
  labelClass,
} from "./shared";

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

function NewPurchaseForm({ suppliers, products, onClose }) {
  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [notes, setNotes] = useState("");

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [items, setItems] = useState([]);

  const create = useApiMutation(createPurchase, {
    invalidate: invalidation.AFTER_PURCHASE,
    success: "Compra registrada",
  });

  function addItem() {
    if (!productId || !quantity || unitCost === "") {
      toast.error("Seleccioná un producto, cantidad y costo.");
      return;
    }

    if (!isValidQuantity(quantity) || !isValidCost(unitCost)) {
      toast.error("Ingresá una cantidad mayor que cero y un costo válido.");
      return;
    }

    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    setItems([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        quantity: Number(quantity),
        unitCost: roundMoney(unitCost),
        subtotal: multiplyMoney(quantity, unitCost),
      },
    ]);

    setProductId("");
    setQuantity("");
    setUnitCost("");
  }

  function removeItem(index) {
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  // Total estimado: el importe definitivo lo calcula el backend
  const total = sumMoney(items.map((item) => item.subtotal));

  function handleSubmit(event) {
    event.preventDefault();

    if (!supplierId) {
      toast.error("Seleccioná un proveedor.");
      return;
    }

    if (items.length === 0) {
      toast.error("Agregá al menos un producto.");
      return;
    }

    create.mutate(
      {
        supplierId,
        paymentMethod,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
      { onSuccess: onClose },
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <ClipboardList className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Nueva compra
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registrá una compra realizada a un proveedor.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* PROVEEDOR + FORMA DE PAGO */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="supplier"
              className={`flex items-center gap-2 ${labelClass}`}
            >
              <Truck className="h-4 w-4 text-gray-400" />
              Proveedor
            </label>

            <select
              id="supplier"
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
            <label
              htmlFor="paymentMethod"
              className={`flex items-center gap-2 ${labelClass}`}
            >
              <CreditCard className="h-4 w-4 text-gray-400" />
              Forma de pago
            </label>

            <select
              id="paymentMethod"
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

        {/* PRODUCTOS */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50 sm:p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                Agregar productos
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Agregá los productos incluidos en esta compra.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="flex flex-col gap-2">
              <label htmlFor="product" className={labelClass}>
                Producto
              </label>

              <select
                id="product"
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
              <label htmlFor="quantity" className={labelClass}>
                Cantidad
              </label>

              <input
                id="quantity"
                type="number"
                min="0.001"
                step="0.001"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Ej: 10"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="unitCost" className={labelClass}>
                Costo unitario
              </label>

              <input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
                placeholder="Ej: 4000"
                className={inputClass}
              />
            </div>

            <button
              type="button"
              onClick={addItem}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>

          {/* ITEMS */}
          {items.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                      <th className={thClass}>Producto</th>
                      <th className={thClass}>Cantidad</th>
                      <th className={thClass}>Costo unitario</th>
                      <th className={thClass}>Subtotal</th>
                      <th className={thClass}>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => (
                      <tr
                        key={`${item.productId}-${index}`}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          {item.productName}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.quantity}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatMoney(item.unitCost)}
                        </td>

                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatMoney(item.subtotal)}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            title="Eliminar producto"
                            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTAL */}
              <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/50 sm:justify-end">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Total
                </span>

                <strong className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatMoney(total)}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* NOTAS */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="notes"
            className={`flex items-center gap-2 ${labelClass}`}
          >
            <FileText className="h-4 w-4 text-gray-400" />
            Notas
          </label>

          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notas de la compra"
            rows={4}
            className={`resize-y ${inputClass}`}
          />
        </div>

        {/* ACCIONES */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={create.isPending}
            className="flex w-fit items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Save className="h-4 w-4" />
            {create.isPending ? "Guardando..." : "Guardar compra"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex w-fit items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}

export default NewPurchaseForm;
