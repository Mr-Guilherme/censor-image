import type { ImageModel } from "@/features/editor/types/editor.types";

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export async function imageFileToModel(file: File): Promise<ImageModel> {
  const bitmap = await fileToBitmap(file);

  return {
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    name: file.name,
  };
}

export function pickFirstImageFile(files: FileList | File[]): File | null {
  const list = Array.from(files);

  for (const file of list) {
    if (file.type.startsWith("image/")) {
      return file;
    }
  }

  return null;
}

export async function imageFromClipboardItems(
  items: DataTransferItemList,
): Promise<ImageModel | null> {
  for (const item of Array.from(items)) {
    if (!item.type.startsWith("image/")) {
      continue;
    }

    const file = item.getAsFile();

    if (!file) {
      continue;
    }

    return imageFileToModel(file);
  }

  return null;
}
