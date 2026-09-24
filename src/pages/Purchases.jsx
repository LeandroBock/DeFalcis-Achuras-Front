import { useEffect, useState } from "react";

import {
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Package,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  Truck,
  Wallet,
  X,
} from "lucide-react";

import {
  getPurchases,
  createPurchase,
  getSuppliers,
  getProducts,
  deactivatePurcheses,
  deletePurchase,
} from "../services/api";


function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [notes, setNotes] = useState("");

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [purchasesData, suppliersData, productsData] =
        await Promise.all([
          getPurchases(),
          getSuppliers(),
          getProducts(),
        ]);

      setPurchases(purchasesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    if (!productId || !quantity || !unitCost) {
      alert("Seleccioná un producto, cantidad y costo.");
      return;
    }

    const product = products.find(
      (item) => item.id === productId,
    );

    if (!product) {
      return;
    }

    const newItem = {
      productId: product.id,
      productName: product.name,
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      subtotal: Number(quantity) * Number(unitCost),
    };

    setItems([...items, newItem]);

    setProductId("");
    setQuantity("");
    setUnitCost("");
  }

async function handleDeactivate(id) {
  if (!id) {
    alert("No se pudo obtener el ID de la compra.");
    return;
  }

  const confirmed = window.confirm(
    "¿Estás seguro de que querés anular esta compra? Se restará la cantidad del stock en el inventario.",
  );

  if (!confirmed) return; // Si el usuario cancela el cartel, frenamos la ejecución

  try {
    // 1. Ejecutamos la petición de borrado lógico en el servidor
    await deletePurchase(id); 
    
    alert("Compra anulada exitosamente.");

    // 2. Actualizamos el estado local de React para que la fila cambie a "Anulada" en tiempo real
    setPurchases((prevPurchases) =>
      prevPurchases.map((purchase) =>
        purchase.id === id 
          ? { ...purchase, paymentStatus: "CANCELLED" } 
          : purchase
      )
    );

    // 3. Volvemos a sincronizar los datos con la base de datos por seguridad
    await loadData();

  } catch (error) {
    console.error(error);
    alert(
      error.message || "No se pudo anular la compra.",
    );
  }
}


  function removeItem(index) {
    setItems(
      items.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    );
  }

  function getTotal() {
    return items.reduce(
      (total, item) => total + item.subtotal,
      0,
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!supplierId) {
      alert("Seleccioná un proveedor.");
      return;
    }

    if (items.length === 0) {
      alert("Agregá al menos un producto.");
      return;
    }

    try {
      const purchaseData = {
        supplierId,
        paymentMethod,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      };

      const result = await createPurchase(purchaseData);

      setPurchases([
        result.purchase,
        ...purchases,
      ]);

      resetForm();
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "No se pudo crear la compra",
      );
    }
  }

  function resetForm() {
    setShowForm(false);
    setSupplierId("");
    setPaymentMethod("transfer");
    setNotes("");
    setProductId("");
    setQuantity("");
    setUnitCost("");
    setItems([]);
  }

  function handleCancel() {
    resetForm();
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(value));
  }

  function formatPaymentMethod(method) {
    const methods = {
      cash: "Efectivo",
      transfer: "Transferencia",
      mercado_pago: "Mercado Pago",
      credit: "Cuenta corriente",
    };

    return methods[method] || method;
  }

  function formatStatus(status) {
    const statuses = {
      pending: "Pendiente",
      partial: "Parcial",
      paid: "Pagada",
    };

    return statuses[status] || status;
  }

  function getSupplierName(supplierId) {
    const supplier = suppliers.find(
      (item) => item.id === supplierId,
    );

    return supplier?.name || "Proveedor desconocido";
  }

  function getStatusClasses(status) {
    const styles = {
      paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      partial:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };

    return (
      styles[status] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    );
  }

  if (loading) {
    return (
      <main className="min-h-[400px] p-6">
        <div className="flex min-h-[300px] items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
          <ShoppingCart className="h-5 w-5 animate-pulse" />
          <span>Cargando compras...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:p-6 lg:p-8">
      {/* HEADER */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-gray-900 p-2 text-white dark:bg-white dark:text-gray-900">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              DF Achuras
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Compras
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registro de compras a proveedores
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
          className="flex w-fit items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nueva compra
            </>
          )}
        </button>
      </header>

      {/* FORMULARIO */}
      {showForm && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <ClipboardList className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Nueva compra
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Registrá una compra realizada a un proveedor.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            {/* PROVEEDOR + FORMA DE PAGO */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="supplier"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  <Truck className="h-4 w-4 text-gray-400" />
                  Proveedor
                </label>

                <select
                  id="supplier"
                  value={supplierId}
                  onChange={(event) =>
                    setSupplierId(event.target.value)
                  }
                  required
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                >
                  <option value="">
                    Seleccioná un proveedor
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="paymentMethod"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Forma de pago
                </label>

                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                >
                  <option value="cash">
                    Efectivo
                  </option>

                  <option value="transfer">
                    Transferencia
                  </option>

                  <option value="mercado_pago">
                    Mercado Pago
                  </option>

                  <option value="credit">
                    Cuenta corriente
                  </option>
                </select>
              </div>
            </div>

            {/* PRODUCTOS */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50 sm:p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                  <Package className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Agregar productos
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Agregá los productos incluidos en esta compra.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="product"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Producto
                  </label>

                  <select
                    id="product"
                    value={productId}
                    onChange={(event) =>
                      setProductId(event.target.value)
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                  >
                    <option value="">
                      Seleccioná un producto
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="quantity"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Cantidad
                  </label>

                  <input
                    id="quantity"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    placeholder="Ej: 10"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="unitCost"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Costo unitario
                  </label>

                  <input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(event) =>
                      setUnitCost(event.target.value)
                    }
                    placeholder="Ej: 4000"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>

              {/* ITEMS */}
              {items.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                  <div className="overflow-x-auto">
                    <table className="min-w-[700px] w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Producto
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Cantidad
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Costo unitario
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Subtotal
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Acción
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item, index) => (
                          <tr
                            key={`${item.productId}-${index}`}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                              {item.productName}
                            </td>

                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {formatMoney(item.unitCost)}
                            </td>

                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                              {formatMoney(item.subtotal)}
                            </td>

                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(index)
                                }
                                title="Eliminar producto"
                                className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* TOTAL */}
                  <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/50 sm:justify-end">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Total
                    </span>

                    <strong className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatMoney(getTotal())}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* NOTAS */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="notes"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Notas
              </label>

              <textarea
                id="notes"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Notas de la compra"
                rows={4}
                className="resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* ACCIONES */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="flex w-fit items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
                Guardar compra
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="flex w-fit items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* HISTORIAL */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <ClipboardList className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Historial de compras
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Compras registradas en el sistema.
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {purchases.length}{" "}
            {purchases.length === 1
              ? "compra"
              : "compras"}
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <ShoppingCart className="h-7 w-7" />
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white">
              No hay compras registradas
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Cuando registres una compra aparecerá en
              este historial.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Fecha
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Proveedor
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Forma de pago
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Estado
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Notas
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(
                        purchase.createdAt,
                      ).toLocaleDateString("es-AR")}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />

                        <strong className="text-sm text-gray-900 dark:text-white">
                          {getSupplierName(
                            purchase.supplierId,
                          )}
                        </strong>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white">
                      {formatMoney(purchase.total)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-gray-400" />

                        {formatPaymentMethod(
                          purchase.paymentMethod,
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          purchase.paymentStatus,
                        )}`}
                      >
                        {purchase.paymentStatus ===
                        "paid" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5" />
                        )}

                        {formatStatus(
                          purchase.paymentStatus,
                        )}
                      </span>
                    </td>

                    <td className="max-w-xs px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {purchase.notes || "Sin notas"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
  onClick={() => {
    // Esto te mostrará en la consola del navegador toda la información del objeto
    console.log("Datos de la compra seleccionada:", purchase);
    
    // Intentamos buscar el ID en todas sus posibles variantes
    const purchaseId = purchase.id || purchase._id || purchase.purchase?.id;
    
    if (!purchaseId) {
      alert("Error: No se encontró un ID válido en este objeto. Revisa la consola.");
      return;
    }
    
    handleDeactivate(purchaseId);
  }}
  className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
>
  <Trash2 className="h-3.5 w-3.5" />
</button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Purchases;