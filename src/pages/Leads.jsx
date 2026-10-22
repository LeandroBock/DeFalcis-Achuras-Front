import { useMemo, useState } from "react";
import { Inbox, Mail, MessageCircle } from "lucide-react";

import { updateLeadStatus } from "../services/api";
import { keys, useApiMutation, useLeads } from "../hooks/queries";
import { formatDate } from "../utils/format";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/PageStates";

const KIND = {
  signup: {
    label: "Crear cuenta",
    className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  demo: {
    label: "Demo",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  contact: {
    label: "Contacto",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
};

const STATUS = [
  ["new", "Nuevo"],
  ["contacted", "Contactado"],
  ["closed", "Cerrado"],
];

const whatsappUrl = (phone, name) => {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length <= 11 ? `549${digits.slice(-10)}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hola ${name}, te escribo de FAENA.`)}`;
};

/**
 * Interesados que dejaron sus datos en la portada de FAENA (contacto, crear
 * cuenta y demo). Solo el super admin.
 */
function Leads() {
  const { data: leads = [], isLoading, error, refetch } = useLeads();
  const [filter, setFilter] = useState("pending");

  const setStatus = useApiMutation(
    ({ id, status }) => updateLeadStatus(id, status),
    { invalidate: [keys.leads] },
  );

  const visible = useMemo(
    () =>
      leads.filter((lead) =>
        filter === "pending" ? lead.status === "new" : true,
      ),
    [leads, filter],
  );
  const pending = leads.filter((lead) => lead.status === "new").length;

  if (isLoading) {
    return <LoadingState icon={Inbox} message="Cargando interesados..." />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <Inbox className="h-7 w-7" />
          Interesados
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Lo que dejan en la portada de FAENA: pedidos de cuenta, de demo y
          consultas.
        </p>
      </header>

      <div className="flex gap-1">
        {[
          ["pending", `Sin responder (${pending})`],
          ["all", `Todos (${leads.length})`],
        ].map(([value, label]) => (
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
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            filter === "pending"
              ? "No hay interesados sin responder"
              : "Todavía no dejó sus datos nadie"
          }
          description="Cuando alguien complete un formulario de la portada aparece acá."
        />
      ) : (
        <ul className="grid gap-3">
          {visible.map((lead) => (
            <li
              key={lead.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${KIND[lead.kind]?.className ?? KIND.contact.className}`}
                    >
                      {KIND[lead.kind]?.label ?? lead.kind}
                    </span>
                    <strong>{lead.name}</strong>
                    {lead.business && (
                      <span className="text-gray-500 dark:text-gray-400">
                        · {lead.business}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(lead.createdAt)}
                    {lead.city && ` · ${lead.city}`}
                  </p>
                </div>

                <select
                  value={lead.status}
                  onChange={(event) =>
                    setStatus.mutate({
                      id: lead.id,
                      status: event.target.value,
                    })
                  }
                  aria-label={`Estado de ${lead.name}`}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-950"
                >
                  {STATUS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {lead.message && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-950 dark:text-gray-300">
                  {lead.message}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {lead.phone && (
                  <a
                    href={whatsappUrl(lead.phone, lead.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium dark:bg-gray-800"
                  >
                    <Mail className="h-4 w-4" />
                    {lead.email}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Leads;
