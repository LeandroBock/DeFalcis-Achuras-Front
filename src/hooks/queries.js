import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import * as api from "../services/api";

// Claves de caché. Invalidar ["orders"] también invalida ["orders", id].
export const keys = {
  products: ["products"],
  categories: ["categories"],
  customers: ["customers"],
  suppliers: ["suppliers"],
  purchases: ["purchases"],
  orders: ["orders"],
  orderPayments: (orderId) => ["orders", orderId, "payments"],
  supplierPayments: (purchaseId) => ["purchases", purchaseId, "payments"],
  expenses: ["expenses"],
  employees: ["employees"],
  inventory: ["inventory"],
  reports: ["reports"],
  dashboard: ["reports", "dashboard"],
  financialSummary: (from, to) => ["reports", "financial-summary", from, to],
  receivables: (from, to) => ["reports", "receivables", from, to],
  payables: (from, to) => ["reports", "payables", from, to],
  invoices: ["invoices"],
  // Bajo ["reports"]: se refrescan solas al registrar ventas o cobros.
  currentAccounts: ["reports", "current-accounts"],
  currentAccount: (customerId) => ["reports", "current-accounts", customerId],
  whatsapp: ["whatsapp"],
  conversation: (phone) => ["whatsapp", phone],
  // Aparte de ["whatsapp"]: un mensaje nuevo no tiene por qué volver a
  // consultar la conexión.
  whatsappConnection: ["whatsapp-connection"],
  drivers: ["drivers"],
  leads: ["leads"],
  customerPrices: (customerId) => ["customers", customerId, "prices"],
  customerPricing: (customerId) => ["customers", customerId, "pricing"],
  // Bajo ["customers"]: asignar clientes a una lista refresca los clientes.
  priceLists: ["customers", "price-lists"],
  priceList: (id) => ["customers", "price-lists", id],
  // Bajo ["orders"]: al asignar o entregar notas se refresca sola.
  route: (driverId, date) => ["orders", "route", driverId, date],
  // Bajo ["orders"]: al entregar o modificar una nota se refrescan solas.
  myDeliveries: (date) => ["orders", "mine", date],
  settlement: (userId, date) => ["orders", "settlement", userId, date],
  deliveryBoard: (date) => ["orders", "board", date],
};

// Lo que cambia cuando se registra plata o mercadería
const AFTER_SALE = [keys.orders, keys.products, keys.inventory, keys.reports];
const AFTER_PURCHASE = [
  keys.purchases,
  keys.products,
  keys.inventory,
  keys.reports,
];

// LECTURAS

export const useProducts = () =>
  useQuery({ queryKey: keys.products, queryFn: api.getProducts });

export const useCategories = () =>
  useQuery({ queryKey: keys.categories, queryFn: api.getCategories });

export const useCustomers = () =>
  useQuery({ queryKey: keys.customers, queryFn: api.getCustomers });

export const useSuppliers = () =>
  useQuery({ queryKey: keys.suppliers, queryFn: api.getSuppliers });

export const usePurchases = () =>
  useQuery({ queryKey: keys.purchases, queryFn: api.getPurchases });

export const useOrders = () =>
  useQuery({ queryKey: keys.orders, queryFn: api.getOrders });

export const useOrder = (orderId) =>
  useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => api.getOrder(orderId),
    enabled: !!orderId,
  });

export const useCustomerPrices = (customerId) =>
  useQuery({
    queryKey: keys.customerPrices(customerId),
    queryFn: () => api.getCustomerPrices(customerId),
    enabled: !!customerId,
  });

export const useCustomerPricing = (customerId) =>
  useQuery({
    queryKey: keys.customerPricing(customerId),
    queryFn: () => api.getCustomerPricing(customerId),
    enabled: !!customerId,
  });

export const usePriceLists = ({ enabled = true } = {}) =>
  useQuery({ queryKey: keys.priceLists, queryFn: api.getPriceLists, enabled });

export const usePriceList = (id) =>
  useQuery({
    queryKey: keys.priceList(id),
    queryFn: () => api.getPriceList(id),
    enabled: !!id,
  });

export const useRoute = (driverId, date) =>
  useQuery({
    queryKey: keys.route(driverId, date),
    queryFn: () => api.getRoute(driverId, date),
    enabled: !!driverId,
  });

export const useLeads = () =>
  useQuery({ queryKey: keys.leads, queryFn: api.getLeads });

export const useDrivers = ({ enabled = true } = {}) =>
  useQuery({ queryKey: keys.drivers, queryFn: api.getDrivers, enabled });

export const useMyDeliveries = (date) =>
  useQuery({
    queryKey: keys.myDeliveries(date),
    queryFn: () => api.getMyDeliveries(date),
    refetchInterval: 60_000,
  });

