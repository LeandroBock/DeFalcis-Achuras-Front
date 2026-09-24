import { useEffect, useState } from "react";
import {
  Edit,
  Package,
  Plus,
  Save,
  Trash2,
  Pencil,
  X,
} from "lucide-react";

import {
  getProducts,
  createProduct,
  updateProduct,
  deactivateProduct,
} from "../services/api";
import ConfirmModal from "../components/ConfirmModal";


function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDeactivate, setProductToDeactivate] = useState(null);
const [deactivating, setDeactivating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    unit: "kg",
    salePrice: "",
    costPrice: "",
    stock: "",
  });

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error(error);
        setError("No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleEdit(product) {
    setEditingProduct(product);
    setShowForm(true);

    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      unit: product.unit,
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      stock: product.stock,
    });
  }

async function handleDeactivate() {
  if (!productToDeactivate) {
    return;
  }

  try {
    setDeactivating(true);

    await deactivateProduct(productToDeactivate.id);

    setProducts(
      products.filter(
        (product) =>
          product.id !== productToDeactivate.id,
      ),
    );

    setProductToDeactivate(null);
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        "No se pudo desactivar el producto",
    );
  } finally {
    setDeactivating(false);
  }
}

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const productData = {
        ...formData,
        salePrice: Number(formData.salePrice),
        costPrice: Number(formData.costPrice),
        stock: Number(formData.stock),
      };

      if (editingProduct) {
        const updatedProduct = await updateProduct(
          editingProduct.id,
          productData,
        );

        setProducts(
          products.map((product) =>
            product.id === editingProduct.id
              ? updatedProduct
              : product,
          ),
        );
      } else {
        const newProduct = await createProduct(productData);

        setProducts([...products, newProduct]);
      }

      handleCancel();
    } catch (error) {
      console.error(error);
      setError(
  error.message ||
    "No se pudo guardar el producto",
);
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(value));
  }

  function handleCancel() {
    setShowForm(false);
    setEditingProduct(null);

    setFormData({
      name: "",
      description: "",
      category: "",
      unit: "kg",
      salePrice: "",
      costPrice: "",
      stock: 0,
    });
  }

  if (loading) {
    return (
      <main className="min-h-[400px] p-6">
        <div className="flex min-h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 animate-pulse" />
            <span>Cargando productos...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
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
              <Package className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Gestión
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Productos
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administración de productos de DF Achuras
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
              Nuevo producto
            </>
          )}
        </button>
      </header>

      {/* FORMULARIO */}

      {showForm && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              {editingProduct
                ? "Editar producto"
                : "Nuevo producto"}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Completá los datos del producto.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* NOMBRE */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Nombre
              </label>

              <input
                name="name"
                placeholder="Ej: Chinchulines"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* CATEGORÍA */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Categoría
              </label>

              <input
                name="category"
                placeholder="Ej: Achuras"
                value={formData.category}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* DESCRIPCIÓN */}

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold">
                Descripción
              </label>

              <input
                name="description"
                placeholder="Descripción del producto"
                value={formData.description}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* UNIDAD */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Unidad de venta
              </label>

              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="kg">Kilogramos</option>
                <option value="unit">Unidad</option>
              </select>
            </div>

            {/* STOCK */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Stock inicial
              </label>

              <input
                name="stock"
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                step="0.001"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* PRECIO VENTA */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Precio de venta
              </label>

              <input
                name="salePrice"
                type="number"
                placeholder="0"
                value={formData.salePrice}
                onChange={handleChange}
                min="0"
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* PRECIO COSTO */}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Precio de costo
              </label>

              <input
                name="costPrice"
                type="number"
                placeholder="0"
                value={formData.costPrice}
                onChange={handleChange}
                min="0"
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* BOTONES */}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row md:col-span-2 md:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                <Save className="h-4 w-4" />
                {editingProduct
                  ? "Guardar cambios"
                  : "Guardar producto"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* LISTADO */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        {/* HEADER TABLA */}

        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h2 className="font-bold">
              Listado de productos
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Productos activos de DF Achuras
            </p>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {products.length}{" "}
            {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Package className="h-7 w-7" />
            </div>

            <h3 className="font-semibold">
              No hay productos registrados
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Creá el primer producto para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Producto
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Categoría
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Unidad
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Precio venta
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Costo
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Stock
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {/* PRODUCTO */}

                    <td className="px-5 py-4">
                      <div>
                        <strong className="font-semibold text-gray-900 dark:text-white">
                          {product.name}
                        </strong>

                        {product.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* CATEGORÍA */}

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {product.category}
                      </span>
                    </td>

                    {/* UNIDAD */}

                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {product.unit === "kg"
                          ? "Kg"
                          : "Unidad"}
                      </span>
                    </td>

                    {/* PRECIO */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatMoney(product.salePrice)}
                      </span>
                    </td>

                    {/* COSTO */}

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      {formatMoney(product.costPrice)}
                    </td>

                    {/* STOCK */}

                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${
                          Number(product.stock) <= 0
                            ? "text-red-600 dark:text-red-400"
                            : Number(product.stock) <= 5
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* ACCIONES */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          title="Editar producto"
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
  setProductToDeactivate(product)
}
                          title="Desactivar producto"
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
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
  isOpen={!!productToDeactivate}
  title="¿Desactivar producto?"
  message={
    productToDeactivate
      ? `¿Estás seguro de que querés desactivar "${productToDeactivate.name}"? El producto dejará de aparecer en el listado de productos activos.`
      : ""
  }
  onConfirm={handleDeactivate}
  onCancel={() =>
    setProductToDeactivate(null)
  }
  loading={deactivating}
/>
    </main>
  );
}

export default Products;