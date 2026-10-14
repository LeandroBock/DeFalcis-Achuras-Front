import { useModalFocus } from "../hooks/useModalFocus";

const DEFAULT_OVERLAY =
  "fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm";

/**
 * Fondo + panel de un modal con el comportamiento de teclado completo
 * (useModalFocus): foco adentro al abrir, Tab no se escapa, Esc cierra y el
 * foco vuelve al botón que lo abrió.
 *
 * Se monta solo mientras está abierto:
 *   {open && (
 *     <Modal onClose={close} labelledBy={titleId} className="...">...</Modal>
 *   )}
 *
 * as="form" para que el panel sea el formulario (con onSubmit).
 */
function Modal({
  onClose,
  closeDisabled = false,
  labelledBy,
  describedBy,
  role = "dialog",
  as: Panel = "div",
  overlayClassName = DEFAULT_OVERLAY,
  className,
  children,
  ...props
}) {
  const ref = useModalFocus({ onClose, closeDisabled });

  return (
    <div className={overlayClassName}>
      <Panel
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={className}
        {...props}
      >
        {children}
      </Panel>
    </div>
  );
}

export default Modal;
