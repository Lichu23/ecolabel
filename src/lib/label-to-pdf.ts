import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

/**
 * Converts an SVG string to a PDF buffer.
 *
 * Pipeline:
 *   SVG string → Sharp (rasterize at 2x → PNG buffer) → pdf-lib (embed PNG → PDF)
 *
 * The PDF page size matches the SVG viewBox dimensions scaled at 1.5x for
 * print quality (72 DPI → 108 DPI effective).
 */
export async function labelSvgToPdf(svgString: string): Promise<Buffer> {
  // Step 1: rasterize SVG → PNG at 2× scale for crisp output
  const pngBuffer = await sharp(Buffer.from(svgString))
    .resize({ width: 1040 }) // 2× the 520px SVG width
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Step 2: get actual PNG dimensions after rasterisation
  const meta = await sharp(pngBuffer).metadata();
  const imgWidth = meta.width ?? 1040;
  const imgHeight = meta.height ?? 680;

  // Step 3: create PDF — page size = image dimensions in points (1pt ≈ 1px at 72dpi)
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
