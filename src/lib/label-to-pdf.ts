import { join } from "path";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";

// Noto Sans Latin — bundled with Next.js, covers all regular text characters.
const NOTO_SANS_PATH = join(
  process.cwd(),
  "node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf"
);

// Noto Sans Symbols — covers U+2600-U+26FF Miscellaneous Symbols, including ♻ (U+267B).
const NOTO_SYMBOLS_PATH = join(process.cwd(), "public/fonts/NotoSansSymbols-Regular.ttf");

// Noto Sans Symbols 2 — covers ✓ (U+2713), ✗ (U+2717) and many additional blocks.
const NOTO_SYMBOLS2_PATH = join(process.cwd(), "public/fonts/NotoSansSymbols2-Regular.ttf");

/**
 * Converts an SVG string to a PDF buffer.
 *
 * Pipeline:
 *   SVG string → @resvg/resvg-js (rasterize at 2× with embedded font → PNG) → pdf-lib (PDF)
 *
 * resvg is used instead of Sharp because Sharp relies on system fonts which are
 * not available in Vercel Lambda, causing all text to render as empty boxes.
 */
export async function labelSvgToPdf(svgString: string): Promise<Buffer> {
  // Step 1: rasterize SVG → PNG at 2× scale using resvg with an explicit font
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: 1040 }, // 2× the 520px SVG width
    font: {
      fontFiles: [NOTO_SANS_PATH, NOTO_SYMBOLS_PATH, NOTO_SYMBOLS2_PATH],
      loadSystemFonts: false, // avoid crashes on font-less Lambda environments
    },
  });
  const rendered = resvg.render();
  const pngBuffer = rendered.asPng();

  const imgWidth = rendered.width;
  const imgHeight = rendered.height;

  // Step 2: create PDF — page size = image dimensions in points (1pt ≈ 1px at 72dpi)
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("Etiqueta de Envase — RD 1055/2022");
  pdfDoc.setAuthor("Labeling Agent AI");
  pdfDoc.setCreator("Labeling Agent AI / pdf-lib");

  const page = pdfDoc.addPage([imgWidth, imgHeight]);

  const pngImage = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: imgWidth,
    height: imgHeight,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
