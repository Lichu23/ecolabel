import type { ContainerFraction } from "@/lib/legal-decisions";

export type PackagingUse = "household" | "commercial" | "industrial";

export type InferenceMethod = "visual" | "contextual" | "lookup" | "user_confirmed";

export interface DetectedMaterial {
  part: string;              // e.g. "cuerpo", "tapón", "etiqueta"
  material_name: string;     // e.g. "Polietileno tereftalato"
  material_code: string | null;   // e.g. "01"
  material_abbrev: string | null; // e.g. "PET"
  confidence: number;        // 0.0 – 1.0
  visual_evidence: string;   // brief description of visual clues
  inference_method?: InferenceMethod; // how the material was identified
  container_fraction?: ContainerFraction; // computed, not from AI
  separability?: "separable" | "inseparable"; // Phase 11: user-confirmed in MaterialDecomposer
}

export interface PackagingAnalysis {
  packaging_type:
    | "bottle"
    | "box"
    | "bag"
    | "tray"
    | "can"
    | "jar"
    | "tube"
    | "composite"
    | "unknown";
  materials: DetectedMaterial[];
  overall_confidence: number;      // 0.0 – 1.0
  guided_query_required: boolean;  // true if any material confidence < 0.8
  notes: string;
  packaging_use?: PackagingUse;
}

export interface AnalysisResult {
  analysis: PackagingAnalysis;
  legal_context: string;   // RAG-retrieved text from RD 1055/2022
  analysis_id: string;     // Supabase analyses row id
}
