import type {
  RedactionObject,
  ShapeClipboardPayload,
} from "@/features/editor/types/editor.types";

export const SHAPE_CLIPBOARD_PREFIX = "IMAGE_CENSOR_SHAPES_V1:";

function createObjectId(): string {
  return crypto.randomUUID();
}

export function serializeShapeClipboard(objects: RedactionObject[]): string {
  const payload: ShapeClipboardPayload = {
    version: 1,
    objects: objects.map((item) => structuredClone(item)),
  };

  return `${SHAPE_CLIPBOARD_PREFIX}${JSON.stringify(payload)}`;
}

export function parseShapeClipboard(raw: string): ShapeClipboardPayload | null {
  if (!raw.startsWith(SHAPE_CLIPBOARD_PREFIX)) {
    return null;
  }

  const json = raw.slice(SHAPE_CLIPBOARD_PREFIX.length);

  try {
    const parsed = JSON.parse(json) as ShapeClipboardPayload;

    if (parsed.version !== 1 || !Array.isArray(parsed.objects)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function duplicateObjectsWithOffset(params: {
  objects: RedactionObject[];
  offsetX?: number;
  offsetY?: number;
}): RedactionObject[] {
  const offsetX = params.offsetX ?? 20;
  const offsetY = params.offsetY ?? 20;

  return params.objects.map((item) => {
    const now = Date.now();

    if (item.shape.type === "rect") {
      return {
        ...structuredClone(item),
        id: createObjectId(),
        createdAt: now,
        updatedAt: now,
        shape: {
          type: "rect",
          data: {
            ...item.shape.data,
            x: item.shape.data.x + offsetX,
            y: item.shape.data.y + offsetY,
          },
        },
      };
    }

    if (item.shape.type === "ellipse") {
      return {
        ...structuredClone(item),
        id: createObjectId(),
        createdAt: now,
        updatedAt: now,
        shape: {
          type: "ellipse",
          data: {
            ...item.shape.data,
            cx: item.shape.data.cx + offsetX,
            cy: item.shape.data.cy + offsetY,
          },
        },
      };
    }

    if (item.shape.type === "line") {
      return {
        ...structuredClone(item),
        id: createObjectId(),
        createdAt: now,
        updatedAt: now,
        shape: {
          type: "line",
          data: {
            ...item.shape.data,
            from: {
              x: item.shape.data.from.x + offsetX,
              y: item.shape.data.from.y + offsetY,
            },
            to: {
              x: item.shape.data.to.x + offsetX,
              y: item.shape.data.to.y + offsetY,
            },
          },
        },
      };
    }

    return {
      ...structuredClone(item),
      id: createObjectId(),
      createdAt: now,
      updatedAt: now,
      shape: {
        type: "freehand",
        data: {
          ...item.shape.data,
          points: item.shape.data.points.map((point) => ({
            x: point.x + offsetX,
            y: point.y + offsetY,
          })),
        },
      },
    };
  });
}
