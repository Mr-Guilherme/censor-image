export function pixelateImageData(params: {
  source: ImageData;
  blockSize: number;
}): ImageData {
  const blockSize = Math.max(2, Math.floor(params.blockSize));
  const { width, height, data } = params.source;
  const output = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;
      let count = 0;

      for (let offsetY = 0; offsetY < blockSize; offsetY += 1) {
        const currentY = y + offsetY;

        if (currentY >= height) {
          break;
        }

        for (let offsetX = 0; offsetX < blockSize; offsetX += 1) {
          const currentX = x + offsetX;

          if (currentX >= width) {
            break;
          }

          const index = (currentY * width + currentX) * 4;
          red += data[index];
          green += data[index + 1];
          blue += data[index + 2];
          alpha += data[index + 3];
          count += 1;
        }
      }

      if (!count) {
        continue;
      }

      const blockRed = Math.round(red / count);
      const blockGreen = Math.round(green / count);
      const blockBlue = Math.round(blue / count);
      const blockAlpha = Math.round(alpha / count);

      for (let offsetY = 0; offsetY < blockSize; offsetY += 1) {
        const currentY = y + offsetY;

        if (currentY >= height) {
          break;
        }

        for (let offsetX = 0; offsetX < blockSize; offsetX += 1) {
          const currentX = x + offsetX;

          if (currentX >= width) {
            break;
          }

          const index = (currentY * width + currentX) * 4;
          output[index] = blockRed;
          output[index + 1] = blockGreen;
          output[index + 2] = blockBlue;
          output[index + 3] = blockAlpha;
        }
      }
    }
  }

  return new ImageData(output, width, height);
}
