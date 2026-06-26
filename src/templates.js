export const fishboneTemplates = {
  "5m": {
    id: "5m",
    name: "5M - Basic Manufacturing",
    description: "Basic RCA structure for manufacturing and process issues.",
    categories: [
      "Man",
      "Machine",
      "Method",
      "Material",
      "Measurement"
    ]
  },

  "6m": {
    id: "6m",
    name: "6M - Standard Manufacturing",
    description: "Standard RCA structure including environment-related causes.",
    categories: [
      "Man",
      "Machine",
      "Method",
      "Material",
      "Measurement",
      "Environment"
    ]
  },

  "automation": {
    id: "automation",
    name: "Automation / Controls",
    description: "RCA structure for automation, controls, PLC, HMI, sensors, networks, and machine sequence issues.",
    categories: [
      "People / Operator",
      "Machine / Field Device",
      "Logic / Software",
      "Network / Communication",
      "Method / Sequence",
      "Measurement / Feedback",
      "Environment"
    ]
  },

  "maintenance": {
    id: "maintenance",
    name: "Maintenance",
    description: "RCA structure for maintenance, reliability, equipment, and repair-related issues.",
    categories: [
      "People",
      "Equipment",
      "Procedure",
      "Spare Parts",
      "Tools",
      "Environment"
    ]
  },

  "quality": {
    id: "quality",
    name: "Quality",
    description: "RCA structure for defects, inspection failures, process variation, and customer quality issues.",
    categories: [
      "People",
      "Machine",
      "Method",
      "Material",
      "Measurement",
      "Environment"
    ]
  },

  "commissioning": {
    id: "commissioning",
    name: "Commissioning",
    description: "RCA structure for startup, integration, installation, testing, and project handoff issues.",
    categories: [
      "Scope",
      "Design",
      "Installation",
      "Software",
      "Testing",
      "Documentation",
      "Communication"
    ]
  }
};

export function getTemplate(templateId) {
  return fishboneTemplates[templateId] || fishboneTemplates["6m"];
}

export function createCategoriesFromTemplate(templateId) {
  const template = getTemplate(templateId);

  return template.categories.map((categoryName) => ({
    id: crypto.randomUUID(),
    name: categoryName,
    causes: []
  }));
}
