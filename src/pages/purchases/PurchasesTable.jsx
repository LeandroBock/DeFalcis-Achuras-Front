import {
  CheckCircle2,
  CreditCard,
  Pencil,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";

import {
  formatDate,
  formatMoney,
  formatPaymentMethod,
  formatPurchaseStatus,
  getStatusClasses,
} from "../../utils/format";
import { isCancelled } from "./shared";
import { ROW_FOCUS } from "../../utils/keyboardHelp";

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

function PurchasesTable({
  purchases,
  getSupplierName,
  onEdit,
  onCancel,
  rowProps,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
            <th className={thClass}>Fecha</th>
            <th className={thClass}>Proveedor</th>
            <th className={thClass}>Total</th>
            <th className={thClass}>Forma de pago</th>
            <th className={thClass}>Estado</th>
            <th className={thClass}>Notas</th>
            <th className={thClass}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {purchases.map((purchase, index) => {
            const cancelled = isCancelled(purchase);

            return (
              <tr
                key={purchase.id}
                {...rowProps(
                  index,
                  cancelled
                    ? {}
                    : {
                        Enter: () => onEdit(purchase),
                        Delete: () => onCancel(purchase),
                      },
                )}
                className={`border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${ROW_FOCUS}`}
              >
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(purchase.createdAt)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-400" />

                    <strong className="text-sm text-gray-900 dark:text-white">
                      {getSupplierName(purchase.supplierId)}
                    </strong>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white">
                  {formatMoney(purchase.total)}
                </td>

                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-gray-400" />

                    {formatPaymentMethod(purchase.paymentMethod)}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                      purchase.paymentStatus,
                    )}`}
                  >
                    {purchase.paymentStatus === "paid" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5" />
                    )}

                    {formatPurchaseStatus(purchase.paymentStatus)}
                  </span>
                </td>

                <td className="max-w-xs px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {purchase.notes || "Sin notas"}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => onEdit(purchase)}
                      disabled={cancelled}
                      title="Editar compra (Enter)"
                      aria-label="Editar compra"
                      className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => onCancel(purchase)}
                      disabled={cancelled}
                      title={
                        cancelled ? "Compra anulada" : "Anular compra (Supr)"
                      }
                      aria-label={
                        cancelled ? "Compra anulada" : "Anular compra"
                      }
                      className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PurchasesTable;
