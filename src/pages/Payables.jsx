import { useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Eye,
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
  getPayables,
  getSupplierPayments,
  createSupplierPayment,
} from "../services/api";


function Payables() {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    method: "transfer",
    notes: "",
  });

  async function loadPayables() {
    try {
      setLoading(true);
      setError("");

      const data = await getPayables();
      setPayables(data);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar las cuentas por pagar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayables();
  }, []);

  async function handleSelectPayable(item) {
    try {
      setSelectedPayable(item);
      setShowForm(false);
      setPaymentSummary(null);

      const data = await getSupplierPayments(item.purchaseId);

      setPaymentSummary(data);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron obtener los pagos.");
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleOpenPaymentForm() {
    if (!paymentSummary) return;

    setFormData({
      amount: paymentSummary.pendingAmount,
      method: "transfer",
      notes: "",
    });

    setShowForm(true);
  }

  function handleClosePayment() {
    setShowForm(false);

    setFormData({
      amount: "",
      method: "transfer",
      notes: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedPayable) return;

    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Ingresá un importe válido.");
      return;
    }

    if (
      Number(formData.amount) >
      Number(paymentSummary.pendingAmount)
    ) {
      alert("El importe supera el saldo pendiente.");
      return;
    }

    try {
      setSaving(true);

      await createSupplierPayment({
        purchaseId: selectedPayable.purchaseId,
        amount: Number(formData.amount),
        method: formData.method,
        notes: formData.notes || undefined,
      });

      await loadPayables();

      const updatedSummary = await getSupplierPayments(
        selectedPayable.purchaseId,
      );

      if (Number(updatedSummary.pendingAmount) <= 0) {
        setSelectedPayable(null);
        setPaymentSummary(null);
        setShowForm(false);
      } else {
        setPaymentSummary(updatedSummary);

        setSelectedPayable({
          ...selectedPayable,
          paid: Number(updatedSummary.paidAmount),
          pending: Number(updatedSummary.pendingAmount),
          paymentStatus: updatedSummary.paymentStatus,
        });

        setShowForm(false);
      }

      setFormData({
        amount: "",
        method: "transfer",
        notes: "",
      });

      alert("Pago registrado correctamente.");
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo registrar el pago.");
    } finally {
      setSaving(false);
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(value || 0));
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("es-AR");
  }

  function formatPaymentMethod(method) {
    const methods = {
      cash: "Efectivo",
      transfer: "Transferencia",
      mercado_pago: "Mercado Pago",
    };

    return methods[method] || method;
  }

  function formatStatus(status) {
    const statuses = {
      pending: "Pendiente",
      partial: "Parcial",
      paid: "Pagado",
    };

    return statuses[status] || status;
  }

  const totalPending = payables.reduce(
    (sum, item) => sum + Number(item.pending),
    0,
  );

  if (loading) {
    return (
      <main className="min-h-screen p-5 md:p-8">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Cargando cuentas por pagar...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-5 md:p-8">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 p-5 md:p-8">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <WalletCards className="h-7 w-7" />
            Cuentas por pagar
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Compras con pagos pendientes a proveedores
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayables}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </header>

      {/* SUMMARY */}
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Compras pendientes
              </span>

              <strong className="mt-2 block text-3xl font-bold text-gray-900 dark:text-white">
                {payables.length}
              </strong>
            </div>

            <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
              <WalletCards className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total por pagar
              </span>

              <strong className="mt-2 block text-3xl font-bold text-red-600 dark:text-red-400">
                {formatMoney(totalPending)}
              </strong>
            </div>

            <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/30">
              <CircleDollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </article>
      </section>

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detalle de cuentas pendientes
          </h2>
        </div>

        {payables.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No hay cuentas pendientes
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Todas las compras registradas están pagadas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Proveedor
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Fecha
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Compra
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Total
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Pagado
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Pendiente
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Estado
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payables.map((item) => (
                  <tr
                    key={item.purchaseId}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                          <UserRound className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>

                        <strong className="text-gray-900 dark:text-white">
                          {item.supplierName}
                        </strong>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        {formatDate(item.purchaseDate)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {item.purchaseId.slice(0, 8)}...
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                      {formatMoney(item.total)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-green-600 dark:text-green-400">
                      {formatMoney(item.paid)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-red-600 dark:text-red-400">
                      {formatMoney(item.pending)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.paymentStatus === "pending"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            : item.paymentStatus === "partial"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                        }`}
                      >
                        {item.paymentStatus === "paid" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}

                        {formatStatus(item.paymentStatus)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleSelectPayable(item)}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                      >
                        <Eye className="h-4 w-4" />
                        Ver pagos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DETAIL */}
      {selectedPayable && (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* DETAIL HEADER */}
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Proveedor
              </span>

              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <UserRound className="h-5 w-5" />
                {selectedPayable.supplierName}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedPayable(null);
                setPaymentSummary(null);
                setShowForm(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </div>

          {/* DETAIL SUMMARY */}
          <div className="grid gap-4 border-b border-gray-200 p-5 sm:grid-cols-3 dark:border-gray-800">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total
              </span>

              <strong className="mt-1 block text-xl font-bold text-gray-900 dark:text-white">
                {formatMoney(selectedPayable.total)}
              </strong>
            </div>

            <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/20">
              <span className="text-sm text-green-700 dark:text-green-400">
                Pagado
              </span>

              <strong className="mt-1 block text-xl font-bold text-green-700 dark:text-green-400">
                {formatMoney(
                  paymentSummary?.paidAmount || selectedPayable.paid,
                )}
              </strong>
            </div>

            <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
              <span className="text-sm text-red-700 dark:text-red-400">
                Pendiente
              </span>

              <strong className="mt-1 block text-xl font-bold text-red-700 dark:text-red-400">
                {formatMoney(
                  paymentSummary?.pendingAmount ||
                    selectedPayable.pending,
                )}
              </strong>
            </div>
          </div>

          {/* NEW PAYMENT */}
          {!showForm ? (
            <div className="p-5">
              <button
                type="button"
                onClick={handleOpenPaymentForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
                Registrar pago
              </button>
            </div>
          ) : (
            <form
              className="max-w-xl border-b border-gray-200 p-5 dark:border-gray-800"
              onSubmit={handleSubmit}
            >
              <div className="mb-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <CreditCard className="h-5 w-5" />
                  Registrar pago
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Registrá un pago para reducir el saldo pendiente.
                </p>
              </div>

              <div className="space-y-5">
                {/* AMOUNT */}
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Importe
                  </label>

                  <div className="relative">
                    <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      max={paymentSummary?.pendingAmount}
                      step="0.01"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
                    />
                  </div>

                  <small className="mt-1.5 block text-xs text-gray-500 dark:text-gray-400">
                    Pendiente:{" "}
                    {formatMoney(paymentSummary?.pendingAmount)}
                  </small>
                </div>

                {/* METHOD */}
                <div>
                  <label
                    htmlFor="method"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Forma de pago
                  </label>

                  <div className="relative">
                    <Banknote className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <select
                      id="method"
                      name="method"
                      value={formData.method}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="mercado_pago">
                        Mercado Pago
                      </option>
                    </select>
                  </div>
                </div>

                {/* NOTES */}
                <div>
                  <label
                    htmlFor="notes"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Notas
                  </label>

                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />

                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Ej: Pago parcial"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleClosePayment}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
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
                </div>
              </div>
            </form>
          )}

          {/* PAYMENT HISTORY */}
          {paymentSummary?.payments?.length > 0 && (
            <div className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <History className="h-5 w-5" />
                Historial de pagos
              </h3>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Fecha
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Importe
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Forma de pago
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                        Notas
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paymentSummary.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {formatDate(payment.createdAt)}
                        </td>

                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          {formatMoney(payment.amount)}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <CreditCard className="h-3.5 w-3.5" />
                            {formatPaymentMethod(payment.method)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {payment.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Payables;