function Kbd({ children }) {
  return (
    <kbd className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium dark:border-gray-700">
      {children}
    </kbd>
  );
}

/**
 * Ayuda de teclado debajo de una tabla o formulario (no se muestra en
 * celulares, donde no hay teclado).
 *
 *   import { MOVE } from "../../utils/keyboardHelp";
 *   <KeyboardHelp items={[MOVE, [["Enter"], "editar"], [["N"], "nuevo"]]} />
 */
function KeyboardHelp({ items, className = "" }) {
  return (
    <div
      className={`hidden flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 sm:flex dark:text-gray-400 ${className}`}
    >
      {items.map(([keys, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          {keys.map((key, i) => (
            <span key={key} className="flex items-center gap-1">
              {i > 0 && key !== "↓" && "+"}
              <Kbd>{key}</Kbd>
            </span>
          ))}
          {label}
        </span>
      ))}
    </div>
  );
}

export default KeyboardHelp;
