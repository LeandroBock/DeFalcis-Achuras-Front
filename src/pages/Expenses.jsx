import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Edit,
  FileText,
  Fuel,
  Plus,
  Receipt,
  Save,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../services/api";

import ConfirmModal from "../components/ConfirmModal";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    category: "other",
    description: "",
    amount: "",
    paymentMethod: "cash",
    notes: "",
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");

      const data = await getExpenses();

      setExpenses(data);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los gastos.");
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
      const expenseData = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (editingExpense) {
        const updatedExpense = await updateExpense(
          editingExpense.id,
          expenseData,
        );

        setExpenses(
          expenses.map((expense) =>
            expense.id === editingExpense.id
              ? updatedExpense
              : expense,
          ),
        );
      } else {
        const newExpense = await createExpense(expenseData);

        setExpenses([newExpense, ...expenses]);
      }

      resetForm();
    } catch (error) {
      console.error(error);
      setError(
        error.message || "No se pudo guardar el gasto",
      );
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditingExpense(null);

    setFormData({
      category: "other",
      description: "",
      amount: "",
      paymentMethod: "cash",
      notes: "",
    });
  }

  function handleEdit(expense) {
    setEditingExpense(expense);

    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
    });

    setShowForm(true);
  }

  async function handleDelete() {
    if (!expenseToDelete) return;

    try {
      setDeleting(true);

      await deleteExpense(expenseToDelete.id);

      setExpenses(
        expenses.filter(
          (expense) => expense.id !== expenseToDelete.id,
        ),
      );

      setExpenseToDelete(null);
    } catch (error) {
      console.error(error);
      setError(
        error.message || "No se pudo eliminar el gasto",
      );
    } finally {
      setDeleting(false);
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(value));
  }

  function formatCategory(category) {
    const categories = {
      rent: "Alquiler",
      utilities: "Servicios",
      fuel: "Combustible",
      salaries: "Sueldos",
      taxes: "Impuestos",
      maintenance: "Mantenimiento",
      administrative: "Administrativo",
      other: "Otros",
    };

    return categories[category] || category;
  }

  function formatPaymentMethod(method) {
    const methods = {
      cash: "Efectivo",
      transfer: "Transferencia",
      mercado_pago: "Mercado Pago",
    };

    return methods[method] || method;
  }

  function getCategoryIcon(category) {
    if (category === "fuel") {
      return Fuel;
    }

    if (category === "taxes") {
      return Receipt;
    }

    return Tags;
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <CircleDollarSign className="h-5 w-5 animate-pulse" />
          <span>Cargando gastos...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
              <Receipt className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Gastos
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Registro de gastos de DF Achuras
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nuevo gasto
            </>
          )}
        </button>
      </header>

      {/* FORMULARIO */}
      {showForm && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-5 dark:border-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <CircleDollarSign className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                {editingExpense
                  ? "Editar gasto"
                  : "Nuevo gasto"}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editingExpense
                  ? "Modificá los datos del gasto."
                  : "Registrá un nuevo gasto del negocio."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* CATEGORÍA */}
            <div className="space-y-2">
              <label
                htmlFor="category"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Tags className="h-4 w-4 text-gray-400" />
                Categoría
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="rent">Alquiler</option>
                <option value="utilities">Servicios</option>
                <option value="fuel">Combustible</option>
                <option value="salaries">Sueldos</option>
                <option value="taxes">Impuestos</option>
                <option value="maintenance">
                  Mantenimiento
                </option>
                <option value="administrative">
                  Administrativo
                </option>
                <option value="other">Otros</option>
              </select>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Descripción
              </label>

              <input
                id="description"
                name="description"
                type="text"
                placeholder="Ej: Combustible reparto"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* IMPORTE */}
            <div className="space-y-2">
              <label
                htmlFor="amount"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <CircleDollarSign className="h-4 w-4 text-gray-400" />
                Importe
              </label>

              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ej: 5000"
                value={formData.amount}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* FORMA DE PAGO */}
            <div className="space-y-2">
              <label
                htmlFor="paymentMethod"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <CreditCard className="h-4 w-4 text-gray-400" />
                Forma de pago
              </label>

              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">
                  Transferencia
                </option>
                <option value="mercado_pago">
                  Mercado Pago
                </option>
              </select>
            </div>

            {/* NOTAS */}
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="notes"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Notas
              </label>

              <textarea
                id="notes"
                name="notes"
                placeholder="Notas del gasto"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            {/* BOTÓN */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                <Save className="h-4 w-4" />

                {editingExpense
                  ? "Guardar cambios"
                  : "Guardar gasto"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* HISTORIAL */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <Banknote className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Historial de gastos
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Todos los gastos registrados
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {expenses.length} gastos
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-center dark:border-gray-700">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <Receipt className="h-5 w-5" />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay gastos registrados.
            </p>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline dark:text-gray-200"
            >
              <Plus className="h-4 w-4" />
              Registrar primer gasto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-[1000px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/70">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Fecha
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Categoría
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Descripción
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Importe
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Forma de pago
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
                {expenses.map((expense) => {
                  const CategoryIcon = getCategoryIcon(
                    expense.category,
                  );

                  return (
                    <tr
                      key={expense.id}
                      className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    >
                      {/* FECHA */}
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <CalendarDays className="h-4 w-4 text-gray-400" />

                          {new Date(
                            expense.createdAt,
                          ).toLocaleDateString("es-AR")}
                        </div>
                      </td>

                      {/* CATEGORÍA */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <CategoryIcon className="h-3.5 w-3.5" />

                          {formatCategory(
                            expense.category,
                          )}
                        </span>
                      </td>

                      {/* DESCRIPCIÓN */}
                      <td className="px-4 py-4 text-sm">
                        <strong className="font-semibold">
                          {expense.description}
                        </strong>
                      </td>

                      {/* IMPORTE */}
                      <td className="px-4 py-4 text-sm font-bold text-red-600 dark:text-red-400">
                        {formatMoney(expense.amount)}
                      </td>

                      {/* FORMA DE PAGO */}
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />

                          {formatPaymentMethod(
                            expense.paymentMethod,
                          )}
                        </div>
                      </td>

                      {/* NOTAS */}
                      <td className="max-w-xs px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {expense.notes || "Sin notas"}
                      </td>

                      {/* ACCIONES */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(expense)
                            }
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                            title="Editar gasto"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpenseToDelete(expense)
                            }
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL DE CONFIRMACIÓN */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="¿Eliminar gasto?"
        message={
          expenseToDelete
            ? `¿Estás seguro de que querés eliminar el gasto "${expenseToDelete.description}"? Esta acción no se puede deshacer.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setExpenseToDelete(null)}
        loading={deleting}
      />
    </main>
  );
}

export default Expenses;