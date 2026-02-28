export interface GreenwashingViolation {
  pattern: string;              // human-readable description of the prohibited pattern
  matched: string;              // the actual matched substring
  article: string;              // legal citation
  severity: "error" | "warning";
}

interface ProhibitedPattern {
  regex: RegExp;
  label: string;
  article: string;
  severity: "error" | "warning";
}

const PROHIBITED_PATTERNS: ProhibitedPattern[] = [
  // ── Hard blocks ──────────────────────────────────────────────────────────
  {
    regex: /\beco[- ]?friendly\b/i,
    label: '"eco-friendly"',
    article: "Art. 13.3 RD 1055/2022 · Directiva UE 2024/825 Art. 2",
    severity: "error",
  },
  {
    regex: /\brespetuos[ao]s?\s+(con\s+)?el\s+medio\s+ambiente\b/i,
    label: '"respetuoso con el medio ambiente"',
    article: "Art. 13.3 RD 1055/2022",
    severity: "error",
  },
  {
    // "sostenible" prohibited when unqualified — "certificado sostenible" or "según norma" is OK
    regex: /\bsostenible\b(?!\s*[,)]?\s*(?:certificad[ao]|acreditad[ao]|según\s+norma|bajo\s+norma|verificad[ao]))/i,
    label: '"sostenible" (sin calificación certificada)',
    article: "Art. 13.3 RD 1055/2022 · Directiva UE 2024/825",
    severity: "error",
  },
  {
    regex: /\b100\s*%\s*natural\b/i,
    label: '"100% natural"',
    article: "Art. 13.3 RD 1055/2022",
    severity: "error",
  },
  {
    // "carbono neutro" prohibited without a certified methodology reference
    regex: /\bcarbono\s+neutro\b(?!\s*(?:certificado|verificado|según|bajo\s+(?:norma|metodología)))/i,
    label: '"carbono neutro" (sin metodología certificada)',
    article: "Art. 13.3 RD 1055/2022 · Directiva UE 2024/825",
    severity: "error",
  },
  {
    regex: /\bplástico\s+sostenible\b/i,
    label: '"plástico sostenible"',
    article: "Art. 13.3 RD 1055/2022",
    severity: "error",
  },
  {
    regex: /\benvase\s+verde\b/i,
    label: '"envase verde"',
    article: "Art. 13.3 RD 1055/2022",
    severity: "error",
  },

  // ── Contextual warnings (non-blocking) ───────────────────────────────────
  {
    // "reciclable" only prohibited when the product is not recyclable in standard municipal systems;
    // we cannot auto-detect recyclability, so flag for human review
    regex: /\breciclabl[ae]s?\b/i,
    label: '"reciclable" (verificar reciclabilidad real en sistemas municipales españoles)',
    article: "Art. 13.3 RD 1055/2022",
    severity: "warning",
  },
  {
    // "biodegradable" prohibited when unqualified; allowed with specific certification reference
    regex: /\bbiodegradabl[ae]s?\b(?!\s*(?:certificad[ao]|según\s+norma|conforme|bajo))/i,
    label: '"biodegradable" (sin certificación específica — p.ej. UNE EN 13432)',
    article: "Art. 13.3 RD 1055/2022",
    severity: "warning",
  },
];

export function scanForProhibitedLanguage(text: string): GreenwashingViolation[] {
  if (!text || text.trim().length === 0) return [];

  const violations: GreenwashingViolation[] = [];
  const seen = new Set<string>();

  for (const p of PROHIBITED_PATTERNS) {
    const match = p.regex.exec(text);
    if (match && !seen.has(p.label)) {
      seen.add(p.label);
      violations.push({
        pattern: p.label,
        matched: match[0],
        article: p.article,
        severity: p.severity,
      });
    }
  }

  return violations;
}

export function hasBlockingViolations(violations: GreenwashingViolation[]): boolean {
  return violations.some((v) => v.severity === "error");
}
