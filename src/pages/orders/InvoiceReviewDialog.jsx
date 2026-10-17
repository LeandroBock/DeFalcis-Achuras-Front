import { useEffect, useId, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  FileText,
  Mail,
  MailCheck,
  RefreshCw,
  Send,
  X,
} from "lucide-react";

import {
  downloadInvoiceDraft,
  downloadInvoicePdf,
  emitInvoice,
  getInvoicePreview,
  sendInvoiceEmail,
} from "../../services/api";
import { keys, useApiMutation } from "../../hooks/queries";
import { formatMoney, formatQuantity } from "../../utils/format";
import { voucherLetter, voucherNumber } from "../../utils/invoice";
import Modal from "../../components/Modal";
import { ErrorState, LoadingState } from "../../components/ui/PageStates";

// Se factura siempre A: ARCA solo la acepta para inscriptos y monotributistas.
const TAX_CONDITIONS = [
  { value: 1, label: "IVA Responsable Inscripto" },
  { value: 6, label: "Responsable Monotributo" },
];
const FACTURA_A_CONDITIONS = TAX_CONDITIONS.map((option) => option.value);

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white";

// Espera a que se deje de escribir para volver a calcular la vista previa.
function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

const toForm = (customer) => ({
  name: customer.name ?? "",
  taxId: customer.taxId ?? "",
  // Un cliente cargado como consumidor final arranca como inscripto: hay que
  // completarle el CUIT para poder hacerle la Factura A.
  taxCondition: FACTURA_A_CONDITIONS.includes(customer.taxCondition)
    ? customer.taxCondition
    : 1,
  address: customer.address ?? "",
  email: customer.email ?? "",
});

const toBilling = (form) => ({
  name: form.name,
  taxId: form.taxId || null,
  taxCondition: Number(form.taxCondition),
  address: form.address || null,
  email: form.email || null,
});

/**
 * Una venta por vez: muestra los datos del cliente a facturar (se pueden
 * corregir), el detalle y el total; permite bajar una copia en PDF antes de
 * emitir, y después de emitir la manda por mail y deja bajar la factura.
 */
function InvoiceStep({ orderId, customerName, onEmitted }) {
  // Los datos guardados del cliente: arrancan el formulario.
  const base = useQuery({
    queryKey: ["invoices", "preview", orderId],
    queryFn: () => getInvoicePreview(orderId),
    staleTime: 0,
  });

  if (base.isLoading) {
    return <LoadingState message="Preparando la factura..." />;
  }

  if (base.error) {
    return (
      <ErrorState
        message={base.error.message || "No se pudo preparar la factura."}
        onRetry={base.refetch}
      />
    );
  }

  return (
    <InvoiceForm
      orderId={orderId}
      customerName={customerName}
      initial={base.data}
      onEmitted={onEmitted}
    />
  );
}

