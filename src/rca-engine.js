import { currentProject } from "./state.js";
import { createCategoriesFromTemplate } from "./templates.js";

export const CAUSE_STATUS = {
  NOT_CHECKED: "Not checked",
  POSSIBLE: "Possible",
  PROBABLE: "Probable",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected"
};

export function updateProjectMeta(fields) {
  currentProject.meta = {
    ...currentProject.meta,
    ...fields
  };
}

export function updateProblem(fields) {
  currentProject.problem = {
    ...currentProject.problem,
    ...fields
  };
}

export function changeFishboneTemplate(templateId) {
  currentProject.meta.templateId = templateId;
  currentProject.fishbone.categories = createCategoriesFromTemplate(templateId);
}

export function addCustomCategory(categoryName) {
  const cleanName = categoryName.trim();

  if (!cleanName) {
    return null;
  }

  const category = {
    id: crypto.randomUUID(),
    name: cleanName,
    causes: []
  };

  currentProject.fishbone.categories.push(category);
  return category;
}

export function addCause(categoryId, causeText) {
  const category = currentProject.fishbone.categories.find(
    (item) => item.id === categoryId
  );

  const cleanText = causeText.trim();

  if (!category || !cleanText) {
    return null;
  }

  const cause = {
    id: crypto.randomUUID(),
    text: cleanText,
    status: CAUSE_STATUS.NOT_CHECKED,
    evidenceFor: "",
    evidenceAgainst: "",
    verificationNeeded: "",
    notes: ""
  };

  category.causes.push(cause);
  return cause;
}

export function updateCause(causeId, fields) {
  for (const category of currentProject.fishbone.categories) {
    const cause = category.causes.find((item) => item.id === causeId);

    if (cause) {
      Object.assign(cause, fields);
      return cause;
    }
  }

  return null;
}

export function removeCause(causeId) {
  for (const category of currentProject.fishbone.categories) {
    const index = category.causes.findIndex((item) => item.id === causeId);

    if (index !== -1) {
      category.causes.splice(index, 1);
      return true;
    }
  }

  return false;
}

export function updateFiveWhys(start, whys) {
  currentProject.fiveWhys.start = start;
  currentProject.fiveWhys.whys = whys;
}

export function updateRootCause(fields) {
  currentProject.rootCause = {
    ...currentProject.rootCause,
    ...fields
  };
}

export function addAction(actionData) {
  const actionText = actionData.text?.trim();

  if (!actionText) {
    return null;
  }

  const action = {
    id: crypto.randomUUID(),
    type: actionData.type || "Corrective",
    text: actionText,
    owner: actionData.owner || "",
    dueDate: actionData.dueDate || "",
    status: actionData.status || "Open"
  };

  currentProject.actions.push(action);
  return action;
}

export function removeAction(actionId) {
  const index = currentProject.actions.findIndex(
    (action) => action.id === actionId
  );

  if (index !== -1) {
    currentProject.actions.splice(index, 1);
    return true;
  }

  return false;
}

export function getAllCauses() {
  return currentProject.fishbone.categories.flatMap((category) =>
    category.causes.map((cause) => ({
      ...cause,
      categoryId: category.id,
      categoryName: category.name
    }))
  );
}

export function buildProblemStatement() {
  const problem = currentProject.problem;

  const parts = [];

  if (problem.what) {
    parts.push(problem.what);
  }

  if (problem.where) {
    parts.push(`Location / process: ${problem.where}.`);
  }

  if (problem.when) {
    parts.push(`Timing: ${problem.when}.`);
  }

  if (problem.impact) {
    parts.push(`Impact: ${problem.impact}.`);
  }

  if (problem.containment) {
    parts.push(`Containment: ${problem.containment}.`);
  }

  return parts.join("\n");
}

export function validateProject() {
  const warnings = [];

  if (!currentProject.meta.title.trim()) {
    warnings.push("RCA title is missing.");
  }

  if (!currentProject.problem.what.trim()) {
    warnings.push("Problem description is missing.");
  }

  if (getAllCauses().length === 0) {
    warnings.push("No possible causes have been added.");
  }

  if (!currentProject.rootCause.statement.trim()) {
    warnings.push("Root cause has not been defined.");
  }

  if (currentProject.actions.length === 0) {
    warnings.push("No actions have been added.");
  }

  return warnings;
}
