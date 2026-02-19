"use client";

import { useEffect, useState } from "react";
import { renderCanvases } from "@/features/editor/lib/render";
import type {
  ImageModel,
  RedactionObject,
  ViewportTransform,
} from "@/features/editor/types/editor.types";

export function useCanvasRenderer(params: {
  baseCanvas: HTMLCanvasElement | null;
  overlayCanvas: HTMLCanvasElement | null;
  containerWidth: number;
  containerHeight: number;
  image: ImageModel | null;
  objects: RedactionObject[];
  selectionIds: string[];
  pendingDraft: RedactionObject | null;
}): ViewportTransform | null {
  const [transform, setTransform] = useState<ViewportTransform | null>(null);

  useEffect(() => {
    if (!params.baseCanvas || !params.overlayCanvas) {
      setTransform(null);
      return;
    }

    const baseCanvas = params.baseCanvas;
    const overlayCanvas = params.overlayCanvas;

    const frameId = window.requestAnimationFrame(() => {
      const next = renderCanvases({
        canvases: {
          base: baseCanvas,
          overlay: overlayCanvas,
        },
        containerWidth: params.containerWidth,
        containerHeight: params.containerHeight,
        image: params.image,
        objects: params.objects,
        options: {
          showSelection: true,
          selectionIds: params.selectionIds,
          pendingDraft: params.pendingDraft,
        },
      });

      setTransform(next);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [params]);

  return transform;
}
