"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PendingActionBar(params: {
  visible: boolean;
  onApply: () => void;
  onCancel: () => void;
}): React.JSX.Element | null {
  if (!params.visible) {
    return null;
  }

  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-lg">
      <Button
        type="button"
        size="sm"
        className="gap-2"
        onClick={params.onApply}
      >
        <Check className="size-4" />
        Apply
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={params.onCancel}
      >
        <X className="size-4" />
        Cancel
      </Button>
    </div>
  );
}
