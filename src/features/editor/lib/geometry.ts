import type {
  FreehandGeometry,
  HandlePoint,
  Point,
  RedactionObject,
  ResizeHandle,
  ShapeGeometry,
  ToolType,
} from "@/features/editor/types/editor.types";

const MIN_SIZE = 2;

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createRectBounds(params: { a: Point; b: Point }): Bounds {
  const x = Math.min(params.a.x, params.b.x);
  const y = Math.min(params.a.y, params.b.y);
  const width = Math.max(MIN_SIZE, Math.abs(params.b.x - params.a.x));
  const height = Math.max(MIN_SIZE, Math.abs(params.b.y - params.a.y));

  return { x, y, width, height };
}

export function createShapeFromPoints(params: {
  tool: ToolType;
  start: Point;
  current: Point;
  lineWidth: number;
}): ShapeGeometry {
  const { tool, start, current, lineWidth } = params;

  if (tool === "rect") {
    const bounds = createRectBounds({ a: start, b: current });

    return {
      type: "rect",
      data: bounds,
    };
  }

  if (tool === "ellipse") {
    const bounds = createRectBounds({ a: start, b: current });

    return {
      type: "ellipse",
      data: {
        cx: bounds.x + bounds.width / 2,
        cy: bounds.y + bounds.height / 2,
        rx: bounds.width / 2,
        ry: bounds.height / 2,
      },
    };
  }

  return {
    type: "line",
    data: {
      from: { ...start },
      to: { ...current },
      width: Math.max(1, lineWidth),
    },
  };
}

export function createFreehandShape(points: Point[]): ShapeGeometry {
  const normalized = points.length < 2 ? [...points, ...points] : points;
  const first = normalized[0];
  const last = normalized.at(-1);

  if (first && last && (first.x !== last.x || first.y !== last.y)) {
    normalized.push({ ...first });
  }

  return {
    type: "freehand",
    data: {
      points: normalized,
      closed: true,
    },
  };
}

export function shapeToPath(params: {
  shape: ShapeGeometry;
  offsetX?: number;
  offsetY?: number;
}): Path2D {
  const path = new Path2D();
  const offsetX = params.offsetX ?? 0;
  const offsetY = params.offsetY ?? 0;
  const { shape } = params;

  if (shape.type === "rect") {
    path.rect(
      shape.data.x - offsetX,
      shape.data.y - offsetY,
      shape.data.width,
      shape.data.height,
    );

    return path;
  }

  if (shape.type === "ellipse") {
    path.ellipse(
      shape.data.cx - offsetX,
      shape.data.cy - offsetY,
      shape.data.rx,
      shape.data.ry,
      0,
      0,
      Math.PI * 2,
    );

    return path;
  }

  if (shape.type === "line") {
    path.moveTo(shape.data.from.x - offsetX, shape.data.from.y - offsetY);
    path.lineTo(shape.data.to.x - offsetX, shape.data.to.y - offsetY);

    return path;
  }

  const points = shape.data.points;

  if (!points.length) {
    return path;
  }

  path.moveTo(points[0].x - offsetX, points[0].y - offsetY);

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    path.lineTo(point.x - offsetX, point.y - offsetY);
  }

  path.closePath();

  return path;
}

export function getShapeBounds(shape: ShapeGeometry): Bounds {
  if (shape.type === "rect") {
    return {
      x: shape.data.x,
      y: shape.data.y,
      width: shape.data.width,
      height: shape.data.height,
    };
  }

  if (shape.type === "ellipse") {
    return {
      x: shape.data.cx - shape.data.rx,
      y: shape.data.cy - shape.data.ry,
      width: shape.data.rx * 2,
      height: shape.data.ry * 2,
    };
  }

  if (shape.type === "line") {
    const minX = Math.min(shape.data.from.x, shape.data.to.x);
    const minY = Math.min(shape.data.from.y, shape.data.to.y);
    const maxX = Math.max(shape.data.from.x, shape.data.to.x);
    const maxY = Math.max(shape.data.from.y, shape.data.to.y);
    const half = shape.data.width / 2;

    return {
      x: minX - half,
      y: minY - half,
      width: Math.max(MIN_SIZE, maxX - minX + shape.data.width),
      height: Math.max(MIN_SIZE, maxY - minY + shape.data.width),
    };
  }

  const points = shape.data.points;

  if (!points.length) {
    return { x: 0, y: 0, width: MIN_SIZE, height: MIN_SIZE };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(MIN_SIZE, maxX - minX),
    height: Math.max(MIN_SIZE, maxY - minY),
  };
}

export function moveShape(params: {
  shape: ShapeGeometry;
  dx: number;
  dy: number;
}): ShapeGeometry {
  const { shape, dx, dy } = params;

  if (shape.type === "rect") {
    return {
      type: "rect",
      data: {
        ...shape.data,
        x: shape.data.x + dx,
        y: shape.data.y + dy,
      },
    };
  }

  if (shape.type === "ellipse") {
    return {
      type: "ellipse",
      data: {
        ...shape.data,
        cx: shape.data.cx + dx,
        cy: shape.data.cy + dy,
      },
    };
  }

  if (shape.type === "line") {
    return {
      type: "line",
      data: {
        ...shape.data,
        from: {
          x: shape.data.from.x + dx,
          y: shape.data.from.y + dy,
        },
        to: {
          x: shape.data.to.x + dx,
          y: shape.data.to.y + dy,
        },
      },
    };
  }

  return {
    type: "freehand",
    data: {
      ...shape.data,
      points: shape.data.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
      })),
    },
  };
}

