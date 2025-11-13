import jsPDF from "jspdf";

/**
 * Mã hóa văn bản tiếng Việt để hiển thị đúng trong PDF
 * Chuẩn hóa các ký tự Unicode tiếng Việt
 */
const encodeVietnameseText = (text) => {
  if (!text) return "";

  // Chuẩn hóa văn bản tiếng Việt theo Unicode NFC (Normalization Form Canonical Composition)
  return String(text).normalize("NFC");
};

/**
 * Tải và thêm font Noto Sans hỗ trợ tiếng Việt vào PDF
 * Font được tải từ Google Fonts CDN
 */
const loadVietnameseFont = async (doc) => {
  try {
    console.log("🔤 Loading Vietnamese font...");

    // URL của font Noto Sans từ GitHub (hỗ trợ tiếng Việt tốt)
    const fontUrls = {
      normal:
        "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
      bold: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
    };

    // Tải và thêm font Normal
    try {
      const normalResponse = await fetch(fontUrls.normal);
      const normalFontData = await normalResponse.arrayBuffer();
      const normalBase64 = arrayBufferToBase64(normalFontData);

      doc.addFileToVFS("NotoSans-Regular.ttf", normalBase64);
      doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
      console.log("✅ NotoSans Normal loaded");
    } catch (error) {
      console.warn("⚠️ Failed to load NotoSans Normal:", error);
    }

    // Tải và thêm font Bold
    try {
      const boldResponse = await fetch(fontUrls.bold);
      const boldFontData = await boldResponse.arrayBuffer();
      const boldBase64 = arrayBufferToBase64(boldFontData);

      doc.addFileToVFS("NotoSans-Bold.ttf", boldBase64);
      doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
      console.log("✅ NotoSans Bold loaded");
    } catch (error) {
      console.warn("⚠️ Failed to load NotoSans Bold:", error);
    }

    // Đặt font mặc định
    doc.setFont("NotoSans", "normal");
    return true;
  } catch (error) {
    console.error("❌ Error loading Vietnamese font:", error);
    // Fallback về Helvetica nếu không tải được font
    doc.setFont("helvetica", "normal");
    return false;
  }
};

/**
 * Chuyển đổi ArrayBuffer sang Base64
 */
const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Vẽ tiêu đề của PDF
 */
const drawHeader = (doc, notebook) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Tiêu đề chính
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(20);
  doc.setTextColor(34, 139, 34); // Màu xanh lá
  const title = encodeVietnameseText("NHẬT KÝ TRỒNG TRỌT");
  doc.text(title, pageWidth / 2, 20, { align: "center" });

  // Tên nhật ký
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const notebookName = encodeVietnameseText(notebook.notebook_name || "");
  doc.text(notebookName, pageWidth / 2, 30, { align: "center" });

  // Loại cây
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const plantType = encodeVietnameseText(`🌿 ${notebook.plant_type || ""}`);
  doc.text(plantType, pageWidth / 2, 38, { align: "center" });

  // Đường kẻ phân cách
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(0.5);
  doc.line(20, 42, pageWidth - 20, 42);

  return 50; // Vị trí Y tiếp theo
};

/**
 * Vẽ thông tin tổng quan
 */
const drawOverview = (doc, notebook, yPos) => {
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const overviewTitle = encodeVietnameseText("THÔNG TIN CHUNG");
  doc.text(overviewTitle, 20, yPos);

  yPos += 8;

  // Thông tin chi tiết
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(11);

  const info = [
    {
      label: "Ngày trồng:",
      value: notebook.planted_date
        ? new Date(notebook.planted_date).toLocaleDateString("vi-VN")
        : "N/A",
    },
    {
      label: "Tiến độ tổng thể:",
      value: `${notebook.progress || 0}%`,
    },
    {
      label: "Giai đoạn hiện tại:",
      value: `${notebook.current_stage || 1}`,
    },
    {
      label: "Tiến độ giai đoạn:",
      value: `${notebook.stage_completion || 0}%`,
    },
  ];

  info.forEach((item) => {
    doc.setFont("NotoSans", "bold");
    doc.text(encodeVietnameseText(item.label), 25, yPos);

    doc.setFont("NotoSans", "normal");
    doc.text(encodeVietnameseText(item.value), 80, yPos);

    yPos += 7;
  });

  return yPos + 5;
};

