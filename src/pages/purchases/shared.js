// Estilos y reglas compartidas por los formularios de compras

export const inputClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800";

export const labelClass =
  "text-sm font-semibold text-gray-700 dark:text-gray-300";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "credit", label: "Cuenta corriente" },
];

// El backend devuelve "CANCELLED" o "cancelled" según el endpoint
export function isCancelled(purchase) {
  return String(purchase?.paymentStatus).toLowerCase() === "cancelled";
}

export function isValidQuantity(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0.001;
}

export function isValidCost(value) {
  const number = Number(value);

  return value !== "" && Number.isFinite(number) && number >= 0;
}
