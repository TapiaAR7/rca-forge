import { currentProject, createInitialProject, setCurrentProject } from "./state.js";
import {
  addCause,
  removeCause,
  updateCause,
  updateFiveWhys,
  updateProblem,
  updateProjectMeta,
  updateRootCause,
  addAction,
  removeAction,
  changeFishboneTemplate,
  getAllCauses
} from "./rca-engine.js";
import { saveProject, loadProject } from "./storage.js";
import { generateMarkdownReport } from "./exporters/markdown-exporter.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
  steps: $$(".step"),
  views: $$(".view"),

  newProjectBtn: $("#newProjectBtn"),
  saveProjectBtn: $("#saveProjectBtn"),

  rcaTitle: $("#rcaTitle"),
  preparedBy: $("#preparedBy"),
  areaProcess: $("#areaProcess"),
  rcaDate: $("#rcaDate"),
  fishboneTemplate: $("#fishboneTemplate"),
  rcaMode: $("#rcaMode"),

  problemWhat: $("#problemWhat"),
  problemWhere: $("#problemWhere"),
  problemWhen: $("#problemWhen"),
  problemImpact: $("#problemImpact"),
  containment: $("#containment"),

  causeCategory: $("#causeCategory"),
  causeText: $("#causeText"),
  addCauseBtn: $("#addCauseBtn"),
  causeList: $("#causeList"),
  fishboneDiagram: $("#fishboneDiagram"),

  evidenceBoard: $("#evidenceBoard"),

  whyStart: $("#whyStart"),
  why1: $("#why1"),
  why2: $("#why2"),
  why3: $("#why3"),
  why4: $("#why4"),
  why5: $("#why5"),

  rootCause: $("#rootCause"),
  evidenceSummary: $("#evidenceSummary"),
  verificationMethod: $("#verificationMethod"),

  actionType: $("#actionType"),
  actionOwner: $("#actionOwner"),
  actionDueDate: $("#actionDueDate"),
  actionStatus: $("#actionStatus"),
  actionText: $("#actionText"),
  addActionBtn: $("#addActionBtn"),
  actionList: $("#actionList"),

  exportMarkdownBtn: $("#exportMarkdownBtn"),
  printReportBtn: $("#printReportBtn"),
  exportOutput: $("#exportOutput")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function switchView(stepId) {
  elements.steps.forEach((step) => {
    step.classList.toggle("active", step.dataset.step === stepId);
  });

  elements.views.forEach((view) => {
    view.classList.toggle("active", view.id === stepId);
  });
}

function syncProjectFromForm() {
  updateProjectMeta({
    title: elements.rcaTitle.value,
    preparedBy: elements.preparedBy.value,
    areaProcess: elements.areaProcess.value,
    date: elements.rcaDate.value,
    templateId: elements.fishboneTemplate.value,
    mode: elements.rcaMode.value
  });

  updateProblem({
    what: elements.problemWhat.value,
    where: elements.problemWhere.value,
    when: elements.problemWhen.value,
    impact: elements.problemImpact.value,
    containment: elements.containment.value
  });

  updateFiveWhys(elements.whyStart.value, [
    elements.why1.value,
    elements.why2.value,
    elements.why3.value,
    elements.why4.value,
    elements.why5.value
  ]);

  updateRootCause({
    statement: elements.rootCause.value,
    evidenceSummary: elements.evidenceSummary.value,
    verificationMethod: elements.verificationMethod.value
  });
}

function applyProjectToForm() {
  const project = currentProject;

  elements.rcaTitle.value = project.meta.title || "";
  elements.preparedBy.value = project.meta.preparedBy || "";
  elements.areaProcess.value = project.meta.areaProcess || "";
  elements.rcaDate.value = project.meta.date || today();
  elements.fishboneTemplate.value = project.meta.templateId || "6m";
  elements.rcaMode.value = project.meta.mode || "standard";

  elements.problemWhat.value = project.problem.what || "";
  elements.problemWhere.value = project.problem.where || "";
  elements.problemWhen.value = project.problem.when || "";
  elements.problemImpact.value = project.problem.impact || "";
  elements.containment.value = project.problem.containment || "";

  elements.whyStart.value = project.fiveWhys.start || "";
  elements.why1.value = project.fiveWhys.whys[0] || "";
  elements.why2.value = project.fiveWhys.whys[1] || "";
  elements.why3.value = project.fiveWhys.whys[2] || "";
  elements.why4.value = project.fiveWhys.whys[3] || "";
  elements.why5.value = project.fiveWhys.whys[4] || "";

  elements.rootCause.value = project.rootCause.statement || "";
  elements.evidenceSummary.value = project.rootCause.evidenceSummary || "";
  elements.verificationMethod.value = project.rootCause.verificationMethod || "";
}

function renderCategoryOptions() {
  elements.causeCategory.innerHTML = "";

  currentProject.fishbone.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    elements.causeCategory.appendChild(option);
  });
}

