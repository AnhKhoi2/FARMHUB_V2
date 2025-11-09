import { jsPDF } from "jspdf";

/**
 * Generate PDF from notebook data
 * @param {Object} notebook - Notebook data
 * @param {Object} template - Plant template data
 */
export const generateNotebookPDF = async (notebook, template) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with automatic line wrapping
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        checkNewPage();
        doc.text(line, x, y);
        y += lineHeight;
      });
      return y;
    };

    // Set font (using built-in fonts that support some Unicode)
    doc.setFont("helvetica");

    // === HEADER ===
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 34); // Green
    doc.text("NHAT KY TRONG TROT", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // === NOTEBOOK INFO ===
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(notebook.notebook_name || "N/A", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Loai cay: ${notebook.plant_type || "N/A"}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 7;
    doc.text(
      `Ngay trong: ${
        notebook.planted_date
          ? new Date(notebook.planted_date).toLocaleDateString("vi-VN")
          : "N/A"
      }`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 15;

    // === DIVIDER ===
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // === PROGRESS OVERVIEW ===
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("TONG QUAN TIEN DO", margin, yPosition);
    yPosition += 10;

    checkNewPage();

    // Progress bar
    const barWidth = pageWidth - 2 * margin;
    const barHeight = 15;
    const progress = notebook.progress || 0;

    // Background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, barWidth, barHeight, "F");

    // Progress fill
    doc.setFillColor(76, 175, 80); // Green
    doc.rect(margin, yPosition, (barWidth * progress) / 100, barHeight, "F");

    // Progress text
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${progress}%`,
      margin + barWidth / 2,
      yPosition + barHeight / 2 + 2,
      { align: "center" }
    );
    yPosition += barHeight + 15;

    // === CURRENT STAGE ===
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setTextColor(76, 175, 80);
    doc.text(`GIAI DOAN HIEN TAI`, margin, yPosition);
    yPosition += 8;

    if (template && template.stages && notebook.current_stage) {
      const currentStage = template.stages[notebook.current_stage - 1];
      if (currentStage) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Ten: ${currentStage.name}`, margin + 5, yPosition);
        yPosition += 7;
        doc.text(
          `Thoi gian: Ngay ${currentStage.day_start} - ${currentStage.day_end}`,
          margin + 5,
          yPosition
        );
        yPosition += 7;
        doc.text(
          `Tien do giai doan: ${notebook.stage_completion || 0}%`,
          margin + 5,
          yPosition
        );
        yPosition += 10;

        if (currentStage.description) {
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          yPosition = addWrappedText(
            `Mo ta: ${currentStage.description}`,
            margin + 5,
            yPosition,
            pageWidth - 2 * margin - 10
          );
          yPosition += 5;
        }
      }
    }

    yPosition += 10;

    // === ALL STAGES TIMELINE ===
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setTextColor(76, 175, 80);
    doc.text("TAT CA CAC GIAI DOAN", margin, yPosition);
    yPosition += 10;

    if (template && template.stages) {
      template.stages.forEach((stage, index) => {
        checkNewPage(25);

        const stageTracking = notebook.stages_tracking?.find(
          (s) => s.stage_number === stage.stage_number
        );
        const isCompleted = stageTracking?.completed_at;
        const isCurrent = notebook.current_stage === stage.stage_number;

        // Stage header
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const statusIcon = isCompleted
          ? "[HOAN THANH]"
          : isCurrent
          ? "[DANG THUC HIEN]"
          : "[CHUA BAT DAU]";
        doc.text(
          `${stage.stage_number}. ${stage.name} ${statusIcon}`,
          margin + 5,
          yPosition
        );
        yPosition += 7;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Ngay ${stage.day_start}-${stage.day_end} | Trong so: ${stage.weight}%`,
          margin + 10,
          yPosition
        );
        yPosition += 7;

        // Daily tasks for this stage
        if (stage.daily_tasks && stage.daily_tasks.length > 0) {
          doc.text("Cong viec:", margin + 10, yPosition);
          yPosition += 5;

          stage.daily_tasks.forEach((task) => {
            checkNewPage();
            doc.setFontSize(9);
            doc.text(`- ${task.task_name}`, margin + 15, yPosition);
            yPosition += 5;
          });
        }

        yPosition += 5;
      });
    }

    yPosition += 10;

    // === DAILY CHECKLIST ===
    if (notebook.daily_checklist && notebook.daily_checklist.length > 0) {
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setTextColor(76, 175, 80);
      doc.text("CONG VIEC HANG NGAY", margin, yPosition);
      yPosition += 10;

      const completed = notebook.daily_checklist.filter(
        (t) => t.is_completed
      ).length;
      const total = notebook.daily_checklist.length;

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Tien do: ${completed}/${total} cong viec`,
        margin + 5,
        yPosition
      );
      yPosition += 10;

      notebook.daily_checklist.forEach((task) => {
        checkNewPage();
        const checkbox = task.is_completed ? "[X]" : "[ ]";
        doc.setFontSize(10);
        doc.text(`${checkbox} ${task.task_name}`, margin + 10, yPosition);
        yPosition += 6;

        if (task.description) {
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          yPosition = addWrappedText(
            task.description,
            margin + 15,
            yPosition,
            pageWidth - 2 * margin - 20,
            5
          );
          doc.setTextColor(0, 0, 0);
        }
      });

      yPosition += 10;
    }

    // === OBSERVATIONS ===
    if (
      notebook.stages_tracking &&
      notebook.stages_tracking.some((s) => s.observations?.length > 0)
    ) {
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setTextColor(76, 175, 80);
      doc.text("QUAN SAT", margin, yPosition);
      yPosition += 10;

      notebook.stages_tracking.forEach((stage) => {
        if (stage.observations && stage.observations.length > 0) {
          checkNewPage();
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(`Giai doan ${stage.stage_number}:`, margin + 5, yPosition);
          yPosition += 7;

          stage.observations.forEach((obs) => {
            checkNewPage();
            doc.setFontSize(9);
            const value = obs.value ? "Co" : "Khong";
            doc.text(`- ${obs.key}: ${value}`, margin + 10, yPosition);
            yPosition += 5;
          });

          yPosition += 5;
        }
      });

      yPosition += 10;
    }

    // === JOURNAL ===
    if (notebook.description) {
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setTextColor(76, 175, 80);
      doc.text("GHI CHU CA NHAN", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      yPosition = addWrappedText(
        notebook.description,
        margin + 5,
        yPosition,
        pageWidth - 2 * margin - 10
      );
      yPosition += 10;
    }

    // === FOOTER ===
    const totalPages = doc.internal.pages.length - 1; // -1 because first page is empty
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Trang ${i}/${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
      doc.text(
        `Xuat ngay: ${new Date().toLocaleDateString("vi-VN")}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );
    }

    // === SAVE PDF ===
    const fileName = `${notebook.notebook_name || "notebook"}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { success: false, error: error.message };
  }
};
