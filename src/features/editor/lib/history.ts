import type {
  HistoryCommand,
  HistoryState,
  RedactionObject,
} from "@/features/editor/types/editor.types";

function cloneObjects(objects: RedactionObject[]): RedactionObject[] {
  return objects.map((item) => structuredClone(item));
}

export function createHistoryCommand(params: {
  type: HistoryCommand["type"];
  before: RedactionObject[];
  after: RedactionObject[];
}): HistoryCommand | null {
  const before = cloneObjects(params.before);
  const after = cloneObjects(params.after);

  if (JSON.stringify(before) === JSON.stringify(after)) {
    return null;
  }

  return {
    type: params.type,
    before,
    after,
  };
}

export function pushHistory(params: {
  history: HistoryState;
  command: HistoryCommand;
}): HistoryState {
  const undo = [...params.history.undo, params.command];
  const slicedUndo = undo.slice(
    Math.max(0, undo.length - params.history.limit),
  );

  return {
    ...params.history,
    undo: slicedUndo,
    redo: [],
  };
}

export function canUndo(history: HistoryState): boolean {
  return history.undo.length > 0;
}

export function canRedo(history: HistoryState): boolean {
  return history.redo.length > 0;
}

export function undoHistory(params: {
  history: HistoryState;
  currentObjects: RedactionObject[];
}): { history: HistoryState; objects: RedactionObject[] } {
  const last = params.history.undo.at(-1);

  if (!last) {
    return {
      history: params.history,
      objects: params.currentObjects,
    };
  }

  return {
    history: {
      ...params.history,
      undo: params.history.undo.slice(0, -1),
      redo: [...params.history.redo, last],
    },
    objects: cloneObjects(last.before),
  };
}

export function redoHistory(params: {
  history: HistoryState;
  currentObjects: RedactionObject[];
}): { history: HistoryState; objects: RedactionObject[] } {
  const last = params.history.redo.at(-1);

  if (!last) {
    return {
      history: params.history,
      objects: params.currentObjects,
    };
  }

  return {
    history: {
      ...params.history,
      undo: [...params.history.undo, last],
      redo: params.history.redo.slice(0, -1),
    },
    objects: cloneObjects(last.after),
  };
}
