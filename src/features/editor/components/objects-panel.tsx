"use client";

import { ArrowDownToLine, ArrowUpToLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { ScrollArea } from "@/components/ui/8bit/scroll-area";
import type { RedactionObject } from "@/features/editor/types/editor.types";
import { cn } from "@/lib/utils";

function objectLabel(object: RedactionObject): string {
  if (object.shape.type === "rect") {
    return "Rectangle";
  }

  if (object.shape.type === "ellipse") {
    return "Ellipse";
  }

  if (object.shape.type === "line") {
    return "Line";
  }

  return "Freehand";
}

function objectModeLabel(object: RedactionObject): string {
  if (object.kind === "markup") {
    return "mark";
  }

  if (object.style.mode === "fill") {
    return "solid fill";
  }

  return "pixelate";
}

export function ObjectsPanel(params: {
  objects: RedactionObject[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDeleteSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}): React.JSX.Element {
  const sorted = [...params.objects].reverse();
  const hasSelection = params.selectedIds.length > 0;

  return (
    <Card className="h-full min-w-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[10px] uppercase">Objects</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!hasSelection}
            onClick={params.onSendToBack}
            title="Send to back"
          >
            <ArrowDownToLine className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!hasSelection}
            onClick={params.onBringToFront}
            title="Bring to front"
          >
            <ArrowUpToLine className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!hasSelection}
            onClick={params.onDeleteSelected}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[210px] pr-2">
          <div className="space-y-2">
            {sorted.map((object) => {
              const selected = params.selectedIds.includes(object.id);

              return (
                <button
                  key={object.id}
                  type="button"
                  data-testid="object-item"
                  data-selected={selected}
                  className={cn(
                    "retro w-full border-x-4 border-y-4 px-2.5 py-1.5 text-left text-[10px] transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground dark:border-primary"
                      : "border-foreground bg-background hover:bg-muted dark:border-ring",
                  )}
                  onClick={(event) => {
                    if (event.shiftKey) {
                      const next = new Set(params.selectedIds);

                      if (next.has(object.id)) {
                        next.delete(object.id);
                      } else {
                        next.add(object.id);
                      }

                      params.onSelectionChange(Array.from(next));
                      return;
                    }

                    params.onSelectionChange([object.id]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{objectLabel(object)}</span>
                    <span className="text-xs text-muted-foreground">
                      {objectModeLabel(object)}
                    </span>
                  </div>
                </button>
              );
            })}
            {!sorted.length && (
              <p className="text-xs text-muted-foreground">No objects yet.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
