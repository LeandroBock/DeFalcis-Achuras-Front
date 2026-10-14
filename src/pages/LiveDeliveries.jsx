import { useMemo, useState } from "react";
import { Ban, Bike, CheckCircle2, Clock, Radio, RefreshCw } from "lucide-react";

import { ErrorState, LoadingState } from "../components/ui/PageStates";
import { useDeliveryBoard } from "../hooks/queries";
import {
  formatMoney,
  formatQuantity,
  formatTime,
  todayISO,
} from "../utils/format";

const STATUS = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    card: "border-gray-200 dark:border-gray-800",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
  delivered: {
    label: "Entregada",
    icon: CheckCircle2,
    card: "border-green-300 dark:border-green-900",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  },
  not_delivered: {
    label: "No entregada",
    icon: Ban,
    card: "border-amber-300 dark:border-amber-900",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
};

// Orden dentro de cada repartidor: primero lo que falta entregar.
const ORDER = { pending: 0, not_delivered: 1, delivered: 2 };

// Seguimiento del reparto del día: se actualiza solo cada vez que un
// repartidor entrega o no puede entregar una nota (useOfficeEvents).
function LiveDeliveries() {
  const [date, setDate] = useState(todayISO());
  const boardQuery = useDeliveryBoard(date);
  const board = boardQuery.data;

  const columns = useMemo(() => {
    const groups = new Map();

    for (const note of board?.notes ?? []) {
      const key =
        note.boardStatus === "not_delivered"
          ? "__returned"
          : (note.driverId ?? "__none");
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          title:
            key === "__returned"
              ? "Volvieron a la oficina"
              : key === "__none"
                ? "Sin asignar"
                : (note.driverName ?? "Repartidor"),
          notes: [],
        });
      }
      groups.get(key).notes.push(note);
    }

    return [...groups.values()]
      .map((group) => ({
        ...group,
        notes: group.notes.sort(
          (a, b) => ORDER[a.boardStatus] - ORDER[b.boardStatus],
        ),
        done: group.notes.filter((n) => n.boardStatus === "delivered").length,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [board]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Radio className="h-7 w-7 text-green-600" />
            Reparto en vivo
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Las notas del día y su estado. Se actualiza solo con cada entrega.
          </p>
        </div>

        <div className="flex items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Día</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value || todayISO())}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-950"
            />
          </label>
          <button
            type="button"
            onClick={() => boardQuery.refetch()}
            className="rounded-xl border border-gray-300 p-2.5 dark:border-gray-700"
            aria-label="Actualizar"
          >
            <RefreshCw
              className={`h-5 w-5 ${boardQuery.isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      {boardQuery.isLoading ? (
        <LoadingState icon={Bike} message="Cargando el reparto..." />
      ) : boardQuery.error ? (
        <ErrorState
          message={boardQuery.error.message}
          onRetry={boardQuery.refetch}
        />
      ) : (
        <>
          {/* RESUMEN */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Summary label="Notas del día" value={board.summary.total} />
            <Summary label="Pendientes" value={board.summary.pending} />
            <Summary
              label="Entregadas"
              value={board.summary.delivered}
              tone="green"
            />
            <Summary
              label="No entregadas"
              value={board.summary.notDelivered}
              tone="amber"
            />
            <Summary
              label="Vendido / cobrado"
              value={`${formatMoney(board.summary.sold)} / ${formatMoney(board.summary.collected)}`}
            />
          </section>

          {columns.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700">
              No hay notas de pedido para este día.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {columns.map((column) => (
                <section
                  key={column.key}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950"
                >
                  <h2 className="mb-3 flex items-center justify-between px-1 font-bold">
                    <span className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-gray-400" />
                      {column.title}
                    </span>
                    {column.key !== "__returned" && (
                      <span className="text-sm font-medium text-gray-500">
                        {column.done}/{column.notes.length} entregadas
                      </span>
                    )}
                  </h2>

                  <ul className="space-y-2">
                    {column.notes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoteCard({ note }) {
  const status = STATUS[note.boardStatus];
  const Icon = status.icon;
  const delivered = note.boardStatus === "delivered";

  return (
    <li
      className={`rounded-xl border bg-white p-3 text-sm shadow-sm dark:bg-gray-900 ${status.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <strong className="truncate">{note.customer?.name ?? "Cliente"}</strong>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${status.badge}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {status.label}
          {delivered && note.deliveredAt && ` ${formatTime(note.deliveredAt)}`}
        </span>
      </div>

      <ul className="mt-2 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
        {note.items.map((item) => (
          <li key={item.productId} className="flex justify-between">
            <span>{item.productName}</span>
            <span>
              {delivered
                ? `${formatQuantity(item.quantity, item.unit)} (pedido ${formatQuantity(item.requestedQuantity)})`
                : formatQuantity(item.requestedQuantity, item.unit)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
        {delivered ? (
          <>
            <span>
              Total <strong>{formatMoney(note.total)}</strong>
            </span>
            <span
              className={
                note.collected < note.total
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-green-600 dark:text-green-400"
              }
            >
              Cobrado {formatMoney(note.collected)}
            </span>
          </>
        ) : (
          <span className="text-gray-500">~{formatMoney(note.total)}</span>
        )}
      </div>

      {note.boardStatus === "not_delivered" && note.deliveryComment && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          Motivo: {note.deliveryComment}
          {note.driverName && ` (${note.driverName})`}
        </p>
      )}
    </li>
  );
}

const TONES = {
  green: "text-green-600 dark:text-green-400",
  amber: "text-amber-600 dark:text-amber-400",
};

function Summary({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <strong className={`text-xl ${tone ? TONES[tone] : ""}`}>{value}</strong>
    </div>
  );
}

export default LiveDeliveries;
