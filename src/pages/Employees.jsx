import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  DollarSign,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  Pencil,
  Users,
  X,
} from "lucide-react";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from "../services/api";


function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    position: "sales",
    salary: "",
    notes: "",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los empleados.");
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

  function openCreateForm() {
    setEditingEmployee(null);

    setFormData({
      name: "",
      phone: "",
      email: "",
      position: "sales",
      salary: "",
      notes: "",
    });

    setShowForm(true);
  }

  function openEditForm(employee) {
    setEditingEmployee(employee);

    setFormData({
      name: employee.name || "",
      phone: employee.phone || "",
      email: employee.email || "",
      position: employee.position || "sales",
      salary: employee.salary || "",
      notes: employee.notes || "",
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingEmployee(null);

    setFormData({
      name: "",
      phone: "",
      email: "",
      position: "sales",
      salary: "",
      notes: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const employeeData = {
        ...formData,
        salary: Number(formData.salary),
      };

      if (editingEmployee) {
        const updatedEmployee = await updateEmployee(
          editingEmployee.id,
          employeeData,
        );

        setEmployees(
          employees.map((employee) =>
            employee.id === editingEmployee.id
              ? updatedEmployee
              : employee,
          ),
        );
      } else {
        const newEmployee =
          await createEmployee(employeeData);

        setEmployees([
          newEmployee,
          ...employees,
        ]);
      }

      closeForm();
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "No se pudo guardar el empleado",
      );
    }
  }

  async function handleDeactivate(employee) {
    const confirmed = window.confirm(
      `¿Seguro que querés desactivar a ${employee.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deactivateEmployee(employee.id);

      setEmployees(
        employees.filter(
          (item) => item.id !== employee.id,
        ),
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "No se pudo desactivar el empleado",
      );
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(value));
  }

  function formatPosition(position) {
    const positions = {
      administration: "Administración",
      sales: "Ventas",
      warehouse: "Depósito",
      delivery: "Reparto",
      production: "Producción",
      other: "Otro",
    };

    return positions[position] || position;
  }

  function getPositionIcon(position) {
    const icons = {
      administration: Building2,
      sales: BriefcaseBusiness,
      warehouse: MapPin,
      delivery: BriefcaseBusiness,
      production: BriefcaseBusiness,
      other: UserRound,
    };

    return icons[position] || UserRound;
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <Users className="h-5 w-5 animate-pulse" />
          <span>Cargando empleados...</span>
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Empleados
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestión de empleados de DF Achuras
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </button>
      </header>

      {showForm && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {editingEmployee ? (
                  <Edit className="h-5 w-5" />
                ) : (
                  <UserRound className="h-5 w-5" />
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  {editingEmployee
                    ? "Editar empleado"
                    : "Nuevo empleado"}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {editingEmployee
                    ? "Modificá los datos del empleado."
                    : "Completá los datos del nuevo empleado."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">
                Cancelar
              </span>
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <UserRound className="h-4 w-4 text-gray-400" />
                Nombre
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Phone className="h-4 w-4 text-gray-400" />
                Teléfono
              </label>

              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="Ej: 3415551234"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Mail className="h-4 w-4 text-gray-400" />
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Ej: juan@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="position"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <BriefcaseBusiness className="h-4 w-4 text-gray-400" />
                Puesto
              </label>

              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              >
                <option value="administration">
                  Administración
                </option>

                <option value="sales">
                  Ventas
                </option>

                <option value="warehouse">
                  Depósito
                </option>

                <option value="delivery">
                  Reparto
                </option>

                <option value="production">
                  Producción
                </option>

                <option value="other">
                  Otro
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="salary"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <DollarSign className="h-4 w-4 text-gray-400" />
                Sueldo
              </label>

              <input
                id="salary"
                name="salary"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej: 500000"
                value={formData.salary}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

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
                placeholder="Información adicional"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-gray-500 dark:focus:ring-gray-800"
              />
            </div>

            <div className="flex justify-end md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                <Save className="h-4 w-4" />

                {editingEmployee
                  ? "Guardar cambios"
                  : "Crear empleado"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">
              Empleados activos
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Personal registrado actualmente
            </p>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {employees.length}{" "}
            {employees.length === 1
              ? "empleado"
              : "empleados"}
          </span>
        </div>

        {employees.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-center dark:border-gray-700">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <Users className="h-5 w-5" />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay empleados registrados.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline dark:text-gray-200"
            >
              <Plus className="h-4 w-4" />
              Crear primer empleado
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-[1050px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/70">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Nombre
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Teléfono
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Email
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Puesto
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Sueldo
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
                {employees.map((employee) => {
                  const PositionIcon =
                    getPositionIcon(
                      employee.position,
                    );

                  return (
                    <tr
                      key={employee.id}
                      className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            <UserRound className="h-4 w-4" />
                          </div>

                          <strong className="text-sm font-semibold">
                            {employee.name}
                          </strong>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {employee.phone ? (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {employee.phone}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {employee.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{employee.email}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <PositionIcon className="h-3.5 w-3.5" />
                          {formatPosition(
                            employee.position,
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold">
                        {formatMoney(
                          employee.salary,
                        )}
                      </td>

                      <td className="max-w-xs px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {employee.notes || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                employee,
                              )
                            }
                            className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeactivate(
                                employee,
                              )
                            }
                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
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
    </main>
  );
}

export default Employees;