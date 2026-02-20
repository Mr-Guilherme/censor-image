# Playwright Smoke Checklist

1. Open app on `http://localhost:3000`.
2. Load wide fixture image.
3. Draw redaction rectangles near all four corners.
4. Export PNG and validate edge redactions are aligned between preview and export.
5. Reload and repeat with tall fixture image.
6. Load text-heavy fixture image in `Pixelate` mode.
7. Set `Pixelation Strength` to a higher value and draw one large rectangle over text lines.
8. Export PNG and validate sampled grid metrics inside the region:
   - region is not flat (variance threshold)
   - repeated adjacent samples indicate mosaic blocks
9. Confirm preview/export alignment checks pass and downloads are triggered.
