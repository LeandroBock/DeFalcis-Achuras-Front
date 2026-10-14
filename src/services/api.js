import { buildUrl, download, getToken, request } from "./http";

// AUTH

export const login = (credentials) =>
  request("/auth/login", {
    method: "POST",
    body: credentials,
    auth: false,
    errorMessage: "Error al iniciar sesión",
  });

// PRODUCTOS

export const getProducts = () =>
  request("/products", {
    errorMessage: "No se pudieron obtener los productos",
  });

export const createProduct = (productData) =>
  request("/products", {
    method: "POST",
    body: productData,
    errorMessage: "No se pudo crear el producto",
  });

export const updateProduct = (productId, productData) =>
  request(`/products/${productId}`, {
    method: "PATCH",
    body: productData,
    errorMessage: "No se pudo actualizar el producto",
  });

export const deactivateProduct = (productId) =>
  request(`/products/${productId}/deactivate`, {
    method: "PATCH",
    errorMessage: "No se pudo desactivar el producto",
  });

// CATEGORÍAS

export const getCategories = () =>
  request("/categories", {
    errorMessage: "No se pudieron obtener las categorías",
  });

export const createCategory = (categoryData) =>
  request("/categories", {
    method: "POST",
    body: categoryData,
    errorMessage: "No se pudo crear la categoría",
  });

export const updateCategory = (categoryId, categoryData) =>
  request(`/categories/${categoryId}`, {
    method: "PATCH",
    body: categoryData,
    errorMessage: "No se pudo actualizar la categoría",
  });

export const deactivateCategory = (categoryId) =>
  request(`/categories/${categoryId}/deactivate`, {
    method: "PATCH",
    errorMessage: "No se pudo desactivar la categoría",
  });

// CLIENTES

export const getCustomers = () =>
  request("/customers", {
    errorMessage: "No se pudieron obtener los clientes",
  });

export const createCustomer = (customerData) =>
  request("/customers", {
    method: "POST",
    body: customerData,
    errorMessage: "No se pudo crear el cliente",
  });

export const updateCustomer = (customerId, customerData) =>
  request(`/customers/${customerId}`, {
    method: "PATCH",
    body: customerData,
    errorMessage: "No se pudo actualizar el cliente",
  });

export const deactivateCustomer = (customerId) =>
  request(`/customers/${customerId}/deactivate`, {
    method: "PATCH",
    errorMessage: "No se pudo desactivar el cliente",
  });

// PROVEEDORES

export async function createSupplier(supplierData) {
  try {
    return await request("/suppliers", {
      method: "POST",
      body: supplierData,
      errorMessage: "No se pudo crear el proveedor",
    });
  } catch (error) {
    if (error.status === 409) {
      error.message = "El proveedor ya existe";
    }

    throw error;
  }
}

export const getSuppliers = () =>
  request("/suppliers", {
    errorMessage: "No se pudieron obtener los proveedores",
  });

export const updateSupplier = (supplierId, supplierData) =>
  request(`/suppliers/${supplierId}`, {
    method: "PATCH",
    body: supplierData,
    errorMessage: "No se pudo actualizar el proveedor",
  });

export const deactivateSupplier = (supplierId) =>
  request(`/suppliers/${supplierId}/deactivate`, {
    method: "PATCH",
    errorMessage: "No se pudo desactivar el proveedor",
  });

// COMPRAS

export const getPurchases = () =>
  request("/purchases", {
    errorMessage: "No se pudieron obtener las compras",
  });

export const getPurchase = (purchaseId) =>
  request(`/purchases/${purchaseId}`, {
    errorMessage: "No se pudo obtener la compra",
  });

export const createPurchase = (purchaseData) =>
  request("/purchases", {
    method: "POST",
    body: purchaseData,
    errorMessage: "No se pudo crear la compra",
  });

export const updatePurchase = (id, data) =>
  request(`/purchases/${id}`, {
    method: "PATCH",
    body: data,
    errorMessage: "No se pudo actualizar la compra",
  });

