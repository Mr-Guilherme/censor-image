"use client";

import { useEffect } from "react";
import { parseShapeClipboard } from "@/features/editor/lib/clipboard";
import { imageFromClipboardItems } from "@/features/editor/lib/image-import";
import type {
  ImageModel,
  ShapeClipboardPayload,
} from "@/features/editor/types/editor.types";

export function useImagePaste(params: {
  enabled: boolean;
  onImagePaste: (image: ImageModel) => void;
  onShapesPaste: (payload: ShapeClipboardPayload) => void;
  onCopyRequest: () => string | null;
  fallbackClipboard: ShapeClipboardPayload | null;
}): void {
  useEffect(() => {
    if (!params.enabled) {
      return;
    }

    const onCopy = (event: ClipboardEvent) => {
      const raw = params.onCopyRequest();

      if (!raw || !event.clipboardData) {
        return;
      }

      event.clipboardData.setData("text/plain", raw);
      event.preventDefault();
    };

    const onPaste = async (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData;

      if (!clipboardData) {
        return;
      }

      const image = await imageFromClipboardItems(clipboardData.items);

      if (image) {
        params.onImagePaste(image);
        event.preventDefault();
        return;
      }

      const text = clipboardData.getData("text/plain");
      const parsed = parseShapeClipboard(text);

      if (parsed) {
        params.onShapesPaste(parsed);
        event.preventDefault();
        return;
      }

      if (!params.fallbackClipboard) {
        return;
      }

      params.onShapesPaste(params.fallbackClipboard);
      event.preventDefault();
    };

    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste);

    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste);
    };
  }, [params]);
}
