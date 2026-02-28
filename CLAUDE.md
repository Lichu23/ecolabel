# CLAUDE.md — Labeling Agent AI

Project-level rules and lessons learned. Claude Code reads this file automatically.

---

## Project layout

```
app/                  Next.js 14 App Router (the main application)
  src/
    app/              Routes (protected/, api/, auth/)
    lib/              Core modules (groq-vision, rag, label-generator, legal-decisions, schemas)
    types/            Shared TypeScript interfaces (analysis.ts)
    __mocks__/        Vitest stubs (server-only.ts)
  vitest.config.ts
```

---


## 🛠 Development Process
* **Error Prevention:** After resolving a non-trivial bug or architectural mistake, immediately update the "Lessons Learned" section below. 
* **Context:** Summarize the error, the root cause, and the specific pattern to follow (or avoid) next time.

## Fixed errors — do NOT repeat these mistakes

### 1. `server-only` package crashes Vitest

**Root cause:** `import "server-only"` at the top of `src/lib/rag.ts` (and any future server-only module) throws at import time in Vitest because it runs outside the Next.js server context.

**Fix applied:**
- Created `src/__mocks__/server-only.ts` — a no-op stub (`export {}`)
- Added a `resolve.alias` in `vitest.config.ts` pointing `"server-only"` to that stub

**Rule:** Any time a new `"server-only"` module is added to `src/lib/`, no extra config is needed — the alias already handles it. Never remove the alias from `vitest.config.ts`.

---

### 2. SVG material codes rendered as `(XX)` not `>XX<`

**Root cause:** The old label generator rendered each material code inside a standalone `<text>XX</text>` element, so tests could assert `svg.toContain(">01<")`. After the redesign, codes appear inside combined text like `♻ CUERPO: PET (01)`, so the `>01<` pattern never matches.

**Fix applied:** Tests updated to assert `svg.toContain("(01)")` instead of `svg.toContain(">01<")`.

**Rule:** When writing label-generator tests, assert the human-readable string that actually appears in the SVG text content (e.g. `"(01)"`, `"PET"`, `"AMARILLO"`), not XML tag boundary patterns like `">01<"`.

---

### 3. RAG fallback returned a bare "no results" string instead of a legal statement

**Root cause:** `src/lib/rag.ts` returned `"No se encontró contexto legal relevante para esta consulta."` when the vector search found nothing. This string appeared verbatim on the analyze page, which is not legally defensible.

**Fix applied:**
- Added `FALLBACK_LEGAL_CONTEXT` constant in `src/lib/legal-decisions.ts` with a full RD 1055/2022 citation
- `rag.ts` now imports and returns `FALLBACK_LEGAL_CONTEXT` on empty results

**Rule:** The legal context field must NEVER be a UX error message. Any fallback must be a valid regulatory statement. Keep `FALLBACK_LEGAL_CONTEXT` in `legal-decisions.ts` as the single source of truth.

---

### 4. Circular dependency between `analysis.ts` and `legal-decisions.ts`

**Root cause:** `analysis.ts` needs `ContainerFraction` (defined in `legal-decisions.ts`). If `legal-decisions.ts` also imported from `analysis.ts`, we'd get a circular dependency.

**Fix applied:** `legal-decisions.ts` uses inline structural types (`Array<{ material_code: string | null; material_abbrev: string | null }>`) rather than importing `DetectedMaterial`. The import is one-way: `analysis.ts` → `legal-decisions.ts` only.

**Rule:** `legal-decisions.ts` must never import from `src/types/analysis.ts`. Keep the dependency one-directional.

---

### 5. `packaging_use` not threaded through the full pipeline

**Root cause:** The packaging use selection was added to the upload form but not forwarded to the label generator, causing the compliance checklist and container fraction assignments to always default to `"household"`.

**Fix applied:** The full chain now passes `packaging_use`:
1. Upload form → `FormData` → `POST /api/analyze`
2. `/api/analyze` reads it from form data, stores it in `raw_response` JSONB, and passes it in the body of the internal `POST /api/label/generate` call
3. `/api/label/generate` reads it from the JSON body and passes it to `generateLabelSVG()`

**Rule:** Any new user-configurable field added to the upload form must be explicitly forwarded through every step of the pipeline: form → analyze route → raw_response storage → label generate route → SVG generator. Do not assume defaults will be picked up automatically.

---

### 7. Auto-saving products to DB on every analysis (even abandoned ones)

