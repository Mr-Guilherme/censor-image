"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCanvasRenderer } from "@/features/editor/hooks/use-canvas-renderer";
import { usePointerInteractions } from "@/features/editor/hooks/use-pointer-interactions";
import type {
  CommandType,
  ImageModel,
  RedactionObject,
  ToolType,
} from "@/features/editor/types/editor.types";

interface CanvasSize {
  width: number;
  height: number;
}

export function CanvasViewport(params: {
  image: ImageModel | null;
  objects: RedactionObject[];
  selectedIds: string[];
  pendingDraft: RedactionObject | null;
  tool: ToolType;
  styleLineWidth: number;
  placingIds: string[];
  onSelection: (ids: string[]) => void;
  onPendingShape: (shape: RedactionObject["shape"] | null) => void;
  onObjectsTransient: (objects: RedactionObject[]) => void;
  onCommit: (data: {
    before: RedactionObject[];
    after: RedactionObject[];
    command: CommandType;
  }) => void;
  onClearPlacing: () => void;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<CanvasSize>({ width: 1000, height: 640 });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const first = entries[0];

      if (!first) {
        return;
      }

      setSize({
        width: Math.max(1, Math.floor(first.contentRect.width)),
        height: Math.max(1, Math.floor(first.contentRect.height)),
      });
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const transform = useCanvasRenderer({
    baseCanvas: baseCanvasRef.current,
    overlayCanvas: overlayCanvasRef.current,
    containerWidth: size.width,
    containerHeight: size.height,
    image: params.image,
    objects: params.objects,
    selectionIds: params.selectedIds,
    pendingDraft: params.pendingDraft,
  });

  const interactions = usePointerInteractions({
    canvas: overlayCanvasRef.current,
    imageLoaded: Boolean(params.image),
    tool: params.tool,
    styleLineWidth: params.styleLineWidth,
    transform,
    objects: params.objects,
    selectedIds: params.selectedIds,
    placingIds: params.placingIds,
    onSelection: params.onSelection,
    onPendingShape: params.onPendingShape,
    onObjectsTransient: params.onObjectsTransient,
    onCommit: params.onCommit,
    onClearPlacing: params.onClearPlacing,
  });

  const helperText = useMemo(() => {
    if (!params.image) {
      return "Drop or paste an image to begin.";
    }

    if (params.tool !== "select") {
      return "Draw shape, then click Apply to confirm censorship.";
    }

    if (params.placingIds.length) {
      return "Move pasted objects to place them, then release pointer.";
    }

    return "Use Select to move/resize existing objects.";
  }, [params.image, params.placingIds.length, params.tool]);

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-2">
      <div className="text-xs text-muted-foreground">{helperText}</div>
      <div
        ref={containerRef}
        className="relative h-full min-h-[560px] overflow-hidden rounded-xl border border-border bg-[#0b0e13]"
      >
        <canvas ref={baseCanvasRef} className="absolute inset-0" />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0"
          style={{ cursor: interactions.cursor }}
          onPointerDown={interactions.onPointerDown}
          onPointerMove={interactions.onPointerMove}
          onPointerUp={interactions.onPointerUp}
          onPointerCancel={interactions.onPointerUp}
          onPointerLeave={interactions.onPointerLeave}
        />
      </div>
    </div>
  );
}
