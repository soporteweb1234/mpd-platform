"use client";

import { useEffect } from "react";
import { useSearchStore } from "@/lib/stores/search-store";

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useGlobalSearchShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isOpen = useSearchStore.getState().isOpen;
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        useSearchStore.getState().close();
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        if (!isOpen && isEditable(e.target)) return;
        e.preventDefault();
        useSearchStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
