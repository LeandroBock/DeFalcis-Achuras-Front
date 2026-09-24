import { useEffect, useState } from "react";
import {
  FolderTree,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  getCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
} from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
const [categoryToDeactivate, setCategoryToDeactivate] =
  useState(null);
const [deactivating, setDeactivating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const data = await getCategories();

      setCategories(data);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar las categorías.");
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
    if (editingCategory) {
      const updatedCategory = await updateCategory(
        editingCategory.id,
        formData,
      );

      setCategories(
        categories.map((category) =>
          category.id === editingCategory.id
            ? updatedCategory
            : category,
        ),
      );
    } else {
      const newCategory =
        await createCategory(formData);

      setCategories([
        ...categories,
        newCategory,
      ]);
    }

    handleCancel();
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        (editingCategory
          ? "No se pudo actualizar la categoría"
          : "No se pudo crear la categoría"),
    );
  }
}

async function handleDeactivate() {
  if (!categoryToDeactivate) {
    return;
  }

  try {
    setDeactivating(true);

    await deactivateCategory(
      categoryToDeactivate.id,
    );

    setCategories(
      categories.filter(
        (category) =>
          category.id !==
          categoryToDeactivate.id,
      ),
    );

    setCategoryToDeactivate(null);
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        "No se pudo desactivar la categoría",
    );
  } finally {
    setDeactivating(false);
  }
}

function handleCancel() {
  setShowForm(false);
  setEditingCategory(null);

  setFormData({
    name: "",
    description: "",
  });
}

  function handleEdit(category) {
  setEditingCategory(category);

  setFormData({
    name: category.name || "",
    description: category.description || "",
  });

  setShowForm(true);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

  if (loading) {
    return (
      <main className="min-h-[400px] p-6">
        <div className="flex min-h-[300px] items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
          <FolderTree className="h-5 w-5 animate-pulse" />
          <span>Cargando categorías...</span>
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
              <FolderTree className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Gestión
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Categorías
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administración de categorías de DF Achuras
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
              Nueva categoría
            </>
          )}
        </button>
      </header>

      {/* FORMULARIO */}

      {showForm && (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Plus className="h-5 w-5" />
            </div>

            <div>
<h2 className="text-xl font-bold">
  {editingCategory
    ? "Editar categoría"
    : "Nueva categoría"}
</h2>

<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
  {editingCategory
    ? "Modificá los datos de la categoría."
    : "Completá los datos de la nueva categoría."}
</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold"
              >
                Nombre
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Ej: Achuras"
                value={formData.name}
                onChange={handleChange}
                maxLength={50}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />

              <span className="text-xs text-gray-400">
                Máximo 50 caracteres.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="description"
                className="text-sm font-semibold"
              >
                Descripción
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Descripción de la categoría"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
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
{editingCategory
  ? "Guardar cambios"
  : "Guardar categoría"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* LISTADO */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <FolderTree className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold">
                Listado de categorías
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Categorías activas de DF Achuras
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {categories.length}{" "}
            {categories.length === 1
              ? "categoría"
              : "categorías"}
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <FolderTree className="h-7 w-7" />
            </div>

            <h3 className="font-semibold">
              No hay categorías registradas
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Creá la primera categoría para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Nombre
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Descripción
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <FolderTree className="h-4 w-4" />
                        </div>

                        <strong className="font-semibold text-gray-900 dark:text-white">
                          {category.name}
                        </strong>
                      </div>
                    </td>

                    <td className="max-w-lg px-5 py-4 text-gray-600 dark:text-gray-400">
                      {category.description ||
                        "Sin descripción"}
                    </td>

                    <td className="px-5 py-4">
                     <div className="flex justify-end gap-2">
  <button
    type="button"
    onClick={() => handleEdit(category)}
    title="Editar categoría"
    className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
  >
    <Pencil className="h-4 w-4" />
  </button>

  <button
    type="button"
    onClick={() =>
      setCategoryToDeactivate(category)
    }
    title="Desactivar categoría"
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
  isOpen={!!categoryToDeactivate}
  title="¿Desactivar categoría?"
  message={
    categoryToDeactivate
      ? `¿Estás seguro de que querés desactivar "${categoryToDeactivate.name}"? La categoría dejará de aparecer en el listado de categorías activas.`
      : ""
  }
  onConfirm={handleDeactivate}
  onCancel={() =>
    setCategoryToDeactivate(null)
  }
  loading={deactivating}
/>
    </main>
  );
}

export default Categories;