import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileText,
  History,
  Plus,
  RefreshCw,
  Save,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import {
  getOrders,
  getCustomers,
  getOrderPayments,
  createPayment,
} from "../services/api";


function Payments() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transfer");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [ordersData, customersData] = await Promise.all([
        getOrders(),
        getCustomers(),
      ]);

      setOrders(ordersData);
      setCustomers(customersData);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  function getCustomerName(customerId) {
    const customer = customers.find(
      (item) => item.id === customerId,
    );

    return customer?.name || "Cliente desconocido";
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(value));
  }

  function formatPaymentMethod(method) {
    const methods = {
      cash: "Efectivo",
      transfer: "Transferencia",
      mercado_pago: "Mercado Pago",
    };

    return methods[method] || method;
  }

  function formatPaymentStatus(status) {
    const statuses = {
      pending: "Pendiente",
      partial: "Parcial",
      paid: "Pagado",
    };

    return statuses[status] || status;
  }

  async function handleSelectOrder(order) {
    try {
      setSelectedOrder(order);
      setShowForm(false);
      setPaymentSummary(null);

      const summary = await getOrderPayments(order.id);
      setPaymentSummary(summary);
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "No se pudo obtener el estado de los pagos",
      );
    }
  }

  function handleOpenPaymentForm() {
    if (!paymentSummary) {
      return;
    }

    setAmount(paymentSummary.pendingAmount);
    setMethod("transfer");
    setNotes("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedOrder) {
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Ingresá un monto válido.");
      return;
    }

    if (
      Number(amount) >
      Number(paymentSummary.pendingAmount)
    ) {
      alert("El monto supera el saldo pendiente.");
      return;
    }

    try {
      setSaving(true);

      const result = await createPayment({
        orderId: selectedOrder.id,
        amount: Number(amount),
        method,
        notes,
      });

      setPaymentSummary({
        ...paymentSummary,
        paymentStatus: result.paymentStatus,
        paidAmount: result.paidAmount,
        pendingAmount: result.pendingAmount,
      });

      setOrders(
        orders.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                paymentStatus: result.paymentStatus,
              }
            : order,
        ),
      );

      setShowForm(false);
      setAmount("");
      setNotes("");

      alert("Pago registrado correctamente.");
    } catch (error) {
      console.error(error);
      alert(
        error.message || "No se pudo registrar el pago",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleClosePayment() {
    setShowForm(false);
    setAmount("");
    setNotes("");
  }

  function getStatusClasses(status) {
    const classes = {
      paid: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
      partial:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
    };

    return (
      classes[status] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Cargando pagos...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <CircleDollarSign className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pagos
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestión de cobros de las ventas
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.5fr)]">
        {/* VENTAS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Ventas</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Seleccioná una venta para gestionar sus pagos
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {orders.length} ventas
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <WalletCards className="h-5 w-5" />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay ventas registradas.
              </p>
            </div>
          ) : (
            <div className="flex max-h-[650px] flex-col gap-2 overflow-y-auto pr-1">
              {orders.map((order) => {
                const isSelected =
                  selectedOrder?.id === order.id;

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => handleSelectOrder(order)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-gray-900 bg-gray-50 shadow-sm dark:border-white dark:bg-gray-800"
                        : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              isSelected
                                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            <UserRound className="h-4 w-4" />
                          </div>

                          <strong className="truncate text-sm">
                            {getCustomerName(
                              order.customerId,
                            )}
                          </strong>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <CalendarDays className="h-3.5 w-3.5" />

                          {new Date(
                            order.createdAt,
                          ).toLocaleDateString("es-AR")}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <strong className="text-sm">
                          {formatMoney(order.total)}
                        </strong>

                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusClasses(
                            order.paymentStatus,
                          )}`}
                        >
                          {formatPaymentStatus(
                            order.paymentStatus,
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* DETALLE DEL PAGO */}
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          {!selectedOrder ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                <CreditCard className="h-7 w-7" />
              </div>

              <h2 className="text-lg font-bold">
                Seleccioná una venta
              </h2>

              <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Elegí una venta para consultar sus pagos.
              </p>
            </div>
          ) : (
            <>
              {/* CABECERA DEL DETALLE */}
              <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Cliente
                  </span>

                  <div className="mt-1 flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-gray-400" />

                    <h2 className="text-xl font-bold">
                      {getCustomerName(
                        selectedOrder.customerId,
                      )}
                    </h2>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                    paymentSummary?.paymentStatus ||
                      selectedOrder.paymentStatus,
                  )}`}
                >
                  {formatPaymentStatus(
                    paymentSummary?.paymentStatus ||
                      selectedOrder.paymentStatus,
                  )}
                </span>
              </div>

              {/* RESUMEN */}
              <div className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Total venta
                  </span>

                  <strong className="mt-1 block text-xl">
                    {formatMoney(selectedOrder.total)}
                  </strong>
                </div>

                <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/20">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Pagado
                  </span>

                  <strong className="mt-1 block text-xl text-green-700 dark:text-green-400">
                    {formatMoney(
                      paymentSummary?.paidAmount || 0,
                    )}
                  </strong>
                </div>

                <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">
                    Pendiente
                  </span>

                  <strong className="mt-1 block text-xl text-red-700 dark:text-red-400">
                    {formatMoney(
                      paymentSummary?.pendingAmount ||
                        selectedOrder.total,
                    )}
                  </strong>
                </div>
              </div>

              {/* BOTÓN REGISTRAR */}
              {!showForm ? (
                <button
                  type="button"
                  onClick={handleOpenPaymentForm}
                  disabled={
                    paymentSummary?.pendingAmount <= 0
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {paymentSummary?.pendingAmount <= 0 ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Venta pagada
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Registrar pago
                    </>
                  )}
                </button>
              ) : (
                <form
                  className="rounded-xl border border-gray-200 p-5 dark:border-gray-700"
                  onSubmit={handleSubmit}
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">
                        Registrar pago
                      </h3>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Cargá los datos del cobro recibido.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClosePayment}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                      aria-label="Cancelar registro de pago"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* MONTO */}
                  <div className="mb-4 space-y-2">
                    <label
                      htmlFor="amount"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <CircleDollarSign className="h-4 w-4 text-gray-400" />
                      Monto
                    </label>

                    <input
                      id="amount"
                      type="number"
                      min="0.01"
                      max={paymentSummary?.pendingAmount}
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-gray-500 dark:focus:ring-gray-800"
                    />

                    <small className="text-xs text-gray-500 dark:text-gray-400">
                      Pendiente:{" "}
                      {formatMoney(
                        paymentSummary?.pendingAmount || 0,
                      )}
                    </small>
                  </div>

                  {/* MÉTODO */}
                  <div className="mb-4 space-y-2">
                    <label
                      htmlFor="method"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      Método de pago
                    </label>

                    <select
                      id="method"
                      value={method}
                      onChange={(event) =>
                        setMethod(event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-gray-500 dark:focus:ring-gray-800"
                    >
                      <option value="cash">
                        Efectivo
                      </option>
                      <option value="transfer">
                        Transferencia
                      </option>
                      <option value="mercado_pago">
                        Mercado Pago
                      </option>
                    </select>
                  </div>

                  {/* NOTAS */}
                  <div className="mb-5 space-y-2">
                    <label
                      htmlFor="notes"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <FileText className="h-4 w-4 text-gray-400" />
                      Notas
                    </label>

                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      placeholder="Ej: Seña, pago total..."
                      rows={3}
                      className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-gray-500 dark:focus:ring-gray-800"
                    />
                  </div>

                  {/* GUARDAR */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Registrar pago
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* HISTORIAL */}
              {paymentSummary?.payments?.length > 0 && (
                <div className="mt-7">
                  <div className="mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-500" />

                    <h3 className="font-bold">
                      Historial de pagos
                    </h3>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="min-w-[650px] w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/70">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Fecha
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Monto
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Método
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Notas
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {paymentSummary.payments.map(
                          (payment) => (
                            <tr
                              key={payment.id}
                              className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                            >
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-gray-400" />

                                  {new Date(
                                    payment.createdAt,
                                  ).toLocaleDateString(
                                    "es-AR",
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                                {formatMoney(
                                  payment.amount,
                                )}
                              </td>

                              <td className="px-4 py-3 text-sm">
                                {formatPaymentMethod(
                                  payment.method,
                                )}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {payment.notes ||
                                  "Sin notas"}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Payments;