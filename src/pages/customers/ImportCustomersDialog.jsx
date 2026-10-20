import { useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";

import { downloadCustomersTemplate, importCustomers } from "../../services/api";
import { keys, useApiMutation } from "../../hooks/queries";
import Modal from "../../components/Modal";

const ACTION = {
  create: {
    label: "Nuevo",
    className:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  },
  update: {
    label: "Actualiza",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  },
  skip: {
    label: "Ya existe",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
  error: {
    label: "Con error",
    className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
};

const FILTERS = [
  ["all", "Todas"],
  ["error", "Con error"],
  ["create", "Nuevos"],
  ["update", "Actualiza"],
  ["skip", "Ya existen"],
];

/**
 * Importar clientes desde un Excel o CSV en dos pasos: primero se revisa el
 * archivo (qué clientes se crean, cuáles ya existen y qué filas tienen
 * errores) y recién al confirmar se guardan. Las filas con errores no se
 * importan: se corrigen en el Excel y se vuelve a subir.
 */
function ImportCustomersDialog({ onClose }) {
  const titleId = useId();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [filter, setFilter] = useState("all");

  const check = useApiMutation((options) => importCustomers(file, options));
  const save = useApiMutation((options) => importCustomers(file, options), {
    invalidate: [keys.customers],
  });
  const busy = check.isPending || save.isPending;

  const rows = useMemo(
    () =>
      (preview?.rows ?? []).filter(
        (row) => filter === "all" || row.action === filter,
      ),
    [preview, filter],
  );

  const toImport = preview ? preview.created + preview.updated : 0;

  function chooseFile(event) {
    const chosen = event.target.files?.[0] ?? null;
    setFile(chosen);
    setPreview(null);
    setFilter("all");
  }

  function review(nextUpdate = updateExisting) {
    if (!file) {
      toast.error("Elegí el archivo de Excel.");
      return;
    }

    check.mutate(
      { dryRun: true, updateExisting: nextUpdate },
      {
        onSuccess: (result) => {
          setPreview(result);
          setFilter(result.errors ? "error" : "all");
        },
      },
    );
  }

  function toggleUpdate(event) {
    setUpdateExisting(event.target.checked);
    // La vista previa depende de esta opción: se vuelve a revisar.
    if (preview) review(event.target.checked);
  }

  function confirm() {
    save.mutate(
      { dryRun: false, updateExisting },
      {
        onSuccess: (result) => {
          const parts = [
            result.created && `${result.created} creados`,
            result.updated && `${result.updated} actualizados`,
          ].filter(Boolean);
          toast.success(
            parts.length
              ? `Clientes importados: ${parts.join(", ")}.`
              : "No había clientes nuevos para importar.",
          );
          onClose();
        },
      },
    );
  }

  async function handleTemplate() {
    try {
      await downloadCustomersTemplate();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <Modal
      onClose={onClose}
      closeDisabled={busy}
      labelledBy={titleId}
      className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-800">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
            <FileSpreadsheet className="h-4 w-4" />
            Importar
          </p>
          <h2 id={titleId} className="text-lg font-bold">
            Importar clientes desde Excel
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Las columnas se reconocen por el título (Nombre, Teléfono, Email,
            Dirección, Notas, CUIT, Condición IVA, Lista de precios, Trae
            deuda). Solo el nombre es obligatorio.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* PASO 1: ARCHIVO */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            data-autofocus
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
          >
            <Upload className="h-4 w-4" />
            {file ? "Cambiar archivo" : "Elegir archivo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={chooseFile}
            className="sr-only"
            aria-label="Archivo de Excel con los clientes"
            tabIndex={-1}
          />
          <span className="min-w-0 truncate text-sm text-gray-600 dark:text-gray-300">
            {file ? file.name : "Excel (.xlsx) o CSV"}
          </span>

          <button
            type="button"
            onClick={handleTemplate}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-gray-700"
          >
            <Download className="h-4 w-4" />
            Descargar plantilla
          </button>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-3 py-2.5 dark:border-gray-800">
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={toggleUpdate}
            disabled={busy}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-sm">
            <span className="font-semibold">
              Actualizar los clientes que ya existen
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              Se reconocen por CUIT, teléfono o nombre. Si no lo tildás, se
              dejan como están y solo se agregan los nuevos.
            </span>
          </span>
        </label>

        {!preview && (
          <button
            type="button"
            onClick={() => review()}
            disabled={!file || busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
          >
            {check.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {check.isPending ? "Revisando..." : "Revisar archivo"}
          </button>
        )}

        {/* PASO 2: VISTA PREVIA */}
        {preview && (
          <>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              {[
                [
                  "Nuevos",
                  preview.created,
                  "text-green-600 dark:text-green-400",
                ],
                [
                  "Se actualizan",
                  preview.updated,
                  "text-blue-600 dark:text-blue-400",
                ],
                [
                  "Ya existen",
                  preview.skipped,
                  "text-gray-600 dark:text-gray-300",
                ],
                ["Con error", preview.errors, "text-red-600 dark:text-red-400"],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-950"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                  </p>
                  <strong className={`text-xl ${color}`}>{value}</strong>
                </div>
              ))}
            </div>

            {preview.errors > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Las filas con error no se importan. Podés importar las demás
                ahora, o corregirlas en el Excel y volver a subirlo (los que ya
                se importaron no se duplican).
              </p>
            )}

            <div className="flex flex-wrap gap-1">
              {FILTERS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    filter === value
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {label} (
                  {value === "all"
                    ? preview.total
                    : preview.rows.filter((row) => row.action === value).length}
                  )
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-950">
                  <tr>
                    <th className="px-3 py-2">Fila</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Teléfono</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((row) => (
                    <tr key={row.row} className="align-top">
                      <td className="px-3 py-2 text-gray-500">{row.row}</td>
                      <td className="px-3 py-2 font-medium">
                        {row.name || (
                          <span className="text-gray-400">(sin nombre)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                        {row.phone ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION[row.action].className}`}
                        >
                          {ACTION[row.action].label}
                        </span>
                        {row.messages.map((message) => (
                          <p
                            key={message}
                            className={`mt-1 text-xs ${
                              row.action === "error"
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {message}
                          </p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {preview && (
        <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-gray-950">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold dark:border-gray-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={toImport === 0 || busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40"
          >
            {save.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {save.isPending
              ? "Importando..."
              : toImport === 0
                ? "No hay clientes para importar"
                : `Importar ${toImport} ${toImport === 1 ? "cliente" : "clientes"}`}
          </button>
        </div>
      )}
    </Modal>
  );
}

export default ImportCustomersDialog;
