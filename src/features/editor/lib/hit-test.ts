import {
  getHandlePoints,
  getShapeBounds,
} from "@/features/editor/lib/geometry";
import type {
  HitResult,
  Point,
  RedactionObject,
} from "@/features/editor/types/editor.types";

function pointInRect(params: {
  point: Point;
  x: number;
  y: number;
  width: number;
  height: number;
}): boolean {
  return (
    params.point.x >= params.x &&
    params.point.x <= params.x + params.width &&
    params.point.y >= params.y &&
    params.point.y <= params.y + params.height
  );
}

function pointInEllipse(params: {
  point: Point;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}): boolean {
  if (params.rx === 0 || params.ry === 0) {
    return false;
  }

  const dx = (params.point.x - params.cx) / params.rx;
  const dy = (params.point.y - params.cy) / params.ry;

  return dx * dx + dy * dy <= 1;
}

function distanceToSegment(params: {
  point: Point;
  a: Point;
  b: Point;
}): number {
  const dx = params.b.x - params.a.x;
  const dy = params.b.y - params.a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(params.point.x - params.a.x, params.point.y - params.a.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((params.point.x - params.a.x) * dx +
        (params.point.y - params.a.y) * dy) /
        lengthSquared,
    ),
  );

  const projectionX = params.a.x + t * dx;
  const projectionY = params.a.y + t * dy;

  return Math.hypot(params.point.x - projectionX, params.point.y - projectionY);
}

function pointInPolygon(params: { point: Point; points: Point[] }): boolean {
  const { point, points } = params;

  if (points.length < 3) {
    return false;
  }

  let inside = false;

  for (
    let index = 0, previous = points.length - 1;
    index < points.length;
    previous = index, index += 1
  ) {
    const currentPoint = points[index];
    const previousPoint = points[previous];
    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointOnShape(params: {
  point: Point;
  object: RedactionObject;
}): boolean {
  const { shape } = params.object;

  if (shape.type === "rect") {
    return pointInRect({
      point: params.point,
      x: shape.data.x,
      y: shape.data.y,
      width: shape.data.width,
      height: shape.data.height,
    });
  }

  if (shape.type === "ellipse") {
    return pointInEllipse({
      point: params.point,
      cx: shape.data.cx,
      cy: shape.data.cy,
      rx: shape.data.rx,
      ry: shape.data.ry,
    });
  }

  if (shape.type === "line") {
    const tolerance = shape.data.width / 2 + 6;

    return (
      distanceToSegment({
        point: params.point,
        a: shape.data.from,
        b: shape.data.to,
      }) <= tolerance
    );
  }

  return pointInPolygon({
    point: params.point,
    points: shape.data.points,
  });
}

export function hitTestHandles(params: {
  point: Point;
  selectedObjects: RedactionObject[];
  radius?: number;
}): HitResult | null {
  const radius = params.radius ?? 8;

  for (
    let objectIndex = params.selectedObjects.length - 1;
    objectIndex >= 0;
    objectIndex -= 1
  ) {
    const object = params.selectedObjects[objectIndex];
    const handles = getHandlePoints(object.shape);

    for (
      let handleIndex = handles.length - 1;
      handleIndex >= 0;
      handleIndex -= 1
    ) {
      const currentHandle = handles[handleIndex];
      const distance = Math.hypot(
        params.point.x - currentHandle.point.x,
        params.point.y - currentHandle.point.y,
      );

      if (distance > radius) {
        continue;
      }

      return {
        objectId: object.id,
        kind: "handle",
        handle: currentHandle.handle,
      };
    }
  }

  return null;
}

export function hitTestObjects(params: {
  point: Point;
  objects: RedactionObject[];
}): HitResult | null {
  for (let index = params.objects.length - 1; index >= 0; index -= 1) {
    const object = params.objects[index];

    if (!object.visible) {
      continue;
    }

    const bounds = getShapeBounds(object.shape);
    const inBounds = pointInRect({
      point: params.point,
      x: bounds.x - 8,
      y: bounds.y - 8,
      width: bounds.width + 16,
      height: bounds.height + 16,
    });

    if (!inBounds) {
      continue;
    }

    if (!isPointOnShape({ point: params.point, object })) {
      continue;
    }

    return {
      objectId: object.id,
      kind: "body",
    };
  }

  return null;
}
