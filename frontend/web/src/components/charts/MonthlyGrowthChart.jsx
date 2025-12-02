import React, { useEffect, useRef } from "react";

const MonthlyGrowthChart = ({ userData, notebookData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if ((!userData || userData.length === 0) && (!notebookData || notebookData.length === 0)) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

    // Create sorted months
    const allMonths = new Set();
    [...(userData || []), ...(notebookData || [])].forEach((item) => {
      const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
      allMonths.add(key);
    });
    const sortedMonths = Array.from(allMonths).sort();

    const labels = sortedMonths.map((key) => {
      const [year, month] = key.split("-");
      return `${monthNames[parseInt(month) - 1]}/${year}`;
    });

    // Create data maps
    const createDataMap = (data) => {
      const map = {};
      (data || []).forEach((item) => {
        const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
        map[key] = item.count;
      });
      return map;
    };

    const userMap = createDataMap(userData);
    const notebookMap = createDataMap(notebookData);

    const userValues = sortedMonths.map((key) => userMap[key] || 0);
    const notebookValues = sortedMonths.map((key) => notebookMap[key] || 0);

    // Chart config
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...userValues, ...notebookValues, 5);

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Tăng trưởng theo tháng", canvas.width / 2, 30);

    // Draw legend
    ctx.font = "12px Arial";
    ctx.fillStyle = "rgba(75, 192, 192, 1)";
    ctx.fillRect(canvas.width / 2 - 150, 45, 15, 15);
    ctx.fillStyle = "#333";
    ctx.textAlign = "left";
    ctx.fillText("Người dùng mới", canvas.width / 2 - 130, 57);

    ctx.fillStyle = "rgba(54, 162, 235, 1)";
    ctx.fillRect(canvas.width / 2 - 10, 45, 15, 15);
    ctx.fillStyle = "#333";
    ctx.fillText("Notebook mới", canvas.width / 2 + 10, 57);

    // Draw axes
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding + 30);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw Y-axis grid and labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = canvas.height - padding - (chartHeight / ySteps) * i;
      const value = Math.round((maxValue / ySteps) * i);

      ctx.strokeStyle = "#f0f0f0";
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      ctx.fillStyle = "#666";
      ctx.font = "11px Arial";
      ctx.textAlign = "right";
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }

    // Function to draw line with area fill
    const drawLine = (values, color, fillColor) => {
      if (values.length === 0) return;

      const points = values.map((value, index) => {
        const x = padding + (index / (values.length - 1 || 1)) * chartWidth;
        const y = canvas.height - padding - (value / maxValue) * chartHeight;
        return { x, y };
      });

      // Draw filled area
      ctx.beginPath();
      ctx.moveTo(points[0].x, canvas.height - padding);
      points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.lineTo(points[points.length - 1].x, canvas.height - padding);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw points
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    // Draw lines
    drawLine(userValues, "rgba(75, 192, 192, 1)", "rgba(75, 192, 192, 0.2)");
    drawLine(notebookValues, "rgba(54, 162, 235, 1)", "rgba(54, 162, 235, 0.2)");

    // Draw X-axis labels
    labels.forEach((label, index) => {
      const x = padding + (index / (labels.length - 1 || 1)) * chartWidth;
      ctx.fillStyle = "#666";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, x, canvas.height - padding + 20);
    });
  }, [userData, notebookData]);

  if ((!userData || userData.length === 0) && (!notebookData || notebookData.length === 0)) {
    return (
      <div className="text-center text-muted py-4">Không có dữ liệu</div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} width={900} height={380} />
    </div>
  );
};

export default MonthlyGrowthChart;
