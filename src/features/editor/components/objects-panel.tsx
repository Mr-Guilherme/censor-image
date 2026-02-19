"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function ObjectsPanel(params: {
  objects: RedactionObject[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDeleteSelected: () => void;
}): React.JSX.Element {
  const sorted = [...params.objects].reverse();

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Objects</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!params.selectedIds.length}
          onClick={params.onDeleteSelected}
        >
          <Trash2 className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[220px] pr-3">
          <div className="space-y-2">
            {sorted.map((object) => {
              const selected = params.selectedIds.includes(object.id);

              return (
                <button
                  key={object.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted",
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
                      {object.style.mode}
                    </span>
                  </div>
                </button>
              );
            })}
            {!sorted.length && (
              <p className="text-xs text-muted-foreground">
                No redaction objects yet.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
