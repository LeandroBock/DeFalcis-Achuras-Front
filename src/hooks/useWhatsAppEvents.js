import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { whatsAppEventsUrl } from "../services/api";
import { keys } from "./queries";

/**
 * Escucha los eventos en tiempo real del backend (GET /whatsapp/events):
 * - "message": llegó o se envió un mensaje → refresca la bandeja.
 * - "connection": cambió el estado de la conexión con el celular.
 *
 * Devuelve el estado de la conexión con WhatsApp ("connected",
 * "disconnected", ...) y si la app está recibiendo eventos (live).
 */
export function useWhatsAppEvents() {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const events = new EventSource(whatsAppEventsUrl());

    events.onopen = () => setLive(true);
    // EventSource reintenta solo; mientras tanto se muestra "sin conexión".
    events.onerror = () => setLive(false);

    events.addEventListener("message", () => {
      queryClient.invalidateQueries({ queryKey: keys.whatsapp });
    });

    events.addEventListener("connection", (event) => {
      const { status } = JSON.parse(event.data);
      setConnectionStatus(status);
      queryClient.invalidateQueries({ queryKey: keys.whatsappConnection });
    });

    return () => events.close();
  }, [queryClient]);

  return { connectionStatus, live };
}
