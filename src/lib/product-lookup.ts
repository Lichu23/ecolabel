import type { DetectedMaterial } from "@/types/analysis";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LookupEntry {
  /** Lowercase substrings to match against the product name */
  keywords: string[];
  /** Optional: only used as tie-breaker when multiple entries match */
  packaging_type?: string | string[];
  materials: DetectedMaterial[];
}

// ─── Material factory helpers (Anexo II RD 1055/2022) ────────────────────────

function lkp(
  part: string,
  material_name: string,
  material_code: string,
  material_abbrev: string,
  visual_evidence: string
): DetectedMaterial {
  return {
    part,
    material_name,
    material_code,
    material_abbrev,
    confidence: 1.0,
    visual_evidence,
    inference_method: "lookup",
  };
}

// Shorthand builders (code → Anexo II abbreviation)
const PET = (part = "cuerpo", ev = "Botella PET transparente") =>
  lkp(part, "Polietileno tereftalato", "01", "PET", ev);

const HDPE = (part = "cuerpo", ev = "Envase opaco rígido de HDPE") =>
  lkp(part, "Polietileno de alta densidad", "02", "HDPE", ev);

const LDPE = (part = "cuerpo", ev = "Bolsa o film de LDPE") =>
  lkp(part, "Polietileno de baja densidad", "04", "LDPE", ev);

const PP = (part = "tapón", ev = "Tapón o tapa de polipropileno") =>
  lkp(part, "Polipropileno", "05", "PP", ev);

const PS = (part = "cuerpo", ev = "Tarrina de poliestireno") =>
  lkp(part, "Poliestireno", "06", "PS", ev);

const PAP_BOX = (part = "cuerpo", ev = "Caja de cartón") =>
  lkp(part, "Cartón", "21", "PAP", ev);

const PAP_PAPER = (part = "cuerpo", ev = "Bolsa de papel") =>
  lkp(part, "Papel", "22", "PAP", ev);

const FE = (part = "tapón", ev = "Tapa o cuerpo metálico de acero") =>
  lkp(part, "Acero", "40", "FE", ev);

const ALU = (part = "cuerpo", ev = "Envase de aluminio") =>
  lkp(part, "Aluminio", "41", "ALU", ev);

const GL = (part = "cuerpo", ev = "Botella o tarro de vidrio") =>
  lkp(part, "Vidrio incoloro", "70", "GL", ev);

const BRICK = (part = "cuerpo", ev = "Envase multicapa tipo brick (Tetra Pak)") =>
  lkp(part, "Envase compuesto papel/cartón", "81", "C/PAP", ev);

const CPAP = (part = "cuerpo", ev = "Envase flexible laminado") =>
  lkp(part, "Envase compuesto plástico", "84", "C/PAP", ev);

// ─── Lookup table (55 entries, Anexo II RD 1055/2022) ────────────────────────

