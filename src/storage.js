import { currentProject, setCurrentProject } from "./state.js";

const STORAGE_KEY = "rcaForge.currentProject";

export function saveProject() {
  const projectJson = JSON.stringify(currentProject, null, 2);
  localStorage.setItem(STORAGE_KEY, projectJson);
  return true;
}

export function loadProject() {
  const savedProject = localStorage.getItem(STORAGE_KEY);

  if (!savedProject) {
    return null;
  }

  try {
    const parsedProject = JSON.parse(savedProject);
    setCurrentProject(parsedProject);
    return parsedProject;
  } catch (error) {
    console.error("Failed to load saved RCA project:", error);
    return null;
  }
}

export function clearSavedProject() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportProjectJson() {
  return JSON.stringify(currentProject, null, 2);
}

export function importProjectJson(jsonText) {
  try {
    const parsedProject = JSON.parse(jsonText);

    if (!parsedProject.schemaVersion || !parsedProject.meta || !parsedProject.problem) {
      throw new Error("Invalid RCA project file.");
    }

    setCurrentProject(parsedProject);
    saveProject();

    return {
      ok: true,
      project: parsedProject
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}
