import { useState } from "react";
import {
  Ban,
  CheckCircle2,
  Plus,
  RefreshCw,
  Scale,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { deliverOrder, markOrderNotDelivered } from "../../services/api";
import CustomerInfo from "./CustomerInfo";
import { invalidation, keys, useApiMutation } from "../../hooks/queries";
import {
  formatMoney,
  formatPaymentMethod,
  formatQuantity,
  multiplyMoney,
  roundMoney,
  sumMoney,
} from "../../utils/format";

const { AFTER_SALE } = invalidation;

const METHODS = ["cash", "transfer", "mercado_pago"];

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-green-950";

/**
 * Cargar la entrega de una nota de pedido: los kilos pesados en el domicilio
 * (puede ser más o menos de lo pedido, 0 si no lo quiso, o productos que se
 * agregan en el momento) y lo cobrado, combinando métodos de pago.
 *
 * order: { id, customer: { name, address }, items: [{ productId,
 *          productName, unit, requestedQuantity, unitPrice }] }
 * products: catálogo para agregar productos en el momento.
 */
function DeliveryForm({ order, products, onDone, onClose }) {
  // Los kilos arrancan con lo pedido: el repartidor corrige con lo pesado.
  const [rows, setRows] = useState(() =>
    order.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      unit: item.unit,
      requested: Number(item.requestedQuantity),
      unitPrice: Number(item.unitPrice),
      quantity: String(Number(item.requestedQuantity)),
    })),
  );
  const [payments, setPayments] = useState([]);
  const [comment, setComment] = useState("");
  const [addingId, setAddingId] = useState("");
  const [notDeliveredReason, setNotDeliveredReason] = useState(null);
  const [error, setError] = useState("");

  const deliver = useApiMutation((data) => deliverOrder(order.id, data), {
    invalidate: [...AFTER_SALE, keys.orders],
    success: "Entrega registrada.",
    showError: false,
  });

  const notDelivered = useApiMutation(
    (reason) => markOrderNotDelivered(order.id, reason),
    {
      invalidate: [keys.orders],
      success: "Se avisó a la oficina que no se entregó.",
      showError: false,
    },
  );

  const busy = deliver.isPending || notDelivered.isPending;

  const total = sumMoney(
    rows.map((row) => multiplyMoney(Number(row.quantity) || 0, row.unitPrice)),
  );
  const collected = sumMoney(payments.map((p) => Number(p.amount) || 0));
  const pending = roundMoney(total - collected);

  const availableProducts = products.filter(
    (product) => !rows.some((row) => row.productId === product.id),
  );

  function updateRow(productId, quantity) {
    setRows((current) =>
      current.map((row) =>
        row.productId === productId ? { ...row, quantity } : row,
      ),
    );
  }

  function addProduct() {
    const product = products.find((item) => item.id === addingId);
    if (!product) return;

    setRows((current) => [
      ...current,
      {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        requested: 0,
        // El precio especial del cliente, si tiene, si no el normal.
        unitPrice:
          order.customer?.specialPrices?.[product.id] ??
          Number(product.salePrice),
        quantity: "",
      },
    ]);
    setAddingId("");
  }

  // Los agregados en el momento se pueden quitar; los de la nota se ponen en 0.
  function removeRow(productId) {
    setRows((current) => current.filter((row) => row.productId !== productId));
  }

  function addPayment(method) {
    setPayments((current) => [
      ...current,
      {
        method,
        amount: current.length === 0 && pending > 0 ? String(pending) : "",
      },
    ]);
  }

  function updatePayment(index, amount) {
    setPayments((current) =>
      current.map((payment, i) =>
        i === index ? { ...payment, amount } : payment,
      ),
    );
  }

  function removePayment(index) {
    setPayments((current) => current.filter((_, i) => i !== index));
  }

  function handleDeliver(event) {
    event.preventDefault();
    setError("");

    const items = rows.map((row) => ({
      productId: row.productId,
      quantity: Number(row.quantity) || 0,
    }));

    if (items.some((item) => item.quantity < 0)) {
      setError("Los kilos no pueden ser negativos.");
      return;
    }

    if (!items.some((item) => item.quantity > 0)) {
      setError(
        'No cargaste ningún producto entregado. Si el cliente no recibió el pedido, usá "No entregado".',
      );
      return;
    }

    const cleanPayments = payments
      .map((payment) => ({
        method: payment.method,
        amount: roundMoney(Number(payment.amount) || 0),
      }))
      .filter((payment) => payment.amount > 0);

    if (collected > total) {
      setError("Lo cobrado no puede superar el total de la entrega.");
      return;
    }

    deliver.mutate(
      { items, payments: cleanPayments, comment: comment.trim() || undefined },
      { onSuccess: onDone, onError: (err) => setError(err.message) },
    );
  }

  function handleNotDelivered(event) {
    event.preventDefault();
    if (!notDeliveredReason?.trim()) return;

    notDelivered.mutate(notDeliveredReason.trim(), {
      onSuccess: onDone,
      onError: (err) => setError(err.message),
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-950/60 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={handleDeliver}
        className="flex max-h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-xl sm:rounded-2xl dark:bg-gray-900"
      >
        {/* ENCABEZADO */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
              Cargar entrega
            </p>
            <h2 className="truncate text-lg font-bold">
              {order.customer?.name || "Cliente"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <CustomerInfo customer={order.customer} />

          {/* KILOS */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Scale className="h-5 w-5 text-gray-400" />
              Kilos entregados
            </h3>

            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.productId}
                  className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {row.requested > 0
                          ? `Pedido: ${formatQuantity(row.requested, row.unit)}`
                          : "Agregado en la entrega"}{" "}
                        · {formatMoney(row.unitPrice)} /{" "}
                        {row.unit === "kg" ? "kg" : "u."}
                      </p>
                    </div>

                    {row.requested === 0 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.productId)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label={`Quitar ${row.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <span className="sr-only">
                        {row.unit === "kg" ? "Kilos" : "Unidades"} de {row.name}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.001"
                        value={row.quantity}
                        onChange={(event) =>
                          updateRow(row.productId, event.target.value)
                        }
                        disabled={busy}
                        placeholder={row.unit === "kg" ? "Kilos" : "Unidades"}
                        className={inputClass}
                      />
                    </label>

                    <strong className="w-28 shrink-0 text-right">
                      {formatMoney(
                        multiplyMoney(Number(row.quantity) || 0, row.unitPrice),
                      )}
                    </strong>
                  </div>

                  {row.requested > 0 && Number(row.quantity) === 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      No lo llevó.
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* AGREGAR PRODUCTO */}
            {availableProducts.length > 0 && (
              <div className="mt-3 flex gap-2">
                <select
                  value={addingId}
                  onChange={(event) => setAddingId(event.target.value)}
                  disabled={busy}
                  className={inputClass}
                  aria-label="Producto para agregar"
                >
                  <option value="">Agregar un producto...</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={addProduct}
                  disabled={!addingId || busy}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
            )}
          </section>

          {/* COBRO */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Wallet className="h-5 w-5 text-gray-400" />
              Cobrado
            </h3>

            <div className="space-y-2">
              {payments.map((payment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 text-sm font-medium">
                    {formatPaymentMethod(payment.method)}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={payment.amount}
                    onChange={(event) =>
                      updatePayment(index, event.target.value)
                    }
                    disabled={busy}
                    placeholder="Importe"
                    aria-label={`Importe en ${formatPaymentMethod(payment.method)}`}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removePayment(index)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    aria-label="Quitar cobro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => addPayment(method)}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {formatPaymentMethod(method)}
                </button>
              ))}
            </div>

            {payments.length === 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Si no pagó nada, queda todo en cuenta corriente.
              </p>
            )}
          </section>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">
              Comentario (opcional)
            </span>
            <input
              type="text"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={busy}
              className={inputClass}
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </p>
          )}
        </div>

        {/* TOTALES Y ACCIONES */}
        <div className="space-y-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total</p>
              <strong className="text-base">{formatMoney(total)}</strong>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Cobrado</p>
              <strong className="text-base text-green-600 dark:text-green-400">
                {formatMoney(collected)}
              </strong>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">
                {pending < 0 ? "Sobra" : "Queda debiendo"}
              </p>
              <strong
                className={`text-base ${pending < 0 ? "text-red-600" : pending > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}
              >
                {formatMoney(Math.abs(pending))}
              </strong>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNotDeliveredReason("")}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <Ban className="h-4 w-4" />
              No entregado
            </button>

            <button
              type="submit"
              disabled={busy}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {deliver.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {deliver.isPending ? "Guardando..." : "Confirmar entrega"}
            </button>
          </div>
        </div>
      </form>

      {/* MOTIVO DE NO ENTREGA */}
      {notDeliveredReason !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-950/60 p-4">
          <form
            onSubmit={handleNotDelivered}
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900"
          >
            <h3 className="text-lg font-bold">¿Por qué no se entregó?</h3>

            <div className="flex flex-wrap gap-2">
              {["No había nadie", "No lo quiso", "Dirección incorrecta"].map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setNotDeliveredReason(reason)}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700"
                  >
                    {reason}
                  </button>
                ),
              )}
            </div>

            <input
              type="text"
              value={notDeliveredReason}
              onChange={(event) => setNotDeliveredReason(event.target.value)}
              placeholder="Motivo"
              autoFocus
              className={inputClass}
            />

            <p className="text-xs text-gray-500 dark:text-gray-400">
              La nota vuelve a la oficina para reprogramarla. No se descuenta
              stock ni se registra ningún cobro.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNotDeliveredReason(null)}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold dark:border-gray-700"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={!notDeliveredReason.trim() || notDelivered.isPending}
                className="flex-1 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default DeliveryForm;
