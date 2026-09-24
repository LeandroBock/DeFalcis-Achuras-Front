import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  Package,
  RefreshCw,
  ShoppingCart,
  Sun,
  Wallet,
  X,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { getDashboard, getFinancialSummary } from "../services/api";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { darkMode, toggleTheme } = useTheme();

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [dashboardData, summaryData] = await Promise.all([
        getDashboard(),
        getFinancialSummary(from, to),
      ]);

      setDashboard(dashboardData);
      setSummary(summaryData);
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    loadDashboard();
  }

  function handleClearFilters() {
    setFrom("");
    setTo("");

    setTimeout(() => {
      loadDashboard();
    }, 0);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(value));
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-gray-500 dark:text-gray-400">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">Cargando dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-red-100 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <p className="font-medium text-red-700 dark:text-red-400">{error}</p>

          <button
            type="button"
            onClick={loadDashboard}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const productsWithoutStock = dashboard.inventory.productsWithoutStock;
  const productsWithLowStock = dashboard.inventory.productsWithLowStock;
  const pendingReceivables = Number(dashboard.receivables.pending);
  const pendingPayables = Number(dashboard.payables.pending);

  const hasAlerts =
    productsWithoutStock > 0 ||
    productsWithLowStock > 0 ||
    pendingReceivables > 0 ||
    pendingPayables > 0;

  const estimatedResult = Number(summary.estimatedResult);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:px-6 lg:px-8">
      {/* HEADER */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-gray-900 p-2 text-white dark:bg-white dark:text-gray-900">
              <CircleDollarSign className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              De Falcis Achuras
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Resumen general de tu negocio
          </p>
        </div>

        {/* TEMA */}
<button
  type="button"
  onClick={toggleTheme}
  aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
  className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
>
  {darkMode ? (
    <>
      <Sun className="h-4 w-4 text-yellow-400" />
      Modo claro
    </>
  ) : (
    <>
      <span className="text-lg leading-none">☾</span>
      Modo oscuro
    </>
  )}
</button>
      </header>

      {/* FILTROS */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Filter className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Filtrar información
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Consultá los movimientos de un período determinado.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 lg:flex-row lg:items-end"
        >
          <div className="flex flex-1 flex-col gap-2">
            <label
              htmlFor="from"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Desde
            </label>

            <input
              id="from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
            />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label
              htmlFor="to"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Hasta
            </label>

            <input
              id="to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500 dark:focus:ring-gray-800"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <Filter className="h-4 w-4" />
              Filtrar
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          </div>
        </form>
      </section>

      {/* RESUMEN FINANCIERO */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Resumen financiero
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Situación económica del período seleccionado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* VENTAS */}
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <ShoppingCart className="h-5 w-5" />
              </div>

              <ArrowUpFromLine className="h-4 w-4 text-gray-400" />
            </div>

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Ventas
            </span>

            <strong className="mt-1 block text-2xl font-bold text-gray-900 dark:text-white">
              {formatMoney(summary.totalSales)}
            </strong>

            <small className="mt-1 block text-xs text-gray-500 dark:text-gray-500">
              Total de ventas
            </small>
          </article>

          {/* COBRADO */}
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <Wallet className="h-5 w-5" />
              </div>

              <ArrowDownToLine className="h-4 w-4 text-green-500" />
            </div>

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Cobrado
            </span>

            <strong className="mt-1 block text-2xl font-bold text-green-600 dark:text-green-400">
              {formatMoney(summary.totalCollected)}
            </strong>

            <small className="mt-1 block text-xs text-gray-500 dark:text-gray-500">
              Dinero cobrado
            </small>
          </article>

          {/* COMPRAS */}
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <Package className="h-5 w-5" />
              </div>

              <ArrowDownToLine className="h-4 w-4 text-orange-500" />
            </div>

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Compras
            </span>

            <strong className="mt-1 block text-2xl font-bold text-gray-900 dark:text-white">
              {formatMoney(summary.totalPurchases)}
            </strong>

            <small className="mt-1 block text-xs text-gray-500 dark:text-gray-500">
              Total de compras
            </small>
          </article>

          {/* GASTOS */}
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <CircleDollarSign className="h-5 w-5" />
              </div>

              <ArrowDownToLine className="h-4 w-4 text-red-500" />
            </div>

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Gastos
            </span>

            <strong className="mt-1 block text-2xl font-bold text-gray-900 dark:text-white">
              {formatMoney(summary.totalExpenses)}
            </strong>

            <small className="mt-1 block text-xs text-gray-500 dark:text-gray-500">
              Gastos registrados
            </small>
          </article>
        </div>
      </section>

      {/* RESULTADO */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Resultado estimado
            </span>

            <h2
              className={`mt-2 text-3xl font-bold ${
                estimatedResult >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatMoney(summary.estimatedResult)}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cobrado - compras - gastos
            </p>
          </div>

          <div
            className={`rounded-full p-4 ${
              estimatedResult >= 0
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            <CircleDollarSign className="h-7 w-7" />
          </div>
        </div>
      </section>

      {/* ESTADO DEL NEGOCIO */}
      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Estado del negocio
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Información actual de inventario y cuentas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* PRODUCTOS */}
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 w-fit rounded-xl bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Package className="h-5 w-5" />
            </div>

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Productos activos
            </span>

            <strong className="mt-1 block text-2xl font-bold text-gray-900 dark:text-white">
              {dashboard.inventory.totalProducts}
            </strong>

            <small className="mt-1 block text-xs text-gray-500 dark:text-gray-500">
              Productos disponibles en el sistema
            </small>
          </article>

          {/* SIN STOCK */}
          <article
            className={`rounded-2xl border p-5 shadow-sm ${
              productsWithoutStock > 0
                ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            }`}
          >
            <div className="mb-4 w-fit rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Sin stock
            </span>

            <strong className="mt-1 block text-2xl font-bold text-gray-900 dark:text-white">
              {productsWithoutStock}
            </strong>

            <small className="mt-1 block text-xs text-gray-500 dark:text-gray-500">
              Productos sin existencia
            </small>
          </article>

          {/* STOCK BAJO */}
          <article
            className={`rounded-2xl border p-5 shadow-sm ${
              productsWithLowStock > 0
                ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/20"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            }`}
          >
            <div className="mb-4 w-fit rounded-xl bg-yellow-100 p-3 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Stock bajo
            </span>

            <strong className="mt-1 block text-2xl font-bold text-gray-900 dark:text-white">
              {productsWithLowStock}
            </strong>

            <small className="mt-1 block text-xs text-gray-500 dark:text-gray-500">
              Productos con 5 unidades o menos
            </small>
          </article>

          {/* POR COBRAR */}
          <article
            className={`rounded-2xl border p-5 shadow-sm ${
              pendingReceivables > 0
                ? "border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            }`}
          >
            <div className="mb-4 w-fit rounded-xl bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <Wallet className="h-5 w-5" />
            </div>

            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Por cobrar
            </span>

            <strong className="mt-1 block text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatMoney(pendingReceivables)}
            </strong>

            <small className="mt-1 block text-xs text-gray-500 dark:text-gray-500">
              Dinero pendiente de clientes
            </small>
          </article>
        </div>
      </section>

      {/* CUENTAS */}
      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Por pagar a proveedores
          </span>

          <h2 className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
            {formatMoney(pendingPayables)}
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Compras pendientes de pago
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Dinero cobrado
          </span>

          <h2 className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {formatMoney(dashboard.financial.totalCollected)}
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Total registrado en pagos
          </p>
        </article>
      </section>

      {/* ALERTAS */}
      <section className="mt-10 pb-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Alertas del negocio
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Situaciones que requieren atención.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {!hasAlerts ? (
            <article className="flex items-start gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/50 dark:bg-green-950/20">
              <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <strong className="block font-semibold text-green-800 dark:text-green-300">
                  Todo está en orden
                </strong>

                <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                  No hay productos sin stock, stock bajo ni cuentas pendientes.
                </p>
              </div>
            </article>
          ) : (
            <>
              {productsWithoutStock > 0 && (
                <article className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/20">
                  <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div>
                    <strong className="block font-semibold text-red-800 dark:text-red-300">
                      Productos sin stock
                    </strong>

                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      Tenés {productsWithoutStock} producto
                      {productsWithoutStock !== 1 ? "s" : ""} sin existencia.
                    </p>
                  </div>
                </article>
              )}

              {productsWithLowStock > 0 && (
                <article className="flex items-start gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-900/50 dark:bg-yellow-950/20">
                  <div className="rounded-full bg-yellow-100 p-2 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div>
                    <strong className="block font-semibold text-yellow-800 dark:text-yellow-300">
                      Stock bajo
                    </strong>

                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                      Tenés {productsWithLowStock} producto
                      {productsWithLowStock !== 1 ? "s" : ""} con stock bajo.
                    </p>
                  </div>
                </article>
              )}

              {pendingReceivables > 0 && (
                <article className="flex items-start gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900/50 dark:bg-orange-950/20">
                  <div className="rounded-full bg-orange-100 p-2 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                    <Wallet className="h-5 w-5" />
                  </div>

                  <div>
                    <strong className="block font-semibold text-orange-800 dark:text-orange-300">
                      Cuentas por cobrar
                    </strong>

                    <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
                      Hay {formatMoney(pendingReceivables)} pendientes de cobro.
                    </p>
                  </div>
                </article>
              )}

              {pendingPayables > 0 && (
                <article className="flex items-start gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900/50 dark:bg-orange-950/20">
                  <div className="rounded-full bg-orange-100 p-2 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                    <Wallet className="h-5 w-5" />
                  </div>

                  <div>
                    <strong className="block font-semibold text-orange-800 dark:text-orange-300">
                      Cuentas por pagar
                    </strong>

                    <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
                      Hay {formatMoney(pendingPayables)} pendientes de pago.
                    </p>
                  </div>
                </article>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
