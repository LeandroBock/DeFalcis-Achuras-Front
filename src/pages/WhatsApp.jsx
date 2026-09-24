import { useCallback, useEffect, useState } from "react";

import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  ShoppingBag,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";


const API_URL = import.meta.env.VITE_API_URL;

function WhatsApp() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Pago
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const token = localStorage.getItem("access_token");

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/whatsapp/conversations`,
        {
          headers: getHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar las conversaciones");
      }

      const data = await response.json();

      setConversations(data);

      if (data.length > 0 && !selectedPhone) {
        setSelectedPhone(data[0].phone);
      }
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPhone]);

  const loadConversation = useCallback(async (phone) => {
    if (!phone) return;

    try {
      const response = await fetch(
        `${API_URL}/whatsapp/conversations/${phone}`,
        {
          headers: getHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar la conversación");
      }

      const data = await response.json();

      setConversation(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedPhone) {
      loadConversation(selectedPhone);
    }
  }, [selectedPhone, loadConversation]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await loadConversations();

      if (selectedPhone) {
        await loadConversation(selectedPhone);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedPhone, loadConversations, loadConversation]);

  const handleSelectConversation = (phone) => {
    setSelectedPhone(phone);
    setError("");
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!message.trim() || !selectedPhone) return;

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        `${API_URL}/whatsapp/messages/process`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            phone: selectedPhone,
            message: message.trim(),
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data?.message || "No se pudo enviar el mensaje",
        );
      }

      setMessage("");

      await loadConversations();
      await loadConversation(selectedPhone);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleOpenPayment = (order) => {
    setPaymentOrder(order);

    const pendingAmount =
      Number(order.pendingAmount) ||
      Number(order.total) - Number(order.paidAmount || 0);

    setPaymentAmount(
      pendingAmount > 0 ? String(pendingAmount) : "",
    );

    setPaymentMethod("transfer");
    setError("");
  };

  const handleRegisterPayment = async (event) => {
    event.preventDefault();

    if (!paymentOrder?.orderId) {
      setError("Este pedido no está vinculado a un pedido real.");
      return;
    }

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      setError("Ingresá un importe válido.");
      return;
    }

    try {
      setPaymentLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          orderId: paymentOrder.orderId,
          amount,
          method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "No se pudo registrar el pago",
        );
      }

      setPaymentOrder(null);
      setPaymentAmount("");
      setPaymentMethod("transfer");

      await loadConversations();
      await loadConversation(selectedPhone);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitial = (name) => {
    if (!name) return "?";

    return name.charAt(0).toUpperCase();
  };

  const getPaymentLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      partial: "Pago parcial",
      paid: "Pagado",
    };

    return labels[status] || status || "-";
  };

  const selectedCustomer = conversations.find(
    (item) => item.phone === selectedPhone,
  );

  if (loading) {
    return (
      <main className="flex min-h-[500px] items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Cargando conversaciones...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:p-6 lg:p-8">
      {/* HEADER */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-green-600 p-2 text-white">
              <MessageCircle className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              DF Achuras
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            WhatsApp
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bandeja de conversaciones
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          En vivo
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LAYOUT */}
      <div className="grid min-h-[650px] grid-cols-1 gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* SIDEBAR */}
        <aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold">
                  Conversaciones
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {conversations.length} activas
                </p>
              </div>
            </div>

            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700 dark:bg-green-950/40 dark:text-green-400">
              ● En vivo
            </span>
          </div>

          <div className="max-h-[650px] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <MessageCircle className="h-7 w-7" />
                </div>

                <h3 className="font-semibold">
                  No hay conversaciones
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Todavía no hay conversaciones registradas.
                </p>
              </div>
            ) : (
              conversations.map((item) => (
                <button
                  key={item.phone}
                  type="button"
                  onClick={() =>
                    handleSelectConversation(item.phone)
                  }
                  className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-4 text-left transition dark:border-gray-800 ${
                    selectedPhone === item.phone
                      ? "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                    {getInitial(item.customerName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="truncate text-sm">
                        {item.customerName || "Cliente desconocido"}
                      </strong>

                      <span className="shrink-0 text-[11px] text-gray-500 dark:text-gray-400">
                        {formatTime(item.lastMessageDate)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {item.lastMessage || "Sin mensajes"}
                    </p>

                    <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                      <Phone className="h-3 w-3" />
                      {item.phone}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* CONVERSACIÓN */}
        <section className="flex min-h-[650px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {!conversation ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-5 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <MessageCircle className="h-8 w-8" />
              </div>

              <h3 className="font-semibold">
                Seleccioná una conversación
              </h3>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Elegí un cliente de la lista para ver sus mensajes.
              </p>
            </div>
          ) : (
            <>
              {/* CONVERSACIÓN HEADER */}
              <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                  {getInitial(selectedCustomer?.customerName)}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold">
                    {selectedCustomer?.customerName ||
                      "Cliente desconocido"}
                  </h2>

                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Phone className="h-3 w-3" />
                    {selectedPhone}
                  </div>
                </div>
              </div>

              {/* MENSAJES */}
              <div className="flex min-h-[300px] flex-1 flex-col gap-3 overflow-y-auto bg-gray-100 p-4 dark:bg-gray-950 sm:p-5">
                {conversation.messages?.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay mensajes.
                  </div>
                ) : (
                  conversation.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
                        msg.direction === "incoming"
                          ? "self-start rounded-tl-sm border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                          : "self-end rounded-tr-sm bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      <span className="mb-1 block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        {msg.direction === "incoming"
                          ? "Cliente"
                          : "DF Achuras"}
                      </span>

                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.message}
                      </p>

                      <small className="mt-1.5 block text-right text-[10px] text-gray-500 dark:text-gray-400">
                        {formatTime(msg.createdAt)}
                      </small>
                    </div>
                  ))
                )}
              </div>

              {/* PEDIDOS */}
              {conversation.orders?.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-gray-500 dark:text-gray-400" />

                      <h3 className="font-bold">
                        Pedidos del cliente
                      </h3>
                    </div>

                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {conversation.orders.length}{" "}
                      {conversation.orders.length === 1
                        ? "pedido"
                        : "pedidos"}
                    </span>
                  </div>

                  <div className="flex max-h-[330px] flex-col gap-3 overflow-y-auto">
                    {conversation.orders.map((order) => {
                      const statusLabels = {
                        pending: "Pendiente",
                        confirmed: "Confirmado",
                        delivered: "Entregado",
                        cancelled: "Cancelado",
                      };

                      const statusClasses = {
                        pending:
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
                        confirmed:
                          "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
                        delivered:
                          "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
                        cancelled:
                          "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
                      };

                      return (
                        <div
                          key={order.id}
                          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Pedido
                              </span>

                              <strong className="text-sm">
                                #
                                {order.id
                                  .slice(0, 8)
                                  .toUpperCase()}
                              </strong>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                statusClasses[order.status] ||
                                "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {statusLabels[order.status] ||
                                order.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            <div>
                              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                                Estado
                              </span>

                              <strong className="text-sm">
                                {statusLabels[order.status] ||
                                  order.status}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                                Pago
                              </span>

                              <strong
                                className={
                                  order.paymentStatus === "paid"
                                    ? "text-green-600 dark:text-green-400"
                                    : order.paymentStatus ===
                                        "partial"
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-600 dark:text-red-400"
                                }
                              >
                                {getPaymentLabel(
                                  order.paymentStatus,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                                Total
                              </span>

                              <strong className="text-sm text-green-600 dark:text-green-400">
                                $
                                {Number(
                                  order.total || 0,
                                ).toLocaleString("es-AR")}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                                Fecha
                              </span>

                              <strong className="text-sm">
                                {new Date(
                                  order.createdAt,
                                ).toLocaleDateString("es-AR")}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                                Pagado
                              </span>

                              <strong className="text-sm text-green-600 dark:text-green-400">
                                $
                                {Number(
                                  order.paidAmount || 0,
                                ).toLocaleString("es-AR")}
                              </strong>
                            </div>

                            <div>
                              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                                Pendiente
                              </span>

                              <strong className="text-sm text-red-600 dark:text-red-400">
                                $
                                {Number(
                                  order.pendingAmount || 0,
                                ).toLocaleString("es-AR")}
                              </strong>
                            </div>
                          </div>

                          {order.orderId &&
                            order.paymentStatus !== "paid" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPayment(order)
                                }
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                              >
                                <CircleDollarSign className="h-4 w-4" />
                                Registrar pago
                              </button>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMPOSER */}
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-4"
              >
                <input
                  type="text"
                  placeholder="Escribí un mensaje de prueba..."
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  disabled={sending}
                  className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-600 dark:focus:ring-green-950"
                />

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !message.trim() ||
                    !selectedPhone
                  }
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {sending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}

                  <span className="hidden sm:inline">
                    {sending ? "Enviando..." : "Enviar"}
                  </span>
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {/* MODAL DE PAGO */}
      {paymentOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            {/* MODAL HEADER */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                  <WalletCards className="h-4 w-4" />
                  Registrar pago
                </div>

                <h2 className="text-xl font-bold">
                  Pedido #
                  {paymentOrder.id.slice(0, 8).toUpperCase()}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPaymentOrder(null)}
                disabled={paymentLoading}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* RESUMEN */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Total
                </span>

                <strong className="mt-1 block text-sm">
                  $
                  {Number(paymentOrder.total).toLocaleString(
                    "es-AR",
                    {
                      minimumFractionDigits: 2,
                    },
                  )}
                </strong>
              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-900/50 dark:bg-green-950/20">
                <span className="text-xs text-green-600 dark:text-green-400">
                  Pagado
                </span>

                <strong className="mt-1 block text-sm text-green-700 dark:text-green-400">
                  $
                  {Number(
                    paymentOrder.paidAmount || 0,
                  ).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                <span className="text-xs text-red-600 dark:text-red-400">
                  Pendiente
                </span>

                <strong className="mt-1 block text-sm text-red-700 dark:text-red-400">
                  $
                  {Number(
                    paymentOrder.pendingAmount ??
                      Number(paymentOrder.total) -
                        Number(paymentOrder.paidAmount || 0),
                  ).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
            </div>

            {/* FORMULARIO */}
            <form
              className="space-y-5"
              onSubmit={handleRegisterPayment}
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="paymentAmount"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <CircleDollarSign className="h-4 w-4 text-gray-400" />
                  Importe
                </label>

                <input
                  id="paymentAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(event.target.value)
                  }
                  disabled={paymentLoading}
                  placeholder="Ej: 6500"
                  className="rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-green-950"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="paymentMethod"
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Método de pago
                </label>

                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value)
                  }
                  disabled={paymentLoading}
                  className="rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-green-950"
                >
                  <option value="transfer">
                    Transferencia
                  </option>

                  <option value="cash">Efectivo</option>

                  <option value="mercado_pago">
                    Mercado Pago
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPaymentOrder(null)}
                  disabled={paymentLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paymentLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {paymentLoading
                    ? "Registrando..."
                    : "Registrar pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default WhatsApp;