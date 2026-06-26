import { currentProject } from "../state.js";
import { buildProblemStatement, getAllCauses } from "../rca-engine.js";

const PPTX_CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
  "https://unpkg.com/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"
];

function clean(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function safeFileName(value) {
  return clean(value, "rca-report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getPptxConstructor() {
  return window.PptxGenJS || window.pptxgen || window.pptxgenjs || null;
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}"]`);

    if (existingScript) {
      if (getPptxConstructor()) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));

    document.head.appendChild(script);
  });
}

async function ensurePptxLibraryLoaded() {
  const existingConstructor = getPptxConstructor();

  if (existingConstructor) {
    return existingConstructor;
  }

  for (const url of PPTX_CDN_URLS) {
    try {
      await loadScript(url);

      const constructorAfterLoad = getPptxConstructor();

      if (constructorAfterLoad) {
        return constructorAfterLoad;
      }
    } catch (error) {
      console.warn(error);
    }
  }

  return null;
}

function shape(type) {
  return (
    window.PptxGenJS?.ShapeType?.[type] ||
    window.pptxgen?.ShapeType?.[type] ||
    window.pptxgenjs?.ShapeType?.[type] ||
    type
  );
}

function addHeader(slide, title) {
  slide.addText(title, {
    x: 0.55,
    y: 0.35,
    w: 12.2,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 22,
    bold: true,
    color: "102033"
  });

  slide.addShape(shape("line"), {
    x: 0.55,
    y: 0.86,
    w: 12.2,
    h: 0,
    line: { color: "2563EB", width: 1.2 }
  });
}

function addFooter(slide) {
  slide.addText("Generated with RCA Forge", {
    x: 0.55,
    y: 7.05,
    w: 12.2,
    h: 0.25,
    fontFace: "Arial",
    fontSize: 8,
    color: "667085",
    align: "right"
  });
}

function addCard(slide, title, body, x, y, w, h) {
  slide.addShape(shape("rect"), {
    x,
    y,
    w,
    h,
    fill: { color: "F8FBFF" },
    line: { color: "D9E2EF", width: 1 }
  });

  slide.addShape(shape("rect"), {
    x,
    y,
    w,
    h: 0.28,
    fill: { color: "EAF2FF" },
    line: { color: "D9E2EF", width: 0.4 }
  });

  slide.addText(title, {
    x: x + 0.15,
    y: y + 0.06,
    w: w - 0.3,
    h: 0.18,
    fontFace: "Arial",
    fontSize: 10,
    bold: true,
    color: "1D4ED8",
    fit: "shrink"
  });

  slide.addText(clean(body), {
    x: x + 0.15,
    y: y + 0.4,
    w: w - 0.3,
    h: h - 0.48,
    fontFace: "Arial",
    fontSize: 8.8,
    color: "102033",
    valign: "top",
    fit: "shrink"
  });
}

function createTitleSlide(deck) {
  const slide = deck.addSlide();
  slide.background = { color: "F8FAFC" };

  slide.addShape(shape("rect"), {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: "F8FAFC" },
    line: { color: "F8FAFC" }
  });

  slide.addShape(shape("rect"), {
    x: 0.75,
    y: 0.75,
    w: 1.05,
    h: 1.05,
    fill: { color: "2563EB" },
    line: { color: "2563EB" }
  });

  slide.addText("RCA", {
    x: 0.75,
    y: 1.08,
    w: 1.05,
    h: 0.3,
    fontFace: "Arial",
    fontSize: 16,
    bold: true,
    color: "FFFFFF",
    align: "center"
  });

  slide.addText("RCA Report", {
    x: 2.05,
    y: 0.85,
    w: 10.5,
    h: 0.55,
    fontFace: "Arial",
    fontSize: 30,
    bold: true,
    color: "102033"
  });

  slide.addText(clean(currentProject.meta.title), {
    x: 2.05,
    y: 1.45,
    w: 10.5,
    h: 0.45,
    fontFace: "Arial",
    fontSize: 17,
    color: "475467"
  });

  addCard(slide, "Prepared By", currentProject.meta.preparedBy, 0.75, 2.45, 3.7, 1.0);
  addCard(slide, "Area / Process", currentProject.meta.areaProcess, 4.8, 2.45, 3.7, 1.0);
  addCard(slide, "Date", currentProject.meta.date, 8.85, 2.45, 3.7, 1.0);

  addCard(
    slide,
    "RCA Flow",
    "Problem → Fishbone → Evidence → 5 Whys → Root Cause → Actions",
    0.75,
    4.05,
    11.8,
    1.25
  );

  addFooter(slide);
}

function createProblemSlide(deck) {
  const slide = deck.addSlide();
  slide.background = { color: "FFFFFF" };

  addHeader(slide, "Problem Statement");

  addCard(
    slide,
    "Problem Summary",
    buildProblemStatement() || "No problem statement entered.",
    0.65,
    1.15,
    12.0,
    2.35
  );

  addCard(slide, "Impact", currentProject.problem.impact, 0.65, 3.85, 5.85, 1.35);
  addCard(slide, "Containment", currentProject.problem.containment, 6.8, 3.85, 5.85, 1.35);

  addFooter(slide);
}

