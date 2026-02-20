"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/8bit/button";
import { Separator } from "@/components/ui/8bit/separator";
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
      !window.confirm("Replace current image and discard existing objects?")
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
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-3 px-3 py-3 text-sm md:px-5 md:py-4">
      <header className="retro flex flex-wrap items-center justify-between gap-2 border-x-6 border-y-6 border-foreground bg-card px-2.5 py-2 dark:border-ring">
        <div className="text-xs font-medium tracking-wide uppercase">
          Pixelate
        </div>
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
            size="sm"
            className="gap-1.5 px-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-3.5" />
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

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
        <section className="relative flex min-h-[640px] min-w-0 flex-col border-x-6 border-y-6 border-foreground bg-card p-3 dark:border-ring">
          {!editor.state.document.image ? (
            <ImportSurface
              className="h-full min-h-0 flex-1"
              onFiles={(files) => void importFromFiles(files)}
            />
          ) : (
            <CanvasViewport
              image={editor.state.document.image}
              objects={editor.state.document.objects}
              selectedIds={editor.state.document.selectedIds}
              pendingDraft={editor.state.document.pendingDraft}
              tool={editor.state.tool}
              style={editor.style}
              styleLineWidth={
                editor.style.mode === "mark"
                  ? editor.style.markup.strokeWidth
                  : editor.style.lineWidth
              }
              placingIds={editor.state.placingIds}
              onSelection={editor.setSelection}
              onPendingShape={editor.setPendingShape}
              onAddObject={editor.addObject}
              onObjectsTransient={editor.setObjectsTransient}
              onCommit={editor.commitObjects}
              onClearPlacing={editor.clearPlacing}
            />
          )}
        </section>

        <aside className="grid min-w-0 auto-rows-max gap-3">
          <SettingsPanel
            style={editor.style}
            hasSelection={editor.state.document.selectedIds.length > 0}
            onStylePreviewChange={editor.setStylePreview}
            onStyleChange={editor.setStyle}
            onApplySelectionStyle={editor.applyStyleToSelection}
          />
          <Separator className="my-1" />
          <ObjectsPanel
            objects={editor.state.document.objects}
            selectedIds={editor.state.document.selectedIds}
            onSelectionChange={editor.setSelection}
            onDeleteSelected={editor.deleteSelected}
            onBringToFront={editor.bringSelectionToFront}
            onSendToBack={editor.sendSelectionToBack}
          />
        </aside>
      </div>
    </div>
  );
}
