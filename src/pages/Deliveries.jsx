import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bike,
  ClipboardCheck,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Scale,
  StickyNote,
} from "lucide-react";

import DeliveryForm from "../components/delivery/DeliveryForm";
import { ErrorState, LoadingState } from "../components/ui/PageStates";
import { useMyDeliveries, useProducts } from "../hooks/queries";
import {
  formatDate,
  formatMoney,
  formatQuantity,
  todayISO,
} from "../utils/format";

const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const whatsappUrl = (phone) => {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length <= 11 ? `549${digits.slice(-10)}` : digits;
  return `https://wa.me/${number}`;
};

// Pantalla del repartidor (pensada para el celular): sus notas de pedido
// pendientes y la carga de cada entrega en el domicilio.
function Deliveries() {
  const [onlyToday, setOnlyToday] = useState(true);
  const date = onlyToday ? todayISO() : undefined;

  const deliveriesQuery = useMyDeliveries(date);
  const productsQuery = useProducts();
  const [delivering, setDelivering] = useState(null);

  const deliveries = deliveriesQuery.data ?? [];

  if (deliveriesQuery.isLoading) {
    return <LoadingState icon={Bike} message="Cargando tus entregas..." />;
  }

  if (deliveriesQuery.error) {
    return (
      <ErrorState
        message={deliveriesQuery.error.message}
        onRetry={deliveriesQuery.refetch}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bike className="h-7 w-7" />
            Mis entregas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {deliveries.length === 1
              ? "1 nota para entregar"
              : `${deliveries.length} notas para entregar`}
          </p>
        </div>

        <Link
          to="/settlement"
          className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-gray-700"
        >
          <ClipboardCheck className="h-4 w-4" />
          Mi rendición
        </Link>
      </header>

      <div className="flex items-center gap-2">
        {[
          [true, "Hoy"],
          [false, "Todas"],
        ].map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setOnlyToday(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              onlyToday === value
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => deliveriesQuery.refetch()}
          className="ml-auto rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Actualizar"
        >
          <RefreshCw
            className={`h-5 w-5 ${deliveriesQuery.isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {deliveries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <Bike className="mx-auto mb-3 h-10 w-10" />
          {onlyToday
            ? "No tenés entregas para hoy."
            : "No tenés notas pendientes."}
        </div>
      ) : (
        <ul className="space-y-3">
          {deliveries.map((delivery) => (
            <li
              key={delivery.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold">
                    {delivery.customer?.name || "Cliente"}
                  </h2>
                  {delivery.deliveryDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Entrega: {formatDate(delivery.deliveryDate)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                  ~{formatMoney(delivery.total)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {delivery.customer?.address && (
                  <a
                    href={mapsUrl(delivery.customer.address)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-800"
                  >
                    <MapPin className="h-4 w-4" />
                    {delivery.customer.address}
                  </a>
                )}
                {delivery.customer?.phone && (
                  <>
                    <a
                      href={`tel:${delivery.customer.phone}`}
                      className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-800"
                    >
                      <Phone className="h-4 w-4" />
                      Llamar
                    </a>
                    <a
                      href={whatsappUrl(delivery.customer.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </>
                )}
              </div>

              <ul className="mt-3 divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {delivery.items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex justify-between py-1.5"
                  >
                    <span>{item.productName}</span>
                    <span className="font-medium">
                      {formatQuantity(item.requestedQuantity, item.unit)}
                    </span>
                  </li>
                ))}
              </ul>

              {delivery.notes && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
                  {delivery.notes}
                </p>
              )}

              <button
                type="button"
                onClick={() => setDelivering(delivery)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
              >
                <Scale className="h-5 w-5" />
                Cargar entrega
              </button>
            </li>
          ))}
        </ul>
      )}

      {delivering && (
        <DeliveryForm
          order={delivering}
          products={productsQuery.data ?? []}
          onDone={() => setDelivering(null)}
          onClose={() => setDelivering(null)}
        />
      )}
    </div>
  );
}

export default Deliveries;