**Root cause:** The old flow called `POST /api/products` before analysis, writing a product row to the DB before the user had a chance to review results. Abandoned or failed analyses left orphaned product records.

**Fix applied:** Split the flow into two separate API calls:
1. `POST /api/analyze` — pure analysis, **no DB writes**. Returns `{ analysis, legal_context }` only.
2. `POST /api/analyses/save` (new route) — persists everything only when the user explicitly clicks Save: creates product, creates analysis record, uploads image, saves analysis data, generates label.

`UploadClient.tsx` now has a 4-phase state machine:
- `"form"` → user fills in product name + image
- `"analyzing"` → spinner, AI runs, nothing written to DB
- `"preview"` → shows detected materials/confidence summary + **"Guardar en base de datos"** and **"← Nuevo análisis"** buttons
- `"saving"` → spinner while persisting → redirects to `/analyze/{id}`

**Rule:** Never write to the database during AI analysis. Always separate the analysis step (pure computation) from the persistence step (explicit user action). The `POST /api/analyze` route must remain free of DB writes.

---

### 8. Label SVG not visible in the preview before saving

**Root cause:** The label SVG was only generated inside `POST /api/analyses/save` (after DB persistence). In the new analyze-then-save flow, the user was left with a plain summary card and no label preview, causing confusion compared to the old flow.

**Fix applied:**
- `POST /api/analyze` now also generates a label SVG preview using `generateLabelSVG` with `analysisId: "preview"` (no DB write, no storage upload)
- Company info (`name`, `cif`) is looked up from DB during the analyze call (user is already authenticated)
- `product_name` is forwarded from the upload form to `/api/analyze` so the preview label shows the real product name
- `UploadClient` stores `label_svg` in the preview state and renders it as `<img src="data:image/svg+xml;base64,..." />`
- Label preview generation is wrapped in a try/catch — if it fails, preview proceeds without it (non-fatal)

**Rule:** When the analyze/save flow is split, the analyze endpoint must return a full preview payload — `label_svg`, `container_fractions`, and `compliance_items` — so the client can render the complete analyze-page layout before saving. Always send `product_name` to `/api/analyze` so the preview label shows the real product name. Use `analysisId: "preview"` as placeholder for the QR URL.

---

### 9. Preview layout must match the full analyze page

**Root cause:** The first preview implementation was a narrow summary card (a few key–value rows) that didn't show the materials table, compliance checklist, or label. Users expected to see the same rich output as the `/analyze/[id]` page.

**Fix applied:**
- `upload/page.tsx` no longer wraps `UploadClient` in a `max-w-lg` Card. It just passes `companyName` as a prop and lets the client manage its own layout.
- `UploadClient` has two distinct layout modes:
  - **Form / analyzing phases** → narrow `max-w-lg` Card (same as before)
  - **Preview / saving phases** → full-width two-column layout identical to `/analyze/[id]`: left column has product image + info card; right column has materials table, label SVG, compliance checklist, and legal context. Save/Cancel buttons appear both at the top and at the bottom.
- `POST /api/analyze` also returns `container_fractions` and `compliance_items` (already computed for label generation) so the client can render the materials table and checklist without importing server-side utilities.
- The uploaded image is shown using `URL.createObjectURL(file)`, revoked when leaving the preview.

**Rule:** The preview must always mirror the full `/analyze/[id]` layout. Never show a minimal summary where the full data is available. The `UploadClient` controls its own container width per phase — do not wrap it in a fixed max-width in the page.

---

### 10. Download button missing from label preview; save button text too verbose

**Root cause:** The label SVG was rendered as an `<img>` in the preview but had no download action, forcing users to save first to get a downloadable file. The save button also used the overly verbose label "Guardar en base de datos" instead of a simple "Guardar".

**Fix applied:**
- Added a "Descargar SVG" `<Button asChild>` + `<a download>` directly below the label preview image. It reuses the same base64 data URL already rendered for the `<img>`, so no extra computation is needed. Filename: `etiqueta-preview.svg`.
- Renamed all instances of "Guardar en base de datos" → "Guardar" (top header button + bottom bar button).

**Rule:** Whenever a label SVG is available in the preview state, always render a download button alongside it — users should never be required to save to the DB just to download a file. Keep save button labels concise ("Guardar"), not descriptive of the underlying mechanism.

---

### 6. `startTransition` and Supabase join array types

**`startTransition` must receive a void-returning callback.** Server Actions return `Promise<T>`, so passing them directly causes a type error. Always wrap in a block body:
```ts
startTransition(() => { someServerAction(arg); });
```

