/**
 * Packaging type classifier per Art. 2 of RD 1055/2022 (BOE-A-2022-22199).
 *
 * Definitions (Art. 2):
 * - Envase doméstico: Can reach final consumers via any retail channel.
 * - Envase comercial: Used in commercial establishments (restaurants, hotels, offices).
 * - Envase industrial: Used exclusively in industrial or manufacturing processes.
 *
 * Edge-case rule (MITECO interpretive note, Dec 2024):
 * If a product can reach consumers through ANY retail channel, it must be classified
 * as domestic — even if also sold B2B (dual-channel B2C+B2B → always domestic).
 * Example: 5L olive oil sold to restaurants AND in 500ml to consumers → domestic.
 */

import type { PackagingUse } from "@/types/analysis";

export interface ClassifierQuestion {
  id: string;
  text: string;
  legalNote: string;
}

export interface ClassifierAnswer {
  questionId: string;
  answer: "yes" | "no";
}

export const CLASSIFIER_QUESTIONS: ClassifierQuestion[] = [
  {
    id: "retail_channel",
    text: "¿El producto llega o podría llegar al consumidor final a través de cualquier canal minorista (supermercados, farmacias, tiendas, e-commerce al consumidor)?",
    legalNote:
      "Art. 2 RD 1055/2022: si el envase puede llegar al consumidor por cualquier canal minorista → envase doméstico. Aplica aunque el producto también se venda a empresas (canal dual B2B+B2C → siempre doméstico).",
  },
  {
    id: "commercial_use",
    text: "¿El envase se usa en establecimientos comerciales (restaurantes, hoteles, oficinas, colectividades) como parte de un servicio?",
    legalNote:
      "Art. 2 RD 1055/2022: envase comercial es aquel que, sin llegar al consumidor final, se usa en hostelería, restauración y otras actividades comerciales.",
  },
  {
    id: "industrial_use",
    text: "¿El envase se usa exclusivamente en procesos industriales o de fabricación, sin contacto con comercios ni consumidores finales?",
    legalNote:
      "Art. 2 RD 1055/2022: envase industrial es aquel utilizado únicamente en industrias. No está sujeto a la obligación de indicar la fracción de recogida separada del Art. 13.2.",
  },
];

/**
 * Classifies packaging use based on a series of yes/no answers.
 *
 * Decision tree per Art. 2 RD 1055/2022:
 * 1. Any retail channel reach → household (hard override for dual B2B+B2C channel)
 * 2. Commercial establishment use → commercial
 * 3. Exclusively industrial → industrial
 * 4. Default (conservative) → household (more obligations, safer for compliance)
 */
export function classifyPackagingUse(answers: ClassifierAnswer[]): PackagingUse {
  const map = Object.fromEntries(answers.map((a) => [a.questionId, a.answer]));

  // Rule 1 — hard override: any retail channel → domestic
  if (map["retail_channel"] === "yes") return "household";

  // Rule 2: commercial establishment use
  if (map["commercial_use"] === "yes") return "commercial";

  // Rule 3: exclusively industrial
  if (map["industrial_use"] === "yes") return "industrial";

  // Default: domestic (conservative — errs on the side of more obligations)
  return "household";
}

/**
 * Returns a human-readable legal rationale for the classification result.
 */
export function getClassificationRationale(
  result: PackagingUse,
  answers: ClassifierAnswer[]
): string {
  const map = Object.fromEntries(answers.map((a) => [a.questionId, a.answer]));

  if (result === "household") {
    if (map["retail_channel"] === "yes") {
      return (
        "Clasificado como doméstico: el producto puede llegar al consumidor final a través de " +
        "canales minoristas (Art. 2 RD 1055/2022). Esta clasificación aplica aunque el producto " +
        "también se venda a empresas (canal dual B2B+B2C → siempre doméstico, nota interpretativa " +
        "MITECO diciembre 2024)."
      );
    }
    return (
      "Clasificado como doméstico por criterio conservador: ante la duda, RD 1055/2022 exige " +
      "aplicar las obligaciones del envase doméstico (Art. 13.2 — indicación de fracción de " +
      "recogida separada obligatoria)."
    );
  }

  if (result === "commercial") {
    return (
      "Clasificado como comercial: el envase se usa en establecimientos de hostelería, " +
      "restauración u otras actividades comerciales, sin llegar al consumidor final (Art. 2 " +
      "RD 1055/2022). Exento de la indicación de fracción de recogida separada (Art. 13.2)."
    );
  }

  return (
    "Clasificado como industrial: el envase se usa exclusivamente en procesos industriales " +
    "o de fabricación (Art. 2 RD 1055/2022). Exento de la indicación de fracción de " +
    "recogida separada (Art. 13.2)."
  );
}
