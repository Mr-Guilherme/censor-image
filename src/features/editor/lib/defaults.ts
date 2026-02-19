import type {
  HistoryState,
  PreferencesV1,
  StyleParams,
  ToolType,
} from "@/features/editor/types/editor.types";

export const STORAGE_KEY_PREFERENCES = "image-censor.preferences";

export const DEFAULT_TOOL: ToolType = "select";

export const DEFAULT_STYLE: StyleParams = {
  mode: "pixelate",
  pixelate: {
    blockSize: 12,
    alpha: 0.9,
  },
  fill: {
    color: "#000000",
  },
  lineWidth: 24,
};

export const DEFAULT_PREFERENCES: PreferencesV1 = {
  version: 1,
  defaultStyle: DEFAULT_STYLE,
  defaultTool: DEFAULT_TOOL,
};

export const DEFAULT_HISTORY: HistoryState = {
  undo: [],
  redo: [],
  limit: 100,
};
