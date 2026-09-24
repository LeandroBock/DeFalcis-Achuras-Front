import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Filter,
  Info,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  getFinancialSummary,
  getReceivables,
  getPayables,
} from "../services/api";


function Reports() {
  const [summary, setSummary] = useState(null);
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const [
        summaryData,
        receivablesData,
        payablesData,
      ] = await Promise.all([
        getFinancialSummary(from, to),
        getReceivables(from, to),
        getPayables(from, to),
      ]);

      setSummary(summaryData);
      setReceivables(receivablesData);
      setPayables(payablesData);
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el reporte.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    loadReport();
  }

  function clearFilters() {
    setFrom("");
    setTo("");

    setTimeout(() => {
      loadReport();
    }, 0);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Number(value || 0));
  }

  const totalReceivables = receivables.reduce(
    (sum, item) => sum + Number(item.pending),
    0,
  );

  const totalPayables = payables.reduce(
    (sum, item) => sum + Number(item.pending),
    0,
  );

  const financialValues = [
    Number(summary?.totalSales || 0),
    Number(summary?.totalCollected || 0),
    Number(summary?.totalPurchases || 0),
    Number(summary?.totalExpenses || 0),
  ];

  const maxFinancialValue = Math.max(
    ...financialValues,
    1,
  );

  const financialBars = [
    {
      label: "Ventas",
      value: Number(summary?.totalSales || 0),
      icon: TrendingUp,
    },
    {
      label: "Cobrado",
      value: Number(summary?.totalCollected || 0),
      icon: CircleDollarSign,
    },
    {
      label: "Compras",
      value: Number(summary?.totalPurchases || 0),
      icon: Wallet,
    },
    {
      label: "Gastos",
      value: Number(summary?.totalExpenses || 0),
      icon: TrendingDown,
    },
  ];

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Cargando reporte...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <Info className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            <BarChart3 className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Reportes
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Resumen financiero de DF Achuras
            </p>
          </div>
        </div>
      </header>

      {/* FILTROS */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <Filter className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold">
              Filtrar período
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Seleccioná las fechas que querés analizar.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 lg:flex-row lg:items-end"
        >
          <div className="flex-1 space-y-2">
            <label
              htmlFor="from"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <CalendarDays className="h-4 w-4 text-gray-400" />
              Desde
            </label>

            <input
              id="from"
              type="date"
              value={from}
              onChange={(event) =>
                setFrom(event.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-800"
            />
          </div>

          <div className="flex-1 space-y-2">
            <label
              htmlFor="to"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <CalendarDays className="h-4 w-4 text-gray-400" />
              Hasta
            </label>

            <input
              id="to"
              type="date"
              value={to}
              onChange={(event) =>
                setTo(event.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:ring-gray-800"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            <Filter className="h-4 w-4" />
            Aplicar filtros
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            Limpiar
          </button>
        </form>
      </section>

      {/* TARJETAS PRINCIPALES */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Ventas
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <strong className="block text-2xl font-bold">
            {formatMoney(summary?.totalSales)}
          </strong>

          <small className="mt-2 block text-xs text-gray-400 dark:text-gray-500">
            Total de ventas confirmadas
          </small>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Cobrado
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <CircleDollarSign className="h-4 w-4" />
            </div>
          </div>

          <strong className="block text-2xl font-bold">
            {formatMoney(summary?.totalCollected)}
          </strong>

          <small className="mt-2 block text-xs text-gray-400 dark:text-gray-500">
            Dinero efectivamente cobrado
          </small>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Compras
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <strong className="block text-2xl font-bold">
            {formatMoney(summary?.totalPurchases)}
          </strong>

          <small className="mt-2 block text-xs text-gray-400 dark:text-gray-500">
            Total comprado
          </small>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Gastos
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>

          <strong className="block text-2xl font-bold">
            {formatMoney(summary?.totalExpenses)}
          </strong>

          <small className="mt-2 block text-xs text-gray-400 dark:text-gray-500">
            Gastos registrados
          </small>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Cuentas por cobrar
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400">
              <CircleDollarSign className="h-4 w-4" />
            </div>
          </div>

          <strong className="block text-2xl font-bold">
            {formatMoney(totalReceivables)}
          </strong>

          <small className="mt-2 block text-xs text-gray-400 dark:text-gray-500">
            Dinero pendiente de cobrar
          </small>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Cuentas por pagar
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <strong className="block text-2xl font-bold">
            {formatMoney(totalPayables)}
          </strong>

          <small className="mt-2 block text-xs text-gray-400 dark:text-gray-500">
            Dinero pendiente de pagar
          </small>
        </article>
      </section>

      {/* GRÁFICOS */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* RESUMEN FINANCIERO */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-gray-500" />

            <h2 className="text-lg font-bold">
              Resumen financiero
            </h2>
          </div>

          <div className="flex h-[280px] items-end justify-around gap-3 overflow-x-auto pt-5 sm:gap-5">
            {financialBars.map((item) => {
              const height =
                (item.value / maxFinancialValue) *
                100;

              const Icon = item.icon;

              return (
                <div
                  className="flex h-full min-w-[60px] flex-1 flex-col items-center justify-end"
                  key={item.label}
                >
                  <div className="mb-2 flex flex-col items-center gap-1">
                    <Icon className="h-3.5 w-3.5 text-gray-400" />

                    <span className="text-center text-[10px] font-medium text-gray-500 sm:text-xs dark:text-gray-400">
                      {formatMoney(item.value)}
                    </span>
                  </div>

                  <div className="flex h-[190px] w-full max-w-[70px] items-end overflow-hidden rounded-t-xl bg-gray-100 dark:bg-gray-800">
                    <div
                      className="w-full rounded-t-xl bg-gray-900 transition-all duration-500 dark:bg-white"
                      style={{
                        height: `${Math.max(
                          height,
                          3,
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="mt-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* DINERO PENDIENTE */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <Wallet className="h-5 w-5 text-gray-500" />

            <h2 className="text-lg font-bold">
              Dinero pendiente
            </h2>
          </div>

          <div className="space-y-8 pt-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Cuentas por cobrar
                </span>

                <strong className="text-lg">
                  {formatMoney(totalReceivables)}
                </strong>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full min-w-[3px] rounded-full bg-gray-900 transition-all duration-500 dark:bg-white"
                  style={{
                    width: `${Math.min(
                      totalReceivables / 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Cuentas por pagar
                </span>

                <strong className="text-lg">
                  {formatMoney(totalPayables)}
                </strong>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full min-w-[3px] rounded-full bg-gray-900 transition-all duration-500 dark:bg-white"
                  style={{
                    width: `${Math.min(
                      totalPayables / 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADO ESTIMADO */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <CircleDollarSign className="h-5 w-5" />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Resultado estimado
            </span>

            <strong className="mt-1 block text-3xl font-bold sm:text-4xl">
              {formatMoney(
                summary?.estimatedResult,
              )}
            </strong>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Cobrado − compras − gastos
            </p>
          </div>
        </div>
      </section>

      {/* DETALLE */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* COBRAR */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              Cuentas por cobrar
            </h2>

            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300">
              {receivables.length}
            </span>
          </div>

          {receivables.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-gray-300 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay cuentas pendientes de cobro.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {receivables
                .slice(0, 5)
                .map((item) => (
                  <div
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    key={item.orderId}
                  >
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold">
                        {item.customerName}
                      </strong>

                      <small className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        Venta #
                        {item.orderId.slice(0, 8)}
                      </small>
                    </div>

                    <strong className="shrink-0 text-sm text-red-600 dark:text-red-400">
                      {formatMoney(item.pending)}
                    </strong>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* PAGAR */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              Cuentas por pagar
            </h2>

            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              {payables.length}
            </span>
          </div>

          {payables.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-gray-300 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay cuentas pendientes de pago.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {payables
                .slice(0, 5)
                .map((item) => (
                  <div
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    key={item.purchaseId}
                  >
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold">
                        {item.supplierName}
                      </strong>

                      <small className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        Compra #
                        {item.purchaseId.slice(0, 8)}
                      </small>
                    </div>

                    <strong className="shrink-0 text-sm text-red-600 dark:text-red-400">
                      {formatMoney(item.pending)}
                    </strong>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* INFORMACIÓN */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 sm:p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />

          <div>
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-200">
              ¿Qué significa este reporte?
            </h2>

            <div className="mt-3 space-y-3 text-sm leading-6 text-blue-800 dark:text-blue-300">
              <p>
                Este resumen muestra el movimiento
                financiero registrado en el sistema
                para el período seleccionado.
              </p>

              <p>
                El resultado mostrado actualmente es
                un{" "}
                <strong>
                  resultado estimado
                </strong>
                : toma el dinero cobrado y descuenta
                las compras y los gastos registrados.
              </p>

              <p>
                No representa todavía la ganancia
                contable real, porque una compra puede
                generar stock que todavía no fue vendido.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Reports;