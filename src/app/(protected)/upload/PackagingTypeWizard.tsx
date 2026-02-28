"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PackagingUse } from "@/types/analysis";
import {
  CLASSIFIER_QUESTIONS,
  classifyPackagingUse,
  getClassificationRationale,
  type ClassifierAnswer,
} from "@/lib/packaging-classifier";

const PACKAGING_USE_LABEL: Record<PackagingUse, string> = {
  household: "Doméstico",
  commercial: "Comercial",
  industrial: "Industrial",
};

const PACKAGING_USE_DESCRIPTION: Record<PackagingUse, string> = {
  household:
    "Envase que llega al consumidor final. Sujeto a la indicación de fracción de recogida separada (Art. 13.2 RD 1055/2022).",
  commercial:
    "Envase usado en hostelería, restauración u oficinas. Exento de indicar fracción de contenedor (Art. 13.2).",
  industrial:
    "Envase exclusivamente industrial. Exento de indicar fracción de contenedor (Art. 13.2).",
};

const RESULT_STYLE: Record<
  PackagingUse,
  { border: string; bg: string; badge: string }
> = {
  household: {
    border: "border-green-200",
    bg: "bg-green-50",
    badge: "bg-green-700 text-white",
  },
  commercial: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    badge: "bg-blue-700 text-white",
  },
  industrial: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    badge: "bg-gray-600 text-white",
  },
};

interface Props {
  onComplete: (packagingUse: PackagingUse) => void;
}

export function PackagingTypeWizard({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<ClassifierAnswer[]>([]);
  const [result, setResult] = useState<PackagingUse | null>(null);
  const [rationale, setRationale] = useState<string>("");

  const question = CLASSIFIER_QUESTIONS[currentStep];
  const totalSteps = CLASSIFIER_QUESTIONS.length;

  function handleAnswer(answer: "yes" | "no") {
    const newAnswers: ClassifierAnswer[] = [
      ...answers,
      { questionId: question.id, answer },
    ];
    setAnswers(newAnswers);

    // Determine if we can short-circuit to a result
    const earlyResult =
      // Q1 yes → always domestic (retail channel override)
      (question.id === "retail_channel" && answer === "yes") ||
      // Q2 yes → commercial
      (question.id === "commercial_use" && answer === "yes") ||
      // Last question answered
      currentStep >= totalSteps - 1;

    if (earlyResult) {
      const classification = classifyPackagingUse(newAnswers);
      setResult(classification);
      setRationale(getClassificationRationale(classification, newAnswers));
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setCurrentStep((s) => s - 1);
    setAnswers((a) => a.slice(0, -1));
  }

  function handleReset() {
    setCurrentStep(0);
    setAnswers([]);
    setResult(null);
    setRationale("");
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result !== null) {
    const style = RESULT_STYLE[result];

    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Clasificación del envase</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Resultado de la clasificación
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Conforme al Art. 2 del RD 1055/2022
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Result badge */}
            <div
              className={`rounded-lg border p-4 ${style.border} ${style.bg}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${style.badge}`}
                >
                  {PACKAGING_USE_LABEL[result].toUpperCase()}
                </span>
                <span className="text-sm font-semibold">
                  Envase {PACKAGING_USE_LABEL[result]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {PACKAGING_USE_DESCRIPTION[result]}
              </p>
            </div>

            {/* Legal rationale */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">
                Base legal
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {rationale}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Cambiar clasificación
              </Button>
              <Button size="sm" onClick={() => onComplete(result)}>
                Continuar con el análisis →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Question screen ────────────────────────────────────────────────────────
  const progressPct = (currentStep / totalSteps) * 100;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Clasificar tipo de envase</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Pregunta {currentStep + 1} de {totalSteps}
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Art. 2 · RD 1055/2022
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
            <div
              className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <p className="text-sm font-medium leading-relaxed">{question.text}</p>

          {/* Legal note */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              {question.legalNote}
            </p>
          </div>

          {/* Answer buttons */}
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={() => handleAnswer("yes")}>
              Sí
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleAnswer("no")}
            >
              No
            </Button>
          </div>

          {/* Back link */}
          {currentStep > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline text-left"
              onClick={handleBack}
            >
              ← Volver a la pregunta anterior
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