function resizeBoundsByHandle(params: {
  bounds: Bounds;
  handle: Exclude<ResizeHandle, "start" | "end">;
  point: Point;
}): Bounds {
  const { bounds, handle, point } = params;
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;

  let nextLeft = left;
  let nextRight = right;
  let nextTop = top;
  let nextBottom = bottom;

  if (handle.includes("w")) {
    nextLeft = Math.min(point.x, right - MIN_SIZE);
  }

  if (handle.includes("e")) {
    nextRight = Math.max(point.x, left + MIN_SIZE);
  }

  if (handle.includes("n")) {
    nextTop = Math.min(point.y, bottom - MIN_SIZE);
  }

  if (handle.includes("s")) {
    nextBottom = Math.max(point.y, top + MIN_SIZE);
  }

  return {
    x: nextLeft,
    y: nextTop,
    width: Math.max(MIN_SIZE, nextRight - nextLeft),
    height: Math.max(MIN_SIZE, nextBottom - nextTop),
  };
}

function scaleFreehand(params: {
  geometry: FreehandGeometry;
  from: Bounds;
  to: Bounds;
}): FreehandGeometry {
  const scaleX =
    params.from.width === 0 ? 1 : params.to.width / params.from.width;
  const scaleY =
    params.from.height === 0 ? 1 : params.to.height / params.from.height;

  return {
    ...params.geometry,
    points: params.geometry.points.map((point) => ({
      x: params.to.x + (point.x - params.from.x) * scaleX,
      y: params.to.y + (point.y - params.from.y) * scaleY,
    })),
  };
}

export function resizeShape(params: {
  shape: ShapeGeometry;
  handle: ResizeHandle;
  point: Point;
}): ShapeGeometry {
  const { shape, handle, point } = params;

  if (shape.type === "line") {
    if (handle === "start") {
      return {
        type: "line",
        data: {
          ...shape.data,
          from: { ...point },
        },
      };
    }

    if (handle === "end") {
      return {
        type: "line",
        data: {
          ...shape.data,
          to: { ...point },
        },
      };
    }

    return shape;
  }

  if (handle === "start" || handle === "end") {
    return shape;
  }

  const fromBounds = getShapeBounds(shape);
  const toBounds = resizeBoundsByHandle({
    bounds: fromBounds,
    handle,
    point,
  });

  if (shape.type === "rect") {
    return {
      type: "rect",
      data: {
        x: toBounds.x,
        y: toBounds.y,
        width: toBounds.width,
        height: toBounds.height,
      },
    };
  }

  if (shape.type === "ellipse") {
    return {
      type: "ellipse",
      data: {
        cx: toBounds.x + toBounds.width / 2,
        cy: toBounds.y + toBounds.height / 2,
        rx: toBounds.width / 2,
        ry: toBounds.height / 2,
      },
    };
  }

  return {
    type: "freehand",
    data: scaleFreehand({
      geometry: shape.data,
      from: fromBounds,
      to: toBounds,
    }),
  };
}

export function getHandlePoints(shape: ShapeGeometry): HandlePoint[] {
  if (shape.type === "line") {
    return [
      {
        handle: "start",
        point: shape.data.from,
      },
      {
        handle: "end",
        point: shape.data.to,
      },
    ];
  }

  const bounds = getShapeBounds(shape);
  const left = bounds.x;
  const centerX = bounds.x + bounds.width / 2;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const centerY = bounds.y + bounds.height / 2;
  const bottom = bounds.y + bounds.height;

  return [
    { handle: "nw", point: { x: left, y: top } },
    { handle: "n", point: { x: centerX, y: top } },
    { handle: "ne", point: { x: right, y: top } },
    { handle: "e", point: { x: right, y: centerY } },
    { handle: "se", point: { x: right, y: bottom } },
    { handle: "s", point: { x: centerX, y: bottom } },
    { handle: "sw", point: { x: left, y: bottom } },
    { handle: "w", point: { x: left, y: centerY } },
  ];
}

export function updateObjectShape(params: {
  object: RedactionObject;
  shape: ShapeGeometry;
}): RedactionObject {
  return {
    ...params.object,
    shape: params.shape,
    updatedAt: Date.now(),
  };
}

export function getHandleCursor(handle: ResizeHandle): string {
  if (handle === "start" || handle === "end") {
    return "grab";
  }

  if (handle === "n" || handle === "s") {
    return "ns-resize";
  }

  if (handle === "e" || handle === "w") {
    return "ew-resize";
  }

  if (handle === "ne" || handle === "sw") {
    return "nesw-resize";
  }

  return "nwse-resize";
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
