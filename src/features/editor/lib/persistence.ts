import {
  DEFAULT_PREFERENCES,
  STORAGE_KEY_PREFERENCES,
} from "@/features/editor/lib/defaults";
import type {
  PreferencesV1,
  StyleParams,
  ToolType,
} from "@/features/editor/types/editor.types";

function isValidTool(tool: unknown): tool is ToolType {
  return ["select", "rect", "ellipse", "line", "freehand"].includes(
    String(tool),
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isStyle(style: unknown): style is StyleParams {
  if (!style || typeof style !== "object") {
    return false;
  }

  const candidate = style as Partial<StyleParams>;

  if (!candidate.mode || !["pixelate", "fill"].includes(candidate.mode)) {
    return false;
  }

  if (!candidate.pixelate || typeof candidate.pixelate !== "object") {
    return false;
  }

  if (!candidate.fill || typeof candidate.fill !== "object") {
    return false;
  }

  return true;
}

function normalizeStyle(style: StyleParams): StyleParams {
  return {
    mode: style.mode,
    pixelate: {
      blockSize: clamp(Math.round(style.pixelate.blockSize), 2, 128),
      alpha: clamp(style.pixelate.alpha, 0.1, 1),
    },
    fill: {
      color: /^#[0-9a-f]{6}$/i.test(style.fill.color)
        ? style.fill.color
        : DEFAULT_PREFERENCES.defaultStyle.fill.color,
    },
    lineWidth: clamp(Math.round(style.lineWidth), 1, 200),
  };
}

function isPreferencesV1(value: unknown): value is PreferencesV1 {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PreferencesV1>;

  if (candidate.version !== 1) {
    return false;
  }

  if (!isStyle(candidate.defaultStyle)) {
    return false;
  }

  return isValidTool(candidate.defaultTool);
}

export function loadPreferences(): PreferencesV1 {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY_PREFERENCES);

  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isPreferencesV1(parsed)) {
      return DEFAULT_PREFERENCES;
    }

    return {
      version: 1,
      defaultTool: parsed.defaultTool,
      defaultStyle: normalizeStyle(parsed.defaultStyle),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: PreferencesV1): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: PreferencesV1 = {
    version: 1,
    defaultTool: preferences.defaultTool,
    defaultStyle: normalizeStyle(preferences.defaultStyle),
  };

  window.localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(payload));
}
