import { join } from "path";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";

// Noto Sans is bundled with Next.js — guaranteed to exist in any environment
// including Vercel Lambda, where system fonts are absent.
const FONT_PATH = join(
  process.cwd(),
  "node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf"
);

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
      fontFiles: [FONT_PATH],
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
