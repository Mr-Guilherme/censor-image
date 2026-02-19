"use client";

import { useEffect, useRef } from "react";
import {
  loadPreferences,
  savePreferences,
} from "@/features/editor/lib/persistence";
import type {
  StyleParams,
  ToolType,
} from "@/features/editor/types/editor.types";

export function useLocalPreferences(params: {
  tool: ToolType;
  style: StyleParams;
  onLoad: (tool: ToolType, style: StyleParams) => void;
}): void {
  const hasLoadedRef = useRef(false);
  const onLoadRef = useRef(params.onLoad);

  useEffect(() => {
    onLoadRef.current = params.onLoad;
  }, [params.onLoad]);

  useEffect(() => {
    const preferences = loadPreferences();
    onLoadRef.current(preferences.defaultTool, preferences.defaultStyle);
    hasLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      savePreferences({
        version: 1,
        defaultTool: params.tool,
        defaultStyle: params.style,
      });
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [params.style, params.tool]);
}
