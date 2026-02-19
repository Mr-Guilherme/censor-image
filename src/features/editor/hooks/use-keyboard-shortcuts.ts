"use client";

import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useKeyboardShortcuts(params: {
  enabled: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onEscape: () => void;
  onStyleApply: () => void;
}): void {
  useEffect(() => {
    if (!params.enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const withModifier = event.metaKey || event.ctrlKey;

      if (withModifier && event.key.toLowerCase() === "z" && !event.shiftKey) {
        params.onUndo();
        event.preventDefault();
        return;
      }

      if (
        withModifier &&
        (event.key.toLowerCase() === "y" ||
          (event.key.toLowerCase() === "z" && event.shiftKey))
      ) {
        params.onRedo();
        event.preventDefault();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        params.onDelete();
        event.preventDefault();
        return;
      }

      if (event.key === "Escape") {
        params.onEscape();
        event.preventDefault();
        return;
      }

      if (withModifier && event.key.toLowerCase() === "enter") {
        params.onStyleApply();
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [params]);
}