/**
 * Vẽ giai đoạn hiện tại
 */
const drawCurrentStage = (doc, notebook, template, yPos) => {
  if (!template || !template.stages || !notebook.current_stage) {
    return yPos;
  }

  const currentStageData = template.stages[notebook.current_stage - 1];
  if (!currentStageData) return yPos;

  doc.setFont("NotoSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(34, 139, 34);
  const stageTitle = encodeVietnameseText("GIAI ĐOẠN HIỆN TẠI: NẢY MẦM");
  doc.text(stageTitle, 20, yPos);

  yPos += 10;

  // Thông tin giai đoạn
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const stageInfo = [
    {
      label: "Tên giai đoạn:",
      value: currentStageData.name || "N/A",
    },
    {
      label: "Thời gian:",
      value: `Ngày ${currentStageData.day_start}-${currentStageData.day_end}`,
    },
    {
      label: "Tiến độ giai đoạn:",
      value: `${notebook.stage_completion || 0}%`,
    },
  ];

  stageInfo.forEach((item) => {
    doc.setFont("NotoSans", "bold");
    doc.text(encodeVietnameseText(item.label), 25, yPos);

    doc.setFont("NotoSans", "normal");
    doc.text(encodeVietnameseText(item.value), 80, yPos);

    yPos += 7;
  });

  // Mô tả giai đoạn
  if (currentStageData.description) {
    yPos += 3;
    doc.setFont("NotoSans", "bold");
    doc.text(encodeVietnameseText("Mô tả:"), 25, yPos);

    yPos += 7;
    doc.setFont("NotoSans", "normal");
    const description = encodeVietnameseText(currentStageData.description);
    const splitDescription = doc.splitTextToSize(description, 160);
    doc.text(splitDescription, 25, yPos);
    yPos += splitDescription.length * 6;
  }

  return yPos + 5;
};

/**
 * Vẽ công việc hàng ngày
 */
const drawDailyTasks = (doc, notebook, yPos) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Kiểm tra xem có cần trang mới không
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont("NotoSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const tasksTitle = encodeVietnameseText("TIẾN TRÌNH TRỒNG TRỌT");
  doc.text(tasksTitle, 20, yPos);

  yPos += 10;

  if (!notebook.daily_checklist || notebook.daily_checklist.length === 0) {
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.text(encodeVietnameseText("Chưa có công việc nào"), 25, yPos);
    return yPos + 10;
  }

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(11);

  notebook.daily_checklist.forEach((task, index) => {
    // Kiểm tra trang mới cho mỗi task
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }

    // Checkbox (✓ hoặc ☐)
    const checkbox = task.is_completed ? "☑" : "☐";
    doc.text(checkbox, 25, yPos);

    // Tên công việc
    const taskName = encodeVietnameseText(
      task.task_name || `Công việc ${index + 1}`
    );
    doc.text(taskName, 35, yPos);

    // Trọng số
    doc.setTextColor(100, 100, 100);
    const weight = encodeVietnameseText(`Trọng số: ${task.weight || 0}`);
    doc.text(weight, pageWidth - 60, yPos);

    doc.setTextColor(0, 0, 0);
    yPos += 8;
  });

  return yPos + 5;
};

/**
 * Vẽ tất cả các giai đoạn
 */
