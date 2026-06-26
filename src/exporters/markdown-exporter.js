import { currentProject } from "../state.js";
import { buildProblemStatement, getAllCauses, validateProject } from "../rca-engine.js";

function valueOrDash(value) {
  return value && value.trim() ? value.trim() : "-";
}

function section(title) {
  return `\n## ${title}\n\n`;
}

export function generateMarkdownReport() {
  const project = currentProject;
  const warnings = validateProject();
  const causes = getAllCauses();

  let markdown = "";

  markdown += `# RCA Report: ${valueOrDash(project.meta.title)}\n\n`;

  markdown += `**Prepared by:** ${valueOrDash(project.meta.preparedBy)}\n\n`;
  markdown += `**Area / Process:** ${valueOrDash(project.meta.areaProcess)}\n\n`;
  markdown += `**Date:** ${valueOrDash(project.meta.date)}\n\n`;
  markdown += `**RCA Mode:** ${valueOrDash(project.meta.mode)}\n\n`;
  markdown += `**Fishbone Template:** ${valueOrDash(project.meta.templateId)}\n\n`;

  if (warnings.length > 0) {
    markdown += section("Open Items / Warnings");
    warnings.forEach((warning) => {
      markdown += `- ${warning}\n`;
    });
    markdown += "\n";
  }

  markdown += section("Problem Statement");
  markdown += `${buildProblemStatement() || "No problem statement entered."}\n`;

  markdown += section("Possible Causes - Fishbone");
  project.fishbone.categories.forEach((category) => {
    markdown += `### ${category.name}\n\n`;

    if (category.causes.length === 0) {
      markdown += "- No causes added.\n\n";
      return;
    }

    category.causes.forEach((cause) => {
      markdown += `- ${cause.text}\n`;
    });

    markdown += "\n";
  });

  markdown += section("Evidence Review");

  if (causes.length === 0) {
    markdown += "No causes available for evidence review.\n";
  } else {
    causes.forEach((cause) => {
      markdown += `### ${cause.text}\n\n`;
      markdown += `**Category:** ${cause.categoryName}\n\n`;
      markdown += `**Status:** ${cause.status}\n\n`;
      markdown += `**Evidence For:** ${valueOrDash(cause.evidenceFor)}\n\n`;
      markdown += `**Evidence Against:** ${valueOrDash(cause.evidenceAgainst)}\n\n`;
      markdown += `**Verification Needed:** ${valueOrDash(cause.verificationNeeded)}\n\n`;
    });
  }

  markdown += section("5 Whys");

  markdown += `**Starting issue / cause:** ${valueOrDash(project.fiveWhys.start)}\n\n`;

  project.fiveWhys.whys.forEach((why, index) => {
    markdown += `**Why ${index + 1}:** ${valueOrDash(why)}\n\n`;
  });

  markdown += section("Root Cause Validation");

  markdown += `**Root Cause:** ${valueOrDash(project.rootCause.statement)}\n\n`;
  markdown += `**Evidence Summary:** ${valueOrDash(project.rootCause.evidenceSummary)}\n\n`;
  markdown += `**Verification Method:** ${valueOrDash(project.rootCause.verificationMethod)}\n\n`;

  markdown += section("Action Plan");

  if (project.actions.length === 0) {
    markdown += "No actions added.\n";
  } else {
    project.actions.forEach((action, index) => {
      markdown += `### Action ${index + 1}\n\n`;
      markdown += `**Type:** ${valueOrDash(action.type)}\n\n`;
      markdown += `**Action:** ${valueOrDash(action.text)}\n\n`;
      markdown += `**Owner:** ${valueOrDash(action.owner)}\n\n`;
      markdown += `**Due Date:** ${valueOrDash(action.dueDate)}\n\n`;
      markdown += `**Status:** ${valueOrDash(action.status)}\n\n`;
    });
  }

  markdown += `\n---\n\n`;
  markdown += `Generated with RCA Forge.\n`;

  return markdown;
}
