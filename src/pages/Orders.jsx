import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  ShoppingCart,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { createOrder, emitInvoices, downloadInvoicePdf } from "../services/api";
import {
  invalidation,
  keys,
  useApiMutation,
  useCustomers,
  useInvoices,
  useOrders,
  useProducts,
} from "../hooks/queries";
import { usePagination } from "../hooks/usePagination";
import {
  formatDate,
  formatMoney,
  formatOrderStatus as formatStatus,
  formatPaymentStatus,
  multiplyMoney,
  sumMoney,
} from "../utils/format";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/ui/Pagination";
import { ErrorState, LoadingState } from "../components/ui/PageStates";

const { AFTER_SALE } = invalidation;

function Orders() {
  const ordersQuery = useOrders();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();

  // Si el usuario no tiene permiso para facturar, la pantalla
  // sigue funcionando y simplemente no muestra la facturación
  const invoicesQuery = useInvoices();
  const canInvoice = invoicesQuery.isSuccess;

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const customers = useMemo(
    () => customersQuery.data ?? [],
    [customersQuery.data],
  );
  const products = productsQuery.data ?? [];
  const invoices = useMemo(
    () => invoicesQuery.data ?? [],
    [invoicesQuery.data],
  );

  const { pageItems, ...pagination } = usePagination(orders);

  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [items, setItems] = useState([]);

  // Facturación
  const [selected, setSelected] = useState(new Set());
  const [confirmInvoice, setConfirmInvoice] = useState(false);

  const createSale = useApiMutation(createOrder, {
    invalidate: [...AFTER_SALE, keys.invoices],
    success: "Venta registrada",
  });

  const emit = useApiMutation(emitInvoices, {
    invalidate: [keys.invoices],
  });

  const invoicing = emit.isPending;

  function loadData() {
    ordersQuery.refetch();
    customersQuery.refetch();
    productsQuery.refetch();
  }

  // ---------- Facturación ----------
  const invoiceByOrder = useMemo(
    () => new Map(invoices.map((invoice) => [invoice.orderId, invoice])),
    [invoices],
  );

  function isInvoiceable(order) {
    const invoice = invoiceByOrder.get(order.id);

    return (
      ["confirmed", "delivered"].includes(order.status) &&
      invoice?.status !== "authorized" &&
      invoice?.status !== "pending"
    );
  }

  const invoiceableOrders = orders.filter(isInvoiceable);

  const allSelected =
    invoiceableOrders.length > 0 &&
    invoiceableOrders.every((order) => selected.has(order.id));

  function toggleSelected(orderId) {
    setSelected((previous) => {
      const next = new Set(previous);

      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }

      return next;
    });
  }

  function toggleAll() {
    setSelected(
      allSelected
        ? new Set()
        : new Set(invoiceableOrders.map((order) => order.id)),
    );
  }

  function handleInvoice() {
    if (selected.size === 0) {
      return;
    }

    if (selected.size > 50) {
      toast.error("Podés facturar hasta 50 ventas por vez.");
      return;
    }

    setConfirmInvoice(true);
  }

  function emitSelectedInvoices() {
    emit.mutate([...selected], {
      onSuccess: (results) => {
        const failed = results.filter((result) => !result.ok);
        const okCount = results.length - failed.length;

        if (failed.length > 0) {
          toast.warning(`${okCount} facturada(s), ${failed.length} con error`, {
            description: (
              <ul className="mt-1 space-y-1">
                {failed.map((item) => (
                  <li key={item.orderId}>
                    • Venta {item.orderId.slice(0, 8)}: {item.error}
                  </li>
                ))}
              </ul>
            ),
            duration: 15000,
          });
        } else {
          toast.success(`${okCount} factura(s) emitida(s)`);
        }

        setSelected(new Set());
      },
      onSettled: () => setConfirmInvoice(false),
    });
  }

  async function handleDownloadPdf(invoice) {
    try {
      const number = `${String(invoice.ptoVta).padStart(5, "0")}-${String(invoice.cbteNro).padStart(8, "0")}`;

      await downloadInvoicePdf(invoice.id, `factura-${number}.pdf`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  // ---------- Ventas ----------
  function addItem() {
    if (!productId || !quantity) {
      toast.error("Seleccioná un producto y una cantidad.");
      return;
    }

    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    const quantityNumber = Number(quantity);
    const stockNumber = Number(product.stock);

    if (quantityNumber <= 0) {
      toast.error("La cantidad tiene que ser mayor a cero.");
      return;
    }

    if (quantityNumber > stockNumber) {
      toast.error(`Stock insuficiente. Disponible: ${stockNumber}`);
      return;
    }

    const existingItem = items.find((item) => item.productId === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantityNumber;

      if (newQuantity > stockNumber) {
        toast.error(`Stock insuficiente. Disponible: ${stockNumber}`);
        return;
      }

      setItems(
        items.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: multiplyMoney(newQuantity, item.unitPrice),
              }
            : item,
        ),
      );
    } else {
      const unitPrice = Number(product.salePrice);

      const newItem = {
        productId: product.id,
        productName: product.name,
        quantity: quantityNumber,
        unitPrice,
        subtotal: multiplyMoney(quantityNumber, unitPrice),
        stock: stockNumber,
      };

      setItems([...items, newItem]);
    }

    setProductId("");
    setQuantity("");
  }

  function removeItem(index) {
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  // Total estimado: el importe definitivo lo calcula el backend
  function getTotal() {
    return sumMoney(items.map((item) => item.subtotal));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!customerId) {
      toast.error("Seleccioná un cliente.");
      return;
    }

    if (items.length === 0) {
      toast.error("Agregá al menos un producto.");
      return;
    }

    const orderData = {
      customerId,
      notes,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    createSale.mutate(orderData, { onSuccess: resetForm });
  }

  function resetForm() {
    setShowForm(false);
    setCustomerId("");
    setNotes("");
    setProductId("");
    setQuantity("");
    setItems([]);
  }

  function handleCancel() {
    resetForm();
  }

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );

  function getCustomerName(customerId) {
    return customerNames.get(customerId) || "Cliente desconocido";
  }

  if (
    ordersQuery.isLoading ||
    customersQuery.isLoading ||
    productsQuery.isLoading
  ) {
    return <LoadingState message="Cargando ventas..." />;
  }

  if (ordersQuery.error || customersQuery.error || productsQuery.error) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos."
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <Receipt className="h-7 w-7" />
            Ventas
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registro de ventas y pedidos de clientes
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              handleCancel();
            } else {
              setShowForm(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nueva venta
            </>
          )}
        </button>
      </header>

      {/* NEW ORDER */}
      {showForm && (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <ShoppingCart className="h-5 w-5" />
              Nueva venta
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-5">
            {/* CUSTOMER */}
            <div>
              <label
                htmlFor="customer"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Cliente
              </label>

              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <select
                  id="customer"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  required
                  className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white"
                >
                  <option value="">Seleccioná un cliente</option>

                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PRODUCTS */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/40">
              <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                <Package className="h-5 w-5" />
                Agregar productos
              </h3>

              <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end">
                {/* PRODUCT */}
                <div>
                  <label
                    htmlFor="product"
                    className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Producto
                  </label>

                  <select
                    id="product"
                    value={productId}
                    onChange={(event) => setProductId(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-white"
                  >
                    <option value="">Seleccioná un producto</option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={Number(product.stock) <= 0}
                      >
                        {product.name} — Stock: {product.stock}
                      </option>
                    ))}
                  </select>
                </div>

                {/* QUANTITY */}
                <div>
                  <label
                    htmlFor="quantity"
                    className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Cantidad
                  </label>

                  <input
                    id="quantity"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="Ej: 3"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-white"
                  />
                </div>

                {/* ADD */}
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>

              {/* ITEMS */}
              {items.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                            Producto
                          </th>

                          <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                            Cantidad
                          </th>

                          <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                            Precio
                          </th>

                          <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                            Subtotal
                          </th>

                          <th className="px-4 py-3" />
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {items.map((item, index) => (
                          <tr
                            key={`${item.productId}-${index}`}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                              {item.productName}
                            </td>

                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {formatMoney(item.unitPrice)}
                            </td>

                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                              {formatMoney(item.subtotal)}
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                                aria-label={`Eliminar ${item.productName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* TOTAL */}
                  <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/50">
                    <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      Total
                    </span>

                    <strong className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatMoney(getTotal())}
                    </strong>
                  </div>
                </div>
              )}
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

                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notas del pedido"
                  rows={3}
                  className="w-full resize-y rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white"
                />
              </div>
            </div>

            {/* SAVE */}
            <button
              type="submit"
              disabled={createSale.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <Save className="h-4 w-4" />
              Confirmar venta
            </button>
          </form>
        </section>
      )}

      {/* HISTORY */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Receipt className="h-5 w-5" />
              Historial de ventas
            </h2>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {orders.length} ventas
            </span>
          </div>

          {canInvoice && (
            <button
              type="button"
              onClick={handleInvoice}
              disabled={selected.size === 0 || invoicing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {invoicing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}

              {invoicing
                ? "Facturando..."
                : `Facturar seleccionadas (${selected.size})`}
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <ShoppingCart className="mb-4 h-12 w-12 text-gray-400" />

            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay ventas registradas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                <tr>
                  {canInvoice && (
                    <th className="w-10 px-5 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        disabled={invoiceableOrders.length === 0}
                        aria-label="Seleccionar todas las ventas facturables"
                      />
                    </th>
                  )}

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Fecha
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Cliente
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Total
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Estado
                  </th>

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Pago
                  </th>

                  {canInvoice && (
                    <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                      Factura
                    </th>
                  )}

                  <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                    Notas
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pageItems.map((order) => {
                  const invoice = invoiceByOrder.get(order.id);

                  return (
                    <tr
                      key={order.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      {canInvoice && (
                        <td className="px-5 py-4">
                          {isInvoiceable(order) && (
                            <input
                              type="checkbox"
                              checked={selected.has(order.id)}
                              onChange={() => toggleSelected(order.id)}
                              aria-label="Seleccionar venta para facturar"
                            />
                          )}
                        </td>
                      )}

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />

                          {formatDate(order.createdAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            <UserRound className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </div>

                          <strong className="text-gray-900 dark:text-white">
                            {getCustomerName(order.customerId)}
                          </strong>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                        {formatMoney(order.total)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            order.status === "confirmed"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                                : order.status === "delivered"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          {order.status === "confirmed" ||
                          order.status === "delivered" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}

                          {formatStatus(order.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            order.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              : order.paymentStatus === "partial"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                          }`}
                        >
                          <CircleDollarSign className="h-3.5 w-3.5" />

                          {formatPaymentStatus(order.paymentStatus)}
                        </span>
                      </td>

                      {canInvoice && (
                        <td className="px-5 py-4">
                          {invoice?.status === "authorized" ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(invoice)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-950/60"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Factura {invoice.cbteTipo === 1 ? "A" : "B"}{" "}
                              {String(invoice.cbteNro).padStart(8, "0")} · PDF
                            </button>
                          ) : invoice?.status === "rejected" ? (
                            <span
                              title={invoice.errorMessage || ""}
                              className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              Rechazada
                            </span>
                          ) : invoice?.status === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">
                              En proceso
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Sin facturar
                            </span>
                          )}
                        </td>
                      )}

                      <td className="max-w-xs px-5 py-4 text-gray-600 dark:text-gray-300">
                        {order.notes || "Sin notas"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination {...pagination} />
      </section>

      <ConfirmModal
        isOpen={confirmInvoice}
        title="¿Emitir facturas?"
        message={`Se van a emitir ${selected.size} factura(s) en ARCA. Esta acción no se puede deshacer.`}
        onConfirm={emitSelectedInvoices}
        onCancel={() => setConfirmInvoice(false)}
        loading={invoicing}
        confirmText="Emitir facturas"
        loadingText="Emitiendo..."
      />
    </div>
  );
}

export default Orders;
