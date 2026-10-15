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
  WalletCards,
  X,
} from "lucide-react";

import { createSupplierPayment } from "../services/api";
import {
  keys,
  useApiMutation,
  usePurchases,
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
} from "../utils/format";
import Pagination from "../components/ui/Pagination";
import { ErrorState, LoadingState } from "../components/ui/PageStates";

const EMPTY_FORM = {
  amount: "",
  method: "transfer",
  notes: "",
};

function SupplierPayments() {
  const { data: purchases = [], isLoading, error, refetch } = usePurchases();

  const { pageItems, ...pagination } = usePagination(purchases);

  const [selectedId, setSelectedId] = useState(null);
  const selectedPurchase =
    purchases.find((purchase) => purchase.id === selectedId) ?? null;

  const { data: paymentSummary, isLoading: loadingPayments } =
    useSupplierPayments(selectedId);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Teclado: flechas en la tabla y Enter muestra los pagos de la compra; en
  // el formulario Esc cancela y Ctrl+Enter guarda.
  const rows = useRowNavigation(pageItems.length);
  const { formRef, rememberFocus, restoreFocus } = useFormFocus(showForm);

  function toggleForm() {
    if (showForm) {
      closeForm();
    } else {
      rememberFocus();
      setShowForm(true);
    }
  }

  function closeForm() {
    setShowForm(false);
    restoreFocus();
  }

  const registerPayment = useApiMutation(createSupplierPayment, {
    invalidate: [keys.purchases, keys.reports],
    success: "Pago registrado correctamente.",
  });

  function selectPurchase(purchase) {
    setSelectedId(purchase.id);
    setShowForm(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedPurchase || !paymentSummary) {
      return;
    }

    const amount = roundMoney(formData.amount);

    if (amount <= 0) {
      toast.error("Ingresá un importe válido.");
      return;
    }

    if (amount > roundMoney(paymentSummary.pendingAmount)) {
      toast.error("El importe supera el saldo pendiente.");
      return;
    }

    registerPayment.mutate(
      {
        purchaseId: selectedPurchase.id,
        amount,
        method: formData.method,
        notes: formData.notes || undefined,
      },
      {
        onSuccess: () => {
          setFormData(EMPTY_FORM);
          closeForm();
        },
      },
    );
  }

  if (isLoading) {
    return <LoadingState message="Cargando pagos a proveedores..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="No se pudieron cargar las compras."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          <CreditCard className="h-7 w-7" />
          Pagos a proveedores
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Control de pagos de las compras realizadas
        </p>
      </header>

      {/* PURCHASES */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <WalletCards className="h-5 w-5" />
            Compras
          </h2>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {purchases.length} {purchases.length === 1 ? "compra" : "compras"}
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <WalletCards className="mb-4 h-12 w-12 text-gray-400" />

            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay compras registradas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Fecha
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Proveedor
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Total
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
                {pageItems.map((purchase, index) => (
                  <tr
                    key={purchase.id}
                    {...rows.rowProps(index, {
                      Enter: () => selectPurchase(purchase),
                    })}
                    className={`transition ${ROW_FOCUS} ${
                      selectedPurchase?.id === purchase.id
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        {formatDate(purchase.createdAt)}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                      {purchase.supplierId}
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatMoney(purchase.total)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          purchase.paymentStatus === "pending"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            : purchase.paymentStatus === "partial"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                        }`}
                      >
                        {purchase.paymentStatus === "paid" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}

                        {formatStatus(purchase.paymentStatus)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => selectPurchase(purchase)}
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

        {purchases.length > 0 && (
          <KeyboardHelp
            className="border-t border-gray-200 px-5 py-3 dark:border-gray-800"
            items={[MOVE, [["Enter"], "ver pagos"]]}
          />
        )}

        <Pagination {...pagination} />
      </section>

      {/* DETAIL */}
      {selectedPurchase && (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* DETAIL HEADER */}
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <CircleDollarSign className="h-5 w-5" />
                Detalle de pagos
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Compra seleccionada:{" "}
                <strong className="text-gray-900 dark:text-white">
                  {formatMoney(selectedPurchase.total)}
                </strong>
              </p>
            </div>

            {paymentSummary && Number(paymentSummary.pendingAmount) > 0 && (
              <button
                type="button"
                onClick={toggleForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {showForm ? (
                  <>
                    <X className="h-4 w-4" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Registrar pago
                  </>
                )}
              </button>
            )}
          </div>

          {loadingPayments ? (
            <div className="flex items-center gap-3 p-5 text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Cargando información de pagos...
            </div>
          ) : (
            <>
              {/* PAYMENT CARDS */}
              {paymentSummary && (
                <div className="grid gap-4 border-b border-gray-200 p-5 sm:grid-cols-3 dark:border-gray-800">
                  <div className="rounded-xl bg-gray-50 p-5 dark:bg-gray-800/60">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total
                    </span>

                    <strong className="mt-2 block text-2xl font-bold text-gray-900 dark:text-white">
                      {formatMoney(selectedPurchase.total)}
                    </strong>
                  </div>

                  <div className="rounded-xl bg-green-50 p-5 dark:bg-green-950/20">
                    <span className="text-sm text-green-700 dark:text-green-400">
                      Pagado
                    </span>

                    <strong className="mt-2 block text-2xl font-bold text-green-700 dark:text-green-400">
                      {formatMoney(paymentSummary.paidAmount)}
                    </strong>
                  </div>

                  <div className="rounded-xl bg-red-50 p-5 dark:bg-red-950/20">
                    <span className="text-sm text-red-700 dark:text-red-400">
                      Pendiente
                    </span>

                    <strong className="mt-2 block text-2xl font-bold text-red-700 dark:text-red-400">
                      {formatMoney(paymentSummary.pendingAmount)}
                    </strong>
                  </div>
                </div>
              )}

              {/* FORM */}
              {showForm && (
                <form
                  ref={formRef}
                  className="grid gap-5 border-b border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/30 md:grid-cols-3"
                  onSubmit={handleSubmit}
                  onKeyDown={formKeys(closeForm)}
                >
                  {/* AMOUNT */}
                  <div>
                    <label
                      htmlFor="amount"
                      className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
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
                        step="0.01"
                        max={paymentSummary?.pendingAmount}
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-white"
                      />
                    </div>
                  </div>

                  {/* METHOD */}
                  <div>
                    <label
                      htmlFor="method"
                      className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
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
                        className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-white"
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
                      className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Notas
                    </label>

                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />

                      <input
                        id="notes"
                        name="notes"
                        type="text"
                        placeholder="Ej: Pago parcial"
                        value={formData.notes}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-white"
                      />
                    </div>
                  </div>

                  {/* BUTTON */}
                  <div className="flex items-center gap-4 md:col-span-3">
                    <button
                      type="submit"
                      disabled={registerPayment.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                      <Save className="h-4 w-4" />
                      Registrar pago
                    </button>

                    <KeyboardHelp items={[SAVE, CANCEL]} />
                  </div>
                </form>
              )}

              {/* HISTORY */}
              {paymentSummary?.payments?.length > 0 ? (
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
                            className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
              ) : (
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <History className="mb-3 h-10 w-10 text-gray-400" />

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay pagos registrados para esta compra.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default SupplierPayments;
