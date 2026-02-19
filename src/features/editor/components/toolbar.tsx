"use client";

import {
  Circle,
  Download,
  Hand,
  Minus,
  MousePointer2,
  Move,
  Redo2,
  Square,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ToolType } from "@/features/editor/types/editor.types";
import { cn } from "@/lib/utils";

const TOOL_OPTIONS: Array<{
  id: ToolType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "rect", label: "Rectangle", icon: Square },
  { id: "ellipse", label: "Ellipse", icon: Circle },
  { id: "line", label: "Line", icon: Minus },
  { id: "freehand", label: "Freehand", icon: Hand },
];

export function Toolbar(params: {
  tool: ToolType;
  onToolChange: (tool: ToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
      {TOOL_OPTIONS.map((tool) => {
        const Icon = tool.icon;

        return (
          <Button
            key={tool.id}
            type="button"
            variant={params.tool === tool.id ? "default" : "secondary"}
            size="sm"
            className={cn("gap-2", params.tool === tool.id ? "" : "opacity-80")}
            onClick={() => params.onToolChange(tool.id)}
          >
            <Icon className="size-4" />
            {tool.label}
          </Button>
        );
      })}

      <Separator orientation="vertical" className="mx-1 h-7" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!params.canUndo}
        onClick={params.onUndo}
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!params.canRedo}
        onClick={params.onRedo}
      >
        <Redo2 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-7" />

      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={params.onExport}
      >
        <Download className="size-4" />
        Export PNG
      </Button>

      <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        <Move className="size-3" />
        Ctrl/Cmd+Z, Y, C, V
      </div>
    </div>
  );
}
