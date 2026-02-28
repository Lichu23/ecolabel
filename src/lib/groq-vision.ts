import Groq from "groq-sdk";
import { z } from "zod";
import type { PackagingAnalysis } from "@/types/analysis";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const DetectedMaterialSchema = z.object({
  part: z.string().nullable().transform((v) => v ?? "componente"),
  material_name: z.string().nullable().transform((v) => v ?? "Material desconocido"),
  material_code: z.string().nullable(),
  material_abbrev: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  visual_evidence: z.string().nullable().transform((v) => v ?? ""),
  inference_method: z
    .enum(["visual", "contextual"])
    .optional()
    .default("visual"),
});

const PackagingAnalysisSchema = z.object({
  packaging_type: z.enum([
    "bottle", "box", "bag", "tray", "can", "jar", "tube", "composite", "unknown",
  ]),
  materials: z.array(DetectedMaterialSchema).min(1),
  overall_confidence: z.number().min(0).max(1),
  guided_query_required: z.boolean(),
  notes: z.string(),
});

// Pass 1: packaging format identification
const PackagingFormatSchema = z.object({
  format: z.enum([
    "bottle", "box", "bag", "tray", "can", "jar", "tube", "composite", "unknown",
  ]),
  shape_description: z.string(),
  visible_codes: z.array(z.string()),
});

type PackagingFormat = z.infer<typeof PackagingFormatSchema>;

// ─── Part name normalisation ───────────────────────────────────────────────────
// Maps common synonyms the model uses for the same physical part to a single
// canonical key. Used for deduplication in groq-vision.ts and for lookup
// matching in route.ts so "tapa" and "tapón" are treated as the same part.

const PART_SYNONYMS: Record<string, string> = {
  tapa: "tapón", cap: "tapón", cierre: "tapón", rosca: "tapón",
  "tapa de rosca": "tapón", "tapa superior": "tapón",
  body: "cuerpo", envase: "cuerpo", botella: "cuerpo",
  recipiente: "cuerpo", contenedor: "cuerpo",
  label: "etiqueta",
  handle: "asa", "asa de transporte": "asa",
  "film protector": "film", precinto: "film",
  "base inferior": "base",
};

export function canonicalPart(part: string): string {
  const lower = part.toLowerCase().trim();
  return PART_SYNONYMS[lower] ?? lower;
}

/** One image sent to the analysis pipeline. */
export interface ImageInput {
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

// ─── Groq client ──────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Pass 1: packaging format ─────────────────────────────────────────────────

const PASS_1_PROMPT = `Identifica el formato físico de este envase.
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "format": "bottle | box | bag | tray | can | jar | tube | composite | unknown",
  "shape_description": "descripción en una frase del formato (ej: botella cilíndrica transparente 500ml con tapón azul)",
  "visible_codes": ["lista de códigos de material visibles en la imagen (ej: '01', 'PET', 'HDPE', '♻05') — array vacío si no hay ninguno"]
}`;

async function identifyPackagingFormat(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp"
): Promise<PackagingFormat | null> {
  try {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: "text", text: PASS_1_PROMPT },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 256,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const result = PackagingFormatSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    // Pass 1 failure is non-fatal — Pass 2 runs without format context
    return null;
  }
}

// ─── Pass 2: material identification ─────────────────────────────────────────

