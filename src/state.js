import { createCategoriesFromTemplate } from "./templates.js";

export const SCHEMA_VERSION = "0.1.0";

export function createInitialProject() {
  return {
    schemaVersion: SCHEMA_VERSION,

    meta: {
      title: "",
      preparedBy: "",
      areaProcess: "",
      date: "",
      templateId: "6m",
      mode: "standard"
    },

    problem: {
      what: "",
      where: "",
      when: "",
      impact: "",
      containment: ""
    },

    fishbone: {
      categories: createCategoriesFromTemplate("6m")
    },

    fiveWhys: {
      start: "",
      whys: ["", "", "", "", ""]
    },

    rootCause: {
      statement: "",
      evidenceSummary: "",
      verificationMethod: ""
    },

    actions: []
  };
}

export let currentProject = createInitialProject();

export function setCurrentProject(project) {
  currentProject = project;
}
