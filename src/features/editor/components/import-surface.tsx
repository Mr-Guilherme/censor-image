"use client";

import { ImageUp, Upload } from "lucide-react";
import { useRef, useState } from "react";

export function ImportSurface(params: {
  onFiles: (files: FileList | File[]) => void;
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <button
      type="button"
      aria-label="Import image area"
      className={`flex h-full min-h-[320px] w-full flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-colors ${
        dragging ? "border-primary bg-primary/10" : "border-border bg-card"
      }`}
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
      <ImageUp className="mb-3 size-10 text-primary" />
      <h2 className="text-lg font-medium">
        Import an image to start censoring
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
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
      <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        <Upload className="size-4" />
        Choose Image
      </span>
    </button>
  );
}
