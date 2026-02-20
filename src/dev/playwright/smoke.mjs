#!/usr/bin/env node
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../../..");
const outputDir = path.join(workspaceRoot, "output", "playwright");
const docsDir = path.join(workspaceRoot, "docs");
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const CASES = [
  {
    name: "wide",
    file: path.join(workspaceRoot, "tests", "fixtures", "wide-image.png"),
    width: 1200,
    height: 600,
  },
  {
    name: "tall",
    file: path.join(workspaceRoot, "tests", "fixtures", "tall-image.png"),
    width: 600,
    height: 1200,
  },
];

const EDGE_RECTS = [
  {
    name: "top-left",
    start: { x: 0.01, y: 0.01 },
    end: { x: 0.2, y: 0.2 },
  },
  {
    name: "top-right",
    start: { x: 0.8, y: 0.01 },
    end: { x: 0.99, y: 0.2 },
  },
  {
    name: "bottom-left",
    start: { x: 0.01, y: 0.8 },
    end: { x: 0.2, y: 0.99 },
  },
  {
    name: "bottom-right",
    start: { x: 0.8, y: 0.8 },
    end: { x: 0.99, y: 0.99 },
  },
];

const PIXELATE_CASE = {
  name: "text-heavy",
  file: path.join(workspaceRoot, "tests", "fixtures", "text-heavy.png"),
  width: 1238,
  height: 432,
  region: {
    xMin: 0.05,
    yMin: 0.2,
    xMax: 0.95,
    yMax: 0.92,
  },
};

const MARKUP_CASE = {
  name: "markup",
  file: path.join(workspaceRoot, "tests", "fixtures", "wide-image.png"),
  width: 1200,
  height: 600,
};

async function clickModeTab(page, name) {
  const tab = page.getByRole("tab", { name });

  if (await tab.count()) {
    await tab.first().click();
    return;
  }

  await page.getByRole("button", { name }).click();
}

async function assertModeTabsStable(page, contextLabel) {
  const labels = ["Pixelate", "Solid", "Mark"];

  for (const label of labels) {
    const tab = page.getByRole("tab", { name: label });

    if (!(await tab.count())) {
      throw new Error(`${contextLabel} missing mode tab: ${label}`);
    }

    if (!(await tab.first().isVisible())) {
      throw new Error(`${contextLabel} mode tab is not visible: ${label}`);
    }
  }

  const selectCount = await page.evaluate(() => {
    const settingsCard = Array.from(
      document.querySelectorAll('[data-slot="card"]'),
    ).find((card) => card.textContent?.includes("Redaction Settings"));

    if (!settingsCard) {
      throw new Error("Settings panel card not found.");
    }

    return settingsCard.querySelectorAll("select").length;
  });

  if (selectCount !== 0) {
    throw new Error(
      `${contextLabel} expected no select controls in settings panel, found ${selectCount}.`,
    );
  }
}

async function runModeTabsReloadCase(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByText("Redaction Settings").waitFor();
  await assertModeTabsStable(page, "mode-tabs initial");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Redaction Settings").waitFor();
  await assertModeTabsStable(page, "mode-tabs reload");
}

async function dragSliderThumb(page, slider) {
  const thumb = slider.locator('[data-slot="slider-thumb"]').first();
  const sliderBox = await slider.boundingBox();
  const thumbBox = await thumb.boundingBox();

  if (!sliderBox || !thumbBox) {
    throw new Error("Slider bounds are unavailable.");
  }

  const y = thumbBox.y + thumbBox.height / 2;
  const startX = thumbBox.x + thumbBox.width / 2;
  const endX = sliderBox.x + sliderBox.width - 8;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, {
    steps: 24,
  });
  await page.mouse.up();
}

async function runSliderCommitCase(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByText("Redaction Settings").waitFor();
  await assertModeTabsStable(page, "slider-case initial");
  await clickModeTab(page, "Pixelate");
  const initial = await page.getByTestId("blur-intensity-input").inputValue();

  const slider = page.locator('[data-slot="slider"]').first();
  await dragSliderThumb(page, slider);

  await page.waitForTimeout(200);
  const committed = await page.getByTestId("blur-intensity-input").inputValue();

  if (!committed.trim() || committed === initial) {
    throw new Error("Slider drag did not update blur intensity value.");
  }

  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Redaction Settings").waitFor();
  await assertModeTabsStable(page, "slider-case reload");
  const persisted = await page.getByTestId("blur-intensity-input").inputValue();

  if (!persisted.trim() || persisted === initial) {
    throw new Error("Slider value was not persisted after reload.");
  }
}

