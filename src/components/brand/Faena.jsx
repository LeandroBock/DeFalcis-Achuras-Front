import { useId } from "react";

// Identidad de FAENA. Rojo carne con una veta rosada (la grasa del corte) en
// la F. tone="color" para fondos claros; tone="light" para fondos rojos u
// oscuros (cuadro blanco con la F roja).

const BRAND = {
  name: "FAENA",
  tagline: "Gestión para la industria de la carne",
};

export function FaenaMark({ size = 40, tone = "color", title = "FAENA" }) {
  const id = useId().replace(/:/g, "");
  const light = tone === "light";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light ? "#FFFFFF" : "#D12B2B"} />
          <stop offset="1" stopColor={light ? "#F6E7E3" : "#8E1616"} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}-bg)`} />
      {/* F: palo, barra superior y barra del medio */}
      <g fill={light ? "#B3201F" : "#FFFFFF"}>
        <rect x="19" y="14" width="9" height="36" rx="2" />
        <rect x="19" y="14" width="27" height="9" rx="2" />
        <rect x="19" y="30" width="20" height="8" rx="2" />
      </g>
      {/* Veta de grasa sobre la barra superior */}
      <path
        d="M28 20.5 C33 18.6 38 21.4 44.5 19.2"
        fill="none"
        stroke={light ? "#F2B8AE" : "#F7C9C1"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Isotipo + "FAENA", con la bajada opcional.
export function FaenaLogo({
  size = 40,
  tone = "color",
  tagline = false,
  className = "",
}) {
  const light = tone === "light";

  return (
    <span
      className={`inline-flex items-center gap-3 ${className}`}
      style={{ lineHeight: 1 }}
    >
      <FaenaMark size={size} tone={tone} />
      <span className="flex flex-col">
        <span
          style={{
            fontFamily: "'Montserrat', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: size * 0.56,
            letterSpacing: "0.14em",
            color: light ? "#FFFFFF" : "#2A1213",
          }}
          className={light ? "" : "dark:!text-white"}
        >
          {BRAND.name}
        </span>
        {tagline && (
          <span
            style={{
              fontFamily: "'Montserrat', system-ui, sans-serif",
              fontSize: Math.max(10, size * 0.24),
              fontWeight: 500,
              marginTop: 4,
              letterSpacing: "0.04em",
              color: light ? "#F4D6D0" : "#7A5C58",
            }}
          >
            {BRAND.tagline}
          </span>
        )}
      </span>
    </span>
  );
}
