import { useState } from "react";
import { toast } from "sonner";
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

import { createSupplierPayment } from "../services/api";
import {
  keys,
  useApiMutation,
  usePayables,
  useSupplierPayments,
} from "../hooks/queries";
import { usePagination } from "../hooks/usePagination";
import { formKeys, useRowNavigation } from "../hooks/useRowNavigation";
import { useFormFocus } from "../hooks/useFormFocus";
import KeyboardHelp from "../components/ui/KeyboardHelp";
import { CANCEL, MOVE, ROW_FOCUS, SAVE } from "../utils/keyboardHelp";
import {
  formatDate,
  formatMoney,
  formatPaymentMethod,
  formatPaymentStatus as formatStatus,
  roundMoney,
  sumMoney,
} from "../utils/format";
import Pagination from "../components/ui/Pagination";
import { ErrorState, LoadingState } from "../components/ui/PageStates";

const EMPTY_FORM = {
  amount: "",
  method: "transfer",
  notes: "",
};

function Payables() {
  const {
    data: payables = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePayables("", "");

  const { pageItems, ...pagination } = usePagination(payables);

  // Se guarda el id y se lee la fila de la lista: así, después de un pago,
  // los importes se actualizan solos y si quedó saldada desaparece.
  const [selectedId, setSelectedId] = useState(null);
  const selectedPayable =
    payables.find((item) => item.purchaseId === selectedId) ?? null;

  const { data: paymentSummary } = useSupplierPayments(
    selectedPayable?.purchaseId,
  );

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Teclado: flechas en la tabla, Enter muestra los pagos de la compra y P
  // registra un pago (con el saldo cargado); en el formulario Esc cancela y
  // Ctrl+Enter guarda.
  const rows = useRowNavigation(pageItems.length);
  const { formRef, rememberFocus, restoreFocus } = useFormFocus(showForm);

  // Abre el pago con el saldo de la fila, sin esperar el detalle.
  function payFromRow(item) {
    rememberFocus();
    setSelectedPayable(item);
    setFormData({ amount: item.pending, method: "transfer", notes: "" });
    setShowForm(true);
  }

  const registerPayment = useApiMutation(createSupplierPayment, {
    invalidate: [keys.purchases, keys.reports],
    success: "Pago registrado correctamente.",
  });

  const saving = registerPayment.isPending;

  function setSelectedPayable(item) {
    setSelectedId(item?.purchaseId ?? null);
  }

  function handleSelectPayable(item) {
    setSelectedPayable(item);
    setShowForm(false);
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

    rememberFocus();
    setFormData({
      amount: paymentSummary.pendingAmount,
      method: "transfer",
      notes: "",
    });

    setShowForm(true);
  }

  function handleClosePayment() {
    setShowForm(false);
    setFormData(EMPTY_FORM);
    restoreFocus();
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedPayable) return;

    const amount = roundMoney(formData.amount);

    if (amount <= 0) {
      toast.error("Ingresá un importe válido.");
      return;
    }

    // El saldo del detalle si ya cargó; si no, el de la fila.
    const pending = paymentSummary?.pendingAmount ?? selectedPayable.pending;

    if (amount > roundMoney(pending)) {
      toast.error("El importe supera el saldo pendiente.");
      return;
    }

    registerPayment.mutate(
      {
        purchaseId: selectedPayable.purchaseId,
        amount,
        method: formData.method,
        notes: formData.notes || undefined,
      },
      {
        onSuccess: (result) => {
          // Saldada: sale de la lista y el foco pasa a la fila siguiente.
          if (roundMoney(result?.pendingAmount ?? 1) <= 0) {
            rows.focusAfterChange();
          }
          handleClosePayment();
        },
      },
    );
  }

  const totalPending = sumMoney(payables.map((item) => item.pending));

  if (isLoading) {
    return <LoadingState message="Cargando cuentas por pagar..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="No se pudieron cargar las cuentas por pagar."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
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
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
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
                {pageItems.map((item, index) => (
                  <tr
                    key={item.purchaseId}
                    {...rows.rowProps(index, {
                      Enter: () => handleSelectPayable(item),
                      p: () => payFromRow(item),
                    })}
                    className={`transition hover:bg-gray-50 dark:hover:bg-gray-800/50 ${ROW_FOCUS}`}
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
                        tabIndex={-1}
                        onClick={() => handleSelectPayable(item)}
                        title="Ver pagos (Enter)"
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

        {payables.length > 0 && (
          <KeyboardHelp
            className="border-t border-gray-200 px-5 py-3 dark:border-gray-800"
            items={[MOVE, [["Enter"], "ver pagos"], [["P"], "registrar pago"]]}
          />
        )}

        <Pagination {...pagination} />
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
                  paymentSummary?.paidAmount ?? selectedPayable.paid,
                )}
              </strong>
            </div>

            <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
              <span className="text-sm text-red-700 dark:text-red-400">
                Pendiente
              </span>

              <strong className="mt-1 block text-xl font-bold text-red-700 dark:text-red-400">
                {formatMoney(
                  paymentSummary?.pendingAmount ?? selectedPayable.pending,
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
              ref={formRef}
              className="max-w-xl border-b border-gray-200 p-5 dark:border-gray-800"
              onSubmit={handleSubmit}
              onKeyDown={formKeys(handleClosePayment)}
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
                    Pendiente: {formatMoney(paymentSummary?.pendingAmount)}
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
                      <option value="mercado_pago">Mercado Pago</option>
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
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <KeyboardHelp items={[SAVE, CANCEL]} className="sm:mr-auto" />

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
    </div>
  );
}

export default Payables;