function toScreenPoint(bounds, normalizedPoint) {
  return {
    x: bounds.left + normalizedPoint.x * bounds.width,
    y: bounds.top + normalizedPoint.y * bounds.height,
  };
}

function toMidPoint(edgeRect) {
  return {
    x: (edgeRect.start.x + edgeRect.end.x) / 2,
    y: (edgeRect.start.y + edgeRect.end.y) / 2,
  };
}

function isMagentaPixel(pixel) {
  const [r, g, b, a] = pixel;
  return r > 170 && b > 170 && g < 130 && a > 120;
}

function assertMagenta(pixel, contextLabel) {
  if (isMagentaPixel(pixel)) {
    return;
  }

  throw new Error(
    `${contextLabel} expected magenta-ish pixel, got [${pixel.join(", ")}].`,
  );
}

function computeContainBounds(params) {
  const scale = Math.min(
    params.canvasRect.width / params.imageWidth,
    params.canvasRect.height / params.imageHeight,
  );
  const width = params.imageWidth * scale;
  const height = params.imageHeight * scale;

  return {
    left: params.canvasRect.left + (params.canvasRect.width - width) / 2,
    top: params.canvasRect.top + (params.canvasRect.height - height) / 2,
    width,
    height,
  };
}

async function getBaseCanvasMetrics(page) {
  return page.evaluate(() => {
    const canvas = document.querySelectorAll("canvas")[0];

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Base preview canvas not found.");
    }

    const rect = canvas.getBoundingClientRect();

    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  });
}

async function drawRectInBounds(params) {
  const start = toScreenPoint(params.bounds, params.start);
  const end = toScreenPoint(params.bounds, params.end);

  await params.page.mouse.move(start.x, start.y);
  await params.page.mouse.down();
  await params.page.mouse.move(end.x, end.y, { steps: 12 });
  await params.page.mouse.up();
}

async function samplePreviewPixel(params) {
  return params.page.evaluate(
    ({ imageBounds, samplePoint }) => {
      const canvas = document.querySelectorAll("canvas")[0];

      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("Base preview canvas not found.");
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        throw new Error("Preview context unavailable.");
      }

      const rect = canvas.getBoundingClientRect();
      const dprX = canvas.width / rect.width;
      const dprY = canvas.height / rect.height;
      const cssX = imageBounds.left + samplePoint.x * imageBounds.width;
      const cssY = imageBounds.top + samplePoint.y * imageBounds.height;
      const canvasX = Math.min(
        canvas.width - 1,
        Math.max(0, Math.round((cssX - rect.left) * dprX)),
      );
      const canvasY = Math.min(
        canvas.height - 1,
        Math.max(0, Math.round((cssY - rect.top) * dprY)),
      );

      return Array.from(ctx.getImageData(canvasX, canvasY, 1, 1).data);
    },
    {
      imageBounds: params.imageBounds,
      samplePoint: params.samplePoint,
    },
  );
}

async function sampleExportPixel(page, exportPath, samplePoint) {
  const raw = await readFile(exportPath);
  const base64 = raw.toString("base64");

  return page.evaluate(
    async ({ base64, samplePoint }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        throw new Error("Export sampling context unavailable.");
      }

      ctx.drawImage(image, 0, 0, image.width, image.height);
      const x = Math.min(
        canvas.width - 1,
        Math.max(0, Math.round(samplePoint.x * (canvas.width - 1))),
      );
      const y = Math.min(
        canvas.height - 1,
        Math.max(0, Math.round(samplePoint.y * (canvas.height - 1))),
      );

      return Array.from(ctx.getImageData(x, y, 1, 1).data);
    },
    { base64, samplePoint },
  );
}