// Se actualiza solo con los avisos en tiempo real (useOfficeEvents); el
// refresco cada minuto es un respaldo.
export const useDeliveryBoard = (date) =>
  useQuery({
    queryKey: keys.deliveryBoard(date),
    queryFn: () => api.getDeliveryBoard(date),
    refetchInterval: 60_000,
  });

export const useSettlement = (userId, date, { enabled = true } = {}) =>
  useQuery({
    queryKey: keys.settlement(userId, date),
    queryFn: () => api.getSettlement({ userId, date }),
    enabled,
  });

export const useExpenses = () =>
  useQuery({ queryKey: keys.expenses, queryFn: api.getExpenses });

export const useEmployees = () =>
  useQuery({ queryKey: keys.employees, queryFn: api.getEmployees });

export const useInventoryMovements = () =>
  useQuery({ queryKey: keys.inventory, queryFn: api.getInventoryMovements });

export const useInvoices = () =>
  useQuery({ queryKey: keys.invoices, queryFn: api.getInvoices });

export const useCurrentAccounts = () =>
  useQuery({ queryKey: keys.currentAccounts, queryFn: api.getCurrentAccounts });

export const useCurrentAccount = (customerId, { enabled = true } = {}) =>
  useQuery({
    queryKey: keys.currentAccount(customerId),
    queryFn: () => api.getCurrentAccount(customerId),
    enabled: enabled && !!customerId,
  });

export const useDashboard = () =>
  useQuery({ queryKey: keys.dashboard, queryFn: api.getDashboard });

export const useFinancialSummary = (from, to) =>
  useQuery({
    queryKey: keys.financialSummary(from, to),
    // Al cambiar el filtro se siguen viendo los datos anteriores mientras carga
    placeholderData: keepPreviousData,
    queryFn: () => api.getFinancialSummary(from, to),
  });

export const useReceivables = (from, to) =>
  useQuery({
    queryKey: keys.receivables(from, to),
    // Al cambiar el filtro se siguen viendo los datos anteriores mientras carga
    placeholderData: keepPreviousData,
    queryFn: () => api.getReceivables(from, to),
  });

export const usePayables = (from, to) =>
  useQuery({
    queryKey: keys.payables(from, to),
    // Al cambiar el filtro se siguen viendo los datos anteriores mientras carga
    placeholderData: keepPreviousData,
    queryFn: () => api.getPayables(from, to),
  });

export const useOrderPayments = (orderId) =>
  useQuery({
    queryKey: keys.orderPayments(orderId),
    queryFn: () => api.getOrderPayments(orderId),
    enabled: !!orderId,
  });

export const useSupplierPayments = (purchaseId) =>
  useQuery({
    queryKey: keys.supplierPayments(purchaseId),
    queryFn: () => api.getSupplierPayments(purchaseId),
    enabled: !!purchaseId,
  });

// Bandeja de WhatsApp. Los mensajes nuevos llegan en tiempo real
// (useWhatsAppEvents); el refresco cada 30 s es solo un respaldo.
export const useWhatsAppConversations = () =>
  useQuery({
    queryKey: keys.whatsapp,
    queryFn: api.getWhatsAppConversations,
    refetchInterval: 30_000,
  });

export const useWhatsAppConversation = (phone) =>
  useQuery({
    queryKey: keys.conversation(phone),
    queryFn: () => api.getWhatsAppConversation(phone),
    enabled: !!phone,
    refetchInterval: 30_000,
  });

// Estado de la conexión con el celular. Mientras se espera el escaneo, se
// consulta seguido porque el QR se renueva cada ~20 s.
export const useWhatsAppConnection = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: keys.whatsappConnection,
    queryFn: api.getWhatsAppConnection,
    enabled,
    refetchInterval: (query) =>
      ["waiting_qr", "connecting"].includes(query.state.data?.status)
        ? 3000
        : 30_000,
  });

// ESCRITURAS

/**
 * Mutación con invalidación de caché y aviso automático.
 *
 * const create = useApiMutation(api.createCustomer, {
 *   invalidate: [keys.customers],
 *   success: "Cliente creado",
 * });
 * await create.mutateAsync(data);
 *
 * Con más de un parámetro, envolver en una función de un solo argumento:
 * useApiMutation(({ id, data }) => api.updateCustomer(id, data), ...)
 *
 * Los errores se muestran como toast. Si la pantalla necesita
 * manejarlos por su cuenta, pasar showError: false.
 */
export function useApiMutation(
  mutationFn,
  { invalidate = [], success, showError = true } = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      invalidate.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );

      if (success) {
        toast.success(success);
      }
    },
    onError: (error) => {
      if (showError) {
        toast.error(error.message);
      }
    },
  });
}

export const invalidation = {
  AFTER_SALE,
  AFTER_PURCHASE,
};
