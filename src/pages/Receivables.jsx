import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileText,
  Plus,
  RefreshCw,
  Save,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { createPayment } from "../services/api";
import {
  invalidation,
  useApiMutation,
  useOrderPayments,
  useReceivables,
} from "../hooks/queries";
import { usePagination } from "../hooks/usePagination";
import { formKeys, useRowNavigation } from "../hooks/useRowNavigation";
import { useFormFocus } from "../hooks/useFormFocus";
import KeyboardHelp from "../components/ui/KeyboardHelp";
import { CANCEL, MOVE, ROW_FOCUS, SAVE } from "../utils/keyboardHelp";
import { formatDate, formatMoney, roundMoney, sumMoney } from "../utils/format";
import Pagination from "../components/ui/Pagination";
import { ErrorState, LoadingState } from "../components/ui/PageStates";

const { AFTER_SALE } = invalidation;

function Receivables() {
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transfer");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const {
    data: receivables = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useReceivables("", "");

  const { pageItems, ...pagination } = usePagination(receivables);

  // Estado de pagos de la venta seleccionada
  const { data: paymentSummary } = useOrderPayments(
    selectedReceivable?.orderId,
  );

  // Teclado: flechas en la tabla y Enter abre el pago de esa venta (con el
  // saldo pendiente cargado); en el formulario Esc cancela y Ctrl+Enter guarda.
  const rows = useRowNavigation(pageItems.length);
  const { formRef, rememberFocus, restoreFocus } = useFormFocus(showForm);
  // Abre el pago con el saldo de la fila, sin esperar el detalle.
  function payFromRow(item) {
    rememberFocus();
    setSelectedReceivable(item);
    setAmount(item.pending);
    setMethod("transfer");
    setNotes("");
    setShowForm(true);
  }

  const registerPayment = useApiMutation(createPayment, {
    invalidate: AFTER_SALE,
    success: "Pago registrado correctamente.",
  });

  function handleSelectReceivable(item) {
    setSelectedReceivable(item);
    setShowForm(false);
  }

  function handleOpenPaymentForm() {
    if (!paymentSummary) {
      return;
    }

    rememberFocus();
    setAmount(paymentSummary.pendingAmount);
    setMethod("transfer");
    setNotes("");
    setShowForm(true);
  }

  function handleClosePayment() {
    setShowForm(false);
    setAmount("");
    setNotes("");
    restoreFocus();
  }

  function handleSubmitPayment(event) {
    event.preventDefault();

    if (!selectedReceivable) {
      return;
    }

    const value = roundMoney(amount);

    if (value <= 0) {
      toast.error("Ingresá un monto válido.");
      return;
    }

    // El saldo del detalle si ya cargó; si no, el de la fila.
    const pending = paymentSummary?.pendingAmount ?? selectedReceivable.pending;

    if (value > roundMoney(pending)) {
      toast.error("El monto supera el saldo pendiente.");
      return;
    }

    registerPayment.mutate(
      {
        orderId: selectedReceivable.orderId,
        amount: value,
        method,
        notes,
      },
      {
        onSuccess: (result) => {
          handleClosePayment();

          // Saldada: sale de la lista
          if (roundMoney(result.pendingAmount) <= 0) {
            rows.focusAfterChange();
            setSelectedReceivable(null);
          }
        },
      },
    );
  }

  const saving = registerPayment.isPending;

  const totalPending = sumMoney(receivables.map((item) => item.pending));

  const totalReceivables = receivables.length;

  if (isLoading) {
    return <LoadingState message="Cargando cuentas por cobrar..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="No se pudieron cargar las cuentas por cobrar."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Cuentas por cobrar
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ventas con pagos pendientes de clientes
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Actualizar
        </button>
      </header>

      {/* RESUMEN */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <UserRound className="h-5 w-5" />
            </div>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Clientes / ventas pendientes
            </span>
          </div>

          <strong className="text-3xl font-bold">{totalReceivables}</strong>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <CircleDollarSign className="h-5 w-5" />
            </div>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total por cobrar
            </span>
          </div>

          <strong className="text-3xl font-bold text-red-600 dark:text-red-400">
            {formatMoney(totalPending)}
          </strong>
        </article>
      </section>

      {/* TABLA */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-bold">Detalle de cuentas pendientes</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ventas que todavía tienen saldo pendiente de pago
          </p>
        </div>

        {receivables.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-semibold">No hay cuentas pendientes</h3>

            <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Todas las ventas registradas se encuentran pagadas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cliente
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Fecha
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Venta
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Pagado
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Pendiente
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {pageItems.map((item, index) => (
                  <tr
                    key={item.orderId}
                    {...rows.rowProps(index, { Enter: () => payFromRow(item) })}
                    className={`border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800/70 dark:hover:bg-gray-800/40 ${ROW_FOCUS}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <UserRound className="h-4 w-4" />
                        </div>

                        <strong className="text-sm">{item.customerName}</strong>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        {formatDate(item.orderDate)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {item.orderId.slice(0, 8)}...
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold">
                      {formatMoney(item.total)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatMoney(item.paid)}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-red-600 dark:text-red-400">
                      {formatMoney(item.pending)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.paymentStatus === "pending"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300"
                        }`}
                      >
                        {item.paymentStatus === "pending"
                          ? "Pendiente"
                          : "Pago parcial"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => handleSelectReceivable(item)}
                        title="Registrar pago (Enter)"
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                      >
                        <WalletCards className="h-4 w-4" />
                        Registrar pago
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {receivables.length > 0 && (
          <KeyboardHelp
            className="border-t border-gray-200 px-5 py-3 dark:border-gray-800"
            items={[MOVE, [["Enter"], "registrar pago"]]}
          />
        )}

        <Pagination {...pagination} />
      </section>

      {/* DETALLE Y PAGO */}
      {selectedReceivable && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          {/* CABECERA */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Cliente
              </span>

              <div className="mt-1 flex items-center gap-2">
                <UserRound className="h-5 w-5 text-gray-400" />
                <h2 className="text-xl font-bold">
                  {selectedReceivable.customerName}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedReceivable(null);
                setShowForm(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </div>

          {/* RESUMEN DEL PAGO */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Total
              </span>

              <strong className="mt-1 block text-xl">
                {formatMoney(selectedReceivable.total)}
              </strong>
            </div>

            <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/20">
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Pagado
              </span>

              <strong className="mt-1 block text-xl text-green-700 dark:text-green-400">
                {formatMoney(
                  paymentSummary?.paidAmount ?? selectedReceivable.paid,
                )}
              </strong>
            </div>

            <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
              <span className="text-xs font-medium text-red-700 dark:text-red-400">
                Pendiente
              </span>

              <strong className="mt-1 block text-xl text-red-700 dark:text-red-400">
                {formatMoney(
                  paymentSummary?.pendingAmount ?? selectedReceivable.pending,
                )}
              </strong>
            </div>
          </div>

          {/* BOTÓN NUEVO PAGO */}
          {!showForm ? (
            <button
              type="button"
              onClick={handleOpenPaymentForm}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
              Registrar pago
            </button>
          ) : (
            /* FORMULARIO */
            <form
              ref={formRef}
              className="max-w-xl space-y-5 border-t border-gray-200 pt-6 dark:border-gray-800"
              onSubmit={handleSubmitPayment}
              onKeyDown={formKeys(handleClosePayment)}
            >
              <div>
                <h3 className="text-lg font-bold">Registrar pago</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ingresá los datos del pago recibido.
                </p>
              </div>

              {/* MONTO */}
              <div className="space-y-2">
                <label
                  htmlFor="receivable-amount"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <CircleDollarSign className="h-4 w-4 text-gray-400" />
                  Monto
                </label>

                <input
                  id="receivable-amount"
                  type="number"
                  min="0.01"
                  max={paymentSummary?.pendingAmount}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-gray-500 dark:focus:ring-gray-800"
                />

                <small className="text-xs text-gray-500 dark:text-gray-400">
                  Pendiente: {formatMoney(paymentSummary?.pendingAmount || 0)}
                </small>
              </div>

              {/* MÉTODO */}
              <div className="space-y-2">
                <label
                  htmlFor="receivable-method"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Método de pago
                </label>

                <select
                  id="receivable-method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-gray-500 dark:focus:ring-gray-800"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>

              {/* NOTAS */}
              <div className="space-y-2">
                <label
                  htmlFor="receivable-notes"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  Notas
                </label>

                <textarea
                  id="receivable-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ej: Seña, pago total..."
                  rows={4}
                  className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-gray-500 dark:focus:ring-gray-800"
                />
              </div>

              {/* ACCIONES */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
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

                <KeyboardHelp items={[SAVE, CANCEL]} className="sm:ml-auto" />
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

export default Receivables;