function InvoiceForm({ orderId, customerName, initial, onEmitted }) {
  const [form, setForm] = useState(() => toForm(initial.customer));
  const [saveToCustomer, setSaveToCustomer] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const nameRef = useRef(null);

  // Al abrir cada venta, el foco va al primer dato del cliente.
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Con los datos corregidos: tipo de factura y avisos actualizados.
  const billing = useDebounced(toBilling(form));
  const live = useQuery({
    queryKey: ["invoices", "preview", orderId, billing],
    queryFn: () => getInvoicePreview(orderId, billing),
    enabled: !!billing.name.trim(),
    placeholderData: keepPreviousData,
  });

  const preview = live.data ?? initial;

  const emit = useApiMutation(emitInvoice, {
    invalidate: [keys.invoices, keys.customers],
    showError: false,
  });

  const set = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const problems = preview?.problems ?? [];
  const canEmail = !!form.email.trim() && preview?.emailConfigured;
  const busy = emit.isPending;

  async function handleDraft() {
    setDownloading(true);
    try {
      await downloadInvoiceDraft(orderId, toBilling(form));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  }

  function handleEmit(event) {
    event.preventDefault();
    setError("");

    emit.mutate(
      {
        orderId,
        customer: toBilling(form),
        saveToCustomer,
        sendEmail: sendEmail && canEmail,
      },
      {
        onSuccess: (result) => {
          if (result.ok) {
            onEmitted({ ...result, emailTo: form.email.trim() || null });
          } else {
            setError(result.error);
          }
        },
        onError: (err) => setError(err.message),
      },
    );
  }

  return (
    <form id="invoice-form" onSubmit={handleEmit} className="space-y-5">
      {preview?.pendingConfirmation && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Una emisión anterior quedó sin confirmar. Al emitir, primero se
          verifica en ARCA si ya quedó hecha (no se duplica).
        </p>
      )}

      {preview?.previousError && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ARCA rechazó el intento anterior: {preview.previousError}
        </p>
      )}

      <fieldset className="space-y-3" disabled={busy}>
        <legend className="mb-1 text-sm font-semibold">
          Datos del cliente a facturar
          <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
            (corregí lo que esté mal)
          </span>
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">
              Nombre o razón social
            </span>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              required
              maxLength={150}
              ref={nameRef}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">CUIT</span>
            <input
              type="text"
              inputMode="numeric"
              value={form.taxId}
              onChange={set("taxId")}
              placeholder="11 dígitos (obligatorio para Factura A)"
              maxLength={20}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              Condición frente al IVA
            </span>
            <select
              value={form.taxCondition}
              onChange={set("taxCondition")}
              className={inputClass}
            >
              {TAX_CONDITIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Domicilio</span>
            <input
              type="text"
              value={form.address}
              onChange={set("address")}
              maxLength={300}
              className={inputClass}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">
              Mail (para enviarle la factura)
            </span>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              maxLength={150}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveToCustomer}
            onChange={(event) => setSaveToCustomer(event.target.checked)}
            className="h-4 w-4"
          />
          Guardar estos datos en la ficha de {customerName}
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendEmail && canEmail}
            onChange={(event) => setSendEmail(event.target.checked)}
            disabled={!canEmail}
            className="h-4 w-4"
          />
          Enviar la factura por mail al emitirla
          {!preview?.emailConfigured ? (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              (el correo de la empresa no está configurado)
            </span>
          ) : !form.email.trim() ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (cargá el mail del cliente)
            </span>
          ) : null}
        </label>
      </fieldset>

      {/* DETALLE */}
      <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 dark:bg-gray-950">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" />
            Factura {preview?.letter} · Punto de venta {preview?.pointOfSale}
          </h3>
          {live.isFetching && (
            <RefreshCw
              className="h-4 w-4 animate-spin text-gray-400"
              aria-label="Actualizando"
            />
          )}
        </div>

        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-semibold">Producto</th>
              <th className="px-4 py-2 text-right font-semibold">Cantidad</th>
              <th className="px-4 py-2 text-right font-semibold">Precio</th>
              <th className="px-4 py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {preview?.items.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-2">
                  {item.name}
                  {item.vatRate > 0 && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      (IVA {String(item.vatRate).replace(".", ",")}%)
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatQuantity(item.quantity)} {item.unit}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatMoney(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
          {preview?.vat > 0 && (
            <>
              <p className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Neto</span>
                <span>{formatMoney(preview.net)}</span>
              </p>
              <p className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>IVA</span>
                <span>{formatMoney(preview.vat)}</span>
              </p>
            </>
          )}
          <p className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(preview?.total ?? 0)}</span>
          </p>
        </div>
      </section>

      {problems.length > 0 && (
        <ul
          role="alert"
          className="space-y-1 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300"
        >
          {problems.map((problem) => (
            <li key={problem} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {problem}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleDraft}
          disabled={busy || downloading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <FileDown className="h-4 w-4" />
          {downloading ? "Generando..." : "Descargar vista previa (PDF)"}
        </button>
        <button
          type="submit"
          disabled={busy || problems.length > 0 || !form.name.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900"
        >
          <Send className="h-4 w-4" />
          {busy
            ? "Emitiendo en ARCA..."
            : `Emitir factura ${preview?.letter ?? ""}`}
        </button>
      </div>
    </form>
  );
}

// Resultado de la emisión: descargar la factura y el estado del mail.
function EmittedStep({ result }) {
  const [email, setEmail] = useState(result.email);
  const [to, setTo] = useState(result.email?.to ?? result.emailTo ?? "");
  const downloadRef = useRef(null);
  const number = voucherNumber(result);

  useEffect(() => {
    downloadRef.current?.focus();
  }, []);

  const resend = useApiMutation(sendInvoiceEmail, {
    invalidate: [keys.invoices],
    showError: false,
  });

  async function handleDownload() {
    try {
      await downloadInvoicePdf(result.invoiceId, `factura-${number}.pdf`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleResend(event) {
    event.preventDefault();
    resend.mutate(
      { invoiceId: result.invoiceId, to: to.trim() || undefined },
      {
        onSuccess: (response) => setEmail(response),
        onError: (err) =>
          setEmail({ sent: false, to: to.trim(), error: err.message }),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3 text-green-900 dark:bg-green-950/30 dark:text-green-200"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">
            Factura {voucherLetter(result.cbteTipo)} {number} emitida
          </p>
          <p className="text-sm">CAE {result.cae}</p>
        </div>
      </div>

      {email?.sent ? (
        <p className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-950">
          <MailCheck className="h-4 w-4 text-green-600" />
          Enviada por mail a <strong>{email.to}</strong>
        </p>
      ) : (
        <form
          onSubmit={handleResend}
          className="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
        >
          <p className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-amber-600" />
            {email?.error
              ? `No se envió por mail: ${email.error}`
              : "No se envió por mail."}
          </p>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Mail del cliente</span>
              <input
                type="email"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="mail@cliente.com"
                required
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={resend.isPending}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Send className="h-4 w-4" />
              {resend.isPending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      )}

      <button
        type="button"
        onClick={handleDownload}
        ref={downloadRef}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <FileDown className="h-4 w-4" />
        Descargar factura (PDF)
      </button>
    </div>
  );
}

/**
 * Facturar las ventas elegidas, de a una: revisar, emitir y seguir con la
 * próxima.
 *
 * sales: [{ id, customerName }]
 */
function InvoiceReviewDialog({ sales, onClose }) {
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const [emitted, setEmitted] = useState(null);
  const sale = sales[index];
  const isLast = index === sales.length - 1;

  function next() {
    setEmitted(null);
    if (isLast) onClose();
    else setIndex((current) => current + 1);
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy={titleId}
      className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div>
          <h2 id={titleId} className="text-lg font-bold">
            Facturar venta de {sale.customerName}
          </h2>
          {sales.length > 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Venta {index + 1} de {sales.length}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {emitted ? (
          <EmittedStep key={emitted.invoiceId} result={emitted} />
        ) : (
          <InvoiceStep
            key={sale.id}
            orderId={sale.id}
            customerName={sale.customerName}
            onEmitted={setEmitted}
          />
        )}
      </div>

      {(emitted || sales.length > 1) && (
        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-950">
          {!emitted && !isLast && (
            <button
              type="button"
              onClick={next}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold dark:border-gray-700"
            >
              Saltar esta venta
            </button>
          )}
          {emitted && (
            <button
              type="button"
              onClick={next}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
            >
              {isLast ? "Terminar" : "Siguiente venta"}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

export default InvoiceReviewDialog;
