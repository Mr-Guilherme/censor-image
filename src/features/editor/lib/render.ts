import {
  getHandlePoints,
  getShapeBounds,
  shapeToPath,
} from "@/features/editor/lib/geometry";
import { pixelateImageData } from "@/features/editor/lib/pixelate";
import type {
  ImageModel,
  RedactionObject,
  RenderOptions,
  ShapeGeometry,
  ViewportTransform,
} from "@/features/editor/types/editor.types";

let patchCanvas: HTMLCanvasElement | null = null;
let maskCanvas: HTMLCanvasElement | null = null;

interface CanvasPair {
  base: HTMLCanvasElement;
  overlay: HTMLCanvasElement;
}

interface ViewportInput {
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
}

function getScratchCanvases(): {
  patchCanvas: HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
} | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (!patchCanvas || !maskCanvas) {
    patchCanvas = document.createElement("canvas");
    maskCanvas = document.createElement("canvas");
  }

  return {
    patchCanvas,
    maskCanvas,
  };
}

function setupCanvas(params: {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr: number;
}): CanvasRenderingContext2D | null {
  const targetWidth = Math.max(1, Math.floor(params.width * params.dpr));
  const targetHeight = Math.max(1, Math.floor(params.height * params.dpr));

  if (
    params.canvas.width !== targetWidth ||
    params.canvas.height !== targetHeight
  ) {
    params.canvas.width = targetWidth;
    params.canvas.height = targetHeight;
  }

  params.canvas.style.width = `${params.width}px`;
  params.canvas.style.height = `${params.height}px`;

  const context = params.canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
  });

  if (!context) {
    return null;
  }

  context.setTransform(params.dpr, 0, 0, params.dpr, 0, 0);

  return context;
}

export function getViewportTransform(params: ViewportInput): ViewportTransform {
  const baseWidth = Math.max(1, params.containerWidth);
  const baseHeight = Math.max(1, params.containerHeight);
  const scale = Math.min(
    baseWidth / params.imageWidth,
    baseHeight / params.imageHeight,
  );
  const width = params.imageWidth * scale;
  const height = params.imageHeight * scale;
  const offsetX = (baseWidth - width) / 2;
  const offsetY = (baseHeight - height) / 2;

  return {
    scale,
    offsetX,
    offsetY,
    width,
    height,
  };
}

export function toImagePoint(params: {
  x: number;
  y: number;
  transform: ViewportTransform;
}): { x: number; y: number } {
  return {
    x: (params.x - params.transform.offsetX) / params.transform.scale,
    y: (params.y - params.transform.offsetY) / params.transform.scale,
  };
}

export function toScreenPoint(params: {
  x: number;
  y: number;
  transform: ViewportTransform;
}): { x: number; y: number } {
  return {
    x: params.transform.offsetX + params.x * params.transform.scale,
    y: params.transform.offsetY + params.y * params.transform.scale,
  };
}

function clampBoundsToImage(params: {
  bounds: ReturnType<typeof getShapeBounds>;
  image: ImageModel;
}): ReturnType<typeof getShapeBounds> | null {
  const x = Math.max(0, Math.floor(params.bounds.x));
  const y = Math.max(0, Math.floor(params.bounds.y));
  const maxX = Math.min(
    params.image.width,
    Math.ceil(params.bounds.x + params.bounds.width),
  );
  const maxY = Math.min(
    params.image.height,
    Math.ceil(params.bounds.y + params.bounds.height),
  );
  const width = maxX - x;
  const height = maxY - y;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
}

function drawShapeMask(params: {
  context: CanvasRenderingContext2D;
  shape: ShapeGeometry;
  offsetX: number;
  offsetY: number;
}): void {
  const path = shapeToPath({
    shape: params.shape,
    offsetX: params.offsetX,
    offsetY: params.offsetY,
  });

  params.context.fillStyle = "#ffffff";
  params.context.strokeStyle = "#ffffff";
  params.context.lineCap = "round";
  params.context.lineJoin = "round";

  if (params.shape.type === "line") {
    params.context.lineWidth = params.shape.data.width;
    params.context.stroke(path);
    return;
  }

  params.context.fill(path);
}

