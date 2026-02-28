"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MandatoryMarkingInputs } from "@/lib/legal-decisions";

// ── Question definitions ──────────────────────────────────────────────────────

interface QuestionDef {
  key: keyof MandatoryMarkingInputs;
  label: string;
  article: string;
  hint: string;          // plain-language explanation
  yesExample: string;    // concrete YES examples
  noExample: string;     // concrete NO examples
  sddrNote?: true;
}

const QUESTIONS: QuestionDef[] = [
  {
    key: "isCompostable",
    label: "¿El envase está certificado como compostable?",
    article: "Art. 13.5 RD 1055/2022",
    hint: "Solo si tienes un certificado oficial que lo acredita. No basta con que el material sea orgánico.",
    yesExample: "Bolsa de bioplástico con certificado EN 13432, envase de cartón compostable certificado",
    noExample: "Lata de aluminio, botella de plástico PET, tarro de vidrio, caja de cartón normal",
  },
  {
    key: "isSUP",
    label: "¿Es un plástico desechable de un solo uso (SUP)?",
    article: "Art. 13.7 RD 1055/2022",
    hint: "Los SUP son productos de plástico pensados para usarse una sola vez y tirarse. La directiva europea tiene una lista cerrada.",
    yesExample: "Pajitas de plástico, vasos desechables de plástico, cubiertos de plástico, bastoncillos, platos desechables de plástico",
    noExample: "Lata de refresco, botella de vidrio, tarro de plástico rígido para alimentos, caja de cartón",
  },
  {
    key: "isReusable",
    label: "¿Es un envase diseñado para reutilizarse?",
    article: "Art. 13.2 RD 1055/2022",
    hint: "Un envase reutilizable está diseñado y certificado para ser devuelto, rellenado y usado varias veces. No confundir con reciclable.",
    yesExample: "Botella de vidrio retornable de cervecería, caja de madera o plástico duro para transporte con sistema de devolución, envase rellenable certificado",
    noExample: "Botella de agua de un solo uso, lata de conservas, tetrabrik, bolsa de plástico de supermercado",
  },
  {
    key: "isSDDR",
    label: "¿Es un envase de bebida que podría incluirse en el sistema de depósito (SDDR)?",
    article: "Arts. 46.8, 47.7 RD 1055/2022",
    hint: "El SDDR es el futuro sistema de 'paga y devuelve' para envases de bebida. Aún no es obligatorio, pero afectará a latas, botellas de plástico y vidrio de bebidas.",
    yesExample: "Lata de cerveza o refresco, botella de agua de plástico, botella de refresco, botella de cerveza de vidrio",
    noExample: "Tarro de mermelada, botella de aceite, caja de leche, botella de vino (exenta temporalmente)",
    sddrNote: true,
  },
];

// ── Consequence text shown after answering YES ────────────────────────────────

const YES_CONSEQUENCE: Record<keyof MandatoryMarkingInputs, string> = {
  isCompostable:
    "Requiere certificación UNE EN 13432:2001 en el etiquetado (Art. 13.5).",
  isSUP:
    "Requiere pictogramas obligatorios EU 2020/2151 en el etiquetado (Art. 13.7).",
  isReusable:
    "Requiere indicación de condición de reutilización en el etiquetado (Art. 13.2).",
  isSDDR:
    "Próximamente obligatorio — SDDR en fase de implantación nacional. No es exigible actualmente (Arts. 46.8, 47.7).",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onComplete: (inputs: MandatoryMarkingInputs) => void;
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MandatoryMarkingQuestionnaire({ onComplete, onBack }: Props) {
  const [answers, setAnswers] = useState<Partial<MandatoryMarkingInputs>>({});

  const answeredCount = QUESTIONS.filter(
    (q) => answers[q.key] !== undefined
  ).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  function handleAnswer(key: keyof MandatoryMarkingInputs, value: boolean) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleComplete() {
    if (!allAnswered) return;
    onComplete({
      isCompostable: answers.isCompostable!,
      isSUP: answers.isSUP!,
      isReusable: answers.isReusable!,
      isSDDR: answers.isSDDR!,
    });
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">Características del envase</h1>
        <span className="text-sm text-muted-foreground">
          {answeredCount}/{QUESTIONS.length} respondidas
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Responde estas preguntas para que el sistema genere el listado de
        cumplimiento completo conforme a RD&nbsp;1055/2022.
      </p>

      <div className="flex flex-col gap-3">
        {QUESTIONS.map((q) => {
          const answer = answers[q.key];
          return (
            <Card
              key={q.key}
              className={
                answer === undefined
                  ? "border-gray-200"
                  : answer
                    ? q.sddrNote
                      ? "border-amber-300 bg-amber-50"
                      : "border-orange-300 bg-orange-50"
                    : "border-green-200 bg-green-50"
              }
            >
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{q.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.article}
                    </p>
                  </div>
                  {answer !== undefined && (
                    <span
                      className={`shrink-0 text-xs font-bold mt-0.5 ${
                        answer ? "text-orange-700" : "text-green-700"
                      }`}
                    >
                      {answer ? "SÍ" : "NO"}
                    </span>
                  )}
                </div>

                {/* Hint — plain-language explanation */}
                <p className="text-xs text-muted-foreground italic">
                  {q.hint}
                </p>

                {/* YES / NO examples — always visible */}
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs">
                    <span className="font-semibold text-green-700">Ej. SÍ: </span>
                    <span className="text-muted-foreground">{q.yesExample}</span>
                  </p>
                  <p className="text-xs">
                    <span className="font-semibold text-red-600">Ej. NO: </span>
                    <span className="text-muted-foreground">{q.noExample}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={answer === true ? "default" : "outline"}
                    onClick={() => handleAnswer(q.key, true)}
                  >
                    Sí
                  </Button>
                  <Button
                    size="sm"
                    variant={answer === false ? "default" : "outline"}
                    onClick={() => handleAnswer(q.key, false)}
                  >
                    No
                  </Button>
                </div>

                {answer === true && (
                  <p
                    className={`text-xs font-medium ${
                      q.sddrNote ? "text-amber-700" : "text-orange-700"
                    }`}
                  >
                    {q.sddrNote && (
                      <span className="inline-block bg-amber-200 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded mr-1.5">
                        PRÓX.
                      </span>
                    )}
                    {YES_CONSEQUENCE[q.key]}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          ← Atrás
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!allAnswered}
          className="flex-1"
        >
          Continuar →
        </Button>
      </div>

      {!allAnswered && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Responde todas las preguntas para continuar.
        </p>
      )}
    </div>
  );
}
