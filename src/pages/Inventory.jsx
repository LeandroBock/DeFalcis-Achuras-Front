import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardEdit,
  History,
  Package,
  Plus,
  Save,
  Settings2,
  X,
} from "lucide-react";

import {
  getInventoryMovements,
  createInventoryMovement,
  getProducts,
} from "../services/api";


function Inventory() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    type: "entry",
    quantity: "",
    reason: "",
  });

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      setError("");

      const [productsData, movementsData] = await Promise.all([
        getProducts(),
        getInventoryMovements(),
      ]);

      setProducts(productsData);
      setMovements(movementsData);
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el inventario.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const movementData = {
        productId: formData.productId,
        type: formData.type,
        quantity: Number(formData.quantity),
        reason: formData.reason || undefined,
      };

      const result = await createInventoryMovement(movementData);

      alert(`Movimiento registrado. Nuevo stock: ${result.stock}`);

      setFormData({
        productId: "",
        type: "entry",
        quantity: "",
        reason: "",
      });

      setShowForm(false);

      await loadInventory();
    } catch (error) {
      console.error(error);

      alert(
        error.message || "No se pudo registrar el movimiento",
      );
    }
  }

  function getProductName(productId) {
    const product = products.find(
      (item) => item.id === productId,
    );

    return product?.name || "Producto eliminado";
  }

  function getProduct(productId) {
    return products.find(
      (item) => item.id === productId,
    );
  }

  function formatType(type) {
    const types = {
      entry: "Entrada",
      exit: "Salida",
      adjustment: "Ajuste",
    };

    return types[type] || type;
  }

  function formatUnit(unit) {
    const units = {
      kg: "kg",
      unit: "unidad",
    };

    return units[unit] || unit;
  }

  function formatDate(date) {
    return new Date(date).toLocaleString("es-AR");
  }

  function getMovementIcon(type) {
    if (type === "entry") {
      return <ArrowDownToLine className="h-4 w-4" />;
    }

    if (type === "exit") {
      return <ArrowUpFromLine className="h-4 w-4" />;
    }

    return <Settings2 className="h-4 w-4" />;
  }

  if (loading) {
    return (
      <main className="min-h-[400px] p-6">
        <div className="flex min-h-[300px] items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
          <Boxes className="h-5 w-5 animate-pulse" />
          <span>Cargando inventario...</span>
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
              <Boxes className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Control
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Inventario
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Control de stock y movimientos de mercadería
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
            showForm
              ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          }`}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Movimiento manual
            </>
          )}
        </button>
      </header>

      {/* FORMULARIO */}

      {showForm && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <ClipboardEdit className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Nuevo movimiento
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Registrá una entrada, salida o ajuste de stock.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* PRODUCTO */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="productId"
                className="text-sm font-semibold"
              >
                Producto
              </label>

              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="">
                  Seleccionar producto
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

            {/* TIPO */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="type"
                className="text-sm font-semibold"
              >
                Tipo de movimiento
              </label>

              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="entry">
                  Entrada
                </option>

                <option value="exit">
                  Salida
                </option>

                <option value="adjustment">
                  Ajuste de stock
                </option>
              </select>
            </div>

            {/* CANTIDAD */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="quantity"
                className="text-sm font-semibold"
              >
                Cantidad
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="Ej: 10"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* MOTIVO */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="reason"
                className="text-sm font-semibold"
              >
                Motivo
              </label>

              <input
                id="reason"
                name="reason"
                type="text"
                placeholder="Ej: Diferencia de inventario"
                value={formData.reason}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* BOTÓN */}

            <div className="flex justify-end pt-2 md:col-span-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:w-auto dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
                Registrar movimiento
              </button>
            </div>
          </form>
        </section>
      )}

      {/* STOCK ACTUAL */}

      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold">
                Stock actual
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Existencias actuales por producto
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {products.length}{" "}
            {products.length === 1
              ? "producto"
              : "productos"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay productos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Producto
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Categoría
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Stock
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Unidad
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {products.map((product) => {
                  const stock = Number(product.stock);

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-5 py-4">
                        <strong className="font-semibold">
                          {product.name}
                        </strong>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <strong
                          className={`text-base ${
                            stock <= 0
                              ? "text-red-600 dark:text-red-400"
                              : stock <= 5
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {stock}
                        </strong>
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {formatUnit(product.unit)}
                      </td>

                      <td className="px-5 py-4">
                        {stock > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Sin stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* HISTORIAL */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <History className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold">
                Historial de movimientos
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registro de entradas, salidas y ajustes
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {movements.length}{" "}
            {movements.length === 1
              ? "movimiento"
              : "movimientos"}
          </span>
        </div>

        {movements.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay movimientos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Fecha
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Producto
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Tipo
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Cantidad
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Motivo
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {movements.map((movement) => {
                  const product = getProduct(
                    movement.productId,
                  );

                  return (
                    <tr
                      key={movement.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(movement.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <strong className="font-semibold">
                          {getProductName(
                            movement.productId,
                          )}
                        </strong>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            movement.type === "entry"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : movement.type === "exit"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {getMovementIcon(
                            movement.type,
                          )}

                          {formatType(
                            movement.type,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {movement.quantity}{" "}
                        {formatUnit(
                          product?.unit,
                        )}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-gray-600 dark:text-gray-400">
                        {movement.reason ||
                          "Sin motivo"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Inventory;