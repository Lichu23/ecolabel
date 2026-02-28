/**
 * Zod schemas for Supabase query results.
 * Use these instead of `as unknown as T` casts to catch shape mismatches at runtime.
 */
import { z } from "zod";

// ─── Shared ────────────────────────────────────────────────────────────────────

export const DetectedMaterialSchema = z.object({
  part: z.string(),
  material_name: z.string(),
  material_code: z.string().nullable(),
  material_abbrev: z.string().nullable(),
  confidence: z.number(),
  visual_evidence: z.string(),
  inference_method: z
    .enum(["visual", "contextual", "lookup", "user_confirmed"])
    .optional(),
  container_fraction: z
    .enum(["amarillo", "azul", "verde", "otro"])
    .optional(),
});

// ─── Dashboard (labels list) ───────────────────────────────────────────────────

export const LabelRowSchema = z.object({
  id: z.string(),
  version: z.number(),
  created_at: z.string(),
  is_archived: z.boolean(),
  qr_url: z.string().nullable(),
  products: z.object({ name: z.string() }).nullable(),
  analyses: z
    .object({
      overall_confidence: z.number().nullable(),
      status: z.string(),
      guided_query_required: z.boolean(),
    })
    .nullable(),
});

export const LabelRowArraySchema = z.array(LabelRowSchema);

// ─── Analyze page ──────────────────────────────────────────────────────────────

const MandatoryMarkingInputsSchema = z.object({
  isCompostable: z.boolean(),
  isSUP: z.boolean(),
  isReusable: z.boolean(),
  isSDDR: z.boolean(),
});

export const PackagingAnalysisRowSchema = z.object({
  packaging_type: z.string(),
  materials: z.array(DetectedMaterialSchema),
  overall_confidence: z.number(),
  guided_query_required: z.boolean(),
  notes: z.string(),
  image_path: z.string().optional(),
  packaging_use: z
    .enum(["household", "commercial", "industrial"])
    .optional(),
  marking_inputs: MandatoryMarkingInputsSchema.optional().nullable(),
});

export const AnalysisRowSchema = z.object({
  id: z.string(),
  status: z.string(),
  materials: z.array(DetectedMaterialSchema),
  overall_confidence: z.number(),
  guided_query_required: z.boolean(),
  legal_context: z.string().nullable(),
  raw_response: PackagingAnalysisRowSchema.nullable(),
  products: z.object({ name: z.string() }),
});

// ─── Analyze page label (auto-generated) ──────────────────────────────────────

export const AnalyzeLabelSchema = z.object({
  id: z.string(),
  svg_path: z.string(),
  pdf_path: z.string(),
  qr_url: z.string().nullable(),
  version: z.number(),
});

// ─── Label page ────────────────────────────────────────────────────────────────

export const LabelPageRowSchema = z.object({
  id: z.string(),
  version: z.number(),
  svg_path: z.string(),
  pdf_path: z.string(),
  qr_url: z.string(),
  created_at: z.string(),
  products: z.object({ name: z.string() }),
  companies: z.object({ name: z.string(), cif: z.string() }),
  analyses: z.object({
    materials: z.array(DetectedMaterialSchema),
    raw_response: PackagingAnalysisRowSchema.nullable(),
    overall_confidence: z.number(),
  }).nullable(),
});

// ─── Label generate route ──────────────────────────────────────────────────────

export const CompanyRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  cif: z.string(),
  whatsapp_number: z.string().nullable(),
});

export const ProductRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  company_id: z.string(),
  companies: CompanyRowSchema,
});

export const AnalysisGenerateRowSchema = z.object({
  id: z.string(),
  status: z.string(),
  materials: z.array(DetectedMaterialSchema),
  raw_response: PackagingAnalysisRowSchema.nullable(),
  products: ProductRowSchema,
});

// ─── Audit export route ────────────────────────────────────────────────────────

export const AuditLabelRowSchema = z.object({
  id: z.string(),
  version: z.number(),
  created_at: z.string(),
  is_archived: z.boolean(),
  qr_url: z.string().nullable(),
  products: z.object({ name: z.string() }).nullable(),
  companies: z.object({ name: z.string(), cif: z.string() }).nullable(),
  analyses: z
    .object({
      status: z.string(),
      overall_confidence: z.number().nullable(),
      guided_query_required: z.boolean(),
      materials: z.array(DetectedMaterialSchema).nullable(),
    })
    .nullable(),
});

export const AuditLabelRowArraySchema = z.array(AuditLabelRowSchema);
