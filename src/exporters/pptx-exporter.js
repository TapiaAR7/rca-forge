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

  slide.addText(title, {
    x: x + 0.16,
    y: y + 0.12,
    w: w - 0.32,
    h: 0.25,
    fontFace: "Arial",
    fontSize: 11,
    bold: true,
    color: "1D4ED8",
    fit: "shrink"
  });

  slide.addText(clean(body), {
    x: x + 0.16,
    y: y + 0.45,
    w: w - 0.32,
    h: h - 0.55,
    fontFace: "Arial",
    fontSize: 9,
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

function createFishboneSlide(deck) {
  const slide = deck.addSlide();
  slide.background = { color: "FFFFFF" };

  addHeader(slide, "Fishbone Diagram");

  const categories = currentProject.fishbone.categories.slice(0, 6);
  const problemTitle =
    currentProject.meta.title ||
    currentProject.problem.what ||
    "Problem";

  const spineStartX = 1.2;
  const spineY = 3.75;
  const spineW = 8.75;

  slide.addShape(shape("line"), {
    x: spineStartX,
    y: spineY,
    w: spineW,
    h: 0,
    line: { color: "102033", width: 2.2 }
  });

  slide.addShape(shape("triangle"), {
    x: 9.85,
    y: 3.55,
    w: 0.35,
    h: 0.4,
    rotate: 90,
    fill: { color: "102033" },
    line: { color: "102033" }
  });

  slide.addShape(shape("rect"), {
    x: 10.25,
    y: 3.05,
    w: 2.25,
    h: 1.35,
    fill: { color: "2563EB" },
    line: { color: "2563EB", width: 1 }
  });

  slide.addText(clean(problemTitle), {
    x: 10.38,
    y: 3.18,
    w: 2.0,
    h: 1.05,
    fontFace: "Arial",
    fontSize: 10,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "mid",
    fit: "shrink"
  });

  const positions = [
    { x: 1.0, y: 1.25, anchorX: 2.35, anchorY: spineY, top: true },
    { x: 4.0, y: 1.25, anchorX: 5.15, anchorY: spineY, top: true },
    { x: 7.0, y: 1.25, anchorX: 7.95, anchorY: spineY, top: true },
    { x: 1.0, y: 5.15, anchorX: 2.35, anchorY: spineY, top: false },
    { x: 4.0, y: 5.15, anchorX: 5.15, anchorY: spineY, top: false },
    { x: 7.0, y: 5.15, anchorX: 7.95, anchorY: spineY, top: false }
  ];

  categories.forEach((category, index) => {
    const pos = positions[index];

    if (!pos) return;

    const boxX = pos.x;
    const boxY = pos.y;
    const boxW = 2.45;
    const boxH = 1.35;

    const connectToX = boxX + boxW / 2;
    const connectToY = pos.top ? boxY + boxH : boxY;

    slide.addShape(shape("line"), {
      x: pos.anchorX,
      y: pos.anchorY,
      w: connectToX - pos.anchorX,
      h: connectToY - pos.anchorY,
      line: { color: "102033", width: 1.6 }
    });

    slide.addShape(shape("rect"), {
      x: boxX,
      y: boxY,
      w: boxW,
      h: boxH,
      fill: { color: "F8FBFF" },
      line: { color: "BFD3FF", width: 1 }
    });

    slide.addText(category.name, {
      x: boxX + 0.12,
      y: boxY + 0.1,
      w: boxW - 0.24,
      h: 0.25,
      fontFace: "Arial",
      fontSize: 11,
      bold: true,
      color: "1D4ED8",
      fit: "shrink"
    });

    const causes = category.causes.length
      ? category.causes
          .slice(0, 3)
          .map((cause) => `• ${cause.text}`)
          .join("\n")
      : "• No causes added";

    slide.addText(causes, {
      x: boxX + 0.12,
      y: boxY + 0.43,
      w: boxW - 0.24,
      h: boxH - 0.52,
      fontFace: "Arial",
      fontSize: 7.8,
      color: "102033",
      valign: "top",
      fit: "shrink"
    });
  });

  slide.addText("Method used: Fishbone / Ishikawa", {
    x: 0.65,
    y: 6.72,
    w: 6.5,
    h: 0.25,
    fontFace: "Arial",
    fontSize: 8.5,
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

  const blob = await deck.write("blob");
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
