"use client";

import { useCallback, useMemo, useReducer } from "react";
import { useLocalPreferences } from "@/features/editor/hooks/use-local-preferences";
import {
  duplicateObjectsWithOffset,
  serializeShapeClipboard,
} from "@/features/editor/lib/clipboard";
import {
  editorReducer,
  initialEditorState,
} from "@/features/editor/lib/reducer";
import { renderExportCanvas } from "@/features/editor/lib/render";
import type {
  CommandType,
  ImageModel,
  RedactionObject,
  ShapeClipboardPayload,
  ShapeGeometry,
  StyleParams,
  ToolType,
} from "@/features/editor/types/editor.types";

function createRedactionObject(params: {
  shape: ShapeGeometry;
  style: StyleParams;
}): RedactionObject {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    shape: structuredClone(params.shape),
    style: structuredClone(params.style),
    visible: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function useEditor() {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const canUndo = state.history.undo.length > 0;
  const canRedo = state.history.redo.length > 0;

  const selectedObjects = useMemo(
    () =>
      state.document.objects.filter((item) =>
        state.document.selectedIds.includes(item.id),
      ),
    [state.document.objects, state.document.selectedIds],
  );

  const setTool = useCallback((tool: ToolType) => {
    dispatch({ type: "setTool", tool });
  }, []);

  const setStyle = useCallback((style: StyleParams) => {
    dispatch({ type: "setStyle", style });
  }, []);

  const updateStyle = useCallback(
    (updater: (current: StyleParams) => StyleParams) => {
      const next = updater(state.style);
      dispatch({ type: "setStyle", style: next });
    },
    [state.style],
  );

  useLocalPreferences({
    tool: state.tool,
    style: state.style,
    onLoad: (tool, style) => {
      dispatch({ type: "setTool", tool });
      dispatch({ type: "setStyle", style });
    },
  });

  const setImage = useCallback((image: ImageModel) => {
    dispatch({ type: "setImage", image });
  }, []);

  const setSelection = useCallback((selectedIds: string[]) => {
    dispatch({ type: "setSelection", selectedIds });
  }, []);

  const setPendingShape = useCallback(
    (shape: ShapeGeometry | null) => {
      if (!shape) {
        dispatch({ type: "setPendingDraft", draft: null });
        return;
      }

      const currentPending = state.document.pendingDraft;

      if (currentPending) {
        dispatch({
          type: "setPendingDraft",
          draft: {
            ...currentPending,
            shape: structuredClone(shape),
            style: structuredClone(state.style),
            updatedAt: Date.now(),
          },
        });
        return;
      }

      dispatch({
        type: "setPendingDraft",
        draft: createRedactionObject({
          shape,
          style: state.style,
        }),
      });
    },
    [state.document.pendingDraft, state.style],
  );

  const cancelPending = useCallback(() => {
    dispatch({ type: "setPendingDraft", draft: null });
  }, []);

  const setObjectsTransient = useCallback((objects: RedactionObject[]) => {
    dispatch({ type: "setObjectsTransient", objects });
  }, []);

  const commitObjects = useCallback(
    (params: {
      before: RedactionObject[];
      after: RedactionObject[];
      command: CommandType;
    }) => {
      dispatch({
        type: "commitObjects",
        before: params.before,
        after: params.after,
        command: params.command,
      });
    },
    [],
  );

  const deleteSelected = useCallback(() => {
    dispatch({ type: "deleteSelected" });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "redo" });
  }, []);

  const applyStyleToSelection = useCallback(() => {
    dispatch({ type: "applyStyleToSelection" });
  }, []);

  const setShapeClipboard = useCallback(
    (clipboard: ShapeClipboardPayload | null) => {
      dispatch({ type: "setClipboard", clipboard });
    },
    [],
  );

  const copySelection = useCallback(() => {
    if (!selectedObjects.length) {
      return null;
    }

    const raw = serializeShapeClipboard(selectedObjects);

    dispatch({
      type: "setClipboard",
      clipboard: {
        version: 1,
        objects: selectedObjects,
      },
    });

    return raw;
  }, [selectedObjects]);

  const pasteClipboardObjects = useCallback(
    (objects: RedactionObject[]) => {
      const before = state.document.objects;
      const duplicated = duplicateObjectsWithOffset({ objects });
      const after = [...before, ...duplicated];

      dispatch({
        type: "commitObjects",
        before,
        after,
        command: "add",
      });
      dispatch({
        type: "setPlacingIds",
        ids: duplicated.map((item) => item.id),
      });

      return duplicated;
    },
    [state.document.objects],
  );

  const clearPlacing = useCallback(() => {
    dispatch({ type: "clearPlacingIds" });
  }, []);

  const exportImage = useCallback(async (): Promise<Blob | null> => {
    if (!state.document.image) {
      return null;
    }

    const canvas = renderExportCanvas({
      image: state.document.image,
      objects: state.document.objects,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }, [state.document.image, state.document.objects]);

  return {
    state,
    canUndo,
    canRedo,
    selectedObjects,
    setTool,
    setStyle,
    updateStyle,
    setImage,
    setSelection,
    setPendingShape,
    cancelPending,
    setObjectsTransient,
    commitObjects,
    deleteSelected,
    undo,
    redo,
    applyStyleToSelection,
    setShapeClipboard,
    copySelection,
    pasteClipboardObjects,
    clearPlacing,
    exportImage,
  };
}
