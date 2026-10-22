import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Beef,
  Bike,
  BookUser,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Layers,
  LogIn,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Radio,
  Route,
  Scale,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";

import { FaenaLogo } from "../../components/brand/Faena";
import LeadForm from "../../components/public/LeadForm";
import { useAuth } from "../../context/AuthContext";
import { homePathFor } from "../../config/navigation";
import "../../landing.css";

// Contacto de FAENA. WhatsApp en formato internacional para wa.me.
const CONTACT = {
  whatsapp: "5493413793177",
  whatsappLabel: "341 379-3177",
  email: "faena@gmail.com",
};
const WA_LINK = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("Hola, quiero consultar por FAENA para mi negocio.")}`;

// Precio de referencia de la membresía (después se carga desde el panel root).
const PRICE = "$ 10.000";

const AUDIENCE = [
  {
    icon: Store,
    title: "Carnicerías",
    text: "Mostrador, pedidos y cuentas corrientes.",
  },
  {
    icon: Truck,
    title: "Distribuidoras",
    text: "Achuras, cortes y reparto a domicilio.",
  },
  {
    icon: Warehouse,
    title: "Frigoríficos y mayoristas",
    text: "Listas de precios, stock y facturación.",
  },
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Notas de pedido",
    text: "Tomá pedidos en segundos con los precios de cada cliente. El total se ajusta con los kilos reales al entregar.",
  },
  {
    icon: Route,
    title: "Rutas de reparto",
    text: "Asigná varias notas a un repartidor y ordená sus paradas. Las ve en ese orden en el celular.",
  },
  {
    icon: Scale,
    title: "Pesaje y cobro en la entrega",
    text: "El repartidor carga los kilos reales y lo que cobró: efectivo, transferencia o cuenta corriente.",
  },
  {
    icon: MessageCircle,
    title: "Recibo X por WhatsApp",
    text: "Al confirmar la entrega, el cliente recibe su recibo al instante en su WhatsApp.",
  },
  {
    icon: BookUser,
    title: "Cuenta corriente",
    text: "Lo que debe cada cliente, cobro de deuda en la entrega y pagos aplicados a lo más viejo.",
  },
  {
    icon: Layers,
    title: "Listas de precios",
    text: "Mayoristas, restaurantes o minoristas: una lista por grupo y descuentos extra por cliente.",
  },
  {
    icon: FileText,
    title: "Facturación electrónica",
    text: "Factura A con ARCA, con revisión antes de emitir, PDF y envío por mail.",
  },
  {
    icon: BarChart3,
    title: "Stock, compras y reportes",
    text: "Inventario, proveedores, gastos y reportes financieros exportables a Excel.",
  },
];

const STEPS = [
  {
    title: "Cargás la nota",
    text: "Desde la oficina o cuando llega por WhatsApp, con los precios de su lista.",
  },
  {
    title: "Armás la ruta",
    text: "Elegís las notas, se las asignás a un repartidor y ordenás las paradas.",
  },
  {
    title: "Se pesa y se cobra",
    text: "En el domicilio se cargan los kilos reales y lo cobrado. El stock se descuenta solo.",
  },
  {
    title: "Recibo y factura",
    text: "El cliente recibe su recibo por WhatsApp y facturás con un clic.",
  },
];

const DRIVER = [
  {
    title: "Paradas en orden",
    text: "La ruta que armaste, con dirección en el mapa y WhatsApp del cliente.",
  },
  {
    title: "Kilos reales y cobro",
    text: "Puede sumar productos en el momento o marcar lo que no se llevó.",
  },
  {
    title: "Deuda a la vista",
    text: "Si el cliente debe, lo ve y lo puede cobrar en la misma entrega.",
  },
  {
    title: "Rendición del día",
    text: "Lo entregado y lo cobrado por método, para controlar la caja.",
  },
];

const MORE = [
  { icon: Radio, title: "Reparto en vivo" },
  { icon: MessageCircle, title: "Pedidos por WhatsApp" },
  { icon: FileSpreadsheet, title: "Importar clientes desde Excel" },
  { icon: Users, title: "Empleados con permisos" },
  { icon: Boxes, title: "Inventario" },
  { icon: KeyRound, title: "Sesiones seguras" },
  { icon: Moon, title: "Modo oscuro" },
];

const PLAN_FEATURES = [
  "Pedidos, reparto, rutas y rendiciones",
  "Cuenta corriente y cobranzas",
  "Listas de precios y descuentos por cliente",
  "Facturación electrónica con ARCA",
  "Recibos y avisos por WhatsApp",
  "Stock, compras, gastos y reportes",
  "Usuarios para todo tu equipo",
];

const FAQ = [
  {
    q: "¿Necesito instalar algo?",
    a: "No. FAENA funciona desde el navegador en la computadora, la tablet o el celular. El repartidor lo usa desde su celular, sin instalar nada.",
  },
  {
    q: "¿Puedo pasar mis clientes desde Excel?",
    a: "Sí. Subís tu planilla y FAENA reconoce las columnas solo: nombre, teléfono, dirección, CUIT, condición de IVA y lista de precios. Antes de guardar te muestra qué se va a cargar.",
  },
  {
    q: "¿Cómo funciona la facturación?",
    a: "Factura electrónica A con ARCA desde el mismo sistema: revisás los datos antes de emitir, se genera el PDF con el CAE y se le manda por mail al cliente.",
  },
  {
    q: "¿Y el WhatsApp?",
    a: "Vinculás el WhatsApp de tu negocio escaneando un QR, como WhatsApp Web. Desde ahí salen los recibos de cada entrega y ves los mensajes de tus clientes en la app.",
  },
  {
    q: "¿Cada empleado ve todo?",
    a: "No. Cada uno entra con su usuario y su rol: ventas, depósito, finanzas o reparto. El repartidor solo ve sus entregas y su rendición.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Las contraseñas se guardan cifradas, las sesiones vencen solas y cada acceso tiene permisos según su rol. Si alguna vez dejás de usar FAENA, tus datos no se borran.",
  },
];

function Landing() {
  const [menu, setMenu] = useState(false);
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="fx">
      {/* NAVEGACIÓN */}
      <header className="fx-nav">
        <div className="fx-wrap fx-nav-in">
          <a href="#inicio" aria-label="FAENA, inicio">
            <FaenaLogo size={38} />
          </a>

          <nav
            className={`fx-links ${menu ? "open" : ""}`}
            onClick={() => setMenu(false)}
            aria-label="Secciones"
          >
            <a href="#funciones">Funciones</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#reparto">Reparto</a>
            <a href="#planes">Planes</a>
            <a href="#preguntas">Preguntas</a>
          </nav>

          <div className="fx-nav-cta">
            {isAuthenticated ? (
              <Link to={homePathFor(user?.role)} className="fx-btn fx-btn-red">
                Ir a mi panel
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="fx-btn fx-btn-outline">
                  <LogIn size={16} />
                  Ingresar
                </Link>
                <Link to="/demo" className="fx-btn fx-btn-red fx-hide-mobile">
                  Probar demo
                </Link>
              </>
            )}
            <button
              type="button"
              className="fx-burger"
              onClick={() => setMenu(!menu)}
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menu}
            >
              {menu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* PORTADA */}
        <section className="fx-hero" id="inicio">
          <div className="fx-wrap fx-hero-in">
            <div className="fx-hero-text">
              <span className="fx-eyebrow">
                Software para la industria de la carne
              </span>
              <h1>
                Tu negocio de carne, <em>del pedido a la cobranza.</em>
              </h1>
              <p>
                Notas de pedido, rutas de reparto, pesaje real en la entrega,
                cuenta corriente, facturación electrónica y recibos por
                WhatsApp. Pensado para carnicerías, distribuidoras y
                frigoríficos.
              </p>
              <div className="fx-hero-cta">
                <Link to="/demo" className="fx-btn fx-btn-white">
                  Probar la demo gratis
                  <ArrowRight size={16} />
                </Link>
                <Link to="/registro" className="fx-btn fx-btn-ghost">
                  Crear cuenta
                </Link>
              </div>
              <p className="fx-hero-note">
                Sin instalar nada · Funciona en la compu y en el celular
              </p>
            </div>

            {/* Vista de la app */}
            <div className="fx-mock" aria-hidden="true">
              <span className="fx-mock-badge">5 paradas · $ 186.400</span>
              <div className="fx-mock-head">
                <div>
                  <b>Ruta de hoy · Juan</b>
                  <br />
                  <span>Jueves 21 de octubre</span>
                </div>
                <span className="fx-chip">
                  <Bike size={12} /> En reparto
                </span>
              </div>
              <div className="fx-stops">
                {[
                  [
                    "Carnicería Centro",
                    "Chinchulín 6 kg · Molleja 2 kg",
                    "$ 41.200",
                    true,
                  ],
                  [
                    "Restaurante El Asador",
                    "Riñón 4 kg · Mondongo 5 kg",
                    "$ 58.900",
                    true,
                  ],
                  ["Parrilla Don Juan", "Chinchulín 8 kg", "$ 38.400", false],
                ].map(([name, items, total, done], index) => (
                  <div className="fx-stop" key={name}>
                    <span className="fx-stop-n">{index + 1}</span>
                    <div>
                      <b>{name}</b>
                      <small>{items}</small>
                    </div>
                    {done ? (
                      <span className="fx-chip fx-chip-green">
                        <Check size={12} /> {total}
                      </span>
                    ) : (
                      <strong>{total}</strong>
                    )}
                  </div>
                ))}
              </div>
              <div className="fx-mock-toast">
                <CheckCircle2 size={18} />
                <span>
                  <b>Recibo X enviado</b> al WhatsApp del cliente
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PARA QUIÉN */}
        <section className="fx-audience" aria-label="Para quién es FAENA">
          <div className="fx-wrap fx-grid-3">
            {AUDIENCE.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon size={30} />
                <b>{title}</b>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FUNCIONES */}
        <section className="fx-section" id="funciones">
          <div className="fx-wrap">
            <div className="fx-head center">
              <span className="fx-eyebrow">Todo en un solo lugar</span>
              <h2>Lo que necesita tu negocio, sin planillas ni cuadernos</h2>
              <p>
                Cada parte del día de trabajo, conectada: lo que se pide, lo que
                se entrega, lo que se cobra y lo que se factura.
              </p>
            </div>
            <div className="fx-grid-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article className="fx-card" key={title}>
                  <div className="fx-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="fx-section fx-alt" id="como-funciona">
          <div className="fx-wrap">
            <div className="fx-head center">
              <span className="fx-eyebrow">Cómo funciona</span>
              <h2>Del pedido a la cobranza en cuatro pasos</h2>
            </div>
            <div className="fx-steps">
              {STEPS.map(({ title, text }) => (
                <div className="fx-step" key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REPARTO */}
        <section className="fx-section" id="reparto">
          <div className="fx-wrap fx-split">
            <div>
              <span className="fx-eyebrow">Para tus repartidores</span>
              <div className="fx-head" style={{ marginBottom: 0 }}>
                <h2>Todo el reparto en el celular del repartidor</h2>
                <p>
                  Y desde la oficina seguís cada entrega en vivo: quién entregó,
                  cuánto cobró y qué quedó pendiente.
                </p>
              </div>
              <ul className="fx-checks">
                {DRIVER.map(({ title, text }) => (
                  <li key={title}>
                    <CheckCircle2 size={20} />
                    <div>
                      <b>{title}</b>
                      <span>{text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="fx-phone" aria-hidden="true">
              <div className="fx-phone-screen">
                <div className="fx-phone-title">Mis entregas · 3 notas</div>
                <div className="fx-phone-card">
                  <b>1 · Carnicería Centro</b>
                  <div className="fx-row">
                    <span>
                      <MapPin size={11} /> San Martín 123
                    </span>
                    <span>~$ 41.200</span>
                  </div>
                  <div className="fx-row">
                    <span>Chinchulín</span>
                    <span>6 kg</span>
                  </div>
                  <div className="fx-row">
                    <span>Molleja</span>
                    <span>2 kg</span>
                  </div>
                  <div className="fx-phone-btn">Cargar entrega</div>
                </div>
                <div className="fx-phone-card">
                  <b>2 · Restaurante El Asador</b>
                  <div className="fx-row">
                    <span>Debe $ 12.500 de antes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MÁS */}
        <section className="fx-section fx-alt" style={{ paddingTop: 64 }}>
          <div className="fx-wrap">
            <div className="fx-head center" style={{ marginBottom: 28 }}>
              <h2>Y además</h2>
            </div>
            <div className="fx-more">
              {MORE.map(({ icon: Icon, title }) => (
                <span key={title}>
                  <Icon size={16} />
                  {title}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* PLANES */}
        <section className="fx-section" id="planes">
          <div className="fx-wrap">
            <div className="fx-head center">
              <span className="fx-eyebrow">Membresía</span>
              <h2>Un solo plan, con todo incluido</h2>
              <p>Probalo gratis con datos de ejemplo antes de decidir.</p>
            </div>
            <div className="fx-plan">
              <div className="fx-plan-body">
                <h3>Membresía FAENA</h3>
                <ul>
                  {PLAN_FEATURES.map((feature) => (
                    <li key={feature}>
                      <Check size={18} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="fx-plan-side">
                <small>Precio mensual</small>
                <div className="fx-price">
                  {PRICE} <small style={{ fontSize: 15 }}>/ mes</small>
                </div>
                <small>Todo incluido, con usuarios para tu equipo.</small>
                <Link to="/registro" className="fx-btn fx-btn-white">
                  Crear cuenta
                </Link>
                <Link to="/demo" className="fx-btn fx-btn-ghost">
                  Probar la demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PREGUNTAS */}
        <section className="fx-section fx-alt" id="preguntas">
          <div className="fx-wrap">
            <div className="fx-head center">
              <span className="fx-eyebrow">Preguntas frecuentes</span>
              <h2>Lo que nos suelen preguntar</h2>
            </div>
            <div className="fx-faq">
              {FAQ.map(({ q, a }) => (
                <details key={q}>
                  <summary>
                    {q}
                    <ChevronDown size={20} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACTO */}
        <section className="fx-section fx-contact" id="contacto">
          <div className="fx-wrap fx-contact-in">
            <div>
              <span className="fx-eyebrow" style={{ color: "var(--rose)" }}>
                Hablemos
              </span>
              <h2>¿Querés ver FAENA funcionando en tu negocio?</h2>
              <p>
                Dejanos tus datos y te escribimos para mostrarte el sistema y
                ayudarte a cargar tus clientes y productos. O escribinos
                directo:
              </p>
              <div className="fx-hero-cta" style={{ marginTop: 22 }}>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="fx-btn fx-btn-white"
                >
                  <MessageCircle size={16} />
                  {CONTACT.whatsappLabel}
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="fx-btn fx-btn-ghost"
                >
                  <Mail size={16} />
                  {CONTACT.email}
                </a>
              </div>
              <ul className="fx-checks" style={{ color: "#f0d9d5" }}>
                {[
                  "Te ayudamos con la primera carga de datos",
                  "Capacitación para tu equipo y tus repartidores",
                  "Soporte por WhatsApp",
                ].map((text) => (
                  <li key={text}>
                    <ShieldCheck size={20} style={{ color: "var(--rose)" }} />
                    <div>{text}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fx-form-card">
              <LeadForm
                kind="contact"
                fields={["city", "message"]}
                submitLabel="Quiero que me contacten"
                successTitle="¡Gracias! Ya recibimos tus datos"
                successText="Te escribimos en el día para mostrarte FAENA."
              />
            </div>
          </div>
        </section>
      </main>

      {/* WHATSAPP FLOTANTE */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noreferrer"
        className="fx-wa"
        aria-label={`Escribinos por WhatsApp al ${CONTACT.whatsappLabel}`}
        title="Escribinos por WhatsApp"
      >
        <MessageCircle size={28} />
      </a>

      {/* PIE */}
      <footer className="fx-footer">
        <div className="fx-wrap fx-footer-in">
          <FaenaLogo size={34} tone="light" />
          <nav aria-label="Pie de página">
            <a href="#funciones">Funciones</a>
            <a href="#planes">Planes</a>
            <a href="#contacto">Contacto</a>
            <Link to="/login">Ingresar</Link>
            <a href={WA_LINK} target="_blank" rel="noreferrer">
              WhatsApp {CONTACT.whatsappLabel}
            </a>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </nav>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <Beef size={14} />© {new Date().getFullYear()} FAENA
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
