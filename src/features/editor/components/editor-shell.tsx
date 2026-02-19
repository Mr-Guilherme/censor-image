"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CanvasViewport } from "@/features/editor/components/canvas-viewport";
import { ImportSurface } from "@/features/editor/components/import-surface";
import { ObjectsPanel } from "@/features/editor/components/objects-panel";
import { SettingsPanel } from "@/features/editor/components/settings-panel";
import { Toolbar } from "@/features/editor/components/toolbar";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { useImagePaste } from "@/features/editor/hooks/use-image-paste";
import { useKeyboardShortcuts } from "@/features/editor/hooks/use-keyboard-shortcuts";
import {
  imageFileToModel,
  pickFirstImageFile,
} from "@/features/editor/lib/image-import";
import type { ImageModel } from "@/features/editor/types/editor.types";

function sanitizeExportName(name: string): string {
  const basename = name.replace(/\.[^/.]+$/, "");

  if (!basename.trim()) {
    return "censored-image";
  }

  return basename.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
}

export function EditorShell(): React.JSX.Element {
  const editor = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importImage = async (image: ImageModel) => {
    if (
      editor.state.document.image &&
      editor.state.document.objects.length > 0 &&
      !window.confirm("Replace current image and discard existing redactions?")
    ) {
      return;
    }

    editor.setImage(image);
  };

  const importFromFiles = async (files: FileList | File[]) => {
    const imageFile = pickFirstImageFile(files);

    if (!imageFile) {
      return;
    }

    const image = await imageFileToModel(imageFile);
    await importImage(image);
  };

  useKeyboardShortcuts({
    enabled: true,
    onUndo: editor.undo,
    onRedo: editor.redo,
    onDelete: editor.deleteSelected,
    onEscape: () => {
      if (editor.state.document.pendingDraft) {
        editor.cancelPending();
        return;
      }

      if (editor.state.placingIds.length) {
        editor.clearPlacing();
      }

      if (editor.state.document.selectedIds.length) {
        editor.setSelection([]);
      }
    },
    onStyleApply: editor.applyStyleToSelection,
  });

  useImagePaste({
    enabled: true,
    onImagePaste: (image) => {
      void importImage(image);
    },
    onShapesPaste: (payload) => {
      editor.setShapeClipboard(payload);
      editor.pasteClipboardObjects(payload.objects);
    },
    onCopyRequest: editor.copySelection,
    fallbackClipboard: editor.state.shapeClipboard,
  });

  const onExport = async () => {
    const blob = await editor.exportImage();

    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const sourceName = editor.state.document.image?.name ?? "image";
    anchor.href = url;
    anchor.download = `${sanitizeExportName(sourceName)}-censored.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:px-6">
      <header className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-2">
        <div className="text-sm font-medium tracking-wide">Image Censor</div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              if (!event.target.files) {
                return;
              }

              void importFromFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Import image
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!editor.state.document.selectedIds.length}
            onClick={editor.deleteSelected}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      <Toolbar
        tool={editor.state.tool}
        onToolChange={editor.setTool}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onExport={onExport}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        {!editor.state.document.image ? (
          <ImportSurface onFiles={(files) => void importFromFiles(files)} />
        ) : (
          <section className="relative flex min-h-[640px] flex-col rounded-xl border border-border bg-card p-3">
            <CanvasViewport
              image={editor.state.document.image}
              objects={editor.state.document.objects}
              selectedIds={editor.state.document.selectedIds}
              pendingDraft={editor.state.document.pendingDraft}
              tool={editor.state.tool}
              styleLineWidth={editor.state.style.lineWidth}
              placingIds={editor.state.placingIds}
              onSelection={editor.setSelection}
              onPendingShape={editor.setPendingShape}
              onObjectsTransient={editor.setObjectsTransient}
              onCommit={editor.commitObjects}
              onClearPlacing={editor.clearPlacing}
            />
          </section>
        )}

        <aside className="grid auto-rows-max gap-4">
          <SettingsPanel
            style={editor.state.style}
            hasSelection={editor.state.document.selectedIds.length > 0}
            onStyleChange={editor.setStyle}
            onApplySelectionStyle={editor.applyStyleToSelection}
          />
          <Separator />
          <ObjectsPanel
            objects={editor.state.document.objects}
            selectedIds={editor.state.document.selectedIds}
            onSelectionChange={editor.setSelection}
            onDeleteSelected={editor.deleteSelected}
          />
        </aside>
      </div>
    </div>
  );
}
