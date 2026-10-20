import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  QrCode,
  RefreshCw,
  Smartphone,
  Unlink,
} from "lucide-react";

import ConfirmModal from "../../components/ConfirmModal";
import {
  keys,
  useApiMutation,
  useWhatsAppConnection,
} from "../../hooks/queries";
import { connectWhatsApp, logoutWhatsApp } from "../../services/api";

const formatPhone = (phone) => (phone ? `+${phone}` : "");

// Vincular el WhatsApp del negocio escaneando un QR, como WhatsApp Web.
// Solo para super_admin y admin.
function ConnectionPanel() {
  const { data, isLoading, error, refetch } = useWhatsAppConnection();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const connect = useApiMutation(connectWhatsApp, {
    invalidate: [keys.whatsappConnection],
  });

  const logout = useApiMutation(logoutWhatsApp, {
    invalidate: [keys.whatsappConnection, keys.whatsapp],
    success: "WhatsApp desvinculado y mensajes borrados.",
  });

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <Notice tone="red" icon={AlertTriangle}>
        {error.message}
        <button
          type="button"
          onClick={() => refetch()}
          className="ml-3 font-semibold underline"
        >
          Reintentar
        </button>
      </Notice>
    );
  }

  const status = data?.status;

  if (status === "disabled") {
    return (
      <Notice tone="amber" icon={AlertTriangle}>
        La conexión con WhatsApp está desactivada en el servidor. Para
        activarla, cargá <strong>WHATSAPP_ENABLED=true</strong> en las variables
        de entorno de Render.
      </Notice>
    );
  }

  if (status === "connected") {
    return (
      <>
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-green-900/50 dark:bg-green-950/20">
          <div className="flex items-center gap-3 text-sm text-green-800 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              WhatsApp conectado
              {data.phone && (
                <>
                  {" "}
                  con el número <strong>{formatPhone(data.phone)}</strong>
                </>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-green-300 px-3 py-1.5 text-sm font-semibold text-green-800 transition hover:bg-green-100 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/30"
          >
            <Unlink className="h-4 w-4" />
            Desvincular
          </button>
        </div>

        <ConfirmModal
          isOpen={confirmLogout}
          title="¿Desvincular WhatsApp?"
          message="Se borra el historial de mensajes de la app y dejan de llegar hasta que vuelvas a escanear el QR. Las ventas y notas de pedido no se tocan. El celular sigue funcionando normalmente."
          confirmText="Desvincular"
          loadingText="Desvinculando..."
          loading={logout.isPending}
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() =>
            logout.mutate(undefined, {
              onSettled: () => setConfirmLogout(false),
            })
          }
        />
      </>
    );
  }

  if (status === "waiting_qr" && data.qr) {
    return (
      <div className="mb-5 flex flex-col items-center gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start dark:border-gray-800 dark:bg-gray-900">
        <img
          src={data.qr}
          alt="Código QR para vincular WhatsApp"
          width={240}
          height={240}
          className="h-60 w-60 shrink-0 rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700"
        />

        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <QrCode className="h-5 w-5 text-green-600" />
            Escaneá el código con el celular del negocio
          </h2>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Abrí WhatsApp en el celular.</li>
            <li>
              Tocá <strong>Configuración</strong> (o los tres puntos) →{" "}
              <strong>Dispositivos vinculados</strong>.
            </li>
            <li>
              Tocá <strong>Vincular un dispositivo</strong> y apuntá la cámara a
              este código.
            </li>
          </ol>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            El código se renueva solo cada unos segundos. Una vez vinculado no
            hace falta volver a escanearlo.
          </p>

          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="mt-4 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (status === "connecting" || status === "waiting_qr" || connect.isPending) {
    return (
      <Notice tone="gray" icon={RefreshCw} spin>
        Conectando con WhatsApp...
      </Notice>
    );
  }

  // disconnected
  return (
    <div className="mb-5 flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gray-100 p-3 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <Smartphone className="h-6 w-6" />
        </div>

        <div>
          <h2 className="font-bold">WhatsApp no está conectado</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vinculá el celular del negocio para recibir y responder los mensajes
            de los clientes desde acá.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => connect.mutate()}
        className="flex shrink-0 items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        <QrCode className="h-4 w-4" />
        Conectar WhatsApp
      </button>
    </div>
  );
}

const TONES = {
  red: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400",
  amber:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300",
  gray: "border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

function Notice({ tone, icon: Icon, spin = false, children }) {
  return (
    <div
      role="status"
      className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${spin ? "animate-spin" : ""}`}
      />
      <div>{children}</div>
    </div>
  );
}

export default ConnectionPanel;
