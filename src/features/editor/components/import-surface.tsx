"use client";

import { ImageUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ImportSurface(params: {
  onFiles: (files: FileList | File[]) => void;
  className?: string;
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <button
      type="button"
      aria-label="Import image area"
      className={cn(
        "retro flex h-full min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center border-2 border-dashed p-6 text-center transition-colors",
        dragging
          ? "border-primary bg-primary/15"
          : "border-foreground bg-card dark:border-ring",
        params.className,
      )}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        params.onFiles(event.dataTransfer.files);
      }}
    >
      <ImageUp className="mb-2 size-7 text-primary" />
      <h2 className="text-xs font-medium uppercase">
        Import an image to start censoring
      </h2>
      <p className="mt-2 max-w-md text-[10px] text-muted-foreground">
        Use file picker, drag and drop, or paste an image with Ctrl/Cmd+V.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          if (!event.target.files) {
            return;
          }

          params.onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <span className="mt-3 inline-flex items-center gap-1 border-2 border-foreground bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground dark:border-ring">
        <Upload className="size-3" />
        Choose Image
      </span>
    </button>
  );
}