export const deletePurchase = (id) =>
  request(`/purchases/${id}`, {
    method: "DELETE",
    errorMessage: "Error al anular la compra",
  });

// VENTAS

export const getOrders = () =>
  request("/orders", {
    errorMessage: "No se pudieron obtener los pedidos",
  });

export const getOrder = (orderId) =>
  request(`/orders/${orderId}`, {
    errorMessage: "No se pudo obtener la venta",
  });

// Nota de pedido: productos y kilos pedidos. Los kilos reales y el cobro se
// cargan al entregar (deliverOrder).
export const createOrder = (orderData) =>
  request("/orders", {
    method: "POST",
    body: orderData,
    errorMessage: "No se pudo crear la nota de pedido",
  });

export const updateOrder = (orderId, data) =>
  request(`/orders/${orderId}`, {
    method: "PATCH",
    body: data,
    errorMessage: "No se pudo modificar la nota de pedido",
  });

// { assignedToId: id | null, deliveryDate?: "AAAA-MM-DD" }
export const assignOrder = (orderId, data) =>
  request(`/orders/${orderId}/assign`, {
    method: "POST",
    body: data,
    errorMessage: "No se pudo asignar el repartidor",
  });

export const cancelOrder = (orderId) =>
  request(`/orders/${orderId}/cancel`, {
    method: "POST",
    errorMessage: "No se pudo anular la nota de pedido",
  });

// { items: [{ productId, quantity }], payments: [{ amount, method }], comment }
export const deliverOrder = (orderId, data) =>
  request(`/orders/${orderId}/deliver`, {
    method: "POST",
    body: data,
    errorMessage: "No se pudo registrar la entrega",
  });

export const markOrderNotDelivered = (orderId, reason) =>
  request(`/orders/${orderId}/not-delivered`, {
    method: "POST",
    body: { reason },
    errorMessage: "No se pudo registrar la entrega fallida",
  });

// REPARTO

export const getDrivers = () =>
  request("/deliveries/drivers", {
    errorMessage: "No se pudieron obtener los repartidores",
  });

export const getMyDeliveries = (date) =>
  request("/deliveries/mine", {
    query: { date },
    errorMessage: "No se pudieron obtener tus entregas",
  });

export const getSettlement = ({ userId, date }) =>
  request("/deliveries/settlement", {
    query: { userId, date },
    errorMessage: "No se pudo obtener la rendición",
  });

// PAGOS DE CLIENTES

export const getOrderPayments = (orderId) =>
  request(`/payments/order/${orderId}`, {
    errorMessage: "No se pudieron obtener los pagos",
  });

export const createPayment = (paymentData) =>
  request("/payments", {
    method: "POST",
    body: paymentData,
    errorMessage: "No se pudo registrar el pago",
  });

// GASTOS

export const getExpenses = () =>
  request("/expenses", {
    errorMessage: "No se pudieron obtener los gastos",
  });

export const createExpense = (expenseData) =>
  request("/expenses", {
    method: "POST",
    body: expenseData,
    errorMessage: "No se pudo crear el gasto",
  });

export const updateExpense = (expenseId, expenseData) =>
  request(`/expenses/${expenseId}`, {
    method: "PATCH",
    body: expenseData,
    errorMessage: "No se pudo actualizar el gasto",
  });

export const deleteExpense = (expenseId) =>
  request(`/expenses/${expenseId}`, {
    method: "DELETE",
    errorMessage: "No se pudo eliminar el gasto",
  });

// EMPLEADOS

export const getEmployees = () =>
  request("/employees", {
    errorMessage: "No se pudieron obtener los empleados",
  });

export const createEmployee = (employeeData) =>
  request("/employees", {
    method: "POST",
    body: employeeData,
    errorMessage: "No se pudo crear el empleado",
  });

export const updateEmployee = (employeeId, employeeData) =>
  request(`/employees/${employeeId}`, {
    method: "PATCH",
    body: employeeData,
    errorMessage: "No se pudo actualizar el empleado",
  });