function renderCauseList() {
  const categories = currentProject.fishbone.categories;

  const hasCauses = categories.some((category) => category.causes.length > 0);

  if (!hasCauses) {
    elements.causeList.className = "empty-state";
    elements.causeList.innerHTML = "No causes added yet.";
    return;
  }

  elements.causeList.className = "cause-stack";

  elements.causeList.innerHTML = categories
    .filter((category) => category.causes.length > 0)
    .map((category) => {
      const causesHtml = category.causes
        .map((cause) => {
          return `
            <div class="cause-item">
              <div class="item-top">
                <div>
                  <div class="item-title">${escapeHtml(cause.text)}</div>
                  <div class="item-meta">${escapeHtml(category.name)}</div>
                </div>
                <button class="small-danger" data-remove-cause="${cause.id}">Remove</button>
              </div>
            </div>
          `;
        })
        .join("");

      return causesHtml;
    })
    .join("");
}

function renderFishboneDiagram() {
  const title =
    currentProject.meta.title ||
    currentProject.problem.what ||
    "Problem";

  const categories = currentProject.fishbone.categories;
  const pairs = Math.ceil(categories.length / 2);
  const width = Math.max(920, 360 + pairs * 260);

  const bones = categories
    .map((category, index) => {
      const isTop = index % 2 === 0;
      const pairIndex = Math.floor(index / 2);
      const left = 70 + pairIndex * 250;
      const top = isTop ? 45 : 220;

      const causes = category.causes.length
        ? category.causes
            .slice(0, 4)
            .map((cause) => `<li>${escapeHtml(cause.text)}</li>`)
            .join("")
        : `<li>No causes added</li>`;

      return `
        <div class="bone ${isTop ? "top" : "bottom"}" style="left:${left}px; top:${top}px;">
          <div class="bone-content">
            <div class="bone-title">${escapeHtml(category.name)}</div>
            <ul>${causes}</ul>
          </div>
        </div>
      `;
    })
    .join("");

  elements.fishboneDiagram.innerHTML = `
    <div class="fishbone-wrap" style="min-width:${width}px;">
      <div class="fishbone-spine"></div>
      <div class="problem-node">${escapeHtml(title)}</div>
      ${bones}
    </div>
  `;
}

function statusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll(" ", "-");
}

function renderEvidenceBoard() {
  const causes = getAllCauses();

  if (causes.length === 0) {
    elements.evidenceBoard.className = "empty-state";
    elements.evidenceBoard.innerHTML = "Add possible causes first to review evidence.";
    return;
  }

  elements.evidenceBoard.className = "evidence-stack";

  elements.evidenceBoard.innerHTML = causes
    .map((cause) => {
      return `
        <div class="evidence-item">
          <div class="item-top">
            <div>
              <div class="item-title">${escapeHtml(cause.text)}</div>
              <div class="item-meta">${escapeHtml(cause.categoryName)}</div>
            </div>
            <span class="badge ${statusClass(cause.status)}">${escapeHtml(cause.status)}</span>
          </div>

          <label class="field">
            <span>Status</span>
            <select data-cause-id="${cause.id}" data-cause-field="status">
              <option ${cause.status === "Not checked" ? "selected" : ""}>Not checked</option>
              <option ${cause.status === "Possible" ? "selected" : ""}>Possible</option>
              <option ${cause.status === "Probable" ? "selected" : ""}>Probable</option>
              <option ${cause.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
              <option ${cause.status === "Rejected" ? "selected" : ""}>Rejected</option>
            </select>
          </label>

          <label class="field">
            <span>Evidence For</span>
            <textarea data-cause-id="${cause.id}" data-cause-field="evidenceFor">${escapeHtml(cause.evidenceFor)}</textarea>
          </label>

          <label class="field">
            <span>Evidence Against</span>
            <textarea data-cause-id="${cause.id}" data-cause-field="evidenceAgainst">${escapeHtml(cause.evidenceAgainst)}</textarea>
          </label>

          <label class="field">
            <span>Verification Needed</span>
            <textarea data-cause-id="${cause.id}" data-cause-field="verificationNeeded">${escapeHtml(cause.verificationNeeded)}</textarea>
          </label>
        </div>
      `;
    })
    .join("");
}

function renderActionList() {
  if (currentProject.actions.length === 0) {
    elements.actionList.className = "empty-state";
    elements.actionList.innerHTML = "No actions added yet.";
    return;
  }

  elements.actionList.className = "action-stack";

  elements.actionList.innerHTML = currentProject.actions
    .map((action) => {
      return `
        <div class="action-item">
          <div class="item-top">
            <div>
              <div class="item-title">${escapeHtml(action.text)}</div>
              <div class="item-meta">
                ${escapeHtml(action.type)} · Owner: ${escapeHtml(action.owner || "-")} · Due: ${escapeHtml(action.dueDate || "-")}
              </div>
            </div>
            <button class="small-danger" data-remove-action="${action.id}">Remove</button>
          </div>
          <div class="item-meta">Status: ${escapeHtml(action.status)}</div>
        </div>
      `;
    })
    .join("");
}

