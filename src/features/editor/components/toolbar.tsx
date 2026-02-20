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
import { Button } from "@/components/ui/8bit/button";
import { Separator } from "@/components/ui/8bit/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/8bit/toggle-group";
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

function isToolType(value: string): value is ToolType {
  return (
    value === "select" ||
    value === "rect" ||
    value === "ellipse" ||
    value === "line" ||
    value === "freehand"
  );
}

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
    <div className="retro flex flex-wrap items-center gap-2 border-x-6 border-y-6 border-foreground bg-card p-1.5 dark:border-ring">
      <ToggleGroup
        type="multiple"
        value={[params.tool]}
        variant="outline"
        className="flex min-w-0 flex-wrap gap-1.5"
        onValueChange={(values) => {
          const nextValue =
            values.find((value) => value !== params.tool) ?? values[0];

          if (!nextValue || !isToolType(nextValue)) {
            return;
          }

          params.onToolChange(nextValue);
        }}
      >
        {TOOL_OPTIONS.map((tool) => {
          const Icon = tool.icon;

          return (
            <ToggleGroupItem
              key={tool.id}
              type="button"
              aria-label={tool.label}
              value={tool.id}
              variant="outline"
              className={cn(
                "h-8 gap-1 px-2 text-[10px]",
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {tool.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <Separator orientation="vertical" className="mx-1 h-7" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 p-0"
        disabled={!params.canUndo}
        onClick={params.onUndo}
      >
        <Undo2 className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 p-0"
        disabled={!params.canRedo}
        onClick={params.onRedo}
      >
        <Redo2 className="size-3.5" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-7" />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1 px-2.5 text-[10px]"
        onClick={params.onExport}
      >
        <Download className="size-3.5" />
        Export PNG
      </Button>

      <div
        className="ml-auto flex max-w-[180px] flex-wrap items-center justify-end gap-1 text-right text-[9px] leading-tight text-muted-foreground md:max-w-none"
        title="Ctrl/Cmd+Z, Y, C, V"
      >
        <Move className="size-3" />
        <span>Ctrl/Cmd+Z, Y, C, V</span>
      </div>
    </div>
  );
}