function makeCausesText(category) {
  if (!category.causes.length) {
    return "• No causes added";
  }

  return category.causes
    .slice(0, 3)
    .map((cause) => `• ${cause.text}`)
    .join("\n");
}

function addFishboneCategoryCard(slide, category, x, y, w, h) {
  slide.addShape(shape("rect"), {
    x,
    y,
    w,
    h,
    fill: { color: "F8FBFF" },
    line: { color: "BFD3FF", width: 1.1 }
  });

  slide.addShape(shape("rect"), {
    x,
    y,
    w,
    h: 0.34,
    fill: { color: "DBEAFE" },
    line: { color: "BFD3FF", width: 0.5 }
  });

  slide.addText(category.name, {
    x: x + 0.13,
    y: y + 0.08,
    w: w - 0.26,
    h: 0.2,
    fontFace: "Arial",
    fontSize: 10,
    bold: true,
    color: "1D4ED8",
    fit: "shrink"
  });

  slide.addText(makeCausesText(category), {
    x: x + 0.14,
    y: y + 0.44,
    w: w - 0.28,
    h: h - 0.52,
    fontFace: "Arial",
    fontSize: 7.4,
    color: "102033",
    valign: "top",
    fit: "shrink"
  });
}

function addSafeLine(slide, x, y, w, h, color = "102033", width = 1.5) {
  slide.addShape(shape("line"), {
    x,
    y,
    w,
    h,
    line: { color, width }
  });
}

function createFishboneSlide(deck) {
  const slide = deck.addSlide();
  slide.background = { color: "F8FAFC" };

  addHeader(slide, "Fishbone / Ishikawa Diagram");

  const categories = currentProject.fishbone.categories.slice(0, 6);
  const problemTitle =
    currentProject.meta.title ||
    currentProject.problem.what ||
    "Problem";

  slide.addShape(shape("rect"), {
    x: 0.55,
    y: 1.05,
    w: 12.25,
    h: 5.75,
    fill: { color: "FFFFFF" },
    line: { color: "D9E2EF", width: 1 }
  });

  const spineY = 3.75;

  addSafeLine(slide, 0.9, spineY, 9.25, 0, "102033", 3);

  addSafeLine(slide, 0.72, 3.38, 0.35, 0.37, "102033", 2);
  addSafeLine(slide, 0.72, 3.75, 0.35, 0, "102033", 2);
  addSafeLine(slide, 0.72, 3.75, 0.35, 0.37, "102033", 2);

  addSafeLine(slide, 10.05, spineY, 0.35, 0, "102033", 3);

  slide.addShape(shape("rect"), {
    x: 10.4,
    y: 2.95,
    w: 2.25,
    h: 1.6,
    fill: { color: "2563EB" },
    line: { color: "1D4ED8", width: 1.1 }
  });

  slide.addText("PROBLEM", {
    x: 10.55,
    y: 3.08,
    w: 1.95,
    h: 0.22,
    fontFace: "Arial",
    fontSize: 8,
    bold: true,
    color: "DDEBFF",
    align: "center"
  });

  slide.addText(clean(problemTitle), {
    x: 10.55,
    y: 3.35,
    w: 1.95,
    h: 0.9,
    fontFace: "Arial",
    fontSize: 10,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "mid",
    fit: "shrink"
  });

  const cardW = 2.35;
  const cardH = 1.32;

  const layout = [
    { cardX: 1.15, cardY: 1.28, lineX: 2.3, lineY: 2.6, lineW: 0.75, lineH: 1.15, ribY: 2.95 },
    { cardX: 4.0, cardY: 1.28, lineX: 5.15, lineY: 2.6, lineW: 0.75, lineH: 1.15, ribY: 2.95 },
    { cardX: 6.85, cardY: 1.28, lineX: 8.0, lineY: 2.6, lineW: 0.75, lineH: 1.15, ribY: 2.95 },
    { cardX: 1.15, cardY: 5.05, lineX: 2.3, lineY: 3.75, lineW: 0.75, lineH: 1.3, ribY: 4.2 },
    { cardX: 4.0, cardY: 5.05, lineX: 5.15, lineY: 3.75, lineW: 0.75, lineH: 1.3, ribY: 4.2 },
    { cardX: 6.85, cardY: 5.05, lineX: 8.0, lineY: 3.75, lineW: 0.75, lineH: 1.3, ribY: 4.2 }
  ];

  categories.forEach((category, index) => {
    const item = layout[index];

    if (!item) return;

    addSafeLine(slide, item.lineX, item.lineY, item.lineW, item.lineH, "102033", 2);
    addSafeLine(slide, item.lineX + 0.18, item.ribY, 0.25, 0.22, "667085", 0.8);
    addSafeLine(slide, item.lineX + 0.38, item.ribY + 0.18, 0.25, 0.22, "667085", 0.8);

    addFishboneCategoryCard(slide, category, item.cardX, item.cardY, cardW, cardH);
  });

  slide.addText("Method: Fishbone / Ishikawa", {
    x: 0.92,
    y: 6.51,
    w: 2.7,
    h: 0.2,
    fontFace: "Arial",
    fontSize: 7.5,
    color: "667085"
  });

  addFooter(slide);
}

