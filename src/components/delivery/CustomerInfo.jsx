import {
  AlertTriangle,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  StickyNote,
} from "lucide-react";

import { formatMoney, formatTaxCondition } from "../../utils/format";

const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const whatsappUrl = (phone) => {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length <= 11 ? `549${digits.slice(-10)}` : digits;
  return `https://wa.me/${number}`;
};

const chip =
  "flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-800";

/**
 * Todos los datos del cliente para el repartidor: dirección (abre el mapa),
 * teléfono (llamar o WhatsApp), email, CUIT/DNI, indicaciones y lo que debe
 * de entregas anteriores.
 */
function CustomerInfo({ customer }) {
  if (!customer) return null;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        {customer.address && (
          <a
            href={mapsUrl(customer.address)}
            target="_blank"
            rel="noreferrer"
            className={chip}
          >
            <MapPin className="h-4 w-4 shrink-0" />
            {customer.address}
          </a>
        )}

        {customer.phone && (
          <>
            <a href={`tel:${customer.phone}`} className={chip}>
              <Phone className="h-4 w-4" />
              {customer.phone}
            </a>
            <a
              href={whatsappUrl(customer.phone)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </>
        )}

        {customer.email && (
          <a href={`mailto:${customer.email}`} className={chip}>
            <Mail className="h-4 w-4" />
            {customer.email}
          </a>
        )}
      </div>

      {(customer.taxId || customer.taxCondition) && (
        <p className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <FileText className="h-4 w-4 shrink-0 text-gray-400" />
          {customer.taxId && (
            <span>
              {customer.taxId.length === 11 ? "CUIT" : "DNI"}{" "}
              <strong>{customer.taxId}</strong>
              {" · "}
            </span>
          )}
          {formatTaxCondition(String(customer.taxCondition))}
        </p>
      )}

      {customer.notes && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Indicaciones:</strong> {customer.notes}
          </span>
        </p>
      )}

      {customer.pendingBalance > 0 && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-red-800 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Debe <strong>{formatMoney(customer.pendingBalance)}</strong> de
            entregas anteriores.
          </span>
        </p>
      )}
    </div>
  );
}

export default CustomerInfo;