const drawAllStages = (doc, template, yPos) => {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (!template || !template.stages || template.stages.length === 0) {
    return yPos;
  }

  // Kiểm tra xem có cần trang mới không
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont("NotoSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const allStagesTitle = encodeVietnameseText("TẤT CẢ CÁC GIAI ĐOẠN");
  doc.text(allStagesTitle, 20, yPos);

  yPos += 10;

  template.stages.forEach((stage, index) => {
    // Kiểm tra trang mới
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }

    // Tên giai đoạn
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(12);
    const stageName = encodeVietnameseText(`${index + 1}. ${stage.name}`);
    doc.text(stageName, 25, yPos);

    yPos += 7;

    // Thời gian
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(10);
    const stageDays = encodeVietnameseText(
      `Thời gian: Ngày ${stage.day_start}-${stage.day_end} (${
        stage.day_end - stage.day_start + 1
      } ngày)`
    );
    doc.text(stageDays, 30, yPos);

    yPos += 6;

    // Mô tả
    if (stage.description) {
      const description = encodeVietnameseText(stage.description);
      const splitDescription = doc.splitTextToSize(description, 150);
      doc.text(splitDescription, 30, yPos);
      yPos += splitDescription.length * 5 + 3;
    }

    yPos += 5;
  });

  return yPos;
};

/**
 * Vẽ ghi chú cá nhân
 */
const drawJournal = (doc, notebook, yPos) => {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (!notebook.description || notebook.description.trim() === "") {
    return yPos;
  }

  // Kiểm tra xem có cần trang mới không
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont("NotoSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const journalTitle = encodeVietnameseText("GHI CHÚ CÁ NHÂN");
  doc.text(journalTitle, 20, yPos);

  yPos += 10;

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(11);
  const journal = encodeVietnameseText(notebook.description);
  const splitJournal = doc.splitTextToSize(journal, 170);

  splitJournal.forEach((line) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, 25, yPos);
    yPos += 6;
  });

  return yPos + 10;
};

/**
 * Vẽ footer
 */
const drawFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Đường kẻ
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

    // Text footer
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);

    const footerText = encodeVietnameseText(
      "FarmHub - Hệ thống quản lý nhật ký trồng trọt"
    );
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });

    // Số trang
    const pageNumber = encodeVietnameseText(`Trang ${i}/${pageCount}`);
    doc.text(pageNumber, pageWidth - 20, pageHeight - 10, { align: "right" });

    // Ngày xuất
    const exportDate = encodeVietnameseText(
      `Xuất ngày: ${new Date().toLocaleDateString("vi-VN")}`
    );
    doc.text(exportDate, 20, pageHeight - 10);
  }
};

/**
 * Hàm chính để tạo PDF
 */
export const generateNotebookPDF = async (notebook, template) => {
  try {
    console.log("📄 Starting PDF generation...");
    console.log("Notebook data:", notebook);
    console.log("Template data:", template);

    // Khởi tạo jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Tải font tiếng Việt
    console.log("🔤 Loading Vietnamese font...");
    const fontLoaded = await loadVietnameseFont(doc);

    if (!fontLoaded) {
      console.warn(
        "⚠️ Vietnamese font not loaded, text may not display correctly"
      );
    }

    // Vẽ các phần của PDF
    let yPos = 20;

    yPos = drawHeader(doc, notebook);
    yPos = drawOverview(doc, notebook, yPos);
    yPos = drawCurrentStage(doc, notebook, template, yPos);
    yPos = drawDailyTasks(doc, notebook, yPos);
    yPos = drawAllStages(doc, template, yPos);
    yPos = drawJournal(doc, notebook, yPos);

    // Vẽ footer cho tất cả các trang
    drawFooter(doc);

    // Tên file
    const fileName = `NhatKy_${encodeVietnameseText(
      notebook.notebook_name || "Notebook"
    )}_${new Date().getTime()}.pdf`;

    // Lưu file
    doc.save(fileName);

    console.log("✅ PDF exported successfully:", fileName);

    return {
      success: true,
      fileName: fileName,
    };
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