function assertPixelateMetrics(params) {
  if (params.variance <= 80) {
    throw new Error(
      `${params.contextLabel} expected non-flat region, variance=${params.variance.toFixed(2)}.`,
    );
  }

  if (params.equalRatio <= 0.2) {
    throw new Error(
      `${params.contextLabel} expected block repetition, equalRatio=${params.equalRatio.toFixed(2)}.`,
    );
  }

  if (params.uniqueColors <= 6) {
    throw new Error(
      `${params.contextLabel} expected color diversity, uniqueColors=${params.uniqueColors}.`,
    );
  }
}

async function collectExportGridMetrics(page, exportPath, region) {
  const raw = await readFile(exportPath);
  const base64 = raw.toString("base64");

  return page.evaluate(
    async ({ base64, region }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        throw new Error("Export metrics context unavailable.");
      }

      ctx.drawImage(image, 0, 0, image.width, image.height);

      const columns = 24;
      const rows = 12;
      const samples = [];
      const unique = new Set();
      let sum = 0;
      let sumSquared = 0;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const nx =
            region.xMin +
            ((column + 0.5) / columns) * (region.xMax - region.xMin);
          const ny =
            region.yMin + ((row + 0.5) / rows) * (region.yMax - region.yMin);
          const x = Math.min(
            canvas.width - 1,
            Math.max(0, Math.round(nx * (canvas.width - 1))),
          );
          const y = Math.min(
            canvas.height - 1,
            Math.max(0, Math.round(ny * (canvas.height - 1))),
          );
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const r = pixel[0];
          const g = pixel[1];
          const b = pixel[2];
          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

          samples.push([r, g, b]);
          unique.add(
            `${Math.round(r / 8)}-${Math.round(g / 8)}-${Math.round(b / 8)}`,
          );
          sum += luma;
          sumSquared += luma * luma;
        }
      }

      let equalPairs = 0;
      let totalPairs = 0;
      const tolerance = 8;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const current = samples[row * columns + column];

          if (column + 1 < columns) {
            const right = samples[row * columns + column + 1];
            const isEqual =
              Math.abs(current[0] - right[0]) <= tolerance &&
              Math.abs(current[1] - right[1]) <= tolerance &&
              Math.abs(current[2] - right[2]) <= tolerance;

            if (isEqual) {
              equalPairs += 1;
            }

            totalPairs += 1;
          }

          if (row + 1 < rows) {
            const below = samples[(row + 1) * columns + column];
            const isEqual =
              Math.abs(current[0] - below[0]) <= tolerance &&
              Math.abs(current[1] - below[1]) <= tolerance &&
              Math.abs(current[2] - below[2]) <= tolerance;

            if (isEqual) {
              equalPairs += 1;
            }

            totalPairs += 1;
          }
        }
      }

      const count = samples.length;
      const mean = sum / count;
      const variance = sumSquared / count - mean * mean;

      return {
        variance,
        equalRatio: totalPairs ? equalPairs / totalPairs : 0,
        uniqueColors: unique.size,
      };
    },
    { base64, region },
  );
}

async function runCase(page, testCase, screenshotPath) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByText("Import an image to start censoring").waitFor();

  await page
    .getByRole("button", { name: "Import image area" })
    .locator('input[type="file"]')
    .setInputFiles(testCase.file);

  await page.getByText("Redaction Settings").waitFor();
  await clickModeTab(page, "Solid");
  await page.locator('input[type="color"]').waitFor();

  const hexInput = page.locator('input[type="text"]').first();
  await hexInput.fill("#ff00ff");
  await hexInput.press("Enter");

  await page.getByRole("button", { name: "Rectangle" }).click();
  const canvasMetrics = await getBaseCanvasMetrics(page);
  const imageBounds = computeContainBounds({
    canvasRect: canvasMetrics,
    imageWidth: testCase.width,
    imageHeight: testCase.height,
  });

  for (const edge of EDGE_RECTS) {
    await drawRectInBounds({
      page,
      bounds: imageBounds,
      start: edge.start,
      end: edge.end,
    });
  }

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  const download = await downloadPromise;
  const exportPath = path.join(outputDir, `smoke-export-${testCase.name}.png`);
  await download.saveAs(exportPath);

  for (const edge of EDGE_RECTS) {
    const samplePoint = toMidPoint(edge);
    const previewPixel = await samplePreviewPixel({
      page,
      imageBounds,
      samplePoint,
    });
    const exportPixel = await sampleExportPixel(page, exportPath, samplePoint);

    assertMagenta(previewPixel, `${testCase.name} preview ${edge.name}`);
    assertMagenta(exportPixel, `${testCase.name} export ${edge.name}`);
  }

  if (!screenshotPath) {
    return;
  }

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
}