**Supabase join relations are typed as arrays** even when using `.single()`. Access them with an `Array.isArray` guard, same as the `labels` pattern in `analyses/[id]/route.ts`:
```ts
const product = Array.isArray(analysis.products) ? analysis.products[0] : analysis.products;
```

---

## Key modules at a glance

| Module | Purpose |
|---|---|
| `src/lib/legal-decisions.ts` | Container fraction lookup, compliance validation, regulatory constants |
| `src/lib/rag.ts` | Vector search over legal_docs; falls back to `FALLBACK_LEGAL_CONTEXT` |
| `src/lib/label-generator.ts` | Generates SVG label with materials, bin badges, compliance checklist, QR |
| `src/lib/groq-vision.ts` | Calls Groq vision API, parses `PackagingAnalysis` |
| `src/lib/schemas.ts` | Zod schemas for all Supabase query results |
| `src/types/analysis.ts` | Core TypeScript interfaces (`DetectedMaterial`, `PackagingAnalysis`, `PackagingUse`) |

## API routes at a glance

| Route | Method | Purpose |
|---|---|---|
| `POST /api/analyze` | POST | Run AI vision + RAG + label SVG preview — **no DB writes**, returns `{ analysis, legal_context, label_svg, container_fractions, compliance_items }` |
| `POST /api/analyses/save` | POST | Persist analysis: creates product + analysis record + uploads image + generates label |
| `POST /api/label/generate` | POST | Generate SVG/PDF label for a saved analysis |
| `POST /api/label/preview` | POST | Recompute SVG + fractions + compliance after user material corrections — **no DB writes** |
| `POST /api/products` | POST | Create a standalone product record |
| `GET /api/analyses/[id]` | GET | Fetch a single analysis row |
| `DELETE /api/analyses/[id]` | DELETE | Delete an analysis |

## Regulatory reference

- Law: **RD 1055/2022** (BOE-A-2022-22199), 27 de diciembre de 2022
- Key article: **Art. 13** — mandatory material identification on packaging
- Key annex: **Anexo II** — separate collection fraction codes
- Constant: `REGULATORY_VERSION = "RD 1055/2022"` in `legal-decisions.ts`


---

## 🧠 Lessons Learned & Error Prevention

### 11. Groq model returns `null` for required string fields in materials array

**Root cause:** `DetectedMaterialSchema` declared `part`, `material_name`, and `visual_evidence` as `z.string()` (non-nullable). The Llama model occasionally returns `null` for these fields (especially `material_name` on ambiguous or partially-visible components), causing `safeParse` to throw: `materials.2.material_name: Invalid input: expected string, received null`.

**Fix applied:** Added `.nullable().transform(v => v ?? fallback)` to each of the three fields:
- `part` → fallback `"componente"`
- `material_name` → fallback `"Material desconocido"`
- `visual_evidence` → fallback `""`

This coerces `null` to a safe string at the Zod boundary, keeping downstream TypeScript types as `string` with no changes needed elsewhere.

**Rule:** Any string field in a Zod schema that comes from LLM output must be `.nullable().transform(v => v ?? fallback)`. Never trust that the model will respect "required string" constraints — `material_code` and `material_abbrev` were already nullable for this reason; `part`, `material_name`, and `visual_evidence` now follow the same pattern.

---

### 12. Tier-based confirmation flow inserted between analyzing and preview

**Context:** After AI analysis, low-confidence or code-less materials silently produce incorrect labels. The fix is a `"confirming"` phase gating the `"preview"`.

**Tier classification (client-side, no API changes):**
- **Tier 1** — `confidence >= 0.8` AND `material_code !== null` → auto-confirmed, green chip, no action
- **Tier 2** — `confidence >= 0.8` BUT `material_code === null` → one YES/NO question; "No" escalates to Tier 3
- **Tier 3** — `confidence < 0.8` → full material dropdown questionnaire

**State machine:** `"form"` → `"analyzing"` → `"confirming"` (if any Tier 2/3) → `"preview"` → `"saving"`

**After confirmation:** Call `POST /api/label/preview` to regenerate SVG + fractions + compliance with corrected materials (no DB writes).

**Rule:** Never go to `"preview"` with unresolved Tier 2/3 materials. The `"confirming"` phase is skipped only when all materials are Tier 1 (confidence ≥ 0.8 AND code present). The `/api/label/preview` route mirrors `/api/analyze`'s label-generation logic but accepts corrected `PackagingAnalysis` via JSON body instead of an image.