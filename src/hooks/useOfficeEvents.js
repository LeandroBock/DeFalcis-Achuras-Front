import { createElement, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { officeEventsUrl } from "../services/api";
import { formatMoney, formatPaymentMethod } from "../utils/format";
import { keys } from "./queries";

const OFFICE_ROLES = ["super_admin", "admin", "ventas", "finanzas"];

// Descripción de la notificación en varias líneas.
const lines = (...parts) =>
  createElement(
    "span",
    { style: { whiteSpace: "pre-line" } },
    parts.filter(Boolean).join("\n"),
  );

function collectedDetail({ collectedByMethod = {} }) {
  return Object.entries(collectedByMethod)
    .filter(([, amount]) => amount)
    .map(
      ([method, amount]) =>
        `${formatPaymentMethod(method)} ${formatMoney(amount)}`,
    )
    .join(" · ");
}

/**
 * Avisos en tiempo real para la oficina (GET /events): cada vez que un
 * repartidor entrega o no puede entregar una nota aparece una notificación,
 * y las pantallas de pedidos, reparto y reportes se actualizan solas.
 */
export function useOfficeEvents(role) {
  const queryClient = useQueryClient();
  const enabled = OFFICE_ROLES.includes(role);

  useEffect(() => {
    if (!enabled) return undefined;

    const events = new EventSource(officeEventsUrl());

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: keys.orders });
      queryClient.invalidateQueries({ queryKey: keys.reports });
      queryClient.invalidateQueries({ queryKey: keys.products });
    };

    [
      "order.created",
      "order.updated",
      "order.assigned",
      "order.cancelled",
    ].forEach((type) => events.addEventListener(type, refresh));

    events.addEventListener("order.delivered", (event) => {
      refresh();
      const data = JSON.parse(event.data);
      const detail = collectedDetail(data);

      toast.success(`Entregado: ${data.customerName}`, {
        description: lines(
          data.driverName && `Repartidor: ${data.driverName}`,
          `Total ${formatMoney(data.total)} · Cobrado ${formatMoney(data.collected ?? 0)}`,
          detail,
          data.pending > 0 && `Queda debiendo ${formatMoney(data.pending)}`,
        ),
        duration: 10_000,
      });
    });

    events.addEventListener("order.not_delivered", (event) => {
      refresh();
      const data = JSON.parse(event.data);

      toast.warning(`No entregado: ${data.customerName}`, {
        description: lines(
          data.driverName && `Repartidor: ${data.driverName}`,
          `Motivo: ${data.reason}`,
        ),
        duration: 15_000,
      });
    });

    return () => events.close();
  }, [enabled, queryClient]);
}