const PRODUCT_LOOKUP: LookupEntry[] = [
  // ── 1. Agua mineral (PET) ─────────────────────────────────────────────────
  {
    keywords: [
      "agua mineral", "agua embotellada", "botella de agua", "agua con gas",
      "agua sin gas", "fontvella", "font vella", "aquarel", "evian",
      "agua de manantial",
    ],
    materials: [
      PET("cuerpo", "Botella PET transparente estándar para agua mineral"),
      PP("tapón", "Tapón de rosca PP estándar"),
    ],
  },

  // ── 2. Leche UHT brick ────────────────────────────────────────────────────
  {
    keywords: [
      "leche entera", "leche semi", "leche desnatada", "leche uht",
      "leche brick", "brick de leche", "leche larga duración",
      "pascual", "puleva", "asturiana", "central lechera",
    ],
    materials: [BRICK("cuerpo", "Brick multicapa Tetra Pak para leche UHT")],
  },

  // ── 3. Yogur tarrina ──────────────────────────────────────────────────────
  {
    keywords: [
      "yogur", "yogurt", "yogures", "danone", "activia", "yoplait",
      "tarrina yogur", "bífidus", "bifidus", "yoghurt", "actimel",
    ],
    materials: [
      PS("cuerpo", "Tarrina de PS rígido blanco estándar"),
      ALU("tapa", "Tapa de aluminio termosellado"),
    ],
  },

  // ── 4. Mantequilla ────────────────────────────────────────────────────────
  {
    keywords: [
      "mantequilla", "mantequilla sin sal", "mantequilla con sal",
      "butter", "lurpak", "kerrygold", "president mantequilla",
      "mantequilla artesana",
    ],
    materials: [
      ALU("envoltorio", "Film de aluminio interior de la mantequilla"),
      PAP_BOX("caja exterior", "Caja de cartón exterior"),
    ],
  },

  // ── 5. Nata brick ─────────────────────────────────────────────────────────
  {
    keywords: [
      "nata líquida", "nata liquida", "nata para cocinar", "nata montada",
      "crema de leche", "nata fresca", "whipping cream", "nata brick",
    ],
    materials: [BRICK("cuerpo", "Brick multicapa para nata líquida")],
  },

  // ── 6. Leche condensada bote ──────────────────────────────────────────────
  {
    keywords: [
      "leche condensada", "leche condensada entera", "la lechera",
      "condensada", "leche condensada azucarada", "condensed milk",
    ],
    materials: [FE("cuerpo", "Lata de acero para leche condensada")],
  },

  // ── 7. Queso fresco PP ────────────────────────────────────────────────────
  {
    keywords: [
      "queso fresco", "queso de burgos", "queso cottage", "queso batido",
      "tarrina de queso", "mozzarella", "ricotta", "queso crema",
      "philadelphia", "queso mascarpone",
    ],
    materials: [
      PP("cuerpo", "Tarrina de PP rígido para queso fresco"),
      PP("tapa", "Tapa de PP estándar"),
    ],
  },

  // ── 8. Cerveza — lata ─────────────────────────────────────────────────────
  {
    keywords: [
      "cerveza", "beer", "birra", "mahou", "estrella damm", "san miguel",
      "heineken", "corona", "moritz", "alhambra", "amstel", "voll-damm",
    ],
    packaging_type: "can",
    materials: [ALU("cuerpo", "Lata de aluminio estándar para cerveza")],
  },

  // ── 9. Cerveza — botella ──────────────────────────────────────────────────
  {
    keywords: [
      "cerveza", "beer", "birra", "mahou", "estrella damm", "san miguel",
      "heineken", "corona", "moritz", "alhambra", "amstel", "voll-damm",
    ],
    packaging_type: "bottle",
    materials: [
      GL("cuerpo", "Botella de vidrio para cerveza"),
      FE("tapón corona", "Chapa metálica de acero"),
    ],
  },

  // ── 10. Vino botella ──────────────────────────────────────────────────────
  {
    keywords: [
      "vino", "vino tinto", "vino blanco", "vino rosado", "botella de vino",
      "rioja", "ribera del duero", "tempranillo", "albariño", "vino joven",
      "vino crianza",
    ],
    packaging_type: "bottle",
    materials: [GL("cuerpo", "Botella de vidrio estándar para vino")],
  },

  // ── 11. Cava / espumoso ───────────────────────────────────────────────────
  {
    keywords: [
      "cava", "espumoso", "cava brut", "cava seco", "champagne",
      "prosecco", "freixenet", "codorniu", "gran cremant",
      "cava reserva", "cava rosado",
    ],
    packaging_type: "bottle",
    materials: [GL("cuerpo", "Botella de vidrio para cava o espumoso")],
  },

  // ── 12. Sidra botella ─────────────────────────────────────────────────────
  {
    keywords: [
      "sidra", "sidra natural", "sidra brut", "cider", "sidra asturiana",
      "el gaitero", "sidrería", "sidra dulce", "hard cider",
    ],
    packaging_type: "bottle",
    materials: [
      GL("cuerpo", "Botella de vidrio para sidra"),
      FE("tapón corona", "Chapa metálica de acero"),
    ],
  },

  // ── 13. Refresco — lata ───────────────────────────────────────────────────
  {
    keywords: [
      "refresco", "coca cola", "pepsi", "fanta", "sprite", "seven up",
      "schweppes", "nestea", "cola", "gaseosa lata", "tónica lata",
      "tonica lata",
    ],
    packaging_type: "can",
    materials: [ALU("cuerpo", "Lata de aluminio para refresco")],
  },

  // ── 14. Refresco — botella PET ────────────────────────────────────────────
  {
    keywords: [
      "refresco", "coca cola", "pepsi", "fanta", "sprite", "seven up",
      "schweppes", "nestea", "cola", "gaseosa", "limonada", "tónica",
    ],
    packaging_type: "bottle",
    materials: [
      PET("cuerpo", "Botella PET para refresco"),
      PP("tapón", "Tapón de rosca PP"),
    ],
  },

  // ── 15. Bebida energética — lata ──────────────────────────────────────────
  {
    keywords: [
      "energética", "energetica", "red bull", "monster", "burn",
      "rockstar", "energizante", "bebida energetica", "energy drink",
      "relentless",
    ],
    packaging_type: "can",
    materials: [ALU("cuerpo", "Lata de aluminio para bebida energética")],
  },

  // ── 16. Bebida isotónica / deportiva ──────────────────────────────────────
  {
    keywords: [
      "isotónica", "isotonica", "deportiva", "powerade", "gatorade",
      "aquarius", "isostar", "sport drink", "electrolitos", "bebida deportiva",
      "isotonic",
    ],
    packaging_type: "bottle",
    materials: [
      PET("cuerpo", "Botella PET para bebida deportiva"),
      PP("tapón", "Tapón de rosca PP"),
    ],
  },

  // ── 17. Zumo / bebida vegetal — brick ─────────────────────────────────────
  {
    keywords: [
      "zumo brick", "zumo brik", "zumo tetra", "bebida vegetal", "leche avena",
      "leche soja", "leche almendra", "alpro", "oatly", "bebida de avena",
      "bebida de soja", "bebida de arroz",
    ],
    materials: [BRICK("cuerpo", "Brick multicapa para zumo o bebida vegetal")],
  },

  // ── 18. Zumo — botella PET ────────────────────────────────────────────────
  {
    keywords: [
      "zumo", "jugo", "néctar", "nectar", "zumo naranja", "zumo manzana",
      "zumo piña", "jugo natural", "don simon", "minute maid", "tropicana",
    ],
    packaging_type: "bottle",
    materials: [
      PET("cuerpo", "Botella PET para zumo"),
      PP("tapón", "Tapón de rosca PP"),
    ],
  },

  // ── 19. Zumo — botella vidrio ─────────────────────────────────────────────
  {
    keywords: [
      "zumo vidrio", "zumo botella vidrio", "jugo vidrio",
      "zumo premium vidrio", "jugo prensado frío",
    ],
    packaging_type: "bottle",
    materials: [
      GL("cuerpo", "Botella de vidrio para zumo premium"),
      FE("tapa metálica", "Tapa metálica de acero"),
    ],
  },

  // ── 20. Aceite de oliva — vidrio ──────────────────────────────────────────
  {
    keywords: [
      "aceite de oliva", "aceite oliva", "aove", "aceite virgen extra",
      "aceite oliva virgen", "arbequina", "hojiblanca", "picual",
      "aceite de oliva premium",
    ],
    packaging_type: ["bottle", "jar"],
    materials: [
      GL("cuerpo", "Botella de vidrio para aceite de oliva"),
      PP("tapón", "Tapón de rosca PP"),
    ],
  },

  // ── 21. Aceite girasol / garrafa PET ──────────────────────────────────────
  {
    keywords: [
      "aceite girasol", "aceite de girasol", "aceite vegetal",
      "garrafa de aceite", "aceite refinado", "aceite de maíz",
      "aceite de colza", "aceite de semillas",
    ],
    packaging_type: "bottle",
    materials: [
      PET("cuerpo", "Botella PET o garrafa para aceite vegetal"),
      PP("tapón", "Tapón de rosca PP"),
    ],
  },

  // ── 22. Vinagre — vidrio ──────────────────────────────────────────────────
  {
    keywords: [
      "vinagre", "vinagre de vino", "vinagre de manzana", "vinagre balsámico",
      "vinagre balsamico", "aceto", "vinagre de jerez", "vinagre de sidra",
      "balsamic vinegar",
    ],
    packaging_type: ["bottle", "jar"],
    materials: [
      GL("cuerpo", "Botella de vidrio para vinagre"),
      PP("tapón", "Tapón de rosca PP"),
    ],
  },

  // ── 23. Ketchup squeeze ───────────────────────────────────────────────────
  {
    keywords: [
      "ketchup", "catsup", "salsa ketchup", "heinz", "orlando ketchup",
      "ketchup squeeze", "tomato ketchup", "salsa tomate squeeze",
    ],
    packaging_type: "bottle",
    materials: [
      PET("cuerpo", "Envase squeeze de PET para ketchup"),
      PP("tapón dosificador", "Tapón dosificador de PP"),
    ],
  },

  // ── 24. Mayonesa — vidrio ─────────────────────────────────────────────────
  {
    keywords: [
      "mayonesa vidrio", "mahonesa vidrio", "mayonesa tarro vidrio",
      "mayonesa en tarro", "hellmann vidrio", "mayonesa artesana",
    ],
    packaging_type: "jar",
    materials: [
      GL("cuerpo", "Tarro de vidrio para mayonesa"),
      FE("tapa", "Tapa metálica de acero"),
    ],
  },

  // ── 25. Mayonesa — PP ─────────────────────────────────────────────────────
  {
    keywords: [
      "mayonesa", "mahonesa", "hellmann", "calvé", "calve", "mayonesa light",
      "mayonesa casera", "salsa mayonesa",
    ],
    materials: [
      PP("cuerpo", "Bote de PP para mayonesa"),
      PP("tapa", "Tapa de PP"),
    ],
  },

  // ── 26. Tomate frito — vidrio ─────────────────────────────────────────────
  {
    keywords: [
      "tomate frito vidrio", "tomate natural vidrio", "tomate triturado vidrio",
      "passata vidrio", "salsa tomate vidrio", "tomate frito tarro",
    ],
    packaging_type: ["jar", "bottle"],
    materials: [
      GL("cuerpo", "Tarro o botella de vidrio para tomate"),
      FE("tapa", "Tapa metálica de acero"),
    ],
  },

  // ── 27. Tomate frito / gazpacho — brick ───────────────────────────────────
  {
    keywords: [
      "tomate frito brick", "gazpacho brick", "gazpacho tetra",
      "tomate tetra", "passata brick", "gazpacho carton", "salmorejo brick",
    ],
    materials: [BRICK("cuerpo", "Brick multicapa para tomate frito o gazpacho")],
  },

  // ── 28. Mermelada / confitura ─────────────────────────────────────────────
  {
    keywords: [
      "mermelada", "confitura", "jam", "mermelada fresa", "mermelada naranja",
      "confitura artesanal", "bonne maman", "hero mermelada",
      "mermelada sin azúcar",
    ],
    packaging_type: "jar",
    materials: [
      GL("cuerpo", "Tarro de vidrio para mermelada"),
      FE("tapa", "Tapa metálica de acero"),
    ],
  },

  // ── 29. Miel ──────────────────────────────────────────────────────────────
  {
    keywords: [
      "miel", "honey", "miel de abeja", "miel de flores", "miel cruda",
      "miel artesanal", "apícola", "miel de romero", "miel ecológica",
    ],
    packaging_type: "jar",
    materials: [
      GL("cuerpo", "Tarro de vidrio para miel"),
      FE("tapa", "Tapa metálica de acero"),
    ],
  },

  // ── 30. Aceitunas ─────────────────────────────────────────────────────────
  {
    keywords: [
      "aceitunas", "olivas", "aceitunas verdes", "aceitunas negras",
      "aceitunas rellenas", "manzanilla", "olives", "aceitunas camperas",
      "aceituna gordal",
    ],
    packaging_type: "jar",
    materials: [
      GL("cuerpo", "Tarro de vidrio para aceitunas"),
      FE("tapa", "Tapa metálica de acero"),
    ],
  },

  // ── 31. Conservas tomate — lata ───────────────────────────────────────────
  {
    keywords: [
      "conserva de tomate", "conservas tomate", "tomate en lata", "tomate lata",
      "tomate triturado lata", "tomate entero lata", "passata lata",
      "tomate pelado lata",
    ],
    packaging_type: "can",
    materials: [FE("cuerpo", "Lata de acero para conserva de tomate")],
  },

  // ── 32. Atún / bonito — lata ──────────────────────────────────────────────
  {
    keywords: [
      "atún", "atun", "bonito", "atún en aceite", "atún al natural",
      "bonito del norte", "tuna", "atún claro", "atún en escabeche",
    ],
    packaging_type: "can",
    materials: [FE("cuerpo", "Lata de acero para conserva de atún")],
  },

  // ── 33. Sardinas / anchoas — lata ─────────────────────────────────────────
  {
    keywords: [
      "sardinas", "anchoas", "anchovas", "sardina en aceite",
      "boquerones lata", "mejillones lata", "berberechos lata",
      "caballa lata", "sardine",
    ],
    packaging_type: "can",
    materials: [FE("cuerpo", "Lata de acero para conserva de sardinas o anchoas")],
  },

  // ── 34. Pasta seca — caja ─────────────────────────────────────────────────
  {
    keywords: [
      "pasta seca", "espagueti", "espaguetis", "macarrones", "penne",
      "fusilli", "tallarines", "lasaña", "lasagna", "fideos", "fettuccine",
    ],
    packaging_type: "box",
    materials: [PAP_BOX("cuerpo", "Caja de cartón para pasta seca")],
  },

  // ── 35. Arroz — bolsa ─────────────────────────────────────────────────────
  {
    keywords: [
      "arroz", "arroz largo", "arroz redondo", "arroz integral",
      "arroz basmati", "rice", "arroz vaporizador", "arroz bomba",
      "arroz arborio",
    ],
    packaging_type: "bag",
    materials: [LDPE("cuerpo", "Bolsa de polietileno para arroz")],
  },

  // ── 36. Harina — bolsa papel ──────────────────────────────────────────────
  {
    keywords: [
      "harina", "harina de trigo", "harina integral", "harina espelta",
      "harina maíz", "flour", "harina repostería", "harina fuerza",
      "harina sin gluten",
    ],
    packaging_type: "bag",
    materials: [PAP_PAPER("cuerpo", "Bolsa de papel kraft para harina")],
  },

  // ── 37. Azúcar — bolsa ────────────────────────────────────────────────────
  {
    keywords: [
      "azúcar", "azucar", "azúcar blanco", "azúcar moreno",
      "azúcar integral", "azúcar moreno integral", "sugar", "azúcar glass",
      "azucar glas",
    ],
    packaging_type: "bag",
    materials: [LDPE("cuerpo", "Bolsa de polietileno para azúcar")],
  },

  // ── 38. Sal — caja ────────────────────────────────────────────────────────
  {
    keywords: [
      "sal marina", "sal gruesa", "sal fina", "sal yodada", "sal de mesa",
      "sal gorda", "salinera", "flor de sal", "sal ahumada",
    ],
    packaging_type: "box",
    materials: [PAP_BOX("cuerpo", "Caja de cartón para sal")],
  },

  // ── 39. Cereales desayuno — caja ──────────────────────────────────────────
  {
    keywords: [
      "cereales", "cornflakes", "muesli", "granola", "copos de avena",
      "kellogg", "nestle cereales", "cheerios", "corn flakes",
      "cereales desayuno",
    ],
    packaging_type: "box",
    materials: [
      PAP_BOX("caja", "Caja de cartón para cereales de desayuno"),
      LDPE("bolsa interior", "Bolsa interior de LDPE"),
    ],
  },

  // ── 40. Café molido — bolsa ───────────────────────────────────────────────
  {
    keywords: [
      "café molido", "cafe molido", "café en grano", "cafe en grano",
      "café natural", "cafe natural", "café torrefacto", "ground coffee",
      "café premium", "cafe gourmet",
    ],
    packaging_type: "bag",
    materials: [CPAP("cuerpo", "Bolsa flexible laminada con válvula para café molido")],
  },

  // ── 41. Café en cápsulas ALU ──────────────────────────────────────────────
  {
    keywords: [
      "café en cápsulas", "cápsulas de café", "capsulas de cafe",
      "café capsulas", "nespresso", "dolce gusto", "compatible nespresso",
      "cápsula café", "capsula cafe", "café en capsula",
    ],
    materials: [
      ALU("cápsula", "Cápsula de aluminio estándar para café"),
      PP("membrana", "Membrana de PP termosellada de la cápsula"),
    ],
  },

  // ── 42. Galletas — caja ───────────────────────────────────────────────────
  {
    keywords: [
      "galletas", "cookies", "biscuits", "galleta maría", "digestive",
      "galletas campurrianas", "oreo", "chips ahoy", "galletas integrales",
      "galleta avena",
    ],
    packaging_type: "box",
    materials: [
      PAP_BOX("caja", "Caja de cartón para galletas"),
      PP("bandeja interior", "Bandeja o envoltorio interior de PP"),
    ],
  },

  // ── 43. Chocolate — tableta ───────────────────────────────────────────────
  {
    keywords: [
      "chocolate", "tableta chocolate", "chocolate negro", "chocolate con leche",
      "chocolate blanco", "chocolatina", "cacao", "tableta cacao",
      "chocolate artesano",
    ],
    packaging_type: "box",
    materials: [
      CPAP("envoltorio laminado", "Envoltorio laminado interior del chocolate"),
      PAP_BOX("caja exterior", "Caja de cartón exterior"),
    ],
  },

  // ── 44. Patatas fritas — bolsa ────────────────────────────────────────────
  {
    keywords: [
      "patatas fritas", "chips", "crisps", "lays", "lay's", "ruffles",
      "doritos", "nachos", "snack patatas", "patatas onduladas",
    ],
    packaging_type: "bag",
    materials: [CPAP("cuerpo", "Bolsa flexible laminada metalizada para snack")],
  },

  // ── 45. Frutos secos — bolsa ──────────────────────────────────────────────
  {
    keywords: [
      "frutos secos", "almendras", "nueces", "pistachos", "cacahuetes",
      "anacardos", "mix de frutos", "nuts", "avellanas", "pipas",
    ],
    packaging_type: "bag",
    materials: [CPAP("cuerpo", "Bolsa flexible laminada para frutos secos")],
  },

  // ── 46. Detergente lavadora ───────────────────────────────────────────────
  {
    keywords: [
      "detergente", "detergente lavadora", "detergente ropa", "ariel",
      "persil", "skip", "surf", "wipp", "dash", "detergente liquido",
    ],
    packaging_type: "bottle",
    materials: [
      HDPE("cuerpo", "Botella opaca de HDPE para detergente"),
      PP("tapón dosificador", "Tapón dosificador de PP"),
    ],
  },

  // ── 47. Champú ────────────────────────────────────────────────────────────
  {
    keywords: [
      "champú", "champu", "shampoo", "champú anticaspa", "champú hidratante",
      "head shoulders", "pantene", "elvive", "l'oreal champú",
      "champú seco",
    ],
    packaging_type: "bottle",
    materials: [
      HDPE("cuerpo", "Botella de HDPE para champú"),
      PP("tapón abatible", "Tapón abatible de PP"),
    ],
  },

  // ── 48. Gel de ducha ──────────────────────────────────────────────────────
  {
    keywords: [
      "gel de ducha", "gel ducha", "shower gel", "gel corporal",
      "body wash", "jabón líquido", "fa gel", "dove gel", "nivea gel",
      "gel exfoliante",
    ],
    packaging_type: "bottle",
    materials: [
      HDPE("cuerpo", "Botella de HDPE para gel de ducha"),
      PP("tapón abatible", "Tapón abatible de PP"),
    ],
  },

  // ── 49. Suavizante ropa ───────────────────────────────────────────────────
  {
    keywords: [
      "suavizante", "suavizante ropa", "fabric softener", "mimosín",
      "mimosin", "lenor", "vernel", "comfort suavizante",
      "suavizante concentrado",
    ],
    packaging_type: "bottle",
    materials: [
      HDPE("cuerpo", "Botella de HDPE para suavizante"),
      PP("tapón dosificador", "Tapón dosificador de PP"),
    ],
  },

  // ── 50. Lejía ─────────────────────────────────────────────────────────────
  {
    keywords: [
      "lejía", "lejia", "bleach", "hipoclorito", "lejía ropa",
      "lejía limpieza", "neutrex", "estrella lejía", "clorox",
      "lejía perfumada",
    ],
    packaging_type: "bottle",
    materials: [
      HDPE("cuerpo", "Botella de HDPE para lejía"),
      PP("tapón", "Tapón de rosca PP"),
    ],
  },

  // ── 51. Limpiahogar spray ─────────────────────────────────────────────────
  {
    keywords: [
      "limpiahogar", "limpiador multiusos", "spray limpiador",
      "limpia hogar", "mr musculo", "mr. muscle", "cif spray",
      "ajax spray", "multiusos", "limpiacristales",
    ],
    packaging_type: "bottle",
    materials: [
      HDPE("cuerpo", "Botella de HDPE con cabezal spray"),
      PP("cabezal spray", "Cabezal difusor de PP"),
    ],
  },

  // ── 52. Pasta de dientes — tubo ───────────────────────────────────────────
  {
    keywords: [
      "pasta de dientes", "pasta dentífrica", "pasta dentrifica",
      "dentifrico", "colgate", "oral b", "oral-b", "sensodyne",
      "crema dental", "pasta fluor",
    ],
    packaging_type: "tube",
    materials: [
      LDPE("tubo", "Tubo flexible de LDPE para pasta dentífrica"),
      PP("tapa", "Tapa de PP del tubo"),
    ],
  },

  // ── 53. Desodorante — aerosol ─────────────────────────────────────────────
  {
    keywords: [
      "desodorante", "deodorant", "antitranspirante", "axe",
      "rexona", "nivea desodorante", "dove deo", "fa desodorante",
      "desodorante spray", "deo aerosol",
    ],
    packaging_type: "can",
    materials: [
      ALU("cuerpo aerosol", "Lata de aluminio para aerosol"),
      PP("tapa", "Tapa plástica de PP"),
    ],
  },

  // ── 54. Desodorante — roll-on ─────────────────────────────────────────────
  {
    keywords: [
      "desodorante roll", "roll-on", "roll on", "desodorante bola",
      "deo roll", "rollon", "deodorante roll",
    ],
    packaging_type: "bottle",
    materials: [
      HDPE("cuerpo", "Botella de HDPE para roll-on"),
      PP("bola y tapa", "Bola aplicadora y tapa de PP"),
    ],
  },

  // ── 55. Caldo / consommé — brick ──────────────────────────────────────────
  {
    keywords: [
      "caldo", "consomé", "consome", "consommé", "caldo de pollo",
      "caldo de verduras", "caldo de pescado", "caldo casero",
      "knorr caldo", "avecrem",
    ],
    materials: [BRICK("cuerpo", "Brick multicapa Tetra Pak para caldo o consommé")],
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Looks up pre-mapped materials for a known Spanish SME product.
 *
 * Returns an array of DetectedMaterial with inference_method:"lookup" if the
 * product name matches a known entry, or null if no match is found.
 *
 * When `aiResult` is provided, the AI-detected `packaging_type` is used as a
 * tie-breaker to disambiguate entries that share keywords (e.g. cerveza en
 * lata vs. cerveza en botella).
 *
 * Algorithm:
 *  1. Find all entries where any keyword is a substring of productName.
 *  2. No matches → null.
 *  3. Exactly one match → return it (packaging_type filter not needed).
 *  4. Multiple matches + aiResult → filter by packaging_type.
 *     - One filtered result → return it.
 *     - Still multiple or none → return first match as safe fallback.
 *  5. Multiple matches, no aiResult → return first match.
 */
export function lookupProductMaterials(
  productName: string,
  aiResult?: { packaging_type: string }
): DetectedMaterial[] | null {
  const normalized = productName.toLowerCase();

  // Step 1: collect all entries where any keyword is a substring
  const matches = PRODUCT_LOOKUP.filter((entry) =>
    entry.keywords.some((kw) => normalized.includes(kw))
  );

  // Step 2: no matches
  if (matches.length === 0) return null;

  // Step 3: exactly one match — return it directly
  if (matches.length === 1) return matches[0].materials;

  // Step 4: multiple matches — use packaging_type to disambiguate
  if (aiResult?.packaging_type) {
    const aiType = aiResult.packaging_type.toLowerCase();
    const filtered = matches.filter((entry) => {
      if (!entry.packaging_type) return true; // no filter = always eligible
      const types = Array.isArray(entry.packaging_type)
        ? entry.packaging_type
        : [entry.packaging_type];
      return types.some((t) => t.toLowerCase() === aiType);
    });

    if (filtered.length === 1) return filtered[0].materials;
    // Multiple or zero after filtering → safest fallback is first filtered,
    // or first overall if no entries passed the filter
    if (filtered.length > 0) return filtered[0].materials;
  }

  // Step 5: no aiResult or no entry passed the filter → first overall match
  return matches[0].materials;
}
