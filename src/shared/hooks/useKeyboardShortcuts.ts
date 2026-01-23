import { useEffect } from "react";

export function useKeyboardShortcuts(handlers: {
  onSearch?: () => void;
  onEscape?: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlers.onSearch?.();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handlers.onSearch?.();
      }

      if (e.key === "Escape") {
        handlers.onEscape?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
