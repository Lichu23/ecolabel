import twilio from "twilio";
import type { DetectedMaterial } from "@/types/analysis";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const from = process.env.TWILIO_WHATSAPP_FROM!; // e.g. "whatsapp:+14155238886"

export interface LabelNotificationPayload {
  /** E.164 phone number of the recipient, e.g. "+34612345678" */
  toPhone: string;
  companyName: string;
  productName: string;
  materials: DetectedMaterial[];
  /** Signed PDF download URL (valid ~1 h) */
  pdfUrl: string | null;
  analysisId: string;
}

/**
 * Sends a WhatsApp notification to the company after a label is generated.
 * Fires two messages:
 *   1. A brief summary with the label PDF link.
 *   2. A materials compliance summary (legal breakdown).
 *
 * Silently no-ops if TWILIO_* env vars are missing or `toPhone` is empty.
 */
export async function sendLabelNotification(
  payload: LabelNotificationPayload
): Promise<void> {
  if (!accountSid || !authToken || !from) return;
  if (!payload.toPhone) return;

  const client = twilio(accountSid, authToken);
  const to = `whatsapp:${payload.toPhone}`;

  const materialsText = payload.materials
    .map(
      (m) =>
        `• ${m.part}: ${m.material_name}${m.material_abbrev ? ` (${m.material_abbrev})` : ""} — Confianza: ${Math.round(m.confidence * 100)}%`
    )
    .join("\n");

  // Message 1 — label ready + PDF link
  const msg1 = [
    `✅ *Etiqueta generada* — ${payload.companyName}`,
    `📦 Producto: ${payload.productName}`,
    payload.pdfUrl
      ? `📄 Descarga el PDF aquí:\n${payload.pdfUrl}`
      : `📄 Accede al panel para descargar el PDF.`,
    `\nID de análisis: ${payload.analysisId}`,
  ].join("\n");

  // Message 2 — legal material breakdown
  const msg2 = [
    `📋 *Desglose de materiales (RD 1055/2022)*`,
    materialsText,
    `\n⚠️ Revisa el etiquetado antes de imprimir. Esta etiqueta ha sido generada automáticamente por IA.`,
  ].join("\n");

  // Send both messages. Errors are logged but not thrown —
  // a WhatsApp failure must never block the label API response.
  await Promise.allSettled([
    client.messages.create({ from, to, body: msg1 }),
    client.messages.create({ from, to, body: msg2 }),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[WhatsApp] Message ${i + 1} failed:`, r.reason);
      }
    });
  });
}
