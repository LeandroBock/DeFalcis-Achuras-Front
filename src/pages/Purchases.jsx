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
  Pencil,
} from "lucide-react";

import {
  getPurchases,
  getPurchase,
  createPurchase,
  getSuppliers,
  getProducts,
  deletePurchase,
  updatePurchase,
} from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

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
  const [purchaseToCancel, setPurchaseToCancel] = useState(null);
  const [cancellingPurchase, setCancellingPurchase] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState(null);
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("transfer");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState([]);
  const [editProductId, setEditProductId] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnitCost, setEditUnitCost] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function handleCancelEdit() {
    setShowEditForm(false);
    setPurchaseToEdit(null);
    setEditSupplierId("");
    setEditPaymentMethod("transfer");
    setEditNotes("");
    setEditItems([]);
    setEditProductId("");
    setEditQuantity("");
    setEditUnitCost("");
  }

  async function handleEditPurchase(purchase) {
    if (!purchase?.id) {
      alert("No se pudo identificar la compra.");
      return;
    }

    if (String(purchase.paymentStatus).toLowerCase() === "cancelled") {
      alert("No se puede editar una compra anulada.");
      return;
    }

    try {
      const response = await getPurchase(purchase.id);
      const data = response?.data ?? response;
      const fullPurchase = data?.purchase ?? purchase;
      const purchaseItems = Array.isArray(data?.items) ? data.items : [];

      setPurchaseToEdit(fullPurchase);
      setEditSupplierId(fullPurchase.supplierId ?? "");
      setEditPaymentMethod(fullPurchase.paymentMethod ?? "transfer");
      setEditNotes(fullPurchase.notes ?? "");

      setEditItems(
        purchaseItems.map((item) => {
          const product = products.find((p) => p.id === item.productId);

          return {
            productId: item.productId,
            productName: product?.name ?? "Producto",
            quantity: Number(item.quantity),
            unitCost: Number(item.unitCost),
          };
        }),
      );

      setShowEditForm(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      setEditProductId("");
      setEditQuantity("");
      setEditUnitCost("");
    } catch (error) {
      console.error("Error al cargar la compra:", error);
      alert(error.message || "No se pudo cargar el detalle de la compra.");
    }
  }

  function addEditItem() {
    if (!editProductId || editQuantity === "" || editUnitCost === "") {
      alert("Seleccioná un producto, una cantidad y un costo.");
      return;
    }

    const quantityValue = Number(editQuantity);
    const costValue = Number(editUnitCost);

    if (
      !Number.isFinite(quantityValue) ||
      quantityValue < 0.001 ||
      !Number.isFinite(costValue) ||
      costValue < 0
    ) {
      alert("Ingresá una cantidad mayor que cero y un costo válido.");
      return;
    }

    const product = products.find((p) => p.id === editProductId);

    if (!product) {
      alert("El producto seleccionado no está disponible.");
      return;
    }

    setEditItems((previous) => [
      ...previous,
      {
        productId: product.id,
        productName: product.name,
        quantity: quantityValue,
        unitCost: costValue,
      },
    ]);

    setEditProductId("");
    setEditQuantity("");
    setEditUnitCost("");
  }

  function updateEditItem(index, field, value) {
    setEditItems((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "productId") {
          const product = products.find((p) => p.id === value);

          return {
            ...item,
            productId: value,
            productName: product?.name ?? "Producto",
          };
        }

        return {
          ...item,
          [field]: value === "" ? "" : Number(value),
        };
      }),
    );
  }

  function removeEditItem(index) {
    setEditItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function handleSavePurchase() {
    if (!purchaseToEdit?.id) return;

    if (!editSupplierId) {
      alert("Seleccioná un proveedor.");
      return;
    }

    if (editItems.length === 0) {
      alert("La compra debe tener al menos un producto.");
      return;
    }

    const validItems = editItems.every(
      (item) =>
        item.productId &&
        Number.isFinite(Number(item.quantity)) &&
        Number(item.quantity) >= 0.001 &&
        Number.isFinite(Number(item.unitCost)) &&
        Number(item.unitCost) >= 0,
    );

    if (!validItems) {
      alert("Revisá las cantidades y los costos de los productos.");
      return;
    }

    try {
      setSavingEdit(true);

      await updatePurchase(purchaseToEdit.id, {
        supplierId: editSupplierId,
        paymentMethod: editPaymentMethod,
        notes: editNotes,
        items: editItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      });

      handleCancelEdit();
      await loadData();
    } catch (error) {
      console.error("Error al editar la compra:", error);
      alert(error.message || "No se pudo actualizar la compra.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [purchasesData, suppliersData, productsData] = await Promise.all([
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

    const product = products.find((item) => item.id === productId);

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

  function handleDeactivate(purchase) {
    if (!purchase?.id) {
      alert("No se pudo obtener el ID de la compra.");
      return;
    }

    if (purchase.paymentStatus === "CANCELLED") {
      return;
    }

    setPurchaseToCancel(purchase);
  }

  async function confirmCancelPurchase() {
    if (!purchaseToCancel) return;

    const purchaseId =
      purchaseToCancel.id ??
      purchaseToCancel.purchaseId ??
      purchaseToCancel.purchase_id ??
      purchaseToCancel.purchase?.id ??
      purchaseToCancel.purchase?.purchaseId ??
      purchaseToCancel.purchase?.purchase_id;

    if (!purchaseId) {
      console.error("Compra sin identificador:", purchaseToCancel);
      alert("No se encontró el ID de la compra. Revisá la consola.");
      return;
    }

    try {
      setCancellingPurchase(true);

      await deletePurchase(purchaseId);

      setPurchaseToCancel(null);
      await loadData();
    } catch (error) {
      console.error("Error al anular la compra:", error);
      alert(error.message || "No se pudo anular la compra.");
    } finally {
      setCancellingPurchase(false);
    }
  }

  function removeItem(index) {
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function getTotal() {
    return items.reduce((total, item) => total + item.subtotal, 0);
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

      setPurchases([result.purchase, ...purchases]);

      resetForm();
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo crear la compra");
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
      CANCELLED: "Anulada",
      cancelled: "Anulada",
    };

    return statuses[status] || status;
  }

  function getSupplierName(supplierId) {
    const supplier = suppliers.find((item) => item.id === supplierId);

    return supplier?.name || "Proveedor desconocido";
  }

  function getStatusClasses(status) {
    const styles = {
      paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      partial:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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

          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>

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

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                  onChange={(event) => setSupplierId(event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                >
                  <option value="">Seleccioná un proveedor</option>

                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
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
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                >
                  <option value="cash">Efectivo</option>

                  <option value="transfer">Transferencia</option>

                  <option value="mercado_pago">Mercado Pago</option>

                  <option value="credit">Cuenta corriente</option>
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
                    onChange={(event) => setProductId(event.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
                  >
                    <option value="">Seleccioná un producto</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
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
                    onChange={(event) => setQuantity(event.target.value)}
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
                    onChange={(event) => setUnitCost(event.target.value)}
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
                                onClick={() => removeItem(index)}
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
                onChange={(event) => setNotes(event.target.value)}
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

      {showEditForm && purchaseToEdit && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <Pencil className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Editar compra
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Modificá los datos y los productos de la compra.
              </p>
            </div>
          </div>

          <p className="mb-5 break-all text-xs text-gray-500 dark:text-gray-400">
            Compra: {purchaseToEdit.id}
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSavePurchase();
            }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Proveedor
                </label>
                <select
                  value={editSupplierId}
                  onChange={(event) => setEditSupplierId(event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Seleccioná un proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Forma de pago
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(event) => setEditPaymentMethod(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mercado_pago">Mercado Pago</option>
                  <option value="credit">Cuenta corriente</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50 sm:p-5">
              <h3 className="mb-4 font-bold text-gray-900 dark:text-white">
                Productos de la compra
              </h3>

              <div className="flex flex-col gap-4">
                {editItems.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Producto
                        </label>
                        <select
                          value={item.productId}
                          onChange={(event) =>
                            updateEditItem(
                              index,
                              "productId",
                              event.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        >
                          {!products.some(
                            (product) => product.id === item.productId,
                          ) && (
                            <option value={item.productId}>
                              {item.productName}
                            </option>
                          )}
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.quantity}
                          onChange={(event) =>
                            updateEditItem(
                              index,
                              "quantity",
                              event.target.value,
                            )
                          }
                          required
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Costo unitario
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) =>
                            updateEditItem(
                              index,
                              "unitCost",
                              event.target.value,
                            )
                          }
                          required
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeEditItem(index)}
                        title="Quitar producto"
                        className="flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-3 text-right text-sm text-gray-600 dark:text-gray-300">
                      Subtotal:{" "}
                      <strong>
                        {formatMoney(
                          Number(item.quantity || 0) *
                            Number(item.unitCost || 0),
                        )}
                      </strong>
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  Agregar otro producto
                </h4>

                <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Producto
                    </label>
                    <select
                      value={editProductId}
                      onChange={(event) => setEditProductId(event.target.value)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    >
                      <option value="">Seleccioná un producto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={editQuantity}
                      onChange={(event) => setEditQuantity(event.target.value)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Costo unitario
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editUnitCost}
                      onChange={(event) => setEditUnitCost(event.target.value)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addEditItem}
                    title="Agregar producto"
                    className="flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-800 sm:justify-end">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Total recalculado
                </span>
                <strong className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatMoney(
                    editItems.reduce(
                      (total, item) =>
                        total +
                        Number(item.quantity || 0) * Number(item.unitCost || 0),
                      0,
                    ),
                  )}
                </strong>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="purchase-edit-notes"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Notas y descripción
              </label>
              <textarea
                id="purchase-edit-notes"
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Observaciones de la compra"
                className="resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={savingEdit}
                className="flex w-fit items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingEdit}
                className="flex w-fit items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
            {purchases.length} {purchases.length === 1 ? "compra" : "compras"}
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
              Cuando registres una compra aparecerá en este historial.
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
                      {new Date(purchase.createdAt).toLocaleDateString("es-AR")}
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

                        {formatStatus(purchase.paymentStatus)}
                      </span>
                    </td>

                    <td className="max-w-xs px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {purchase.notes || "Sin notas"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            handleEditPurchase(purchase);
                          }}
                          disabled={purchase.paymentStatus === "CANCELLED"}
                          title="Editar compra"
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeactivate(purchase)}
                          disabled={purchase.paymentStatus === "CANCELLED"}
                          title={
                            purchase.paymentStatus === "CANCELLED"
                              ? "Compra anulada"
                              : "Anular compra"
                          }
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
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
      <ConfirmModal
        isOpen={!!purchaseToCancel}
        title="¿Anular compra?"
        message={
          purchaseToCancel
            ? `¿Querés anular la compra de ${getSupplierName(
                purchaseToCancel.supplierId,
              )} por ${formatMoney(purchaseToCancel.total)}? Se revertirá el stock asociado.`
            : ""
        }
        confirmText="Anular compra"
        loadingText="Anulando..."
        onConfirm={confirmCancelPurchase}
        onCancel={() => setPurchaseToCancel(null)}
        loading={cancellingPurchase}
      />
    </main>
  );
}

export default Purchases;
