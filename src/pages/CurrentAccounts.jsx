import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookUser,
  CheckCircle2,
  CircleDollarSign,
  HandCoins,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { payCurrentAccount } from "../services/api";
import {
  invalidation,
  useApiMutation,
  useCurrentAccount,
  useCurrentAccounts,
} from "../hooks/queries";
import {
  COLLECTION_METHODS,
  formatDate,
  formatMoney,
  formatPaymentMethod,
  roundMoney,
} from "../utils/format";
import Modal from "../components/Modal";
import { ErrorState, LoadingState } from "../components/ui/PageStates";

const { AFTER_SALE } = invalidation;

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800";

const normalize = (text) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Cuenta corriente de un cliente: las entregas que debe y el registro de un
 * pago, que se aplica a las más viejas primero.
 */
function AccountDialog({ customer, onClose }) {
  const titleId = useId();
  const accountQuery = useCurrentAccount(customer.customerId);
  const account = accountQuery.data;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const amountRef = useRef(null);

  // El monto aparece cuando carga la cuenta: ahí va el foco.
  const canPay = account?.debt > 0;
  useEffect(() => {
    if (canPay) amountRef.current?.focus();
  }, [canPay]);

  const pay = useApiMutation(payCurrentAccount, { invalidate: AFTER_SALE });

  function handleSubmit(event) {
    event.preventDefault();
    if (!account) return;

    const value = roundMoney(amount);

    if (value <= 0) {
      toast.error("Ingresá un monto válido.");
      return;
    }

    if (value > account.debt) {
      toast.error("El pago supera la deuda del cliente.");
      return;
    }

    pay.mutate(
      {
        customerId: customer.customerId,
        amount: value,
        method,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          setAmount("");
          setNotes("");

          if (result.remainingDebt <= 0) {
            toast.success("Pago registrado: la cuenta quedó saldada.");
            onClose();
          } else {
            toast.success(
              `Pago registrado. Sigue debiendo ${formatMoney(result.remainingDebt)}.`,
            );
          }
        },
      },
    );
  }

  return (
    <Modal
      as="form"
      onSubmit={handleSubmit}
      onClose={onClose}
      closeDisabled={pay.isPending}
      labelledBy={titleId}
      className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div>
          <h2 id={titleId} className="text-lg font-bold">
            Cuenta corriente de {customer.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Debe{" "}
            <strong className="text-red-600 dark:text-red-400">
              {formatMoney(account?.debt ?? customer.debt)}
            </strong>
            {customer.phone ? ` · Tel. ${customer.phone}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={pay.isPending}
          aria-label="Cerrar"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {accountQuery.isLoading ? (
          <LoadingState message="Cargando la cuenta..." />
        ) : accountQuery.error ? (
          <ErrorState
            message="No se pudo cargar la cuenta corriente."
            onRetry={accountQuery.refetch}
          />
        ) : account?.orders.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            No debe nada.
          </p>
        ) : (
          <table className="w-full text-sm">
            <caption className="mb-2 text-left font-semibold">
              Entregas adeudadas (se pagan de la más vieja a la más nueva)
            </caption>
            <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="py-2 font-semibold">Entregada</th>
                <th className="py-2 text-right font-semibold">Total</th>
                <th className="py-2 text-right font-semibold">Pagado</th>
                <th className="py-2 text-right font-semibold">Debe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {account?.orders.map((order) => (
                <tr key={order.orderId}>
                  <td className="py-2">{formatDate(order.deliveredAt)}</td>
                  <td className="py-2 text-right">
                    {formatMoney(order.total)}
                  </td>
                  <td className="py-2 text-right">{formatMoney(order.paid)}</td>
                  <td className="py-2 text-right font-semibold text-red-600 dark:text-red-400">
                    {formatMoney(order.pending)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {account?.debt > 0 && (
          <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <legend className="px-1 text-sm font-semibold">
              Registrar pago
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Monto</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    max={account.debt}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    disabled={pay.isPending}
                    ref={amountRef}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(String(account.debt))}
                    disabled={pay.isPending}
                    className="shrink-0 rounded-xl border border-gray-300 px-3 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Todo
                  </button>
                </div>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Forma de pago</span>
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  disabled={pay.isPending}
                  className={inputClass}
                >
                  {COLLECTION_METHODS.map((value) => (
                    <option key={value} value={value}>
                      {formatPaymentMethod(value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">Nota (opcional)</span>
              <input
                type="text"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={pay.isPending}
                className={inputClass}
              />
            </label>
          </fieldset>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-950">
        <button
          type="button"
          onClick={onClose}
          disabled={pay.isPending}
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold dark:border-gray-700"
        >
          Cerrar
        </button>
        {account?.debt > 0 && (
          <button
            type="submit"
            disabled={pay.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
          >
            <HandCoins className="h-4 w-4" />
            {pay.isPending ? "Registrando..." : "Registrar pago"}
          </button>
        )}
      </div>
    </Modal>
  );
}

// Clientes que deben (todo lo que no se cobró en las entregas) y cuánto.
function CurrentAccounts() {
  const { data, isLoading, isFetching, error, refetch } = useCurrentAccounts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const customers = useMemo(() => {
    const all = data?.customers ?? [];
    const term = normalize(search.trim());
    return term ? all.filter((c) => normalize(c.name).includes(term)) : all;
  }, [data, search]);

  if (isLoading) {
    return <LoadingState message="Cargando cuentas corrientes..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="No se pudieron cargar las cuentas corrientes."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Cuentas corrientes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Lo que cada cliente debe de sus entregas
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <BookUser className="h-5 w-5" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Clientes con deuda
            </span>
          </div>
          <strong className="text-3xl font-bold">
            {data?.customers.length ?? 0}
          </strong>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total adeudado
            </span>
          </div>
          <strong className="text-3xl font-bold text-red-600 dark:text-red-400">
            {formatMoney(data?.totalDebt ?? 0)}
          </strong>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <label className="relative block max-w-sm">
            <span className="sr-only">Buscar cliente</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente..."
              className={`${inputClass} pl-9`}
            />
          </label>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="font-semibold">
              {search ? "Ningún cliente coincide" : "Ningún cliente debe nada"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Debe desde</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Entregas
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">Deuda</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {customers.map((customer) => (
                  <tr key={customer.customerId}>
                    <td className="px-5 py-3">
                      <p className="font-semibold">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {formatDate(customer.oldestDebtAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {customer.openOrders}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-red-600 dark:text-red-400">
                      {formatMoney(customer.debt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(customer)}
                        aria-label={`Ver cuenta de ${customer.name}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        Ver cuenta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <AccountDialog customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default CurrentAccounts;
