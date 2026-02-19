"use client";

import { useMemo, useRef, useState } from "react";
import {
  createFreehandShape,
  createShapeFromPoints,
  getHandleCursor,
  moveShape,
  resizeShape,
  updateObjectShape,
} from "@/features/editor/lib/geometry";
import { hitTestHandles, hitTestObjects } from "@/features/editor/lib/hit-test";
import { toImagePoint } from "@/features/editor/lib/render";
import type {
  CommandType,
  Point,
  RedactionObject,
  ResizeHandle,
  ToolType,
  ViewportTransform,
} from "@/features/editor/types/editor.types";

interface DrawingSession {
  kind: "drawing";
  tool: ToolType;
  start: Point;
  points: Point[];
  before: RedactionObject[];
}

interface MovingSession {
  kind: "moving";
  start: Point;
  before: RedactionObject[];
  targetIds: string[];
}

interface ResizingSession {
  kind: "resizing";
  before: RedactionObject[];
  objectId: string;
  handle: ResizeHandle;
}

type InteractionSession = DrawingSession | MovingSession | ResizingSession;

function cloneObjects(objects: RedactionObject[]): RedactionObject[] {
  return objects.map((item) => structuredClone(item));
}

function eventToImagePoint(params: {
  event: PointerEvent | React.PointerEvent<HTMLCanvasElement>;
  canvas: HTMLCanvasElement;
  transform: ViewportTransform;
}): Point {
  const rect = params.canvas.getBoundingClientRect();

  return toImagePoint({
    x: params.event.clientX - rect.left,
    y: params.event.clientY - rect.top,
    transform: params.transform,
  });
}

export function usePointerInteractions(params: {
  canvas: HTMLCanvasElement | null;
  imageLoaded: boolean;
  tool: ToolType;
  styleLineWidth: number;
  transform: ViewportTransform | null;
  objects: RedactionObject[];
  selectedIds: string[];
  pendingDraft: RedactionObject | null;
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
}): {
  cursor: string;
  onPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
} {
  const interactionRef = useRef<InteractionSession | null>(null);
  const [cursor, setCursor] = useState("default");

  const selectedObjects = useMemo(
    () => params.objects.filter((item) => params.selectedIds.includes(item.id)),
    [params.objects, params.selectedIds],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!params.canvas || !params.transform || !params.imageLoaded) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const point = eventToImagePoint({
      event,
      canvas: params.canvas,
      transform: params.transform,
    });

    if (params.tool !== "select") {
      event.currentTarget.setPointerCapture(event.pointerId);
      params.onSelection([]);

      if (params.tool === "freehand") {
        interactionRef.current = {
          kind: "drawing",
          tool: "freehand",
          start: point,
          points: [point],
          before: cloneObjects(params.objects),
        };
        params.onPendingShape(createFreehandShape([point, point]));
        setCursor("crosshair");
        return;
      }

      interactionRef.current = {
        kind: "drawing",
        tool: params.tool,
        start: point,
        points: [],
        before: cloneObjects(params.objects),
      };
      params.onPendingShape(
        createShapeFromPoints({
          tool: params.tool,
          start: point,
          current: point,
          lineWidth: params.styleLineWidth,
        }),
      );
      setCursor("crosshair");
      return;
    }

    const handleHit = hitTestHandles({
      point,
      selectedObjects,
    });

    if (handleHit?.handle) {
      event.currentTarget.setPointerCapture(event.pointerId);
      interactionRef.current = {
        kind: "resizing",
        before: cloneObjects(params.objects),
        objectId: handleHit.objectId,
        handle: handleHit.handle,
      };
      params.onSelection([handleHit.objectId]);
      setCursor(getHandleCursor(handleHit.handle));
      return;
    }

    const hit = hitTestObjects({
      point,
      objects: params.objects,
    });

    if (!hit) {
      params.onSelection([]);
      setCursor("default");
      return;
    }

    if (event.shiftKey) {
      const selected = new Set(params.selectedIds);

      if (selected.has(hit.objectId)) {
        selected.delete(hit.objectId);
      } else {
        selected.add(hit.objectId);
      }

      params.onSelection(Array.from(selected));
      return;
    }

    const activeSelection = params.selectedIds.includes(hit.objectId)
      ? params.selectedIds
      : [hit.objectId];

    params.onSelection(activeSelection);

    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      kind: "moving",
      start: point,
      before: cloneObjects(params.objects),
      targetIds: activeSelection,
    };
    setCursor("grabbing");
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!params.canvas || !params.transform || !params.imageLoaded) {
      return;
    }

    const point = eventToImagePoint({
      event,
      canvas: params.canvas,
      transform: params.transform,
    });
    const session = interactionRef.current;

    if (!session) {
      if (params.tool !== "select") {
        setCursor("crosshair");
        return;
      }

      const handleHit = hitTestHandles({
        point,
        selectedObjects,
      });

      if (handleHit?.handle) {
        setCursor(getHandleCursor(handleHit.handle));
        return;
      }

      const hit = hitTestObjects({
        point,
        objects: params.objects,
      });
      setCursor(hit ? "move" : "default");
      return;
    }

    if (session.kind === "drawing") {
      if (session.tool === "freehand") {
        const points = [...session.points];
        const last = points.at(-1);

        if (!last || Math.hypot(last.x - point.x, last.y - point.y) >= 1) {
          points.push(point);
          session.points = points;
        }

        params.onPendingShape(createFreehandShape(points));
        return;
      }

      params.onPendingShape(
        createShapeFromPoints({
          tool: session.tool,
          start: session.start,
          current: point,
          lineWidth: params.styleLineWidth,
        }),
      );
      return;
    }

    if (session.kind === "moving") {
      const dx = point.x - session.start.x;
      const dy = point.y - session.start.y;
      const targets = new Set(session.targetIds);
      const next = session.before.map((item) => {
        if (!targets.has(item.id)) {
          return item;
        }

        return updateObjectShape({
          object: item,
          shape: moveShape({
            shape: item.shape,
            dx,
            dy,
          }),
        });
      });

      params.onObjectsTransient(next);
      return;
    }

    const target = session.before.find((item) => item.id === session.objectId);

    if (!target) {
      return;
    }

    const next = session.before.map((item) => {
      if (item.id !== session.objectId) {
        return item;
      }

      return updateObjectShape({
        object: item,
        shape: resizeShape({
          shape: target.shape,
          handle: session.handle,
          point,
        }),
      });
    });

    params.onObjectsTransient(next);
  };

  const onPointerUp = () => {
    const session = interactionRef.current;
    interactionRef.current = null;

    if (!session) {
      setCursor(params.tool === "select" ? "default" : "crosshair");
      return;
    }

    if (session.kind === "moving" || session.kind === "resizing") {
      params.onCommit({
        before: session.before,
        after: params.objects,
        command: "update",
      });

      if (params.placingIds.length) {
        params.onClearPlacing();
      }
    }

    if (session.kind === "drawing") {
      if (!params.pendingDraft) {
        setCursor(params.tool === "select" ? "default" : "crosshair");
        return;
      }

      params.onCommit({
        before: session.before,
        after: [...session.before, params.pendingDraft],
        command: "add",
      });
      params.onSelection([params.pendingDraft.id]);
      params.onPendingShape(null);
    }

    setCursor(params.tool === "select" ? "default" : "crosshair");
  };

  const onPointerLeave = () => {
    if (interactionRef.current) {
      return;
    }

    setCursor(params.tool === "select" ? "default" : "crosshair");
  };

  return {
    cursor,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  };
}