function createEvidenceSlides(deck) {
  const causes = getAllCauses();

  if (causes.length === 0) {
    const slide = deck.addSlide();
    slide.background = { color: "FFFFFF" };

    addHeader(slide, "Evidence Review");
    addCard(slide, "Evidence", "No causes available for evidence review.", 0.65, 1.15, 12.0, 1.3);
    addFooter(slide);
    return;
  }

  const chunkSize = 4;

  for (let i = 0; i < causes.length; i += chunkSize) {
    const slide = deck.addSlide();
    slide.background = { color: "FFFFFF" };

    addHeader(slide, i === 0 ? "Evidence Review" : "Evidence Review Continued");

    const chunk = causes.slice(i, i + chunkSize);

    chunk.forEach((cause, index) => {
      const y = 1.15 + index * 1.45;

      const body = [
        `Category: ${cause.categoryName}`,
        `Status: ${cause.status}`,
        `Evidence for: ${clean(cause.evidenceFor)}`,
        `Evidence against: ${clean(cause.evidenceAgainst)}`,
        `Verification needed: ${clean(cause.verificationNeeded)}`
      ].join("\n");

      addCard(slide, cause.text, body, 0.65, y, 12.0, 1.25);
    });

    addFooter(slide);
  }
}

function createFiveWhysSlide(deck) {
  const slide = deck.addSlide();
  slide.background = { color: "FFFFFF" };

  addHeader(slide, "5 Whys Analysis");

  addCard(slide, "Starting Issue / Cause", currentProject.fiveWhys.start, 0.65, 1.15, 12.0, 0.8);

  const whyText = currentProject.fiveWhys.whys
    .map((why, index) => `Why ${index + 1}: ${clean(why)}`)
    .join("\n\n");

  addCard(slide, "Why Chain", whyText, 0.65, 2.2, 12.0, 3.8);

  addFooter(slide);
}

function createRootCauseSlide(deck) {
  const slide = deck.addSlide();
  slide.background = { color: "FFFFFF" };

  addHeader(slide, "Root Cause Validation");

  addCard(slide, "Root Cause", currentProject.rootCause.statement, 0.65, 1.15, 12.0, 1.25);
  addCard(slide, "Evidence Summary", currentProject.rootCause.evidenceSummary, 0.65, 2.75, 12.0, 1.55);
  addCard(slide, "Verification Method", currentProject.rootCause.verificationMethod, 0.65, 4.65, 12.0, 1.35);

  addFooter(slide);
}

function createActionsSlide(deck) {
  const slide = deck.addSlide();
  slide.background = { color: "FFFFFF" };

  addHeader(slide, "Action Plan");

  if (currentProject.actions.length === 0) {
    addCard(slide, "Actions", "No actions added.", 0.65, 1.15, 12.0, 1.0);
    addFooter(slide);
    return;
  }

  const actionsText = currentProject.actions
    .slice(0, 10)
    .map((action, index) => {
      return [
        `Action ${index + 1}`,
        `Type: ${clean(action.type)}`,
        `Action: ${clean(action.text)}`,
        `Owner: ${clean(action.owner)}`,
        `Due Date: ${clean(action.dueDate)}`,
        `Status: ${clean(action.status)}`
      ].join("\n");
    })
    .join("\n\n");

  addCard(slide, "Corrective / Preventive / Detection Actions", actionsText, 0.65, 1.15, 12.0, 5.3);

  addFooter(slide);
}

async function downloadDeck(deck, fileName) {
  try {
    await deck.writeFile({ fileName });
    return;
  } catch (error) {
    console.warn("writeFile failed, trying Blob download:", error);
  }

  try {
    const blob = await deck.write({ outputType: "blob" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error("PowerPoint download failed:", error);
    alert("PowerPoint download failed. Try Generate Markdown or Print Report.");
  }
}

export async function generatePowerPointDeck() {
  const PptxConstructor = await ensurePptxLibraryLoaded();

  if (!PptxConstructor) {
    alert(
      "PowerPoint export could not load in this browser. You can still use Generate Markdown or Print Report."
    );
    return;
  }

  const deck = new PptxConstructor();

  deck.layout = "LAYOUT_WIDE";
  deck.author = "RCA Forge";
  deck.company = "RCA Forge";
  deck.subject = "Root Cause Analysis Report";
  deck.title = clean(currentProject.meta.title, "RCA Report");
  deck.lang = "en-US";

  createTitleSlide(deck);
  createProblemSlide(deck);
  createFishboneSlide(deck);
  createEvidenceSlides(deck);
  createFiveWhysSlide(deck);
  createRootCauseSlide(deck);
  createActionsSlide(deck);

  const fileName = `${safeFileName(currentProject.meta.title)}.pptx`;

  await downloadDeck(deck, fileName);
}
