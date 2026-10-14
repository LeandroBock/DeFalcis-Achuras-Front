// Formateadores y etiquetas compartidas por todas las pantallas.

// La API devuelve importes como number o como string ("1500.00")
type Amount = number | string | null | undefined;
type DateInput = string | number | Date | null | undefined;

const LOCALE = "es-AR";

const moneyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "ARS",
});

export function formatMoney(value: Amount): string {
  const number = Number(value);

  return moneyFormatter.format(Number.isFinite(number) ? number : 0);
}

export function formatNumber(value: Amount, decimals = 2): string {
  const number = Number(value);

  return (Number.isFinite(number) ? number : 0).toLocaleString(LOCALE, {
    maximumFractionDigits: decimals,
  });
}

function toDate(value: DateInput): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

// 13/10/2026
export function formatDate(value: DateInput): string {
  const date = toDate(value);

  return date ? date.toLocaleDateString(LOCALE) : "-";
}

// 13/10/2026, 14:35:00
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);

  return date ? date.toLocaleString(LOCALE) : "-";
}

// 14:35
export function formatTime(value: DateInput): string {
  const date = toDate(value);

  return date
    ? date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })
    : "";
}

// PLATA
// Los importes en JS son float: 0.1 + 0.2 = 0.30000000000000004.
// Para sumar subtotales y comparar saldos usamos centavos enteros.

export function roundMoney(value: Amount): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.round((number + Number.EPSILON) * 100) / 100;
}

export function multiplyMoney(a: Amount, b: Amount): number {
  return roundMoney(Number(a) * Number(b));
}

export function sumMoney(values: Amount[]): number {
  const cents = values.reduce<number>(
    (total, value) => total + Math.round(roundMoney(value) * 100),
    0,
  );

  return cents / 100;
}

// ETIQUETAS

function label(labels: Record<string, string>) {
  return (value: string | null | undefined): string =>
    (value && labels[value]) || value || "-";
}

export const formatPaymentMethod = label({
  cash: "Efectivo",
  transfer: "Transferencia",
  mercado_pago: "Mercado Pago",
  credit: "Cuenta corriente",
});

// Estado de pago de ventas y deudas
export const formatPaymentStatus = label({
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
});

// Estado de una compra (femenino) incluyendo anuladas
export const formatPurchaseStatus = label({
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagada",
  CANCELLED: "Anulada",
  cancelled: "Anulada",
});

export const formatOrderStatus = label({
  pending: "Nota pendiente",
  confirmed: "Entregada",
  delivered: "Entregada",
  cancelled: "Anulada",
});

export const formatExpenseCategory = label({
  rent: "Alquiler",
  utilities: "Servicios",
  fuel: "Combustible",
  salaries: "Sueldos",
  taxes: "Impuestos",
  maintenance: "Mantenimiento",
  administrative: "Administrativo",
  other: "Otros",
});

export const formatPosition = label({
  administration: "Administración",
  sales: "Ventas",
  warehouse: "Depósito",
  delivery: "Reparto",
  production: "Producción",
  other: "Otro",
});

export const formatMovementType = label({
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
});

export const formatUnit = label({
  kg: "kg",
  unit: "unidad",
});

// Clases del badge de estado (pagado / parcial / pendiente / anulado)
const STATUS_CLASSES: Record<string, string> = {
  paid: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function getStatusClasses(status: string | null | undefined): string {
  return (
    (status && STATUS_CLASSES[status]) ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  );
}

export function getInitial(name: string | null | undefined): string {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

// Minúsculas y sin tildes: "Categorías" y "categorias" coinciden
export function normalizeText(text: unknown): string {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Fecha de hoy en Argentina, como "AAAA-MM-DD" (para inputs de fecha).
export function todayISO(now: Date = new Date()): string {
  return new Date(now.getTime() - 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

// Kilos o unidades: hasta 3 decimales, con coma.
export function formatQuantity(value: number | string, unit?: string): string {
  const text = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 3,
  }).format(Number(value) || 0);

  return unit ? `${text} ${unit === "kg" ? "kg" : "u."}` : text;
}
