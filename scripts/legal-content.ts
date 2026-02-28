/**
 * Knowledge base: RD 1055/2022 — Real Decreto de envases y residuos de envases (España)
 * Each entry is one chunk that will be embedded and stored in legal_docs.
 */

export interface LegalChunk {
  title: string;
  article_ref: string;
  content: string;
  metadata?: Record<string, string>;
}

export const LEGAL_CHUNKS: LegalChunk[] = [
  // ─── OBLIGACIONES GENERALES ───────────────────────────────────────────────
  {
    title: "Obligaciones generales de etiquetado de envases",
    article_ref: "RD 1055/2022 Art. 9",
    content: `Los productores de productos envasados están obligados a etiquetar sus envases de acuerdo con el RD 1055/2022. El etiquetado debe incluir: (1) el código de identificación del material de envasado según el Anexo II, (2) el símbolo de reciclaje (bucle de Möbius) cuando proceda, y (3) el símbolo de Punto Verde si el productor está adherido al Sistema Integrado de Gestión (SIG). El etiquetado debe ser visible, legible, indeleble y estar colocado directamente en el envase o en una etiqueta adherida al mismo. Los envases de menos de 10 cm² en cualquiera de sus lados quedan exentos de la obligación de indicar el código de material, pero no del resto de requisitos.`,
    metadata: { category: "obligaciones", topic: "etiquetado_general" },
  },
  {
    title: "Definiciones clave de envases según RD 1055/2022",
    article_ref: "RD 1055/2022 Art. 2",
    content: `Envase: todo producto fabricado con materiales de cualquier naturaleza que se utilice para contener, proteger, manipular, distribuir y presentar mercancías. Envase primario: aquel que está en contacto directo con el producto. Envase secundario o colectivo: el que agrupa varios envases primarios. Envase terciario o de transporte: el destinado al transporte de mercancías a granel. Productor: la persona física o jurídica que, con independencia de la técnica de venta utilizada, incluida la venta a distancia, fabrica, importa o adquiere en otros Estados miembros de la UE envases o productos envasados. Material de envase: la materia prima empleada en la fabricación del envase.`,
    metadata: { category: "definiciones" },
  },

  // ─── IDENTIFICACIÓN DE MATERIALES — PLÁSTICOS ────────────────────────────
  {
    title: "Códigos de identificación de materiales plásticos",
    article_ref: "RD 1055/2022 Anexo II — Plásticos",
    content: `Los plásticos deben identificarse con el símbolo del triángulo de reciclaje (tres flechas en bucle) con el número correspondiente en el interior y las siglas debajo: 01-PET (Polietileno tereftalato) — botellas de agua, refrescos, aceite. 02-HDPE (Polietileno de alta densidad) — botellas de champú, leche, detergente. 03-PVC (Policloruro de vinilo) — tuberías, envases de aceite vegetal. 04-LDPE (Polietileno de baja densidad) — bolsas de plástico, film transparente, envases flexibles. 05-PP (Polipropileno) — tapones, envases de yogur, fiambreras. 06-PS (Poliestireno) — bandejas de carne, vasos desechables, cajas de CD. 07-O (Otros plásticos) — plásticos compuestos o multicapa que no encajan en las categorías anteriores, como policarbonato (PC) o ABS.`,
    metadata: { category: "materiales", topic: "plasticos" },
  },
  {
    title: "Etiquetado PET — Polietileno tereftalato",
    article_ref: "RD 1055/2022 Anexo II — Código 01",
    content: `El polietileno tereftalato (PET, código 01) es uno de los plásticos más reciclados. Se usa principalmente en botellas de bebidas (agua, refrescos, zumos), envases de aceite y bandejas de alimentos. El símbolo de reciclaje debe mostrar el número 1 dentro del triángulo de flechas con las siglas PET debajo. Los envases de PET con el símbolo de Punto Verde deben haber pagado el canon de adherencia al SIG (Ecoembes). En España, los envases de PET superiores a 0,1 litros destinados a bebidas están sujetos al futuro SDDR (Sistema de Depósito, Devolución y Retorno).`,
    metadata: { category: "materiales", topic: "plasticos", material: "PET" },
  },
  {
    title: "Etiquetado HDPE — Polietileno de alta densidad",
    article_ref: "RD 1055/2022 Anexo II — Código 02",
    content: `El polietileno de alta densidad (HDPE, código 02) se usa en botellas de leche, detergentes, champús y envases de productos de limpieza. Código de identificación: triángulo con el número 2 y siglas HDPE. Es considerado uno de los materiales plásticos más reciclables. Los envases de HDPE deben depositarse en el contenedor amarillo (envases ligeros) en España. El etiquetado debe incluir el código 02-HDPE visible en el envase.`,
    metadata: { category: "materiales", topic: "plasticos", material: "HDPE" },
  },
  {
    title: "Etiquetado PP — Polipropileno",
    article_ref: "RD 1055/2022 Anexo II — Código 05",
    content: `El polipropileno (PP, código 05) se utiliza en tapones de botellas, envases de yogur, recipientes para microondas y fiambreras reutilizables. Código de identificación: triángulo con el número 5 y siglas PP. Los tapones de botellas de plástico que sean de PP deben etiquetarse con 05-PP. Los envases de PP ligeros van al contenedor amarillo. Si el envase principal es PET (01) y el tapón es PP (05), ambos materiales pueden indicarse en el etiquetado de forma diferenciada.`,
    metadata: { category: "materiales", topic: "plasticos", material: "PP" },
  },
  {
    title: "Etiquetado LDPE — Film y bolsas de plástico",
    article_ref: "RD 1055/2022 Anexo II — Código 04",
    content: `El polietileno de baja densidad (LDPE, código 04) se emplea en film transparente de cocina, bolsas de plástico, envases de pan de molde, envases flexibles tipo doypack. Código de identificación: triángulo con número 4 y siglas LDPE. Las bolsas de plástico delgadas (< 50 micras) están sujetas a restricciones adicionales en España. El film plástico debe depositarse en el contenedor amarillo.`,
    metadata: { category: "materiales", topic: "plasticos", material: "LDPE" },
  },

  // ─── PAPEL Y CARTÓN ───────────────────────────────────────────────────────
  {
    title: "Códigos de identificación de materiales de papel y cartón",
    article_ref: "RD 1055/2022 Anexo II — Papel y Cartón",
    content: `Los envases de papel y cartón se identifican con los siguientes códigos: 20-PAP (Cartón corrugado) — cajas de transporte y embalaje secundario. 21-PAP (Cartón no corrugado) — cajas de cereales, cartones de leche, cajas de medicamentos. 22-PAP (Papel) — bolsas de papel, papel de envolver, papel de seda. Los envases de papel y cartón deben depositarse en el contenedor azul (papel y cartón) en España. El símbolo debe ser el triángulo de reciclaje con el número correspondiente y las siglas PAP. El cartón para bebidas (tetrabrik) es un material compuesto que lleva el código C/PAP o 81-C/PAP.`,
    metadata: { category: "materiales", topic: "papel_carton" },
  },

  // ─── VIDRIO ───────────────────────────────────────────────────────────────
  {
    title: "Códigos de identificación de materiales de vidrio",
    article_ref: "RD 1055/2022 Anexo II — Vidrio",
    content: `Los envases de vidrio se identifican con los siguientes códigos según el color: 70-GL (Vidrio incoloro/transparente) — botellas de agua, frascos de conservas, botellas de vino blanco. 71-GL (Vidrio verde) — botellas de vino tinto, botellas de cerveza verde. 72-GL (Vidrio marrón/ámbar) — botellas de cerveza, frascos de medicamentos. Los envases de vidrio se depositan en el contenedor verde (iglú) en España. El vidrio es 100% reciclable de forma indefinida sin pérdida de calidad. El código GL debe aparecer en el triángulo de reciclaje.`,
    metadata: { category: "materiales", topic: "vidrio" },
  },

  // ─── METALES ──────────────────────────────────────────────────────────────
  {
    title: "Códigos de identificación de materiales metálicos",
    article_ref: "RD 1055/2022 Anexo II — Metales",
    content: `Los envases metálicos se identifican con los siguientes códigos: 40-FE (Acero/hojalata) — latas de conservas, aerosoles, tapas metálicas, botes de pintura. 41-ALU (Aluminio) — latas de bebidas, papel de aluminio, bandejas de aluminio, cápsulas de café. Los envases metálicos se depositan en el contenedor amarillo (envases ligeros). El aluminio es infinitamente reciclable. Las latas de acero contienen un imán, lo que facilita su separación en las plantas de reciclaje. El código debe aparecer dentro del triángulo de reciclaje con las siglas FE o ALU.`,
    metadata: { category: "materiales", topic: "metales" },
  },

  // ─── PUNTO VERDE ──────────────────────────────────────────────────────────
  {
    title: "Sistema Punto Verde — obligaciones y uso del símbolo",
    article_ref: "RD 1055/2022 Art. 11 — Sistema Integrado de Gestión",
    content: `El símbolo Punto Verde (dos flechas verdes entrelazadas formando un círculo) identifica los envases de empresas que financian los sistemas de gestión de residuos de envases (SIG) en España, principalmente Ecoembes (envases ligeros y cartón) y Ecovidrio (vidrio). La adhesión al SIG es obligatoria para los productores que pongan en el mercado más de 250 kg/año de envases domésticos. Las empresas adheridas pagan un canon por tonelada de envase puesto en el mercado. El uso del símbolo Punto Verde SIN estar adherido al SIG es una infracción grave sancionable con multas de hasta 100.000€. El símbolo debe reproducirse en verde sobre fondo claro o en negativo sobre fondo oscuro, con unas dimensiones mínimas de 9 mm de diámetro.`,
    metadata: { category: "simbolos", topic: "punto_verde" },
  },

  // ─── PLÁSTICOS DE UN SOLO USO (SUP) ──────────────────────────────────────
  {
    title: "Etiquetado obligatorio de plásticos de un solo uso (SUP)",
    article_ref: "RD 1055/2022 Art. 6 — Directiva 2019/904/CE",
    content: `Los productos plásticos de un solo uso (Single-Use Plastics, SUP) requieren un etiquetado específico obligatorio desde 2021. Los productos afectados incluyen: compresas higiénicas, tampones y aplicadores, toallitas húmedas, globos, tazas para bebidas con contenido en plástico, recipientes de comida con contenido en plástico, y filtros de tabaco con plástico. El etiquetado debe incluir el pictograma oficial de la Directiva 2019/904/CE (figura humana tirando basura con una aspa roja) indicando que el producto contiene plástico y pautas de gestión correcta de residuos. El etiquetado debe estar impreso directamente en el producto o su envase, ser visible, claramente legible y permanente, en español.`,
    metadata: { category: "plasticos_uso_unico", topic: "SUP" },
  },
  {
    title: "Restricciones y prohibiciones de plásticos de un solo uso",
    article_ref: "RD 1055/2022 Art. 6 — Anexo VI",
    content: `Desde julio de 2021 están prohibidos en España y la UE los siguientes plásticos de un solo uso: platos de plástico, cubiertos de plástico (tenedores, cuchillos, cucharas, palillos), pajitas de plástico, bastoncillos de algodón con varilla de plástico, agitadores de bebidas, soportes de plástico para globos, vasos y recipientes de poliestireno expandido (EPS/corcho blanco) para alimentos y bebidas. Las empresas que aún fabriquen o importen estos productos cometen una infracción muy grave. Los productores de productos SUP permitidos (con etiquetado) deben contribuir a los costes de limpieza y sensibilización.`,
    metadata: { category: "plasticos_uso_unico", topic: "prohibiciones_SUP" },
  },

  // ─── MATERIALES COMPUESTOS ────────────────────────────────────────────────
  {
    title: "Identificación de materiales compuestos y multicapa",
    article_ref: "RD 1055/2022 Anexo II — Materiales compuestos",
    content: `Los envases fabricados con más de un material (multicapa o compuestos) se identifican con la letra C seguida del material predominante: 81-C/PAP (Cartón para bebidas tipo tetrabrik — principalmente papel/cartón con capas de polietileno y aluminio). 82-C/LDPE (Compuesto de polietileno de baja densidad con otro material). 83-C/PP (Compuesto de polipropileno). 84-C/PS (Compuesto de poliestireno). 90-C/ABS, 91-C/POM, etc. para otros compuestos. Cuando el material sea ambiguo o no pueda identificarse claramente con los códigos estándar, se debe utilizar el código 07-O (otros plásticos) o el código compuesto correspondiente. Nunca se debe adivinar el código; si hay duda, consultar la ficha técnica del material con el fabricante del envase.`,
    metadata: { category: "materiales", topic: "compuestos" },
  },

  // ─── SANCIONES ────────────────────────────────────────────────────────────
  {
    title: "Régimen sancionador — infracciones y multas en etiquetado",
    article_ref: "RD 1055/2022 Art. 35-38 — Ley 7/2022",
    content: `El régimen sancionador del RD 1055/2022 se aplica conjuntamente con la Ley 7/2022 de residuos y suelo contaminado. Infracciones leves (hasta 10.000€): no incluir el código de identificación de materiales en el envase, etiquetado ilegible o en idioma no oficial del Estado. Infracciones graves (hasta 100.000€): usar el símbolo Punto Verde sin estar adherido al SIG, no declarar los envases puestos en el mercado, etiquetado que induzca a error sobre la reciclabilidad del producto. Infracciones muy graves (hasta 3.500.000€): comercializar productos SUP prohibidos, obstrucción a la inspección, reincidencia en infracciones graves. Las multas se calculan teniendo en cuenta el volumen de negocio del infractor y el daño medioambiental causado.`,
    metadata: { category: "sanciones" },
  },

  // ─── ENVASES REUTILIZABLES ────────────────────────────────────────────────
  {
    title: "Etiquetado de envases reutilizables",
    article_ref: "RD 1055/2022 Art. 13 — Envases reutilizables",
    content: `Los envases diseñados para ser reutilizados deben etiquetarse con el símbolo de reutilización (bucle de Möbius con las flechas apuntando hacia adentro, diferenciado del símbolo de reciclaje) y la indicación "REUTILIZABLE" o "ENVASE REUTILIZABLE". Los productores que distribuyan envases reutilizables deben establecer sistemas de recogida y retorno. Para 2030, el 10% de los envases de bebidas deben ofrecerse en formato reutilizable. Los envases reutilizables quedan exentos del pago al SIG durante los ciclos de reutilización, pero deben tributar cuando se conviertan en residuo.`,
    metadata: { category: "reutilizables" },
  },

  // ─── REQUISITOS DE DISEÑO ─────────────────────────────────────────────────
  {
    title: "Requisitos técnicos del etiquetado — tamaño y visibilidad",
    article_ref: "RD 1055/2022 Art. 9.3 — Requisitos técnicos",
    content: `El etiquetado de materiales en envases debe cumplir estos requisitos técnicos: (1) El código de identificación de material (triángulo + número + siglas) debe tener una altura mínima de 13 mm para envases de más de 200 ml. (2) Para envases entre 50-200 ml la altura mínima es 10 mm. (3) Para envases menores de 50 ml la altura mínima es 6 mm. (4) Los envases con superficie total de etiquetado menor de 10 cm² están exentos del código de material pero no del Punto Verde si aplica. (5) El símbolo no debe estar oculto, disimulado ni separado por otros textos o gráficos de forma que dificulte su localización. (6) El color no está regulado pero se recomienda contraste suficiente para garantizar la legibilidad.`,
    metadata: { category: "requisitos_tecnicos", topic: "dimensiones" },
  },

  // ─── GRUPO J — CHUNKS DE REFERENCIAS CRUZADAS ────────────────────────────
  {
    title: "Referencia cruzada: Art. 13.2 indicación de contenedor → Arts. 46.8 y 47.7 SDDR",
    article_ref: "RD 1055/2022 — Referencia cruzada Art. 13.2 / Arts. 46.8-47.7",
    content: `Referencia cruzada entre obligaciones de etiquetado y SDDR: El Art. 13.2 exige indicar el contenedor de recogida en envases domésticos. Cuando el envase esté también sujeto al SDDR (Arts. 46.8 y 47.7), la indicación del contenedor debe complementarse con la información del SDDR: importe del depósito, símbolo SDDR y punto de retorno. Véase también Arts. 46.8 (obligaciones productor SDDR) y 47.7 (calendario SDDR). Durante el período transitorio en que el SDDR no sea aún obligatorio para esa categoría, la indicación del contenedor amarillo o verde sigue aplicando con normalidad.`,
    metadata: { category: "referencias_cruzadas", topic: "art13_SDDR" },
  },
  {
    title: "Referencia cruzada: Compostabilidad Art. 13.5 → normas UNE EN 13432:2001 y EN 14995:2006",
    article_ref: "RD 1055/2022 — Referencia cruzada Art. 13.5 / UNE EN 13432 / EN 14995",
    content: `Referencia cruzada entre el Art. 13.5 (marcado de compostabilidad) y las normas técnicas aplicables: El Art. 13.5 remite expresamente a la norma UNE EN 13432:2001 para envases y a la norma EN 14995:2006 para plásticos en general. Véase también: norma ISO 17088 (especificaciones para plásticos compostables); criterio OK compost HOME (TÜV Austria) para compostabilidad doméstica no cubierta por las normas UNE/EN. La Nota Interpretativa MITECO diciembre 2024 exige diferenciar explícitamente entre compostabilidad industrial y doméstica en el etiquetado. Los envases compostables no son reciclables en los flujos convencionales; no deben etiquetarse con el triángulo de reciclaje estándar.`,
    metadata: { category: "referencias_cruzadas", topic: "compostabilidad_normas" },
  },
  {
    title: "Referencia cruzada: Plásticos SUP Art. 13.7 → Reglamento UE 2020/2151 pictogramas",
    article_ref: "RD 1055/2022 — Referencia cruzada Art. 13.7 / Reglamento UE 2020/2151",
    content: `Referencia cruzada entre el Art. 13.7 (pictograma SUP) y el Reglamento de Ejecución UE 2020/2151: El Art. 13.7 del RD 1055/2022 es la transposición española del mandato de la Directiva SUP 2019/904/CE de incluir pictogramas en productos plásticos de un solo uso. El Reglamento UE 2020/2151 especifica exactamente el diseño, las dimensiones mínimas (>1 cm altura) y el texto de acompañamiento del pictograma para cada categoría de producto SUP. Véase también: Anexo VI del RD 1055/2022 (lista de productos SUP sujetos a pictograma), Art. 6 (restricciones SUP) y Ley 7/2022 Art. 108.2 (sanción por ausencia de pictograma). El Reglamento 2020/2151 es de aplicación directa en España sin necesidad de transposición adicional.`,
    metadata: { category: "referencias_cruzadas", topic: "SUP_pictograma_reglamento_UE" },
  },
  {
    title: "Referencia cruzada: Obligaciones SCRAP Art. 9 → Arts. 17-45 declaración y registro",
    article_ref: "RD 1055/2022 — Referencia cruzada Art. 9 / Arts. 17-45 SCRAP",
    content: `Referencia cruzada entre la obligación general de adhesión al SCRAP y los artículos de desarrollo: El Art. 9 del RD 1055/2022 establece la obligación de adhesión al SCRAP o SIR. Los Arts. 17-45 desarrollan en detalle todos los aspectos del cumplimiento: Arts. 17-18 (registro y declaración), Art. 19 (tonelaje MITECO), Arts. 20-23 (adhesión SIG, canon, umbral 250 kg), Arts. 24-26 (sistema individual SIR), Arts. 27-30 (ecodiseño), Arts. 31-35 (formatos declaración), Arts. 36-38 (auditorías), Arts. 39-41 (objetivos reciclaje), Arts. 42-45 (acuerdos intersistema). Véase también: Ley 7/2022 Arts. 108-109 para el régimen sancionador aplicable al incumplimiento SCRAP.`,
    metadata: { category: "referencias_cruzadas", topic: "SCRAP_obligaciones" },
  },
  {
    title: "Referencia cruzada: Códigos materiales Anexo II → Decisión 97/129/CE tabla completa",
    article_ref: "RD 1055/2022 — Referencia cruzada Anexo II / Decisión 97/129/CE",
    content: `Referencia cruzada entre el Anexo II del RD 1055/2022 y la Decisión 97/129/CE de la Comisión Europea: El Anexo II del RD 1055/2022 incorpora la tabla de identificación de materiales de la Decisión 97/129/CE (11 de febrero de 1997), por la que se establece el sistema de identificación de los materiales de envase. La Decisión 97/129/CE es el origen legal europeo de todos los códigos de material: plásticos 01-07, papel y cartón 20-22, metales 40-41, vidrio 70-74, maderas 50, textiles 60, materiales compuestos 81-84. Los productores que operen en varios países de la UE deben usar los mismos códigos ya que la Decisión 97/129/CE tiene aplicación en todos los Estados miembros. El PPWR (UE 2025/40) prevé actualizar y ampliar esta tabla de códigos.`,
    metadata: { category: "referencias_cruzadas", topic: "codigos_decision_97_129" },
  },
  {
    title: "Referencia cruzada: Lista productos SUP → Anexo VI RD 1055/2022 y Directiva 2019/904/CE",
    article_ref: "RD 1055/2022 — Referencia cruzada Anexo VI / Directiva 2019/904/CE",
    content: `Referencia cruzada entre la lista de productos SUP del RD 1055/2022 y la Directiva europea: El Anexo VI del RD 1055/2022 transpone los Anexos I, II, III y IV de la Directiva 2019/904/CE (Directiva SUP) al ordenamiento español. Anexo I de la Directiva 2019/904: lista de productos cuya comercialización está prohibida. Anexo II: productos sujetos a requisito de marcado (pictograma). Anexo III: productos sujetos a reducción del consumo. Anexo IV: productos sujetos a responsabilidad ampliada del productor (RAP) para costes de limpieza. El Anexo VI del RD 1055/2022 consolida estas cuatro listas adaptadas al contexto español. La Directiva 2019/904 también es aplicable directamente en caso de laguna normativa en el RD 1055/2022.`,
    metadata: { category: "referencias_cruzadas", topic: "SUP_directiva_anexos" },
  },
  {
    title: "Referencia cruzada: Sanciones RD 1055/2022 → Ley 7/2022 Arts. 108-109",
    article_ref: "RD 1055/2022 — Referencia cruzada Sanciones / Ley 7/2022 Arts. 108-109",
    content: `Referencia cruzada entre el régimen sancionador del RD 1055/2022 y la Ley 7/2022: El RD 1055/2022 (Arts. 35-38) establece el marco de infracciones específicas en materia de envases, pero las cuantías de las multas y los criterios de graduación están en la Ley 7/2022 de residuos y suelo contaminado (BOE-A-2022-5809). Arts. 108.1, 108.2 y 108.3 de la Ley 7/2022: tipos de infracciones (leve, grave, muy grave) y multas máximas (10.000€, 100.000€, 3.500.000€). Art. 109 de la Ley 7/2022: criterios de graduación, reducción voluntaria, competencia sancionadora, prescripción y medidas cautelares. En cualquier expediente sancionador en materia de envases, se aplican ambas normas de forma complementaria.`,
    metadata: { category: "referencias_cruzadas", topic: "sanciones_ley7_2022" },
  },
  {
    title: "Referencia cruzada: SDDR Arts. 46-47 → Disposición Transitoria Sexta RD 1055/2022",
    article_ref: "RD 1055/2022 — Referencia cruzada Arts. 46-47 / Disposición Transitoria 6ª",
    content: `Referencia cruzada entre los Arts. 46-47 (SDDR) y la Disposición Transitoria Sexta del RD 1055/2022: La Disposición Transitoria Sexta del RD 1055/2022 establece que el SDDR entrará en vigor de forma obligatoria mediante Orden Ministerial, previa consulta al sector. Hasta la activación de esa Orden, el SDDR es voluntario. La Nota Aclaratoria MITECO agosto 2025 confirma que determinadas categorías de bebidas entran en SDDR obligatorio en 2026. La Disposición Transitoria Sexta también regula la coexistencia con el SIG durante la transición: los productores de bebidas siguen pagando a Ecoembes hasta que el SDDR de su categoría sea obligatorio. Véase también Arts. 46.8, 46.9 (obligaciones productor SDDR), Art. 47.7 (calendario), Art. 47.8 (interacción SIG).`,
    metadata: { category: "referencias_cruzadas", topic: "SDDR_disposicion_transitoria" },
  },
  {
    title: "Referencia cruzada: PPWR Reglamento UE 2025/40 → aplicable agosto 2026, sustituye partes de RD 1055/2022",
    article_ref: "RD 1055/2022 — Referencia cruzada PPWR UE 2025/40",
    content: `Referencia cruzada entre el RD 1055/2022 y el Reglamento UE 2025/40 (PPWR): El Reglamento UE 2025/40 (Packaging and Packaging Waste Regulation) fue aprobado por el Parlamento Europeo y el Consejo en 2025 y es de aplicación directa en España desde agosto de 2026. El PPWR deroga parcialmente la Directiva 94/62/CE e introduce nuevos requisitos: contenidos mínimos de material reciclado, clasificación de reciclabilidad A-D, restricciones de envases innecesarios, requisitos de reusabilidad, Pasaporte Digital de Producto (2028). Las partes del RD 1055/2022 que seguirán vigentes: etiquetado de material (Anexo II), Punto Verde SIG, SDDR, registro de productores, régimen sancionador español. Para actualizaciones: consultar la Nota Aclaratoria MITECO agosto 2025 y el RD de adaptación al PPWR (pendiente de publicación).`,
    metadata: { category: "referencias_cruzadas", topic: "PPWR_sustitucion_RD1055" },
  },
  {
    title: "Referencia cruzada: Punto Verde SIG → Ecoembes envases ligeros/cartón, Ecovidrio vidrio",
    article_ref: "RD 1055/2022 — Referencia cruzada Punto Verde / Ecoembes / Ecovidrio",
    content: `Referencia cruzada entre el símbolo Punto Verde y los SIG autorizados en España: El símbolo Punto Verde solo puede usarse en envases de productores adheridos a un SIG (Sistema Integrado de Gestión) autorizado por el MITECO. SIG autorizados vigentes en España: Ecoembes — gestiona envases domésticos ligeros (plásticos, metales, briks/cartón para bebidas) mediante el contenedor amarillo y cajas y cartón mediante el contenedor azul. Ecovidrio — gestiona envases de vidrio doméstico mediante el contenedor verde (iglú). La adhesión a Ecoembes autoriza el Punto Verde en envases no vítreos. La adhesión a Ecovidrio autoriza el Punto Verde en envases de vidrio. Un productor que tenga envases de ambos materiales debe adherirse a ambos SIG para usar el Punto Verde en todos sus envases. Véase RD 1055/2022 Art. 11 (SIG), Arts. 20-23 (adhesión, canon, umbral), Ley 7/2022 Art. 108.2.a (sanción uso indebido).`,
    metadata: { category: "referencias_cruzadas", topic: "punto_verde_Ecoembes_Ecovidrio" },
  },

  // ─── GRUPO I — NOTA ACLARATORIA MITECO AGOSTO 2025 ───────────────────────
  {
    title: "Nota MITECO ago-2025 — PPWR (Reglamento UE 2025/40): qué aplica desde agosto 2026",
    article_ref: "Nota Aclaratoria MITECO agosto 2025 — PPWR aplicabilidad",
    content: `La Nota Aclaratoria MITECO de agosto 2025 aclara la entrada en vigor del Reglamento UE 2025/40 (PPWR — Packaging and Packaging Waste Regulation): Fecha de aplicación principal: agosto de 2026. El PPWR deroga parcialmente la Directiva 94/62/CE de envases y residuos de envases. Obligaciones del PPWR que se anticipan desde agosto 2026: (a) Contenidos mínimos de material reciclado obligatorios por tipo de envase y material (plástico de contacto alimentario: 10% desde 2026, 25% desde 2030). (b) Requisitos mínimos de reciclabilidad: clasificación de envases en categorías A (reciclable a escala), B, C, D (no reciclable). (c) Restricciones adicionales a sustancias peligrosas en envases de contacto alimentario. Obligaciones PPWR con períodos de transición más largos (2028-2032): requisitos de reusabilidad, etiquetado armonizado europeo, restricciones de envases innecesarios. El RD 1055/2022 sigue vigente en lo que no contradiga el PPWR.`,
    metadata: { category: "PPWR", topic: "aplicabilidad_2026" },
  },
  {
    title: "Nota MITECO ago-2025 — SDDR actualizado: categorías y tamaños confirmados para 2026",
    article_ref: "Nota Aclaratoria MITECO agosto 2025 — SDDR 2026",
    content: `La Nota Aclaratoria MITECO de agosto 2025 confirma las categorías de envases que entrarán en el SDDR (Sistema de Depósito, Devolución y Retorno) obligatorio en 2026: Categorías confirmadas para SDDR obligatorio desde 2026: (1) Botellas de PET de 0,25 litros a 3 litros de agua mineral, agua con gas, refrescos (cola, naranjada, limón, té, isotónicas), cervezas y sidras. (2) Latas de aluminio de 0,25 litros a 1 litro de las mismas categorías de bebidas. (3) Botellas de vidrio de 0,20 litros a 1,5 litros de cerveza y sidra. Categorías excluidas del SDDR 2026 (pendientes de decisión posterior): vinos y cavas, zumos, leche y derivados lácteos. Importe del depósito fijado: 0,25€ para plástico y aluminio; 0,15€ para vidrio (importe orientativo, pendiente de Orden Ministerial).`,
    metadata: { category: "SDDR", topic: "categorias_2026" },
  },
  {
    title: "Nota MITECO ago-2025 — Envases reutilizables B2B: Art. 13.2 se aplica también a ellos",
    article_ref: "Nota Aclaratoria MITECO agosto 2025 — Reutilizables B2B",
    content: `La Nota Aclaratoria MITECO de agosto 2025 aclara la aplicación del Art. 13.2 a envases reutilizables en canal B2B: Aclaración: el Art. 13.2 (indicación del contenedor de recogida) se aplica también a los envases reutilizables destinados exclusivamente a uso B2B, con la particularidad de que la indicación debe señalar el sistema de recogida o retorno específico del fabricante o del SCRAP al que está adherido. Para envases reutilizables en circuito cerrado B2B (p.ej., garrafas de agua para oficinas, bidones de CO2, barriles de cerveza): la indicación debe ser "RETORNAR AL PROVEEDOR" o equivalente, junto a instrucciones de devolución. Para envases reutilizables sin sistema de retorno propio: deben indicar el contenedor de recogida selectiva apropiado para cuando el envase llegue al fin de su vida útil.`,
    metadata: { category: "interpretacion_MITECO", topic: "reutilizables_B2B_art13" },
  },
  {
    title: "Nota MITECO ago-2025 — Etiquetado digital (QR): complemento aceptado, no sustitutivo de pictogramas",
    article_ref: "Nota Aclaratoria MITECO agosto 2025 — QR etiquetado digital",
    content: `La Nota Aclaratoria MITECO de agosto 2025 reitera y amplía la posición del MITECO sobre el etiquetado digital (QR): Posición MITECO: los códigos QR y DataMatrix están aceptados como complemento al etiquetado físico obligatorio. No pueden sustituir a ningún elemento de etiquetado obligatorio. Elementos que NUNCA pueden delegarse al QR: código de material (Anexo II), símbolo Punto Verde, pictograma SUP, indicación del contenedor de recogida (Art. 13.2), advertencias de materiales peligrosos (Art. 13.6). Uso recomendado del QR: enlace a información ampliada de reciclabilidad, instrucciones detalladas de gestión en múltiples idiomas, datos del Pasaporte Digital de Producto (anticipando PPWR), información sobre el porcentaje de material reciclado certificado. A efectos del PPWR (Reglamento UE 2025/40), el Pasaporte Digital de Producto será obligatorio a partir de 2028 para ciertos tipos de envases.`,
    metadata: { category: "interpretacion_MITECO", topic: "QR_etiquetado_digital" },
  },
  {
    title: "Nota MITECO ago-2025 — Interacción RD 1055/2022 y PPWR: qué prevalece",
    article_ref: "Nota Aclaratoria MITECO agosto 2025 — RD1055 vs PPWR",
    content: `La Nota Aclaratoria MITECO de agosto 2025 clarifica la jerarquía normativa entre el RD 1055/2022 y el Reglamento UE 2025/40 (PPWR): El PPWR es un Reglamento europeo de aplicación directa; tiene primacía sobre el RD 1055/2022 en las materias que regula expresamente. RD 1055/2022 sigue aplicando íntegramente en: etiquetado de material (Anexo II), sistema de Punto Verde (SIG), SDDR, régimen sancionador nacional, registro de productores (RPE). PPWR sustituye o modifica: definición de envases, criterios de reciclabilidad (nueva clasificación A-D), contenidos mínimos de material reciclado, restricciones de envases innecesarios, requisitos de reusabilidad. En caso de contradicción entre el RD 1055/2022 y el PPWR, prevalece el PPWR en su ámbito de aplicación. El MITECO publicará un RD de adaptación para incorporar el PPWR al ordenamiento español.`,
    metadata: { category: "PPWR", topic: "interaccion_RD1055_PPWR" },
  },
  {
    title: "Nota MITECO ago-2025 — Prioridades de inspección 2025-2026: compostabilidad y SUP",
    article_ref: "Nota Aclaratoria MITECO agosto 2025 — Prioridades inspección",
    content: `La Nota Aclaratoria MITECO de agosto 2025 anuncia las prioridades de inspección para 2025 y 2026: Prioridad 1 — Declaraciones de compostabilidad: inspectores verificarán que todos los envases etiquetados como "compostable" o "biodegradable" cuenten con certificación UNE EN 13432:2001 o equivalente. Se realizarán campañas específicas en los sectores de hostelería, catering y tiendas de alimentación ecológica. Prioridad 2 — Pictograma SUP: verificación del correcto uso del pictograma en compresas, toallitas, filtros de cigarrillos y envases de comida con plástico. Prioridad 3 — Greenwashing en etiquetado: revisión sistemática de términos como "eco-friendly", "sostenible", "biodegradable" en envases de gran distribución. Prioridad 4 — Registro SDDR (preparación 2026): verificación de que los productores de bebidas en categorías SDDR 2026 están registrados e informados de sus obligaciones. El incumplimiento detectado en estas áreas prioritarias tendrá tramitación preferente del expediente sancionador.`,
    metadata: { category: "interpretacion_MITECO", topic: "prioridades_inspeccion_2026" },
  },

  // ─── GRUPO H — NOTA INTERPRETATIVA MITECO DICIEMBRE 2024 ─────────────────
  {
    title: "Nota MITECO dic-2024 — Ámbito: cuándo un producto B2B es envase doméstico",
    article_ref: "Nota Interpretativa MITECO diciembre 2024 — Ámbito B2B/doméstico",
    content: `La Nota Interpretativa MITECO de diciembre 2024 clarifica cuándo un producto vendido en canal B2B se considera envase doméstico a efectos del RD 1055/2022: Un envase se clasifica como doméstico cuando existe una probabilidad razonable de que el producto llegue al consumidor final, independientemente del canal de venta formal. Criterios para considerar un envase como doméstico aunque se venda en B2B: (a) El producto tiene un uso doméstico reconocible (alimentos, bebidas, higiene, limpieza del hogar). (b) El envase es de tamaño doméstico (no industrial ni de gran formato). (c) El producto se vende también a través de canales retail o de forma directa al consumidor. (d) El producto puede encontrarse en hogares aunque se distribuya por hostelería o restauración. Ejemplo: aceite de oliva en formato 500ml vendido a restaurantes → es envase doméstico porque el formato es el mismo que se vende en supermercados.`,
    metadata: { category: "interpretacion_MITECO", topic: "ambito_B2B_doméstico" },
  },
  {
    title: "Nota MITECO dic-2024 — Art. 13: etiquetado digital y en molde aceptados",
    article_ref: "Nota Interpretativa MITECO diciembre 2024 — Etiquetado Art. 13",
    content: `La Nota Interpretativa MITECO de diciembre 2024 aclara los métodos de etiquetado aceptados para cumplir el Art. 13: Métodos de impresión aceptados: (1) Impresión digital directa sobre el envase (inkjet, offset, flexografía, serigrafía). (2) Etiqueta auto-adhesiva aplicada al envase. (3) In-mold labeling (IML): la etiqueta se integra en el molde de fabricación del envase (habitual en tarros de plástico de yogur y margarina). (4) Estampación en relieve (embossing) visible en el propio material del envase. (5) Grabado por láser en vidrio o metal. Guía de contraste mínimo: el código de material debe tener un contraste mínimo de 3:1 entre el símbolo y el fondo del envase. RECHAZADO: etiquetado exclusivamente en cinta adhesiva externa no permanente o en papel de seda interior no solidario al envase.`,
    metadata: { category: "interpretacion_MITECO", topic: "metodos_etiquetado_aceptados" },
  },
  {
    title: "Nota MITECO dic-2024 — Registro SCRAP: período de gracia pymes (<1 t/año primer año)",
    article_ref: "Nota Interpretativa MITECO diciembre 2024 — SCRAP pymes",
    content: `La Nota Interpretativa MITECO de diciembre 2024 establece un criterio de aplicación del registro SCRAP para pymes: Período de gracia para empresas que inician actividad: las empresas que pongan en el mercado envases domésticos por primera vez disponen de un año natural completo para completar su registro en el Registro de Productores de Envases (RPE) sin que se considere infracción formal. Esta gracia se aplica únicamente cuando el volumen de envases puesto en el mercado en el primer año no supera 1 tonelada. Pasado el primer año, el registro es obligatorio independientemente del volumen. Empresas por debajo del umbral de 250 kg/año: aunque no están obligadas a adherirse al SIG, sí deben registrarse en el RPE si ponen cualquier volumen de envases domésticos en el mercado español. El RPE es el registro, no la adhesión al SIG; son obligaciones distintas.`,
    metadata: { category: "interpretacion_MITECO", topic: "gracia_registro_pymes" },
  },
  {
    title: "Nota MITECO dic-2024 — FAQ SIG: adhesión pymes por debajo de 250 kg/año",
    article_ref: "Nota Interpretativa MITECO diciembre 2024 — FAQ SIG pymes",
    content: `La Nota Interpretativa MITECO de diciembre 2024 responde a la pregunta frecuente de pymes sobre la adhesión al SIG: Pregunta: ¿Una empresa que pone 180 kg/año de envases domésticos en el mercado necesita adherirse a Ecoembes? Respuesta MITECO: La adhesión al SIG es OBLIGATORIA solo a partir de 250 kg/año. Por debajo de ese umbral, la adhesión es voluntaria pero recomendada. Sin embargo, el registro en el RPE (Registro de Productores de Envases) es obligatorio sea cual sea el volumen. Sin adhesión al SIG: la empresa no puede usar el símbolo Punto Verde en sus envases. Con adhesión voluntaria al SIG por debajo del umbral: la empresa sí puede usar el Punto Verde. Las pymes por debajo del umbral con ventas directas a consumidor final (tienda online propia, mercadillo) deben igualmente cumplir con el etiquetado obligatorio del Art. 13.`,
    metadata: { category: "interpretacion_MITECO", topic: "FAQ_SIG_pymes" },
  },
  {
    title: "Nota MITECO dic-2024 — Compostabilidad industrial vs. doméstica: distinción obligatoria",
    article_ref: "Nota Interpretativa MITECO diciembre 2024 — Compostabilidad",
    content: `La Nota Interpretativa MITECO de diciembre 2024 aclara la distinción entre compostabilidad industrial y doméstica: Compostabilidad industrial (norma UNE EN 13432:2001): el envase se desintegra en condiciones de compostaje industrial (temperatura 55-70°C, presión, microorganismos específicos) en menos de 12 semanas. Símbolo: Seedling (brote verde). No se degrada en compostaje doméstico. Compostabilidad doméstica (norma OK compost HOME): el envase se desintegra en composteras domésticas a temperatura ambiente en menos de 6 meses. Símbolo diferenciado del Seedling. OBLIGACIÓN: el etiquetado debe especificar claramente si es industrial o doméstica. No se puede indicar solo "compostable" sin aclarar el tipo. Los envases compostables industrialmente NO deben depositarse en el contenedor marrón (orgánico) en España, ya que las plantas de biorresiduos no los procesan correctamente. Deben indicarlo explícitamente.`,
    metadata: { category: "interpretacion_MITECO", topic: "compostabilidad_distincion" },
  },
  {
    title: "Nota MITECO dic-2024 — Art. 13.3 greenwashing: lista de frases prohibidas específicas",
    article_ref: "Nota Interpretativa MITECO diciembre 2024 — Greenwashing frases",
    content: `La Nota Interpretativa MITECO de diciembre 2024 publica la lista de términos y frases cuyo uso en el etiquetado de envases sin justificación documental constituye greenwashing sancionable: Términos prohibidos sin certificación: "sostenible", "respetuoso con el medioambiente", "eco-friendly", "ecológico", "verde" (en sentido ambiental), "natural" (cuando se refiere a la degradabilidad del envase), "biodegradable" (sin certificación), "compostable" (sin certificación Art. 13.5), "neutral en carbono" (sin verificación tercero), "libre de plástico" (si contiene cualquier componente plástico), "100% reciclable" (si algún componente no es reciclable). Términos permitidos con documentación: "fabricado con X% de material reciclado certificado", "reciclable en el contenedor amarillo", "este envase es reciclable". El inspector puede requerir la documentación de respaldo en el momento de la visita.`,
    metadata: { category: "interpretacion_MITECO", topic: "greenwashing_frases_prohibidas" },
  },
  {
    title: "Nota MITECO dic-2024 — Deficiencias más frecuentes en campañas de inspección 2023-2024",
    article_ref: "Nota Interpretativa MITECO diciembre 2024 — Deficiencias inspección",
    content: `La Nota Interpretativa MITECO de diciembre 2024 resume las deficiencias de etiquetado más frecuentemente detectadas en las campañas de inspección de 2023 y 2024: (1) Ausencia del pictograma SUP en productos obligados (toallitas húmedas, compresas, filtros de cigarrillos): 34% de los productos inspeccionados en su categoría. (2) Uso del Punto Verde sin adhesión acreditada al SIG: 18% de los establecimientos inspeccionados. (3) Código de material ausente o ilegible en envases >10 cm²: 15%. (4) Declaraciones de compostabilidad sin certificación: 12%. (5) Indicación del contenedor incorrecta (código de material indica PET pero se dirige al contenedor azul en vez del amarillo): 8%. (6) Etiquetado únicamente en idioma extranjero (inglés) sin versión en español: 6%. Los sectores más inspeccionados: alimentación (supermercados), hostelería, cosmética y cuidado personal, limpieza del hogar.`,
    metadata: { category: "interpretacion_MITECO", topic: "deficiencias_inspeccion_2024" },
  },
  {
    title: "Nota MITECO dic-2024 — Stock etiquetado existente: período de venta permitido (6 meses)",
    article_ref: "Nota Interpretativa MITECO diciembre 2024 — Provisiones transitorias stock",
    content: `La Nota Interpretativa MITECO de diciembre 2024 aclara el tratamiento del stock de envases ya etiquetados cuando cambia la normativa: Regla general: cuando una obligación de etiquetado nueva entra en vigor, los envases ya fabricados y etiquetados conforme a la normativa anterior pueden continuar comercializándose durante un período máximo de 6 meses desde la fecha de aplicación de la nueva obligación. Condición: los envases deben estar físicamente en stock en el almacén del fabricante o distribuidor en la fecha de entrada en vigor de la nueva normativa. Documentación requerida: inventario de stock con fecha y cantidad, para acreditar ante inspección que el stock era preexistente. Límite: el período de 6 meses no es prorrogable. Pasado ese plazo, todos los envases en el mercado deben cumplir la nueva obligación. Esta disposición no aplica a los productos SUP prohibidos (la prohibición es inmediata, sin período transitorio de stock).`,
    metadata: { category: "interpretacion_MITECO", topic: "stock_transicion_6meses" },
  },

  // ─── GRUPO G — ANEXO IV LISTA PRODUCTOS SUP ──────────────────────────────
  {
    title: "SUP — Lista completa de productos sujetos a obligación de pictograma",
    article_ref: "RD 1055/2022 Anexo VI — Productos SUP con pictograma obligatorio",
    content: `Según el Anexo VI del RD 1055/2022 y el Reglamento UE 2020/2151, los productos plásticos de un solo uso (SUP) sujetos a la obligación de incluir el pictograma de advertencia son: (1) Compresas higiénicas, tampones y aplicadores de tampones. (2) Toallitas húmedas (para higiene personal, doméstica o industrial) con plástico. (3) Globos de helio y decorativos con varilla de plástico. (4) Filtros de tabaco (cigarrillos, tabaco de liar) con filamento de plástico. (5) Tazas y vasos para bebidas con contenido en plástico (vasos de papel con revestimiento plástico interior). (6) Recipientes de comida con contenido en plástico (envases de comida rápida, envases de ensalada con tapa de plástico sellada). El pictograma debe aparecer en el producto o su envase, ser proporcional al tamaño del envase y estar impreso directamente (no como etiqueta adhesiva que pueda despegarse fácilmente).`,
    metadata: { category: "SUP", topic: "lista_pictograma_obligatorio" },
  },
  {
    title: "SUP — Lista completa de productos prohibidos desde julio 2021",
    article_ref: "RD 1055/2022 Anexo VI — Productos SUP prohibidos",
    content: `Desde el 3 de julio de 2021 están prohibidos en España y en toda la UE los siguientes plásticos de un solo uso (SUP), en virtud de la Directiva 2019/904/CE traspuesta por el RD 1055/2022: (1) Platos de plástico de un solo uso. (2) Cubiertos de plástico de un solo uso: tenedores, cuchillos, cucharas, palillos chinos, espátulas. (3) Pajitas de plástico de un solo uso (excepto las necesarias por razones médicas). (4) Bastoncillos de algodón con varilla de plástico (cotton buds). (5) Agitadores de bebidas de plástico (stirrers). (6) Soportes de plástico para globos (palillos de plástico de globos). (7) Vasos y recipientes de comida de poliestireno expandido (EPS / corcho blanco) de un solo uso. (8) Productos de plástico oxodegradable. EXCEPCIÓN: estos productos fabricados con materiales que NO sean plástico (bambú, caña, papel sin revestimiento plástico, madera) no están prohibidos. Fabricar, importar o comercializar estos productos prohibidos es infracción muy grave (hasta 3.500.000€).`,
    metadata: { category: "SUP", topic: "lista_prohibidos" },
  },
  {
    title: "SUP — Productos en transición: permitidos con etiquetado obligatorio",
    article_ref: "RD 1055/2022 Anexo VI — Productos SUP en transición",
    content: `Productos plásticos de un solo uso (SUP) que siguen estando permitidos pero con obligación de etiquetado con pictograma y contribución a costes de limpieza: (1) Compresas, tampones y aplicadores (hygiene products) — permitidos con pictograma SUP. (2) Toallitas húmedas con plástico — permitidas con pictograma SUP. (3) Globos decorativos con plástico — permitidos con pictograma SUP. (4) Filtros de cigarrillos con plástico — permitidos con pictograma SUP. (5) Vasos de papel con revestimiento plástico — permitidos con pictograma SUP. (6) Recipientes de comida con contenido plástico — permitidos con pictograma SUP. Productos SUP cuya prohibición está prevista pero aún no en vigor (pendiente de revisión de la Directiva SUP): botellas de plástico de bebidas (en estudio para integrar en SDDR). Los productores de estos productos también deben contribuir financieramente a los costes de limpieza del entorno, según las disposiciones del Art. 8 de la Directiva 2019/904.`,
    metadata: { category: "SUP", topic: "lista_transicion" },
  },

  // ─── GRUPO F — ANEXO II CÓDIGOS COMPLETOS (Decisión 97/129/CE) ───────────
  {
    title: "Código 03-PVC — Policloruro de vinilo: ejemplos y normas de recogida",
    article_ref: "RD 1055/2022 Anexo II — Código 03 PVC",
    content: `El código 03-PVC (Policloruro de vinilo) según el Anexo II del RD 1055/2022 y la Decisión 97/129/CE: Productos habituales: envases de aceite vegetal doméstico (botellas translúcidas), bandejas de blíster para medicamentos y productos de ferretería, films transparentes rígidos de empaquetado, tuberías de PVC para uso técnico. El PVC presenta dificultades para el reciclaje junto a PET y HDPE porque contamina los flujos de reciclaje de plástico si se mezcla. Norma de recogida en España: el PVC va al contenedor amarillo (envases ligeros), pero muchas plantas de selección lo separan y desvían a gestión especial. El etiquetado debe mostrar el número 3 dentro del triángulo con las siglas PVC. Algunos envases de PVC blando (film) tienen baja tasa de recuperación real y pueden ser objeto de restricciones futuras por el Reglamento PPWR.`,
    metadata: { category: "materiales", topic: "plasticos", material: "PVC" },
  },
  {
    title: "Código 06-PS — Poliestireno: ejemplos, restricciones EPS y normas de recogida",
    article_ref: "RD 1055/2022 Anexo II — Código 06 PS",
    content: `El código 06-PS (Poliestireno) según el Anexo II del RD 1055/2022: Productos habituales: bandejas de carne y pescado en supermercados, vasos de yogur, cajas de CD/DVD, bandejas de comida para llevar de PS rígido. Poliestireno expandido (EPS, corcho blanco): usado en bandejas de alimentos, cajas de transporte de electrodomésticos, protecciones de embalaje. PROHIBICIÓN: desde julio 2021 están prohibidos los vasos, platos y recipientes de comida de EPS (Directiva SUP 2019/904/CE, Art. 5). El EPS para embalaje industrial (terciario) sigue estando permitido. El PS rígido va al contenedor amarillo. El EPS de embalaje terciario suele gestionarse por recogida diferenciada en puntos de compra o puntos limpios. El etiquetado debe mostrar el número 6 dentro del triángulo con las siglas PS.`,
    metadata: { category: "materiales", topic: "plasticos", material: "PS" },
  },
  {
    title: "Código 07-O — Otros plásticos: cuándo usarlo y productos de ejemplo",
    article_ref: "RD 1055/2022 Anexo II — Código 07 O",
    content: `El código 07-O (Otros plásticos) según el Anexo II del RD 1055/2022 se usa para plásticos que no encajan en los códigos 01-06: Materiales incluidos: Policarbonato (PC) — botellas de agua reutilizables, garrafas de 5L, gafas. ABS (Acrilonitrilo butadieno estireno) — piezas técnicas, juguetes, envases de pinturas. PLA (Ácido poliláctico) — envases de bioplástico, no reciclable en el flujo estándar. Multicapa no separable: cuando el envase combina varios plásticos unidos en láminas no separables mecánicamente. Norma clave: si un plástico no puede identificarse claramente con los códigos 01-06, DEBE usarse el código 07-O. NUNCA se debe adivinar el código; si hay duda, consultar la ficha técnica con el fabricante del envase. Los envases 07-O tienen generalmente baja reciclabilidad real en los sistemas actuales.`,
    metadata: { category: "materiales", topic: "plasticos", material: "O" },
  },
  {
    title: "Códigos 20-22 PAP — Papel y cartón: tipos, ejemplos y contenedor de recogida",
    article_ref: "RD 1055/2022 Anexo II — Códigos 20-22 PAP",
    content: `Los códigos 20-22 PAP (Papel y Cartón) según el Anexo II del RD 1055/2022 y Decisión 97/129/CE: 20-PAP (Cartón corrugado): cajas de transporte y embalaje secundario (cajas de Amazon, cajas de mudanza, embalajes de electrodomésticos). Es el cartón de doble capa con alma ondulada. Se deposita en el contenedor azul. 21-PAP (Cartón no corrugado o cartón plegable): cajas de cereales, cajas de zapatos, cajas de medicamentos, cartones de pizza, embalajes de cartón liso. Se deposita en el contenedor azul. 22-PAP (Papel): bolsas de papel kraft, papel de envolver, papel de regalo, papel de seda, papel de estraza. Se deposita en el contenedor azul. EXCEPCIÓN: el tetrabrik (brik de leche, zumo) NO es código 20-22 sino código 81-C/PAP (material compuesto). El papel y cartón manchado con restos de comida puede rechazarse por la planta de reciclaje.`,
    metadata: { category: "materiales", topic: "papel_carton_codigos" },
  },
  {
    title: "Códigos 40-41 FE/ALU — Metales: latas de acero y aluminio, normas de recogida",
    article_ref: "RD 1055/2022 Anexo II — Códigos 40-41 FE ALU",
    content: `Los códigos metálicos según el Anexo II del RD 1055/2022 y Decisión 97/129/CE: 40-FE (Acero / Hojalata): latas de conservas (atún, tomate, legumbres), aerosoles de acero (desodorantes, spray fijador), tapas de rosca metálicas, botes de pintura, latas de polvos de bebidas. El acero se separa magnéticamente en las plantas de selección. Se deposita en el contenedor amarillo. 41-ALU (Aluminio): latas de refrescos y cerveza, papel de aluminio de cocina, bandejas de aluminio desechables para horno, cápsulas de café de aluminio (Nespresso, Dolce Gusto). El aluminio no es magnético; se detecta por corrientes de Foucault. Se deposita en el contenedor amarillo. IMPORTANTE: las tapas de vidrio con aro de acero (code 40-FE) deben separarse del frasco de vidrio para su correcta clasificación. El aluminio es 100% reciclable infinitas veces.`,
    metadata: { category: "materiales", topic: "metales_codigos" },
  },
  {
    title: "Códigos 70-74 GL — Vidrio: variantes por color y normas de recogida",
    article_ref: "RD 1055/2022 Anexo II — Códigos 70-74 GL",
    content: `Los códigos de vidrio según el Anexo II del RD 1055/2022 y Decisión 97/129/CE: 70-GL (Vidrio incoloro/transparente): botellas de agua mineral, frascos de conservas, botellas de vino blanco, frascos de perfume de vidrio claro. 71-GL (Vidrio verde): botellas de vino tinto, botellas de cava y espumosos, botellas de cerveza verde (Heineken), botellas de agua con gas con vidrio verde. 72-GL (Vidrio marrón/ámbar): botellas de cerveza marrón (Estrella, Voll-Damm), frascos de medicamentos de vidrio oscuro. 73-GL (Vidrio oscuro/negro): algunas botellas de vino tinto de alta gama. 74-GL (Vidrio opaco/blanco opalino): envases de cosmética y farmacia de vidrio blanco opalino. Todos los envases de vidrio se depositan en el contenedor verde (iglú). El vidrio es 100% reciclable sin pérdida de calidad.`,
    metadata: { category: "materiales", topic: "vidrio_codigos_color" },
  },
  {
    title: "Códigos 81-84 C/ — Materiales compuestos: tetrabrik y otros multicapa",
    article_ref: "RD 1055/2022 Anexo II — Códigos 81-84 Compuestos",
    content: `Los códigos de materiales compuestos (multicapa) según el Anexo II del RD 1055/2022: 81-C/PAP (Cartón para bebidas tipo tetrabrik): estructura multicapa papel/cartón + polietileno + aluminio. Productos: briks de leche, zumos, caldos, vino en brik, nata. Se deposita en contenedor amarillo (Ecoembes). 82-C/LDPE (Compuesto con polietileno de baja densidad): películas multicapa de PE + papel o PE + aluminio. Bolsas de snacks metalizadas, envases de café molido. 83-C/PP (Compuesto de polipropileno): envases de alimentos frescos con barrera de PP + otra capa. 84-C/PS (Compuesto de poliestireno): bandejas multicapa con barrera PS. NORMA: el código C/ identifica el material principal del envase; el material secundario se indica tras la barra. Un envase 81-C/PAP es principalmente papel pero con capas de plástico y aluminio que no se pueden separar.`,
    metadata: { category: "materiales", topic: "compuestos_multicapa" },
  },
  {
    title: "Códigos 50, 60, 80 — Madera, textil y cerámicas para envases industriales",
    article_ref: "RD 1055/2022 Anexo II — Códigos 50 60 80",
    content: `Códigos adicionales para envases industriales y no plásticos según el Anexo II del RD 1055/2022 y Decisión 97/129/CE: 50-FOR (Madera): palets de madera, cajas de madera (frutas, vinos), barriles de madera, bobinas de madera para cables. Uso principal en envase terciario. Se gestiona a través de gestores de residuos industriales o valorizadores de madera. 60-TEX (Textil/Fibras): sacos de yute, sacos de algodón, mallas de fibra para embalaje. Uso en productos agrícolas. 80-MX (Mixto) o código específico: envases que combinan materiales de distinta naturaleza (madera + metal, plástico + textil) sin predominio claro. Estos materiales de envase industrial tienen requisitos de etiquetado más flexibles, pero igualmente deben declararse en la declaración SCRAP si superan los 250 kg/año.`,
    metadata: { category: "materiales", topic: "madera_textil_ceramica" },
  },

  // ─── GRUPO E — LEY 7/2022 SANCIONES EXPANDIDAS ───────────────────────────
  {
    title: "Art. 108.1 Ley 7/2022 — Infracciones leves (hasta 10.000€): lista completa",
    article_ref: "Ley 7/2022 Art. 108.1 — Infracciones leves",
    content: `El Art. 108.1 de la Ley 7/2022 de residuos y suelo contaminado lista las infracciones leves en materia de envases (multas hasta 10.000€): (a) No incluir el código de identificación del material de envasado según Anexo II cuando el envase supera los 10 cm². (b) Código de material ilegible, borroso o de dimensiones inferiores a las mínimas reglamentarias. (c) Etiquetado en idioma no oficial del Estado español en el territorio de comercialización. (d) No incluir la indicación del contenedor de recogida en envases domésticos cuando sea obligatorio. (e) Defectos formales en la presentación del símbolo Punto Verde (color incorrecto, dimensiones mínimas incumplidas). (f) Retraso en la presentación de la declaración anual de tonelaje al SCRAP (hasta 3 meses). (g) Uso de códigos de material incorrectos por error de clasificación cuando no induzca a error al consumidor sobre la fracción de recogida.`,
    metadata: { category: "sanciones", topic: "infracciones_leves" },
  },
  {
    title: "Art. 108.2 Ley 7/2022 — Infracciones graves (hasta 100.000€): lista completa",
    article_ref: "Ley 7/2022 Art. 108.2 — Infracciones graves",
    content: `El Art. 108.2 de la Ley 7/2022 lista las infracciones graves en materia de envases (multas hasta 100.000€): (a) Usar el símbolo Punto Verde sin estar adherido al SIG autorizado (Ecoembes/Ecovidrio). (b) No estar registrado en el Registro de Productores de Envases cuando la inscripción es obligatoria. (c) No declarar los envases puestos en el mercado al SCRAP o declarar datos incorrectos. (d) Etiquetar envases con declaraciones medioambientales no verificadas o engañosas (Art. 13.3 greenwashing). (e) Usar la denominación "compostable" o "biodegradable" sin la certificación requerida (Art. 13.5). (f) No incluir el pictograma SUP en productos plásticos de un solo uso que lo requieren (Art. 13.7). (g) Reincidencia en infracciones leves en un período de 2 años. (h) Incumplimiento de los requisitos de ecodiseño de envases (Arts. 27-30).`,
    metadata: { category: "sanciones", topic: "infracciones_graves" },
  },
  {
    title: "Art. 108.3 Ley 7/2022 — Infracciones muy graves (hasta 3.500.000€): lista completa",
    article_ref: "Ley 7/2022 Art. 108.3 — Infracciones muy graves",
    content: `El Art. 108.3 de la Ley 7/2022 lista las infracciones muy graves en materia de envases (multas hasta 3.500.000€): (a) Fabricar, importar o comercializar productos plásticos de un solo uso que están expresamente prohibidos desde julio 2021 (platos, cubiertos, pajitas, bastoncillos con varilla plástica, vasos de EPS). (b) Obstrucción activa a la labor inspectora (impedir el acceso, facilitar documentación falsa). (c) Reincidencia en infracciones graves en un período de 4 años. (d) Causar un daño medioambiental grave y cuantificable por incumplimiento de las obligaciones de gestión de residuos de envases. (e) Fraude documentado en las declaraciones de tonelaje SCRAP (declarar menos de lo puesto en el mercado de forma deliberada y sistemática).`,
    metadata: { category: "sanciones", topic: "infracciones_muy_graves" },
  },
  {
    title: "Art. 109.1 Ley 7/2022 — Criterios de graduación de sanciones",
    article_ref: "Ley 7/2022 Art. 109.1 — Graduación",
    content: `El Art. 109.1 de la Ley 7/2022 establece los criterios para graduar la cuantía de las sanciones dentro del rango legal: (a) Volumen de negocio del infractor: las multas se escalan al alza para grandes empresas; para pymes puede aplicarse el tramo mínimo del rango. (b) Daño medioambiental causado: la existencia de daño real y cuantificable agrava la sanción. (c) Grado de culpa: negligencia grave vs. incumplimiento formal sin impacto real. (d) Beneficio económico obtenido por el infractor gracias al incumplimiento (si el ahorro por no cumplir es superior a la multa, se eleva la sanción para eliminar el incentivo). (e) Trascendencia social del incumplimiento: incumplimientos que afecten a grandes volúmenes de consumidores o al funcionamiento del sistema de recogida selectiva. (f) Continuidad de la infracción: infracciones continuadas se sancionan más gravemente.`,
    metadata: { category: "sanciones", topic: "criterios_graduacion" },
  },
  {
    title: "Art. 109.2 Ley 7/2022 — Descuento por cumplimiento voluntario (hasta 50%)",
    article_ref: "Ley 7/2022 Art. 109.2 — Reducción voluntaria",
    content: `El Art. 109.2 de la Ley 7/2022 establece la posibilidad de reducción de sanción por cumplimiento voluntario: (a) Si el infractor, una vez notificado del expediente sancionador, subsana voluntariamente el incumplimiento antes de la resolución, puede obtener una reducción de hasta el 50% del importe de la multa. (b) La subsanación voluntaria debe ser completa (no parcial) y acreditada documentalmente ante el órgano instructor. (c) El descuento no es automático; el infractor debe solicitarlo expresamente y demostrar la corrección. (d) El descuento se aplica sobre la multa ya graduada (no sobre el máximo del rango). (e) La reducción no es aplicable en infracciones muy graves o en casos de reincidencia.`,
    metadata: { category: "sanciones", topic: "reduccion_voluntaria" },
  },
  {
    title: "Art. 109.3 Ley 7/2022 — Competencia sancionadora (CCAA vs. Estado)",
    article_ref: "Ley 7/2022 Art. 109.3 — Competencia",
    content: `El Art. 109.3 de la Ley 7/2022 delimita la competencia para imponer sanciones: Comunidades Autónomas (CCAA): son competentes para sancionar infracciones detectadas en su territorio, incluyendo inspecciones en puntos de venta y fábricas ubicadas en la CCAA. La mayoría de las inspecciones de etiquetado de envases son iniciadas por los servicios de inspección de las CCAA (Consejería de Medio Ambiente). Estado (MITECO): es competente cuando la infracción tiene efectos en más de una CCAA, cuando afecta al sistema nacional de SCRAP, o cuando la empresa infractora no tiene domicilio en España (importadores de terceros países). En infracciones de envases importados o de comercio electrónico transfronterizo, la competencia puede ser del Estado. Las CCAA y el Estado deben coordinarse para evitar la doble sanción por los mismos hechos.`,
    metadata: { category: "sanciones", topic: "competencia_sancionadora" },
  },
  {
    title: "Art. 109.4 Ley 7/2022 — Prescripción de infracciones (leve 2 años, grave 4 años, muy grave 6 años)",
    article_ref: "Ley 7/2022 Art. 109.4 — Prescripción",
    content: `El Art. 109.4 de la Ley 7/2022 establece los plazos de prescripción de las infracciones: Infracciones leves: prescriben a los 2 años desde la comisión de la infracción (o desde que cesó si es continuada). Infracciones graves: prescriben a los 4 años. Infracciones muy graves: prescriben a los 6 años. La prescripción se interrumpe cuando se notifica al interesado el inicio del procedimiento sancionador. Las sanciones impuestas prescriben en los mismos plazos (leve 2 años, grave 4 años, muy grave 6 años) a partir de la fecha en que la resolución sancionadora sea firme en vía administrativa. Los datos del Registro de Productores de Envases pueden ser consultados retroactivamente hasta 6 años para verificar infracciones antiguas.`,
    metadata: { category: "sanciones", topic: "prescripcion_infracciones" },
  },
  {
    title: "Art. 109.5 Ley 7/2022 — Medidas cautelares durante la inspección",
    article_ref: "Ley 7/2022 Art. 109.5 — Medidas cautelares",
    content: `El Art. 109.5 de la Ley 7/2022 autoriza la adopción de medidas cautelares durante los procedimientos de inspección y sanción: (a) Precinto o retirada cautelar del mercado de los productos etiquetados incorrectamente. (b) Suspensión cautelar de la autorización de SCRAP cuando hay indicios de incumplimiento grave. (c) Inmovilización de productos SUP prohibidos hasta la resolución del expediente. (d) Requerimiento de cese inmediato de publicidad o etiquetado con declaraciones medioambientales engañosas. Las medidas cautelares no tienen carácter sancionador; son provisionales y se levantan si el expediente concluye sin sanción o si el infractor subsana. La adopción de medidas cautelares debe ser proporcional al riesgo medioambiental y al daño potencial al consumidor.`,
    metadata: { category: "sanciones", topic: "medidas_cautelares" },
  },

  // ─── GRUPO D — ARTS. 46–47 SDDR ──────────────────────────────────────────
  {
    title: "Art. 46.8 — Obligaciones del productor para envases de bebidas SDDR (>0,1 L)",
    article_ref: "RD 1055/2022 Art. 46.8",
    content: `El Art. 46.8 del RD 1055/2022 establece las obligaciones de los productores en relación con el SDDR (Sistema de Depósito, Devolución y Retorno) para envases de bebidas: Los productores de bebidas en envases de plástico (PET), vidrio y metal (lata) con capacidad superior a 0,1 litros e inferior o igual a 3 litros deben, cuando el SDDR sea obligatorio: (a) Inscribirse en el sistema SDDR autorizado. (b) Cobrar el importe del depósito al consumidor en el punto de venta (indicado en el precio o en recibo). (c) Garantizar la devolución del depósito cuando el consumidor retorne el envase. (d) Asegurar puntos de recogida de envases retornables. (e) Etiquetar los envases con el importe del depósito y el símbolo del SDDR.`,
    metadata: { category: "SDDR", topic: "obligaciones_productor_SDDR" },
  },
  {
    title: "Art. 46.9 — Importes del depósito SDDR y requisitos de etiquetado",
    article_ref: "RD 1055/2022 Art. 46.9",
    content: `El Art. 46.9 del RD 1055/2022 establece los importes del depósito SDDR y los requisitos de etiquetado asociados: Importes orientativos del depósito (pendientes de fijación definitiva por MITECO): envases de plástico ≤1 L: 0,25 €; envases de vidrio ≤1 L: 0,15-0,25 €; latas de metal ≤1 L: 0,15-0,25 €. El etiquetado del envase sujeto a SDDR debe incluir: (1) El símbolo oficial del SDDR (a definir por MITECO). (2) El importe del depósito en euros. (3) La indicación "RETORNABLE" o "ENVASE SUJETO A DEPÓSITO". El etiquetado SDDR se añade al etiquetado obligatorio de material (Art. 13.1) y no lo sustituye. Los envases SDDR no están exentos del código de material ni del Punto Verde SIG mientras coexistan ambos sistemas.`,
    metadata: { category: "SDDR", topic: "importe_deposito_etiquetado" },
  },
  {
    title: "Art. 47.7 — Calendario de implantación SDDR: actualmente voluntario, obligatorio pendiente",
    article_ref: "RD 1055/2022 Art. 47.7",
    content: `El Art. 47.7 del RD 1055/2022 establece el calendario de implantación del SDDR: El SDDR para envases de bebidas fue declarado de implantación obligatoria en la Ley 7/2022, con un período de transición. El RD 1055/2022 establece que la obligatoriedad se activará mediante Orden Ministerial del MITECO, previa consulta al sector. A la fecha de publicación del RD (diciembre 2022), el SDDR sigue siendo voluntario. La Nota Aclaratoria MITECO agosto 2025 confirma que determinadas categorías de envases de bebidas entrarán en SDDR obligatorio en 2026. Las categorías confirmadas para el SDDR 2026: botellas PET de 0,25 L a 3 L de agua, refrescos, zumos, cervezas y sidras; latas de aluminio de 0,25 L a 1 L.`,
    metadata: { category: "SDDR", topic: "calendario_implantacion" },
  },
  {
    title: "Art. 47.8 — Interacción SDDR y SIG durante el período de transición",
    article_ref: "RD 1055/2022 Art. 47.8",
    content: `El Art. 47.8 del RD 1055/2022 regula la coexistencia del SDDR y el SIG durante la transición: Mientras el SDDR no sea obligatorio, los productores de envases de bebidas deben seguir adheridos al SIG (Ecoembes) y pagar el canon correspondiente. Al activarse el SDDR obligatorio para una categoría de envases, los productores afectados dejan de pagar al SIG por esa categoría (evitar doble pago). El SIG (Ecoembes) y el operador del SDDR deben establecer acuerdos de compensación para los envases que se recogen a través del contenedor amarillo en lugar de los puntos SDDR. Los envases sujetos a SDDR obligatorio que se depositen incorrectamente en el contenedor amarillo seguirán siendo gestionados por Ecoembes hasta que el SDDR alcance una tasa de retorno suficiente.`,
    metadata: { category: "SDDR", topic: "transicion_SDDR_SIG" },
  },

  // ─── GRUPO C — ARTS. 17–45 OBLIGACIONES SCRAP ────────────────────────────
  {
    title: "Arts. 17-18 — Registro SCRAP y obligaciones de declaración",
    article_ref: "RD 1055/2022 Arts. 17-18",
    content: `Arts. 17-18 del RD 1055/2022 regulan el registro y declaración en SCRAP: Art. 17 — Registro: los productores de envases domésticos con obligación de adherirse a un SCRAP deben inscribirse en el registro de productores del MITECO antes de poner en el mercado los envases. El registro es previo y obligatorio; comercializar sin registro es infracción grave. Art. 18 — Declaración: los productores deben presentar al SCRAP una declaración anual con las toneladas de cada material de envase puestas en el mercado durante el año anterior. La declaración debe presentarse antes del 31 de marzo del año siguiente. La declaración debe desglosar por tipo de material (plástico, papel/cartón, vidrio, metal, madera, compuestos) y por tipo de envase (doméstico, comercial, industrial). Los datos declarados pueden ser objeto de auditoría.`,
    metadata: { category: "SCRAP", topic: "registro_declaracion" },
  },
  {
    title: "Art. 19 — Declaración anual de tonelaje a MITECO",
    article_ref: "RD 1055/2022 Art. 19",
    content: `El Art. 19 del RD 1055/2022 establece la obligación de comunicación anual de datos de tonelaje al MITECO: los SCRAP (y los sistemas individuales autorizados) deben comunicar anualmente al MITECO los datos agregados de envases recogidos, reciclados y valorizados, desglosados por material y tipo de envase. Los productores adheridos al SCRAP cumplen esta obligación a través del propio SCRAP. Los productores con Sistema Individual deben presentar directamente los datos al MITECO. La comunicación debe realizarse antes del 30 de junio del año siguiente al ejercicio declarado. El MITECO publica anualmente las estadísticas agregadas de gestión de envases en España para seguimiento de objetivos de reciclaje.`,
    metadata: { category: "SCRAP", topic: "declaracion_tonelaje_MITECO" },
  },
  {
    title: "Arts. 20-23 — Adhesión al SIG: canon, cálculo y umbral 250 kg/año",
    article_ref: "RD 1055/2022 Arts. 20-23",
    content: `Arts. 20-23 del RD 1055/2022 regulan la adhesión al SIG (Sistema Integrado de Gestión): Art. 20 — Umbral de adhesión obligatoria: productores que pongan en el mercado más de 250 kg/año de envases domésticos están obligados a adherirse a un SIG autorizado o implantar un SIS (Sistema Individual). Art. 21 — Canon: las empresas adheridas pagan un canon por cada tonelada de envase puesta en el mercado. El canon se calcula por material y peso según las tarifas del SIG (Ecoembes/Ecovidrio). Art. 22 — Cálculo del canon: el importe depende del tipo de material (plástico flexible, plástico rígido, papel/cartón, vidrio, aluminio, acero) y del peso del envase. Art. 23 — Pago: se realiza de forma trimestral o anual según las condiciones del SIG. Las pymes con volumen inferior a 250 kg/año están exentas de adhesión obligatoria pero pueden adherirse voluntariamente.`,
    metadata: { category: "SCRAP", topic: "adhesion_SIG_canon" },
  },
  {
    title: "Arts. 24-26 — Sistema Individual de Responsabilidad (SIR): alternativa al SIG",
    article_ref: "RD 1055/2022 Arts. 24-26",
    content: `Arts. 24-26 del RD 1055/2022 regulan el Sistema Individual de Responsabilidad (SIR) como alternativa al SIG: Art. 24 — El SIR permite a los grandes productores (habitualmente con volúmenes >10.000 t/año) gestionar directamente sus obligaciones de reciclaje sin adherirse a Ecoembes/Ecovidrio. El SIR requiere autorización previa del MITECO. Art. 25 — Obligaciones del SIR: el productor debe organizar y financiar la recogida selectiva de sus propios envases puestos en el mercado, garantizar las tasas de reciclaje exigidas, y reportar anualmente al MITECO. Art. 26 — Garantía financiera: el SIR debe constituir una garantía financiera (aval bancario o seguro) para asegurar el cumplimiento de sus obligaciones durante toda su vigencia. El SIR no puede usar el símbolo Punto Verde; debe usar una marcación alternativa reconocida por el MITECO.`,
    metadata: { category: "SCRAP", topic: "sistema_individual_SIR" },
  },
  {
    title: "Arts. 27-30 — Obligaciones de ecodiseño y objetivos de reciclabilidad",
    article_ref: "RD 1055/2022 Arts. 27-30",
    content: `Arts. 27-30 del RD 1055/2022 regulan las obligaciones de ecodiseño de envases: Art. 27 — Los envases deben diseñarse para maximizar su reciclabilidad: uso de materiales mono-material cuando sea posible, minimización de componentes incompatibles con el reciclaje (tintas, pegamentos, laminados no separables). Art. 28 — Restricciones: los envases no deben contener sustancias peligrosas que dificulten el reciclaje o contaminen los materiales recuperados. Art. 29 — Objetivo de reciclabilidad: para 2030, el 70% de los envases puestos en el mercado deben ser reciclables en los sistemas de recogida disponibles en España. Art. 30 — Los productores deben documentar el análisis de reciclabilidad de sus envases y ponerlo a disposición del MITECO o la CCAA competente en caso de inspección.`,
    metadata: { category: "SCRAP", topic: "ecodiseño_reciclabilidad" },
  },
  {
    title: "Arts. 31-35 — Formatos de declaración de datos y entradas en el registro",
    article_ref: "RD 1055/2022 Arts. 31-35",
    content: `Arts. 31-35 del RD 1055/2022 regulan los formatos de declaración y el registro de productores: Art. 31 — El MITECO establece los formularios y formatos electrónicos para la declaración anual de tonelajes. Art. 32 — Las declaraciones deben presentarse a través del Registro de Productores de Envases (RPE), disponible en la Sede Electrónica del MITECO. Art. 33 — Los datos declarados deben estar respaldados por documentación contable (facturas de compra de envases, albaranes, contratos de suministro). Art. 34 — Los SCRAP tienen acceso a los datos de declaración de sus adheridos para verificar la coherencia. Art. 35 — El MITECO puede cruzar los datos del RPE con los datos de la AEAT (Agencia Tributaria) para detectar declaraciones incorrectas o incompletas.`,
    metadata: { category: "SCRAP", topic: "declaracion_formatos_registro" },
  },
  {
    title: "Arts. 36-38 — Auditorías SCRAP y derechos de inspección",
    article_ref: "RD 1055/2022 Arts. 36-38",
    content: `Arts. 36-38 del RD 1055/2022 regulan las auditorías y la inspección: Art. 36 — Los SCRAP están obligados a someterse a auditorías externas anuales realizadas por entidades acreditadas por ENAC. La auditoría verifica que los datos declarados de recogida y reciclaje son correctos y que los fondos recaudados se destinan a los fines previstos. Art. 37 — Los inspectores de las CCAA tienen derecho a acceder a las instalaciones de los productores y distribuidores para verificar el cumplimiento del etiquetado, el registro en el SCRAP y las declaraciones de tonelaje. Art. 38 — Los productores deben conservar la documentación de sus declaraciones SCRAP durante un mínimo de 5 años y ponerla a disposición de los inspectores cuando sea requerida.`,
    metadata: { category: "SCRAP", topic: "auditorias_inspeccion" },
  },
  {
    title: "Arts. 39-41 — Objetivos de recuperación y reciclaje por material (2025/2030)",
    article_ref: "RD 1055/2022 Arts. 39-41",
    content: `Arts. 39-41 del RD 1055/2022 establecen los objetivos de reciclaje por material: Para 2025: vidrio 75%, papel y cartón 85%, metales férreos 80%, aluminio 60%, plásticos 50%, madera 30%. Para 2030: vidrio 80%, papel y cartón 90%, metales férreos 90%, aluminio 70%, plásticos 55%, madera 40%. Art. 40 — Los SCRAP son responsables de garantizar que los objetivos se cumplen a nivel agregado en el conjunto de los envases gestionados. Art. 41 — Si los objetivos no se alcanzan, el SCRAP debe presentar un plan de acción correctora al MITECO. El incumplimiento reiterado puede suponer la revocación de la autorización del SCRAP. Los objetivos son de aplicación al conjunto del sistema, no empresa por empresa.`,
    metadata: { category: "SCRAP", topic: "objetivos_reciclaje" },
  },
  {
    title: "Arts. 42-45 — Acuerdos inter-sistema SCRAP",
    article_ref: "RD 1055/2022 Arts. 42-45",
    content: `Arts. 42-45 del RD 1055/2022 regulan los acuerdos entre SCRAP: Art. 42 — Cuando un productor comercializa envases que gestionan dos SCRAP distintos (p.ej., envases ligeros + vidrio), puede adherirse a ambos o llegar a acuerdos de cobertura cruzada. Art. 43 — Los acuerdos inter-sistema deben comunicarse al MITECO y garantizar que no hay duplicación ni laguna en la gestión. Art. 44 — El tetrabrik (C/PAP) es gestionado conjuntamente por Ecoembes; los productores de briks solo necesitan adherirse a Ecoembes aunque el material contenga plástico y aluminio. Art. 45 — Los SCRAP pueden establecer acuerdos de compensación económica cuando las tasas de recogida benefician a un sistema más que a otro (por ejemplo, cuando los envases de vidrio son recogidos en áreas gestionadas por Ecoembes).`,
    metadata: { category: "SCRAP", topic: "acuerdos_inter_sistema" },
  },

  // ─── GRUPO B — ART. 2 DEFINICIONES INDIVIDUALES ─────────────────────────
  {
    title: "Definición: Envase primario, secundario y terciario (Art. 2)",
    article_ref: "RD 1055/2022 Art. 2.1.a-c",
    content: `Según el Art. 2 del RD 1055/2022: Envase primario: aquel que está en contacto directo con el producto y constituye la primera envoltura del mismo (botella de agua, lata de refresco, blíster de medicamento). Envase secundario o colectivo: el que agrupa uno o varios envases primarios para facilitar su venta al por menor o su agrupación; puede retirarse sin alterar las características del producto (caja de cartón que agrupa varias latas). Envase terciario o de transporte: el destinado a facilitar la manipulación y el transporte de mercancías para evitar daños físicos durante la distribución; incluye palets, flejes y film de paletizado. Todos los tipos de envase están sujetos a las obligaciones del RD 1055/2022, aunque con requisitos de etiquetado diferenciados según el canal de distribución.`,
    metadata: { category: "definiciones", topic: "tipos_envase" },
  },
  {
    title: "Definición: Productor, importador y distribuidor (Art. 2)",
    article_ref: "RD 1055/2022 Art. 2.1.d",
    content: `Según el Art. 2.1.d del RD 1055/2022: Productor: la persona física o jurídica que, con independencia de la técnica de venta utilizada (incluida venta a distancia), fabrica, importa o adquiere en otros Estados miembros de la UE envases o productos envasados y los pone en el mercado español. Un fabricante de producto envasado que compra los envases vacíos y los rellena también es "productor" a efectos del RD 1055/2022. Importador: quien introduce en el territorio español productos envasados procedentes de terceros países (fuera de la UE); tiene las mismas obligaciones que el productor. Distribuidor: quien comercializa los productos envasados en la cadena de suministro; tiene obligaciones subsidiarias cuando el productor no cumple sus obligaciones de etiquetado o registro SCRAP.`,
    metadata: { category: "definiciones", topic: "productor_importador" },
  },
  {
    title: "Definición: Envase doméstico vs. comercial vs. industrial (Art. 2.1.e)",
    article_ref: "RD 1055/2022 Art. 2.1.e",
    content: `La clasificación del Art. 2.1.e es crítica para determinar las obligaciones aplicables: Envase doméstico: el destinado al consumidor final para uso en el hogar; incluye todos los envases que, independientemente del canal de venta, puedan acabar en manos de un consumidor privado. Envase comercial: el que se utiliza en el punto de venta para agrupar productos o facilitar su presentación al comprador, aunque no llegue al domicilio del consumidor (bolsas de la compra de supermercado, cajas exhibidoras). Envase industrial: el utilizado exclusivamente en procesos industriales o para el transporte de materias primas entre empresas, que no llega al consumidor final (bidones de productos químicos industriales, big bags, palets). La clasificación como doméstico obliga al etiquetado completo (Art. 13.1 + 13.2) y a la adhesión al SIG (Ecoembes/Ecovidrio). Si hay duda, se presume doméstico.`,
    metadata: { category: "definiciones", topic: "envase_doméstico_comercial_industrial" },
  },
  {
    title: "Definición: SCRAP — Sistema Colectivo de Responsabilidad Ampliada del Productor",
    article_ref: "RD 1055/2022 Art. 2.1.f — SCRAP",
    content: `SCRAP (Sistema Colectivo de Responsabilidad Ampliada del Productor): sistema mediante el cual varios productores se unen colectivamente para cumplir conjuntamente sus obligaciones de responsabilidad ampliada del productor (RAP). En España, los principales SCRAP para envases son: Ecoembes (envases ligeros de plástico, metal y cartón para el hogar) y Ecovidrio (envases de vidrio). Los productores de envases domésticos con más de 250 kg/año están obligados a adherirse a un SCRAP o a implantar un Sistema Individual de Responsabilidad (SIR). El SCRAP recauda el canon de los productores, financia la recogida selectiva y la gestión de residuos, y certifica el cumplimiento ante la administración.`,
    metadata: { category: "definiciones", topic: "SCRAP" },
  },
  {
    title: "Definición: SIG — Sistema Integrado de Gestión (Ecoembes, Ecovidrio)",
    article_ref: "RD 1055/2022 Art. 2.1.g — SIG",
    content: `SIG (Sistema Integrado de Gestión): denominación específica de los SCRAP autorizados en España para gestionar los residuos de envases domésticos. Los SIG vigentes son: Ecoembes — gestiona envases ligeros (plásticos, metales, briks, cartón para bebidas) a través del contenedor amarillo, y cartón/papel a través del contenedor azul; autorizado por el MITECO. Ecovidrio — gestiona envases de vidrio a través del contenedor verde (iglú); autorizado por el MITECO. Los productores adheridos al SIG tienen derecho a usar el símbolo Punto Verde en sus envases. El SIG cobra un canon por tonelada de envase puesto en el mercado, calculado según el tipo de material y el peso del envase.`,
    metadata: { category: "definiciones", topic: "SIG" },
  },
  {
    title: "Definición: Envasador y responsable de puesta en mercado (Art. 2)",
    article_ref: "RD 1055/2022 Art. 2.1.h",
    content: `Envasador: la persona física o jurídica que realiza la operación de llenado de envases (por cuenta propia o de terceros) y pone el producto envasado en el mercado. El envasador es considerado "productor" a efectos del RD 1055/2022 y asume todas las obligaciones derivadas. Responsable de la puesta en el mercado: cuando el fabricante del envase y el envasador son distintos, el responsable de puesta en el mercado es quien finalmente comercializa el producto (generalmente el envasador o el propietario de la marca). Esta distinción es relevante para determinar quién debe registrarse en el SCRAP y quién debe colocar el etiquetado obligatorio. En el caso de la marca blanca (MDD), el distribuidor o retailer que encarga el envasado bajo su marca es el responsable de puesta en el mercado.`,
    metadata: { category: "definiciones", topic: "envasador" },
  },
  {
    title: "Definición: Material de envasado, material recuperable y material reciclado (Art. 2)",
    article_ref: "RD 1055/2022 Art. 2.1.i-k",
    content: `Según el Art. 2 del RD 1055/2022: Material de envasado: materia prima o mezcla de materias primas empleada para fabricar el envase o sus componentes. Material recuperable (o valorizable): material de envase que, una vez convertido en residuo, puede ser objeto de alguna operación de valorización (reciclaje material, reciclaje orgánico, valorización energética). Material reciclado: material obtenido del procesamiento de residuos de envases u otros materiales recuperados (post-consumo o pre-consumo) que puede usarse como materia prima. El contenido de material reciclado en un envase puede indicarse voluntariamente (Art. 13.4) si está certificado. Para 2030, el Reglamento PPWR (UE 2025/40) establecerá contenidos mínimos obligatorios de material reciclado por tipo de envase y material.`,
    metadata: { category: "definiciones", topic: "material_reciclado" },
  },
  {
    title: "Definición: Vida útil del envase y número de rotaciones mínimo (Art. 2)",
    article_ref: "RD 1055/2022 Art. 2.1.l — Reutilización",
    content: `Vida útil del envase reutilizable: período durante el cual el envase puede cumplir su función de contener, proteger y presentar el producto, siendo objeto de las operaciones de recuperación, lavado y rellenado que sean necesarias. Número de rotaciones mínimo: para que un envase sea clasificado como "reutilizable" debe superar un número mínimo de usos (rotaciones) establecido en la normativa de ecodiseño: envases de plástico rígido ≥10 rotaciones; envases de vidrio ≥20 rotaciones; envases de metal ≥20 rotaciones. Por debajo de ese umbral de rotaciones, el envase no puede etiquetarse como "reutilizable" aunque esté físicamente diseñado para múltiples usos. El número de rotaciones debe estar respaldado por ensayos del fabricante o datos de campo documentados.`,
    metadata: { category: "definiciones", topic: "reutilizacion_rotaciones" },
  },

  // ─── GRUPO A — ART. 13 EXPANSIÓN COMPLETA ────────────────────────────────
  {
    title: "Art. 13.1 — Obligación general de etiquetado (todos los tipos de envase)",
    article_ref: "RD 1055/2022 Art. 13.1",
    content: `El artículo 13.1 del RD 1055/2022 establece la obligación general de etiquetado de envases: todos los envases puestos en el mercado en España deben llevar, de forma visible, legible e indeleble, la identificación del material o materiales de que está fabricado el envase, utilizando los códigos de identificación establecidos en el Anexo II. Esta obligación afecta a todos los tipos de envases: primarios, secundarios y terciarios, y es independiente del volumen o peso del producto envasado. La obligación recae sobre el productor o responsable de la puesta en el mercado. El etiquetado debe estar en el propio envase o en una etiqueta firmemente adherida al mismo.`,
    metadata: { category: "etiquetado", topic: "art13_obligacion_general" },
  },
  {
    title: "Art. 13.2 — Indicación de contenedor para envases domésticos; regla canal B2B/B2C",
    article_ref: "RD 1055/2022 Art. 13.2",
    content: `El artículo 13.2 del RD 1055/2022 establece que los envases domésticos (destinados al consumidor final) deben incluir, además del código de material, la indicación del contenedor de recogida selectiva donde debe depositarse el residuo de envase. Esta indicación puede ser textual ("Deposítalo en el contenedor amarillo") o pictográfica (imagen del contenedor correspondiente). Regla canal dual B2B/B2C: cuando un mismo producto se comercializa tanto en canal profesional (B2B) como en canal consumidor (B2C), el etiquetado del contenedor es obligatorio si existe alguna posibilidad razonable de que el envase llegue al consumidor final. En caso de duda sobre si el canal es exclusivamente B2B, debe aplicarse el etiquetado doméstico.`,
    metadata: { category: "etiquetado", topic: "art13_contenedor_doméstico" },
  },
  {
    title: "Art. 13.3 — Prohibición de declaraciones medioambientales engañosas (greenwashing)",
    article_ref: "RD 1055/2022 Art. 13.3",
    content: `El artículo 13.3 del RD 1055/2022 prohíbe expresamente el uso de declaraciones medioambientales engañosas en el etiquetado de envases. Están prohibidas las indicaciones que sugieran que el envase es reciclable cuando no lo es según los sistemas de recogida disponibles en España, o que sobreestimen el rendimiento medioambiental real del envase. Frases específicamente prohibidas o que requieren justificación documental: "100% reciclable" (si contiene componentes no reciclables), "ecológico", "sostenible", "respetuoso con el medioambiente", "eco-friendly", "verde", "biodegradable" (salvo certificación acreditada), "compostable" (sin cumplir Art. 13.5), "neutral en carbono" (sin verificación independiente). El uso no justificado de estas expresiones constituye infracción grave sancionable con hasta 100.000€.`,
    metadata: { category: "etiquetado", topic: "art13_greenwashing" },
  },
  {
    title: "Art. 13.4 — Información voluntaria adicional (tasa de reciclabilidad, contenido reciclado)",
    article_ref: "RD 1055/2022 Art. 13.4",
    content: `El artículo 13.4 del RD 1055/2022 permite, con carácter voluntario, incluir en el etiquetado información adicional sobre el rendimiento medioambiental del envase, siempre que sea veraz, verificable y no induzca a error. Información voluntaria permitida: (a) Porcentaje de material reciclado utilizado en la fabricación del envase (debe estar certificado por entidad acreditada). (b) Tasa de reciclabilidad del envase según metodología de ensayo reconocida (ISO, CEN). (c) Huella de carbono del envase (verificada por tercero independiente). (d) Indicación de que el envase es reciclable "en los sistemas de recogida selectiva de España". Esta información adicional no puede sustituir a la información obligatoria del Art. 13.1-13.2 y debe presentarse de forma diferenciada y no confusa.`,
    metadata: { category: "etiquetado", topic: "art13_informacion_voluntaria" },
  },
  {
    title: "Art. 13.5 — Marcado de compostabilidad: certificaciones UNE EN 13432 y EN 14995 obligatorias",
    article_ref: "RD 1055/2022 Art. 13.5",
    content: `El artículo 13.5 del RD 1055/2022 regula el marcado de compostabilidad en envases. Solo pueden denominarse "compostables" los envases que cuenten con certificación conforme a la norma UNE EN 13432:2001 (compostabilidad industrial) o EN 14995:2006 (para plásticos en general). El marcado debe incluir: (1) El símbolo de compostabilidad reconocido (por ejemplo, el logotipo "Seedling" de European Bioplastics para compostabilidad industrial). (2) La indicación explícita de si es compostabilidad industrial (requiere planta de compostaje) o doméstica (OK compost HOME, norma menos exigente). (3) La mención de la norma de referencia. Está prohibido etiquetar un envase como "compostable" o "biodegradable" sin certificación acreditada. La infracción es grave (hasta 100.000€).`,
    metadata: { category: "etiquetado", topic: "art13_compostabilidad" },
  },
  {
    title: "Art. 13.6 — Advertencias sobre materiales peligrosos o incompatibles",
    article_ref: "RD 1055/2022 Art. 13.6",
    content: `El artículo 13.6 del RD 1055/2022 establece que los envases que contengan materiales peligrosos o incompatibles con los flujos habituales de reciclaje deben incluir advertencias específicas en el etiquetado. Casos de aplicación: (a) Envases contaminados con sustancias peligrosas que requieran gestión especial (punto limpio, gestor autorizado). (b) Envases con materiales que contaminen el flujo de reciclaje si se mezclan (p.ej., PVC en flujo de PET). (c) Envases con componentes que deban separarse antes del depósito (p.ej., tapa de material diferente que no puede ir al mismo contenedor). La advertencia debe incluir instrucciones claras de gestión y, cuando proceda, remisión al punto limpio más cercano.`,
    metadata: { category: "etiquetado", topic: "art13_materiales_peligrosos" },
  },
  {
    title: "Art. 13.7 — Pictograma SUP obligatorio (Reglamento UE 2020/2151)",
    article_ref: "RD 1055/2022 Art. 13.7 — Reglamento UE 2020/2151",
    content: `El artículo 13.7 del RD 1055/2022, en relación con el Reglamento de Ejecución UE 2020/2151 de la Comisión, establece la obligatoriedad del pictograma SUP (Single-Use Plastics) en determinados productos plásticos de un solo uso. El pictograma específico (figura humana tirando basura con aspa, junto a indicación de que el producto contiene plástico) es obligatorio para: compresas, tampones y aplicadores; toallitas húmedas; globos; filtros de cigarrillos con plástico; tazas para bebidas; recipientes de comida con contenido en plástico. El pictograma debe cumplir las especificaciones técnicas del Reglamento 2020/2151: dimensiones mínimas (>1 cm de altura), contraste y posición visible. La ausencia del pictograma en productos SUP sujetos es infracción grave.`,
    metadata: { category: "etiquetado", topic: "art13_pictograma_SUP" },
  },
  {
    title: "Art. 13.8 — Etiquetado digital como complemento (códigos QR permitidos, no sustitutivos)",
    article_ref: "RD 1055/2022 Art. 13.8",
    content: `El artículo 13.8 del RD 1055/2022 regula el uso del etiquetado digital en envases. Los códigos QR, DataMatrix y otros soportes digitales están permitidos como complemento al etiquetado físico obligatorio, pero no pueden sustituirlo. El etiquetado digital puede incluir: (a) Información ampliada sobre reciclabilidad e instrucciones detalladas de gestión. (b) Datos de trazabilidad del envase (origen del material, proveedor). (c) Información sobre el contenido de material reciclado (verificable). (d) Enlace al Pasaporte de Producto Digital (anticipando requisitos PPWR). Los pictogramas obligatorios (código de material, Punto Verde, pictograma SUP) deben estar siempre impresos físicamente en el envase; no puede remitirse al código QR para cumplirlos.`,
    metadata: { category: "etiquetado", topic: "art13_etiquetado_digital" },
  },
];
