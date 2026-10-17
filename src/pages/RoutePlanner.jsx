import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  MapPin,
  Route,
  RotateCcw,
  Save,
} from "lucide-react";

import { saveRoute } from "../services/api";
import { keys, useApiMutation, useDrivers, useRoute } from "../hooks/queries";
import {
  formatDate,
  formatMoney,
  formatQuantity,
  todayISO,
} from "../utils/format";
import KeyboardHelp from "../components/ui/KeyboardHelp";
import { MOVE } from "../utils/keyboardHelp";
import { ErrorState, LoadingState } from "../components/ui/PageStates";

const fieldClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white";

const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

function move(list, from, to) {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Rutas de reparto: la oficina ordena las notas pendientes de cada
 * repartidor en el orden en que las tiene que entregar. El repartidor las ve
 * en ese orden en "Mis entregas".
 */
function RoutePlanner() {
  const drivers = useDrivers().data ?? [];
  const [driverId, setDriverId] = useState("");
  const currentDriver = driverId || drivers[0]?.id || "";
  const [onlyDate, setOnlyDate] = useState(todayISO());

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <Route className="h-7 w-7" />
          Rutas de reparto
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ordená las notas de cada repartidor en el orden de su recorrido.
          Arrastralas o usá las flechas.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Repartidor</span>
          <select
            value={currentDriver}
            onChange={(event) => setDriverId(event.target.value)}
            className={fieldClass}
          >
            {drivers.length === 0 && (
              <option value="">No hay repartidores</option>
            )}
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Entregas del día</span>
          <div className="flex gap-2">
            <input
              type="date"
              value={onlyDate}
              onChange={(event) => setOnlyDate(event.target.value)}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => setOnlyDate(onlyDate ? "" : todayISO())}
              className="shrink-0 rounded-xl border border-gray-300 px-3 text-sm font-semibold dark:border-gray-700"
            >
              {onlyDate ? "Ver todas" : "Solo hoy"}
            </button>
          </div>
        </label>
      </div>

      {currentDriver ? (
        <RouteEditor
          // Al cambiar de repartidor o de día se arranca de lo guardado.
          key={`${currentDriver}-${onlyDate}`}
          driverId={currentDriver}
          date={onlyDate || undefined}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700">
          No hay repartidores con acceso a la app. Creáselo desde Empleados.
        </p>
      )}
    </div>
  );
}

function RouteEditor({ driverId, date }) {
  const routeQuery = useRoute(driverId, date);
  const notes = routeQuery.data ?? [];

  // Orden que se está armando (ids); null mientras no se toque nada.
  const [draft, setDraft] = useState(null);
  const [dragging, setDragging] = useState(null);

  const save = useApiMutation((orderIds) => saveRoute(driverId, orderIds), {
    invalidate: [keys.orders],
  });

  const byId = new Map(notes.map((note) => [note.id, note]));
  // Si mientras tanto se entregó o reasignó alguna nota, se saca del borrador.
  const order = (draft ?? notes.map((note) => note.id)).filter((id) =>
    byId.has(id),
  );
  const dirty =
    draft !== null && order.some((id, index) => id !== notes[index]?.id);

  function reorder(from, to) {
    setDraft(move(order, from, to));
  }

  function focusRow(index) {
    requestAnimationFrame(() =>
      document.querySelector(`[data-route-row="${index}"]`)?.focus(),
    );
  }

  function handleKeyDown(event, index) {
    if (!event.altKey) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusRow(Math.min(index + 1, order.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusRow(Math.max(index - 1, 0));
      }
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const to = event.key === "ArrowUp" ? index - 1 : index + 1;
      if (to < 0 || to >= order.length) return;
      reorder(index, to);
      focusRow(to);
    }
  }

  function handleSave() {
    save.mutate(order, {
      onSuccess: () => {
        toast.success("Ruta guardada. El repartidor ya la ve en este orden.");
        setDraft(null);
      },
    });
  }

  if (routeQuery.isLoading) {
    return <LoadingState icon={Route} message="Cargando la ruta..." />;
  }

  if (routeQuery.error) {
    return (
      <ErrorState
        message={routeQuery.error.message}
        onRetry={routeQuery.refetch}
      />
    );
  }

  if (notes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700">
        {date
          ? "Este repartidor no tiene notas pendientes para ese día."
          : "Este repartidor no tiene notas pendientes."}{" "}
        Asignáselas desde Pedidos y ventas.
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {notes.length} {notes.length === 1 ? "parada" : "paradas"} · total
          estimado{" "}
          <strong>
            {formatMoney(notes.reduce((sum, note) => sum + note.total, 0))}
          </strong>
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft(null)}
            disabled={!dirty || save.isPending}
            className="flex items-center gap-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-gray-700"
          >
            <RotateCcw className="h-4 w-4" />
            Deshacer
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || save.isPending}
            className="flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
          >
            <Save className="h-4 w-4" />
            {save.isPending ? "Guardando..." : "Guardar orden"}
          </button>
        </div>
      </div>

      <ol className="space-y-2">
        {order.map((id, index) => {
          const note = byId.get(id);
          const customer = note.customer;

          return (
            <li
              key={id}
              data-route-row={index}
              tabIndex={0}
              draggable
              onDragStart={(event) => {
                setDragging(index);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragging !== null && dragging !== index) {
                  reorder(dragging, index);
                  setDragging(index);
                }
              }}
              onDragEnd={() => setDragging(null)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              aria-label={`Parada ${index + 1}: ${customer?.name ?? "Cliente"}`}
              className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400 dark:bg-gray-900 ${
                dragging === index
                  ? "border-gray-900 opacity-60 dark:border-white"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <GripVertical
                className="mt-1 h-5 w-5 shrink-0 cursor-grab text-gray-400"
                aria-hidden="true"
              />

              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white dark:bg-white dark:text-gray-900">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="truncate font-bold">
                    {customer?.name ?? "Cliente"}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ~{formatMoney(note.total)}
                  </span>
                </div>

                {customer?.address && (
                  <a
                    href={mapsUrl(customer.address)}
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={-1}
                    className="mt-0.5 flex items-center gap-1 text-sm text-gray-600 hover:underline dark:text-gray-300"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {customer.address}
                  </a>
                )}

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {note.items
                    .map(
                      (item) =>
                        `${item.productName} ${formatQuantity(item.requestedQuantity, item.unit)}`,
                    )
                    .join(" · ")}
                  {!date && note.deliveryDate && (
                    <> · Entrega {formatDate(note.deliveryDate)}</>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => reorder(index, index - 1)}
                  disabled={index === 0}
                  className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Subir parada"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => reorder(index, index + 1)}
                  disabled={index === order.length - 1}
                  className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Bajar parada"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <KeyboardHelp items={[MOVE, [["Alt", "↑", "↓"], "mover la parada"]]} />
    </section>
  );
}

export default RoutePlanner;