async function runPixelateCase(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByText("Import an image to start censoring").waitFor();

  await page
    .getByRole("button", { name: "Import image area" })
    .locator('input[type="file"]')
    .setInputFiles(PIXELATE_CASE.file);

  await page.getByText("Redaction Settings").waitFor();
  await clickModeTab(page, "Pixelate");
  await page.getByTestId("blur-intensity-input").fill("72");
  await page.getByTestId("blur-intensity-input").press("Enter");
  await page.getByTestId("blur-opacity-input").fill("100");
  await page.getByTestId("blur-opacity-input").press("Enter");

  await page.getByRole("button", { name: "Rectangle" }).click();
  const canvasMetrics = await getBaseCanvasMetrics(page);
  const imageBounds = computeContainBounds({
    canvasRect: canvasMetrics,
    imageWidth: PIXELATE_CASE.width,
    imageHeight: PIXELATE_CASE.height,
  });

  await drawRectInBounds({
    page,
    bounds: imageBounds,
    start: { x: PIXELATE_CASE.region.xMin, y: PIXELATE_CASE.region.yMin },
    end: { x: PIXELATE_CASE.region.xMax, y: PIXELATE_CASE.region.yMax },
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  const download = await downloadPromise;
  const exportPath = path.join(
    outputDir,
    `smoke-export-${PIXELATE_CASE.name}.png`,
  );
  await download.saveAs(exportPath);

  const metrics = await collectExportGridMetrics(
    page,
    exportPath,
    PIXELATE_CASE.region,
  );

  assertPixelateMetrics({
    ...metrics,
    contextLabel: PIXELATE_CASE.name,
  });

  await page.screenshot({
    path: path.join(docsDir, "pixelate-mosaic-occlusion.png"),
    fullPage: true,
  });
}

async function runMarkupCase(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByText("Import an image to start censoring").waitFor();

  await page
    .getByRole("button", { name: "Import image area" })
    .locator('input[type="file"]')
    .setInputFiles(MARKUP_CASE.file);

  await page.getByText("Redaction Settings").waitFor();
  await clickModeTab(page, "Mark");
  await page.getByRole("button", { name: "Rectangle" }).click();

  const canvasMetrics = await getBaseCanvasMetrics(page);
  const imageBounds = computeContainBounds({
    canvasRect: canvasMetrics,
    imageWidth: MARKUP_CASE.width,
    imageHeight: MARKUP_CASE.height,
  });

  await drawRectInBounds({
    page,
    bounds: imageBounds,
    start: { x: 0.2, y: 0.2 },
    end: { x: 0.5, y: 0.45 },
  });

  await page.locator('input[type="color"]').first().fill("#22c55e");
  await page.getByTestId("mark-stroke-width-input").fill("14");
  await page.getByTestId("mark-stroke-width-input").press("Enter");
  await page.getByRole("button", { name: "Ellipse" }).click();

  await drawRectInBounds({
    page,
    bounds: imageBounds,
    start: { x: 0.52, y: 0.28 },
    end: { x: 0.84, y: 0.62 },
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  const download = await downloadPromise;
  const exportPath = path.join(
    outputDir,
    `smoke-export-${MARKUP_CASE.name}.png`,
  );
  await download.saveAs(exportPath);
}

async function run() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(docsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1600, height: 1400 },
  });
  const page = await context.newPage();

  await runModeTabsReloadCase(page);
  await runSliderCommitCase(page);
  await runCase(
    page,
    CASES[0],
    path.join(docsDir, "preview-export-alignment.png"),
  );
  await runCase(page, CASES[1]);
  await runPixelateCase(page);
  await runMarkupCase(page);

  await context.close();
  await browser.close();

  process.stdout.write("Smoke check passed. Preview and export are aligned.\n");
}

run().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exitCode = 1;
});