function applyPixelate(params: {
  context: CanvasRenderingContext2D;
  object: RedactionObject;
  image: ImageModel;
}): void {
  const scratch = getScratchCanvases();

  if (!scratch) {
    return;
  }

  const bounds = clampBoundsToImage({
    bounds: getShapeBounds(params.object.shape),
    image: params.image,
  });

  if (!bounds) {
    return;
  }

  const source = params.context.getImageData(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
  );
  const pixelated = pixelateImageData({
    source,
    blockSize: params.object.style.pixelate.blockSize,
  });

  scratch.patchCanvas.width = bounds.width;
  scratch.patchCanvas.height = bounds.height;
  const patchContext = scratch.patchCanvas.getContext("2d");

  if (!patchContext) {
    return;
  }

  patchContext.clearRect(0, 0, bounds.width, bounds.height);
  patchContext.putImageData(pixelated, 0, 0);

  scratch.maskCanvas.width = bounds.width;
  scratch.maskCanvas.height = bounds.height;
  const maskContext = scratch.maskCanvas.getContext("2d");

  if (!maskContext) {
    return;
  }

  maskContext.clearRect(0, 0, bounds.width, bounds.height);
  drawShapeMask({
    context: maskContext,
    shape: params.object.shape,
    offsetX: bounds.x,
    offsetY: bounds.y,
  });

  patchContext.globalCompositeOperation = "destination-in";
  patchContext.drawImage(scratch.maskCanvas, 0, 0);
  patchContext.globalCompositeOperation = "source-over";

  params.context.save();
  params.context.globalAlpha = params.object.style.pixelate.alpha;
  params.context.drawImage(scratch.patchCanvas, bounds.x, bounds.y);
  params.context.restore();
}

function applyFill(params: {
  context: CanvasRenderingContext2D;
  object: RedactionObject;
}): void {
  const path = shapeToPath({ shape: params.object.shape });
  params.context.fillStyle = params.object.style.fill.color;
  params.context.strokeStyle = params.object.style.fill.color;
  params.context.lineCap = "round";
  params.context.lineJoin = "round";

  if (params.object.shape.type === "line") {
    params.context.lineWidth = params.object.style.lineWidth;
    params.context.stroke(path);
    return;
  }

  params.context.fill(path);
}

function drawObject(params: {
  context: CanvasRenderingContext2D;
  object: RedactionObject;
  image: ImageModel;
}): void {
  if (!params.object.visible) {
    return;
  }

  if (params.object.style.mode === "pixelate") {
    applyPixelate(params);
    return;
  }

  applyFill(params);
}

function clearContext(params: {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
}): void {
  params.context.clearRect(0, 0, params.width, params.height);
}

function drawSelectedOverlay(params: {
  context: CanvasRenderingContext2D;
  objects: RedactionObject[];
  selectionIds: string[];
  transform: ViewportTransform;
}): void {
  const selectedObjects = params.objects.filter((item) =>
    params.selectionIds.includes(item.id),
  );

  params.context.save();
  params.context.translate(params.transform.offsetX, params.transform.offsetY);
  params.context.scale(params.transform.scale, params.transform.scale);
  params.context.strokeStyle = "#31d0ff";
  params.context.lineWidth = 1 / params.transform.scale;
  params.context.setLineDash([
    8 / params.transform.scale,
    6 / params.transform.scale,
  ]);

  for (const object of selectedObjects) {
    const path = shapeToPath({ shape: object.shape });

    if (object.shape.type === "line") {
      params.context.lineWidth =
        object.style.lineWidth / params.transform.scale;
      params.context.stroke(path);
      params.context.lineWidth = 1 / params.transform.scale;
      continue;
    }

    params.context.stroke(path);
  }

  params.context.restore();

  params.context.save();
  params.context.fillStyle = "#31d0ff";

  for (const object of selectedObjects) {
    const handles = getHandlePoints(object.shape);

    for (const handle of handles) {
      const screen = toScreenPoint({
        x: handle.point.x,
        y: handle.point.y,
        transform: params.transform,
      });

      params.context.beginPath();
      params.context.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
      params.context.fill();
    }
  }

  params.context.restore();
}

