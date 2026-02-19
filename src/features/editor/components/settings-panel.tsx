"use client";

import { PaintBucket, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type {
  RedactionMode,
  StyleParams,
} from "@/features/editor/types/editor.types";

export function SettingsPanel(params: {
  style: StyleParams;
  hasSelection: boolean;
  onStyleChange: (style: StyleParams) => void;
  onApplySelectionStyle: () => void;
}): React.JSX.Element {
  const onModeChange = (mode: RedactionMode) => {
    params.onStyleChange({
      ...params.style,
      mode,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Redaction Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mode</Label>
          <Select
            value={params.style.mode}
            onValueChange={(value) => onModeChange(value as RedactionMode)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pixelate">Pixelated blur</SelectItem>
              <SelectItem value="fill">Solid color fill</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {params.style.mode === "pixelate" ? (
          <>
            <div className="space-y-2">
              <Label>
                Intensity (block size): {params.style.pixelate.blockSize}px
              </Label>
              <Slider
                min={2}
                max={96}
                step={1}
                value={[params.style.pixelate.blockSize]}
                onValueChange={([value]) => {
                  params.onStyleChange({
                    ...params.style,
                    pixelate: {
                      ...params.style.pixelate,
                      blockSize: value,
                    },
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Opacity: {Math.round(params.style.pixelate.alpha * 100)}%
              </Label>
              <Slider
                min={10}
                max={100}
                step={1}
                value={[Math.round(params.style.pixelate.alpha * 100)]}
                onValueChange={([value]) => {
                  params.onStyleChange({
                    ...params.style,
                    pixelate: {
                      ...params.style.pixelate,
                      alpha: value / 100,
                    },
                  });
                }}
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              type="color"
              value={params.style.fill.color}
              onChange={(event) => {
                params.onStyleChange({
                  ...params.style,
                  fill: {
                    color: event.target.value,
                  },
                });
              }}
              className="h-10 w-full cursor-pointer"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Line width: {params.style.lineWidth}px</Label>
          <Slider
            min={1}
            max={128}
            step={1}
            value={[params.style.lineWidth]}
            onValueChange={([value]) => {
              params.onStyleChange({
                ...params.style,
                lineWidth: value,
              });
            }}
          />
        </div>

        <Button
          type="button"
          className="w-full gap-2"
          variant="secondary"
          onClick={params.onApplySelectionStyle}
          disabled={!params.hasSelection}
        >
          <PaintBucket className="size-4" />
          Apply To Selected
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Puzzle className="size-3" />
          Ctrl/Cmd+Enter also applies current style
        </div>
      </CardContent>
    </Card>
  );
}
