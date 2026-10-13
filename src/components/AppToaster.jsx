import { Toaster } from "sonner";

import { useTheme } from "../context/ThemeContext";

// Notificaciones de la app. Se usan con:
//   import { toast } from "sonner";
//   toast.success("Venta registrada");
//   toast.error(error.message);
function AppToaster() {
  const { darkMode } = useTheme();

  return (
    <Toaster
      theme={darkMode ? "dark" : "light"}
      position="top-right"
      richColors
      closeButton
    />
  );
}

export default AppToaster;
