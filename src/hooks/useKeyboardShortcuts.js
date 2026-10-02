import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  // =========================
  // ATAJOS DE NAVEGACIÓN
  // =========================

  useHotkeys("alt+1", (event) => {
    event.preventDefault();
    navigate("/dashboard");
  });

  useHotkeys("alt+2", (event) => {
    event.preventDefault();
    navigate("/products");
  });

  useHotkeys("alt+3", (event) => {
    event.preventDefault();
    navigate("/inventory");
  });

  useHotkeys("alt+4", (event) => {
    event.preventDefault();
    navigate("/categories");
  });

  useHotkeys("alt+5", (event) => {
    event.preventDefault();
    navigate("/customers");
  });

  useHotkeys("alt+6", (event) => {
    event.preventDefault();
    navigate("/suppliers");
  });

  useHotkeys("alt+7", (event) => {
    event.preventDefault();
    navigate("/purchases");
  });

  useHotkeys("alt+8", (event) => {
    event.preventDefault();
    navigate("/orders");
  });

  useHotkeys("alt+9", (event) => {
    event.preventDefault();
    navigate("/payments");
  });

  useHotkeys("alt+0", (event) => {
    event.preventDefault();
    navigate("/expenses");
  });

  // =========================
  // NAVEGACIÓN DEL SIDEBAR
  // =========================

  useEffect(() => {
    function handleSidebarKeyboard(event) {
      // Solo nos interesan las flechas
      if (
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp"
      ) {
        return;
      }

      // No interferir con inputs, selects, textareas
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }

      // Buscar links del sidebar
      const links = Array.from(
        document.querySelectorAll(
          'nav[aria-label="Navegación principal"] a[href]'
        )
      );

      if (!links.length) {
        return;
      }

      // Solo actuar si el foco está dentro del menú
      const currentIndex = links.indexOf(
        document.activeElement
      );

      if (currentIndex === -1) {
        return;
      }

      event.preventDefault();

      let nextIndex;

      if (event.key === "ArrowDown") {
        nextIndex = Math.min(
          currentIndex + 1,
          links.length - 1
        );
      } else {
        nextIndex = Math.max(
          currentIndex - 1,
          0
        );
      }

      const nextLink = links[nextIndex];

      if (!nextLink) {
        return;
      }

      nextLink.focus();

      // Obliga al contenedor del sidebar a desplazarse
      nextLink.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    document.addEventListener(
      "keydown",
      handleSidebarKeyboard
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleSidebarKeyboard
      );
    };
  }, []);
}