function buildPass2Prompt(format: PackagingFormat | null, imageCount = 1): string {
  const multiImageNote = imageCount > 1
    ? `Se proporcionan ${imageCount} fotografías del mismo envase desde distintos ángulos. Analiza todas las vistas para identificar mejor los materiales y sus códigos ♻.\n\n`
    : "";

  const formatContext = format
    ? `CONTEXTO DE FORMATO (identificado en primera pasada):
- Formato: ${format.format}
- Descripción: ${format.shape_description}
- Códigos visibles en imagen: ${format.visible_codes.length > 0 ? format.visible_codes.join(", ") : "ninguno detectado"}

Usa este contexto para mejorar la identificación de materiales.

`
    : "";

  return `${multiImageNote}${formatContext}Eres un experto en identificación de materiales de envases para el cumplimiento del RD 1055/2022 (España).

Analiza el envase de la imagen e identifica TODOS los materiales visibles.

REGLAS CRÍTICAS:
- NUNCA inventes ni adivines regulaciones o artículos legales.
- Si no puedes identificar claramente un material, asigna confidence < 0.8.
- Solo identifica lo que puedes confirmar visualmente en la imagen.
- Si el material es ambiguo, deja material_code y material_abbrev como null.
- guided_query_required debe ser true si CUALQUIER material tiene confidence < 0.8.

CAMPO inference_method — usa estos valores:
- "visual": el tipo de material es directamente visible (código ♻ con número, texto HDPE/PET/PP, color/opacidad característicos confirmatorios)
- "contextual": material inferido del formato del envase sin marcas directas visibles (ej: tapón pequeño de botella de agua → PP por ser el formato estándar)

GUÍA DE IDENTIFICACIÓN VISUAL — PLÁSTICOS (MUY IMPORTANTE):
- PET (01): Botellas transparentes o ligeramente azuladas para agua/refrescos/zumos. Paredes finas, acanaladas, se arruga al apretarlas. El cuerpo de cualquier botella de agua 500ml-2L estándar es SIEMPRE PET.
- HDPE (02): Envases OPACOS (garrafas de leche, botellas de detergente, champú). Paredes rígidas y gruesas. NUNCA es transparente.
- PP (05): Tapones de rosca de botellas de agua/refrescos, yogures, envases de comida para llevar, film de microondas. Los tapones pequeños de botellas PET son CASI SIEMPRE PP.
- LDPE (04): Film transparente, bolsas de plástico suaves y flexibles.
- PS (06): Bandejas de corcho blanco, vasos de plástico rígido transparente.
- PVC (03): Muy poco común hoy. Film retráctil, algunos blísteres farmacéuticos.

REGLA CLAVE — PRIORIDAD DE IDENTIFICACIÓN:
1. Si hay un número ♻ VISIBLE en la imagen (triángulo de reciclaje con número) → ese código SIEMPRE prevalece sobre cualquier inferencia por forma, color o tamaño. Léelo y úsalo. Asigna confidence = 0.92 e inference_method "visual".
2. Solo si NO hay código ♻ visible Y la botella es transparente, fina y acanalada (paredes muy delgadas, típico envase de agua/refresco de un solo uso) → cuerpo PET (01), tapón PP (05), inference_method "contextual".
3. Si NO hay código ♻ visible Y el envase parece deportivo o reutilizable (paredes gruesas, opaco o semitransparente, sin acanaladuras, marca deportiva) → NO asumas PET. Asigna confidence < 0.8 y deja material_code null para que el usuario confirme.

CÓDIGOS DE REFERENCIA (Anexo II RD 1055/2022):
Plásticos: 01-PET, 02-HDPE, 03-PVC, 04-LDPE, 05-PP, 06-PS, 07-O
Papel/Cartón: 20-PAP (cartón corrugado), 21-PAP (cartón), 22-PAP (papel)
Metales: 40-FE (acero), 41-ALU (aluminio)
Vidrio: 70-GL (incoloro), 71-GL (verde), 72-GL (marrón)
Compuestos: 81-C/PAP (tetrabrik), 84-C/PS, etc.

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "packaging_type": "bottle | box | bag | tray | can | jar | tube | composite | unknown",
  "materials": [
    {
      "part": "nombre de la parte en español (e.g. cuerpo, tapón, etiqueta, film)",
      "material_name": "nombre completo en español (e.g. Polietileno tereftalato)",
      "material_code": "código numérico (e.g. 01) o null si no está claro",
      "material_abbrev": "abreviatura (e.g. PET) o null si no está claro",
      "confidence": 0.0,
      "visual_evidence": "descripción breve de las pistas visuales usadas",
      "inference_method": "visual | contextual"
    }
  ],
  "overall_confidence": 0.0,
  "guided_query_required": false,
  "notes": "observaciones relevantes sobre el envase"
}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyzes one or more packaging images using a two-pass Groq Llama Vision approach.
 *
 * Pass 1: Identify packaging format/shape from the first (primary) image.
 * Pass 2: Identify materials using all provided images + Pass 1 context.
 *
 * @param images - Array of images (base64 + mimeType). First image is the primary view.
 */
export async function analyzePackaging(
  images: ImageInput[]
): Promise<PackagingAnalysis> {
  if (images.length === 0) throw new Error("At least one image is required");

  const primary = images[0];

  // Pass 1: identify packaging format from primary image (non-blocking failure)
  const packagingFormat = await identifyPackagingFormat(primary.base64, primary.mimeType);

  // Pass 2: full material analysis — all images provided for maximum context
  const systemPrompt = buildPass2Prompt(packagingFormat, images.length);

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          // Send every image as a separate image_url block
          ...images.map((img) => ({
            type: "image_url" as const,
            image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
          })),
          {
            type: "text" as const,
            text: systemPrompt,
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1024,
  });

  const raw = response.choices[0]?.message?.content;

  if (!raw) {
    throw new Error("Groq returned an empty response");
  }

  let parsed: PackagingAnalysis;

  try {
    const rawParsed = JSON.parse(raw);
    const result = PackagingAnalysisSchema.safeParse(rawParsed);
    if (!result.success) {
      throw new Error(
        `Groq response failed validation: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
      );
    }
    parsed = result.data as PackagingAnalysis;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Groq returned invalid JSON: ${raw.slice(0, 200)}`);
    }
    throw err;
  }

  // Normalize part name synonyms so "tapa"/"tapón"/"cap" all map to the same
  // canonical key for deduplication purposes. The displayed name keeps the
  // model's original value (highest-confidence winner).

  // Deduplicate materials by canonical part name — the model may report the
  // same physical part under different names (tapa vs tapón) or multiple times
  // when several images show the same component. Keep the entry with the
  // highest confidence; on a tie prefer the one that has a material_code.
  const seen = new Map<string, typeof parsed.materials[number]>();
  for (const mat of parsed.materials) {
    const key = canonicalPart(mat.part);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, mat);
    } else {
      const betterConfidence = mat.confidence > existing.confidence;
      const sameConfidenceButHasCode =
        mat.confidence === existing.confidence &&
        mat.material_code !== null &&
        existing.material_code === null;
      if (betterConfidence || sameConfidenceButHasCode) {
        seen.set(key, mat);
      }
    }
  }
  parsed.materials = Array.from(seen.values());

  // Enforce guided_query_required based on actual confidence values
  const hasLowConfidence = parsed.materials.some((m) => m.confidence < 0.8);
  parsed.guided_query_required = hasLowConfidence || parsed.overall_confidence < 0.8;

  return parsed;
}
