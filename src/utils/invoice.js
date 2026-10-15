const LETTER = { 1: "A", 6: "B", 11: "C" };

export const voucherLetter = (cbteTipo) => LETTER[cbteTipo] ?? "";

// 00003-00000012
export const voucherNumber = (invoice) =>
  `${String(invoice.ptoVta).padStart(5, "0")}-${String(invoice.cbteNro).padStart(8, "0")}`;

export const invoiceLabel = (invoice) =>
  `Factura ${voucherLetter(invoice.cbteTipo)} ${voucherNumber(invoice)}`;
