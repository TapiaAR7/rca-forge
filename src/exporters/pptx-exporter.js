function createFishboneSlide(deck) {
  const slide = deck.addSlide();
  slide.background = { color: "F8FAFC" };

  addHeader(slide, "Fishbone / Ishikawa Diagram");

  const categories = currentProject.fishbone.categories.slice(0, 6);
  const problemTitle =
    currentProject.meta.title ||
    currentProject.problem.what ||
    "Problem";

  const spineY = 3.75;
  const spineStartX = 1.05;
  const spineEndX = 9.65;

  // Light background panel
  slide.addShape(shape("rect"), {
    x: 0.55,
    y: 1.05,
    w: 12.25,
    h: 5.75,
    fill: { color: "FFFFFF" },
    line: { color: "D9E2EF", width: 1 }
  });

  // Fish tail
  slide.addShape(shape("triangle"), {
    x: 0.65,
    y: 3.35,
    w: 0.65,
    h: 0.8,
    rotate: 270,
    fill: { color: "102033" },
    line: { color: "102033" }
  });

  // Main spine
  slide.addShape(shape("line"), {
    x: spineStartX,
    y: spineY,
    w: spineEndX - spineStartX,
    h: 0,
    line: { color: "102033", width: 3 }
  });

  // Fish head arrow
  slide.addShape(shape("triangle"), {
    x: spineEndX - 0.05,
    y: spineY - 0.28,
    w: 0.48,
    h: 0.56,
    rotate: 90,
    fill: { color: "102033" },
    line: { color: "102033" }
  });

  // Problem box
  slide.addShape(shape("rect"), {
    x: 10.2,
    y: 2.95,
    w: 2.35,
    h: 1.55,
    fill: { color: "2563EB" },
    line: { color: "1D4ED8", width: 1.2 }
  });

  slide.addText("PROBLEM", {
    x: 10.35,
    y: 3.08,
    w: 2.05,
    h: 0.22,
    fontFace: "Arial",
    fontSize: 8,
    bold: true,
    color: "DDEBFF",
    align: "center"
  });

  slide.addText(clean(problemTitle), {
    x: 10.35,
    y: 3.35,
    w: 2.05,
    h: 0.82,
    fontFace: "Arial",
    fontSize: 10,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "mid",
    fit: "shrink"
  });

  const positions = [
    {
      side: "top",
      categoryX: 1.25,
      categoryY: 1.35,
      branchStartX: 2.3,
      branchStartY: 2.7,
      branchEndX: 3.05,
      branchEndY: spineY
    },
    {
      side: "top",
      categoryX: 4.05,
      categoryY: 1.35,
      branchStartX: 5.1,
      branchStartY: 2.7,
      branchEndX: 5.8,
      branchEndY: spineY
    },
    {
      side: "top",
      categoryX: 6.85,
      categoryY: 1.35,
      branchStartX: 7.9,
      branchStartY: 2.7,
      branchEndX: 8.55,
      branchEndY: spineY
    },
    {
      side: "bottom",
      categoryX: 1.25,
      categoryY: 5.0,
      branchStartX: 2.3,
      branchStartY: 4.65,
      branchEndX: 3.05,
      branchEndY: spineY
    },
    {
      side: "bottom",
      categoryX: 4.05,
      categoryY: 5.0,
      branchStartX: 5.1,
      branchStartY: 4.65,
      branchEndX: 5.8,
      branchEndY: spineY
    },
    {
      side: "bottom",
      categoryX: 6.85,
      categoryY: 5.0,
      branchStartX: 7.9,
      branchStartY: 4.65,
      branchEndX: 8.55,
      branchEndY: spineY
    }
  ];

  categories.forEach((category, index) => {
    const pos = positions[index];

    if (!pos) return;

    // Main branch
    slide.addShape(shape("line"), {
      x: pos.branchStartX,
      y: pos.branchStartY,
      w: pos.branchEndX - pos.branchStartX,
      h: pos.branchEndY - pos.branchStartY,
      line: { color: "102033", width: 2 }
    });

    // Category card
    slide.addShape(shape("rect"), {
      x: pos.categoryX,
      y: pos.categoryY,
      w: 2.35,
      h: 1.35,
      fill: { color: "EEF4FF" },
      line: { color: "BFD3FF", width: 1.1 }
    });

    // Category header bar
    slide.addShape(shape("rect"), {
      x: pos.categoryX,
      y: pos.categoryY,
      w: 2.35,
      h: 0.32,
      fill: { color: "DBEAFE" },
      line: { color: "BFD3FF", width: 0.5 }
    });

    slide.addText(category.name, {
      x: pos.categoryX + 0.12,
      y: pos.categoryY + 0.07,
      w: 2.1,
      h: 0.2,
      fontFace: "Arial",
      fontSize: 10,
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
      x: pos.categoryX + 0.13,
      y: pos.categoryY + 0.42,
      w: 2.08,
      h: 0.82,
      fontFace: "Arial",
      fontSize: 7.5,
      color: "102033",
      valign: "top",
      fit: "shrink"
    });

    // Small cause ribs on the branch
    const ribDirection = pos.side === "top" ? -1 : 1;

    [0.28, 0.52, 0.76].forEach((ratio, ribIndex) => {
      const baseX =
        pos.branchStartX + (pos.branchEndX - pos.branchStartX) * ratio;
      const baseY =
        pos.branchStartY + (pos.branchEndY - pos.branchStartY) * ratio;

      slide.addShape(shape("line"), {
        x: baseX,
        y: baseY,
        w: 0.32,
        h: 0.22 * ribDirection,
        line: { color: "667085", width: 0.8 }
      });
    });
  });

  // Method label
  slide.addShape(shape("rect"), {
    x: 0.8,
    y: 6.45,
    w: 2.45,
    h: 0.28,
    fill: { color: "F8FAFC" },
    line: { color: "D9E2EF", width: 0.6 }
  });

  slide.addText("Method: Fishbone / Ishikawa", {
    x: 0.92,
    y: 6.51,
    w: 2.2,
    h: 0.14,
    fontFace: "Arial",
    fontSize: 7.5,
    color: "667085"
  });

  addFooter(slide);
}