function drawPendingOverlay(params: {
  context: CanvasRenderingContext2D;
  pendingDraft: RedactionObject;
  transform: ViewportTransform;
}): void {
  params.context.save();
  params.context.translate(params.transform.offsetX, params.transform.offsetY);
  params.context.scale(params.transform.scale, params.transform.scale);
  params.context.setLineDash([
    6 / params.transform.scale,
    4 / params.transform.scale,
  ]);
  params.context.strokeStyle = "#f97316";
  params.context.fillStyle = "rgba(249, 115, 22, 0.24)";
  params.context.lineWidth = 1 / params.transform.scale;

  const path = shapeToPath({ shape: params.pendingDraft.shape });

  if (params.pendingDraft.shape.type === "line") {
    params.context.lineWidth =
      params.pendingDraft.style.lineWidth / params.transform.scale;
    params.context.stroke(path);
  } else {
    params.context.fill(path);
    params.context.lineWidth = 1 / params.transform.scale;
    params.context.stroke(path);
  }

  params.context.restore();
}

function drawImageAndObjects(params: {
  context: CanvasRenderingContext2D;
  image: ImageModel;
  objects: RedactionObject[];
}): void {
  params.context.imageSmoothingEnabled = true;
  params.context.drawImage(
    params.image.bitmap,
    0,
    0,
    params.image.width,
    params.image.height,
  );

  for (const object of params.objects) {
    drawObject({
      context: params.context,
      object,
      image: params.image,
    });
  }
}

export function renderCanvases(params: {
  canvases: CanvasPair;
  containerWidth: number;
  containerHeight: number;
  image: ImageModel | null;
  objects: RedactionObject[];
  options: RenderOptions;
}): ViewportTransform | null {
  const dpr = window.devicePixelRatio || 1;
  const baseContext = setupCanvas({
    canvas: params.canvases.base,
    width: params.containerWidth,
    height: params.containerHeight,
    dpr,
  });
  const overlayContext = setupCanvas({
    canvas: params.canvases.overlay,
    width: params.containerWidth,
    height: params.containerHeight,
    dpr,
  });

  if (!baseContext || !overlayContext) {
    return null;
  }

  clearContext({
    context: baseContext,
    width: params.containerWidth,
    height: params.containerHeight,
  });
  clearContext({
    context: overlayContext,
    width: params.containerWidth,
    height: params.containerHeight,
  });

  if (!params.image) {
    return null;
  }

  const transform = getViewportTransform({
    containerWidth: params.containerWidth,
    containerHeight: params.containerHeight,
    imageWidth: params.image.width,
    imageHeight: params.image.height,
  });

  baseContext.save();
  baseContext.translate(transform.offsetX, transform.offsetY);
  baseContext.scale(transform.scale, transform.scale);
  drawImageAndObjects({
    context: baseContext,
    image: params.image,
    objects: params.objects,
  });
  baseContext.restore();

  if (params.options.showSelection) {
    drawSelectedOverlay({
      context: overlayContext,
      objects: params.objects,
      selectionIds: params.options.selectionIds,
      transform,
    });
  }

  if (params.options.pendingDraft) {
    drawPendingOverlay({
      context: overlayContext,
      pendingDraft: params.options.pendingDraft,
      transform,
    });
  }

  return transform;
}

export function renderExportCanvas(params: {
  image: ImageModel;
  objects: RedactionObject[];
}): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = params.image.width;
  canvas.height = params.image.height;
  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
  });

  if (!context) {
    return canvas;
  }

  drawImageAndObjects({
    context,
    image: params.image,
    objects: params.objects,
  });

  return canvas;
}
