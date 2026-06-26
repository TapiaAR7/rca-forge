import { currentProject } from "../state.js";
import { buildProblemStatement, getAllCauses } from "../rca-engine.js";

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

function shape(type) {
  return window.pptxgen?.ShapeType?.[type] || type;
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
    color: "1D4ED8"
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

  addHeader(slide, "Fishbone Summary");

  const categories = currentProject.fishbone.categories;
  const colW = 3.85;
  const rowH = 1.25;
  const startX = 0.65;
  const startY = 1.15;
  const gapX = 0.3;
  const gapY = 0.22;

  categories.slice(0, 9).forEach((category, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);

    const x = startX + col * (colW + gapX);
    const y = startY + row * (rowH + gapY);

    const causes = category.causes.length
      ? category.causes.map((cause) => `• ${cause.text}`).join("\n")
      : "No causes added";

    addCard(slide, category.name, causes, x, y, colW, rowH);
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

export async function generatePowerPointDeck() {
  if (!window.pptxgen) {
    alert("PowerPoint export library did not load. Refresh the page and try again.");
    return;
  }

  const deck = new window.pptxgen();

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

  await deck.writeFile({ fileName });
}