function renderAll() {
  renderCategoryOptions();
  renderCauseList();
  renderFishboneDiagram();
  renderEvidenceBoard();
  renderActionList();
}

function handleAddCause() {
  syncProjectFromForm();

  const categoryId = elements.causeCategory.value;
  const causeText = elements.causeText.value;

  const cause = addCause(categoryId, causeText);

  if (!cause) {
    alert("Enter a possible cause first.");
    return;
  }

  elements.causeText.value = "";
  renderAll();
  saveProject();
}

function handleAddAction() {
  syncProjectFromForm();

  const action = addAction({
    type: elements.actionType.value,
    text: elements.actionText.value,
    owner: elements.actionOwner.value,
    dueDate: elements.actionDueDate.value,
    status: elements.actionStatus.value
  });

  if (!action) {
    alert("Enter an action first.");
    return;
  }

  elements.actionText.value = "";
  elements.actionOwner.value = "";
  elements.actionDueDate.value = "";
  elements.actionStatus.value = "Open";

  renderActionList();
  saveProject();
}

function handleTemplateChange() {
  const hasCauses = getAllCauses().length > 0;

  if (hasCauses) {
    const confirmChange = confirm(
      "Changing the Fishbone template will reset the current cause list. Continue?"
    );

    if (!confirmChange) {
      elements.fishboneTemplate.value = currentProject.meta.templateId;
      return;
    }
  }

  changeFishboneTemplate(elements.fishboneTemplate.value);
  syncProjectFromForm();
  renderAll();
  saveProject();
}

function handleSave() {
  syncProjectFromForm();
  saveProject();
  renderAll();
  alert("RCA saved in this browser.");
}

function handleNewProject() {
  const confirmNew = confirm(
    "Start a new RCA? Current unsaved changes will be replaced."
  );

  if (!confirmNew) return;

  setCurrentProject(createInitialProject());
  currentProject.meta.date = today();

  applyProjectToForm();
  renderAll();
  saveProject();
}

function handleMarkdownExport() {
  syncProjectFromForm();
  saveProject();

  elements.exportOutput.value = generateMarkdownReport();
}

function handlePrintReport() {
  syncProjectFromForm();
  elements.exportOutput.value = generateMarkdownReport();
  window.print();
}

function attachEvents() {
  elements.steps.forEach((step) => {
    step.addEventListener("click", () => {
      switchView(step.dataset.step);
    });
  });

  [
    elements.rcaTitle,
    elements.preparedBy,
    elements.areaProcess,
    elements.rcaDate,
    elements.rcaMode,
    elements.problemWhat,
    elements.problemWhere,
    elements.problemWhen,
    elements.problemImpact,
    elements.containment,
    elements.whyStart,
    elements.why1,
    elements.why2,
    elements.why3,
    elements.why4,
    elements.why5,
    elements.rootCause,
    elements.evidenceSummary,
    elements.verificationMethod
  ].forEach((input) => {
    input.addEventListener("input", () => {
      syncProjectFromForm();
      renderFishboneDiagram();
      saveProject();
    });
  });

  elements.fishboneTemplate.addEventListener("change", handleTemplateChange);
  elements.addCauseBtn.addEventListener("click", handleAddCause);
  elements.saveProjectBtn.addEventListener("click", handleSave);
  elements.newProjectBtn.addEventListener("click", handleNewProject);
  elements.addActionBtn.addEventListener("click", handleAddAction);
  elements.exportMarkdownBtn.addEventListener("click", handleMarkdownExport);
  elements.printReportBtn.addEventListener("click", handlePrintReport);

  elements.causeList.addEventListener("click", (event) => {
    const causeId = event.target.dataset.removeCause;

    if (!causeId) return;

    removeCause(causeId);
    renderAll();
    saveProject();
  });

  elements.evidenceBoard.addEventListener("input", (event) => {
    const causeId = event.target.dataset.causeId;
    const field = event.target.dataset.causeField;

    if (!causeId || !field) return;

    updateCause(causeId, {
      [field]: event.target.value
    });

    renderCauseList();
    renderFishboneDiagram();
    saveProject();
  });

  elements.evidenceBoard.addEventListener("change", (event) => {
    const causeId = event.target.dataset.causeId;
    const field = event.target.dataset.causeField;

    if (!causeId || !field) return;

    updateCause(causeId, {
      [field]: event.target.value
    });

    renderEvidenceBoard();
    saveProject();
  });

  elements.actionList.addEventListener("click", (event) => {
    const actionId = event.target.dataset.removeAction;

    if (!actionId) return;

    removeAction(actionId);
    renderActionList();
    saveProject();
  });
}

function init() {
  const saved = loadProject();

  if (!saved) {
    currentProject.meta.date = today();
  }

  applyProjectToForm();
  renderAll();
  attachEvents();
}

init();
