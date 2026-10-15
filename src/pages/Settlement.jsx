import { useState } from "react";
import {
  Banknote,
  ClipboardCheck,
  Printer,
  RefreshCw,
  Scale,
} from "lucide-react";

import { ErrorState, LoadingState } from "../components/ui/PageStates";
import { useAuth } from "../context/AuthContext";
import { useDrivers, useSettlement } from "../hooks/queries";
import {
  formatMoney,
  formatPaymentMethod,
  formatQuantity,
  formatTime,
  todayISO,
} from "../utils/format";

const METHODS = ["cash", "transfer"];

// Efectivo y transferencia siempre; otros métodos (Mercado Pago de cobros
// viejos) solo si hubo.
const methodsOf = (collectedByMethod) => [
  ...METHODS,
  ...Object.keys(collectedByMethod).filter(
    (method) => !METHODS.includes(method) && collectedByMethod[method],
  ),
];

// Rendición de un repartidor en un día: qué entregó (kilos reales) y cuánto
// cobró por cada método, para controlar lo que trae a la empresa.
function Settlement() {
  const { user } = useAuth();
  const isDriver = user?.role === "reparto";

  const driversQuery = useDrivers({ enabled: !isDriver });
  const drivers = driversQuery.data ?? [];

  const [chosenDriver, setChosenDriver] = useState("");
  const [date, setDate] = useState(todayISO());

  const driverId = isDriver ? user.id : chosenDriver || drivers[0]?.id;
  const settlementQuery = useSettlement(driverId, date, {
    enabled: !!driverId,
  });
  const settlement = settlementQuery.data;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardCheck className="h-7 w-7" />
            {isDriver ? "Mi rendición" : "Rendición de repartidores"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Lo entregado y lo cobrado en el día
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 print:hidden">
          {!isDriver && (
            <label className="text-sm">
              <span className="mb-1 block font-semibold">Repartidor</span>
              <select
                value={driverId ?? ""}
                onChange={(event) => setChosenDriver(event.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-950"
              >
                {drivers.length === 0 && (
                  <option value="">Sin repartidores</option>
                )}
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="text-sm">
            <span className="mb-1 block font-semibold">Día</span>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(event) => setDate(event.target.value || todayISO())}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-950"
            />
          </label>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={!settlement}
            className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold disabled:opacity-40 dark:border-gray-700"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>
      </header>

      {!isDriver && !driversQuery.isLoading && drivers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700">
          No hay repartidores con acceso a la app. En <strong>Empleados</strong>
          , tocá la llave del repartidor y creale el acceso con rol Reparto.
        </p>
      ) : settlementQuery.isLoading || driversQuery.isLoading ? (
        <LoadingState icon={RefreshCw} message="Calculando rendición..." />
      ) : settlementQuery.error ? (
        <ErrorState
          message={settlementQuery.error.message}
          onRetry={settlementQuery.refetch}
        />
      ) : settlement ? (
        <>
          {/* A RENDIR */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 font-bold">
              <Banknote className="h-5 w-5 text-green-600" />
              {settlement.driver.name}: lo que tiene que rendir
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {methodsOf(settlement.collectedByMethod).map((method) => (
                <div
                  key={method}
                  className="rounded-xl bg-gray-50 p-4 dark:bg-gray-950"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatPaymentMethod(method)}
                  </p>
                  <strong className="text-2xl">
                    {formatMoney(settlement.collectedByMethod[method] ?? 0)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-200 pt-4 text-sm sm:grid-cols-3 lg:grid-cols-5 dark:border-gray-800">
              <Stat
                label="Notas entregadas"
                value={settlement.deliveredCount}
              />
              <Stat label="Vendido" value={formatMoney(settlement.totalSold)} />
              <Stat
                label="Cobrado"
                value={formatMoney(settlement.totalCollected)}
              />
              <Stat
                label="Deuda anterior cobrada"
                value={formatMoney(settlement.debtCollected ?? 0)}
              />
              <Stat
                label="Quedó en cuenta corriente"
                value={formatMoney(settlement.totalOnCredit)}
              />
            </div>

            {settlement.stillPendingCount > 0 && (
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                Tiene {settlement.stillPendingCount} nota(s) asignada(s) todavía
                sin entregar.
              </p>
            )}
          </section>

          {/* KILOS */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="flex items-center gap-2 border-b border-gray-200 px-5 py-4 font-bold dark:border-gray-800">
              <Scale className="h-5 w-5 text-gray-400" />
              Mercadería entregada
            </h2>

            {settlement.products.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">
                No entregó mercadería este día.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-950/50">
                    <tr>
                      <th className="px-5 py-3">Producto</th>
                      <th className="px-5 py-3 text-right">Pedido</th>
                      <th className="px-5 py-3 text-right">Entregado</th>
                      <th className="px-5 py-3 text-right">Diferencia</th>
                      <th className="px-5 py-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {settlement.products.map((product) => {
                      const difference = product.delivered - product.requested;
                      return (
                        <tr key={product.productId}>
                          <td className="px-5 py-3 font-medium">
                            {product.name}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {formatQuantity(product.requested, product.unit)}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold">
                            {formatQuantity(product.delivered, product.unit)}
                          </td>
                          <td
                            className={`px-5 py-3 text-right ${difference < 0 ? "text-red-600" : difference > 0 ? "text-green-600" : "text-gray-400"}`}
                          >
                            {difference > 0 ? "+" : ""}
                            {formatQuantity(difference)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {formatMoney(product.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* NOTAS */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="border-b border-gray-200 px-5 py-4 font-bold dark:border-gray-800">
              Notas entregadas
            </h2>

            {settlement.orders.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">
                No hay notas entregadas este día.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {settlement.orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                  >
                    <div>
                      <strong>{order.customer?.name || "Cliente"}</strong>
                      <span className="ml-2 text-gray-500">
                        {formatTime(order.deliveredAt)}
                      </span>
                      {order.deliveryComment && (
                        <p className="text-xs text-gray-500">
                          {order.deliveryComment}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div>
                        Total <strong>{formatMoney(order.total)}</strong>
                      </div>
                      <div
                        className={
                          order.collected < order.total
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-green-600 dark:text-green-400"
                        }
                      >
                        Cobrado {formatMoney(order.collected)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
      <strong className="text-base">{value}</strong>
    </div>
  );
}

export default Settlement;
