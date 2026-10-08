import {
  BarChart3,
  Boxes,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Package,
  Receipt,
  ShoppingCart,
  Tags,
  Truck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Única fuente de verdad de las secciones del sistema.
 * Lo usan: Layout (menú lateral), useKeyboardShortcuts (Alt + número)
 * y CommandPalette (Ctrl/Cmd + K).
 *
 * key: número que se combina con Alt (ej: "1" => Alt + 1).
 *      Si no tiene key, la sección no tiene atajo directo.
 *
 * keywords: sinónimos para la paleta. No hace falta repetir
 *           la versión con tilde: la búsqueda ignora acentos.
 */
export const navigationItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    description: "Panel principal",
    keywords: ["inicio", "principal"],
    icon: LayoutDashboard,
    key: "1",
  },
  {
    to: "/products",
    label: "Productos",
    description: "Gestionar productos",
    keywords: ["articulos", "mercaderia"],
    icon: Package,
    key: "2",
  },
  {
    to: "/inventory",
    label: "Inventario",
    description: "Stock y movimientos",
    keywords: ["stock", "movimientos", "mercaderia"],
    icon: Boxes,
    key: "3",
  },
  {
    to: "/categories",
    label: "Categorías",
    description: "Gestionar categorías",
    keywords: ["categoria"],
    icon: Tags,
    key: "4",
  },
  {
    to: "/customers",
    label: "Clientes",
    description: "Gestionar clientes",
    keywords: ["cliente"],
    icon: Users,
    key: "5",
  },
  {
    to: "/suppliers",
    label: "Proveedores",
    description: "Gestionar proveedores",
    keywords: ["proveedor"],
    icon: Truck,
    key: "6",
  },
  {
    to: "/purchases",
    label: "Compras",
    description: "Gestionar compras",
    keywords: ["compra"],
    icon: ShoppingCart,
    key: "7",
  },
  {
    to: "/orders",
    label: "Ventas",
    description: "Gestionar ventas",
    keywords: ["venta", "pedidos", "pedido"],
    icon: Receipt,
    key: "8",
  },
  {
    to: "/payments",
    label: "Pagos",
    description: "Gestionar pagos",
    keywords: ["pago", "cobros"],
    icon: CreditCard,
    key: "9",
  },
  {
    to: "/expenses",
    label: "Gastos",
    description: "Gestionar gastos",
    keywords: ["gasto"],
    icon: FileText,
    key: "0",
  },
  {
    to: "/employees",
    label: "Empleados",
    description: "Gestionar empleados",
    keywords: ["empleado", "personal"],
    icon: UserRound,
  },
  {
    to: "/reports",
    label: "Reportes",
    description: "Consultar reportes",
    keywords: ["reporte", "informes", "ganancias"],
    icon: BarChart3,
  },
  {
    to: "/receivables",
    label: "Cuentas por cobrar",
    description: "Consultar saldos de clientes",
    keywords: ["cobrar", "clientes", "deudas", "saldos"],
    icon: DollarSign,
  },
  {
    to: "/supplier-payments",
    label: "Pagos a proveedores",
    description: "Registrar pagos",
    keywords: ["pagos", "proveedores"],
    icon: CreditCard,
  },
  {
    to: "/payables",
    label: "Cuentas por pagar",
    description: "Consultar deudas con proveedores",
    keywords: ["pagar", "deudas", "proveedores"],
    icon: Wallet,
  },
  {
    to: "/whatsapp",
    label: "WhatsApp",
    description: "Gestionar WhatsApp",
    keywords: ["mensajes", "bot", "chat"],
    icon: MessageCircle,
  },
];
