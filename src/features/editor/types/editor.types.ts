export type ToolType = "select" | "rect" | "ellipse" | "line" | "freehand";

export type RedactionMode = "pixelate" | "fill";

export interface Point {
  x: number;
  y: number;
}

export interface PixelateParams {
  blockSize: number;
  alpha: number;
}

export interface FillParams {
  color: string;
}

export interface StyleParams {
  mode: RedactionMode;
  pixelate: PixelateParams;
  fill: FillParams;
  lineWidth: number;
}

export interface RectGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EllipseGeometry {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface LineGeometry {
  from: Point;
  to: Point;
  width: number;
}

export interface FreehandGeometry {
  points: Point[];
  closed: true;
}

export type ShapeGeometry =
  | { type: "rect"; data: RectGeometry }
  | { type: "ellipse"; data: EllipseGeometry }
  | { type: "line"; data: LineGeometry }
  | { type: "freehand"; data: FreehandGeometry };

export interface RedactionObject {
  id: string;
  shape: ShapeGeometry;
  style: StyleParams;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ImageModel {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  name: string;
}

export interface EditorDocument {
  image: ImageModel | null;
  objects: RedactionObject[];
  selectedIds: string[];
  pendingDraft: RedactionObject | null;
}

export type CommandType = "add" | "delete" | "update";

export interface HistoryCommand {
  type: CommandType;
  before: RedactionObject[];
  after: RedactionObject[];
}

export interface HistoryState {
  undo: HistoryCommand[];
  redo: HistoryCommand[];
  limit: number;
}

export interface ShapeClipboardPayload {
  version: 1;
  objects: RedactionObject[];
}

export interface PreferencesV1 {
  version: 1;
  defaultStyle: StyleParams;
  defaultTool: ToolType;
}

export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface HitResult {
  objectId: string;
  kind: "body" | "handle";
  handle?: ResizeHandle;
}

export type ResizeHandle =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw"
  | "start"
  | "end";

export interface HandlePoint {
  handle: ResizeHandle;
  point: Point;
}

export interface RenderOptions {
  showSelection: boolean;
  selectionIds: string[];
  pendingDraft: RedactionObject | null;
}