export const deactivateEmployee = (employeeId) =>
  request(`/employees/${employeeId}/deactivate`, {
    method: "PATCH",
    errorMessage: "No se pudo desactivar el empleado",
  });

// INVENTARIO

export const getInventoryMovements = () =>
  request("/inventory", {
    errorMessage: "No se pudieron obtener los movimientos",
  });

export const createInventoryMovement = (movementData) =>
  request("/inventory/movement", {
    method: "POST",
    body: movementData,
    errorMessage: "No se pudo registrar el movimiento",
  });

// PAGOS A PROVEEDORES

export const getSupplierPayments = (purchaseId) =>
  request(`/supplier-payments/purchase/${purchaseId}`, {
    errorMessage: "No se pudieron obtener los pagos",
  });

export const createSupplierPayment = (paymentData) =>
  request("/supplier-payments", {
    method: "POST",
    body: paymentData,
    errorMessage: "No se pudo registrar el pago",
  });

// REPORTES

export const getDashboard = () =>
  request("/reports/dashboard", {
    errorMessage: "No se pudo obtener el dashboard",
  });

export const getFinancialSummary = (from, to) =>
  request("/reports/financial-summary", {
    query: { from, to },
    errorMessage: "No se pudo obtener el resumen financiero",
  });

export const getReceivables = (from = "", to = "") =>
  request("/reports/receivables", {
    query: { from, to },
    errorMessage: "No se pudieron obtener las cuentas por cobrar",
  });

export const getPayables = (from = "", to = "") =>
  request("/reports/payables", {
    query: { from, to },
    errorMessage: "No se pudieron obtener las cuentas por pagar",
  });

export function exportReport(from = "", to = "") {
  const range = from || to ? `_${from || "inicio"}_a_${to || "hoy"}` : "";

  return download("/reports/export", `reporte-financiero${range}.xlsx`, {
    query: { from, to },
    errorMessage: "No se pudo exportar el reporte",
  });
}

// FACTURACIÓN

export const getInvoices = () =>
  request("/invoicing", {
    errorMessage: "No se pudieron obtener las facturas",
  });

export const emitInvoices = (orderIds) =>
  request("/invoicing/emit", {
    method: "POST",
    body: { orderIds },
    errorMessage: "No se pudo facturar",
  });

export const downloadInvoicePdf = (invoiceId, filename = "factura.pdf") =>
  download(`/invoicing/${invoiceId}/pdf`, filename, {
    errorMessage: "No se pudo generar el PDF",
  });

// WHATSAPP

export const getWhatsAppConversations = () =>
  request("/whatsapp/conversations", {
    errorMessage: "No se pudieron cargar las conversaciones",
  });

export const getWhatsAppConversation = (phone) =>
  request(`/whatsapp/conversations/${phone}`, {
    errorMessage: "No se pudo cargar la conversación",
  });

// Envía el mensaje de verdad por WhatsApp desde el número del negocio
export const sendWhatsAppMessage = (phone, message) =>
  request(`/whatsapp/conversations/${phone}/messages`, {
    method: "POST",
    body: { message },
    errorMessage: "No se pudo enviar el mensaje",
  });

// Conexión con el celular (QR). Solo super_admin y admin.
export const getWhatsAppConnection = () =>
  request("/whatsapp/connection", {
    errorMessage: "No se pudo consultar la conexión de WhatsApp",
  });

export const connectWhatsApp = () =>
  request("/whatsapp/connection/connect", {
    method: "POST",
    errorMessage: "No se pudo iniciar la conexión con WhatsApp",
  });

export const logoutWhatsApp = () =>
  request("/whatsapp/connection/logout", {
    method: "POST",
    errorMessage: "No se pudo desvincular WhatsApp",
  });

// URL del stream de eventos en tiempo real. EventSource no puede mandar el
// header Authorization, así que el token va en la URL (solo esta ruta lo acepta).
export const whatsAppEventsUrl = () =>
  buildUrl("/whatsapp/events", { access_token: getToken() });
