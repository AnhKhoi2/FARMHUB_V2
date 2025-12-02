import React, { useEffect, useRef } from "react";

const ActivityHeatmapChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || Object.keys(data).length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Chart config
    const padding = 50;
    const cellWidth = 28;
    const cellHeight = 30;
    const startX = padding + 30;
    const startY = padding + 30;

    // Find max value for color intensity
    let maxValue = 0;
    Object.values(data).forEach((dayData) => {
      Object.values(dayData).forEach((count) => {
        if (count > maxValue) maxValue = count;
      });
    });

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Hoạt động người dùng theo giờ trong tuần", canvas.width / 2, 25);

    // Draw hour labels (X-axis)
    ctx.fillStyle = "#666";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    hours.forEach((hour, index) => {
      if (hour % 3 === 0) { // Show every 3 hours
        const x = startX + index * cellWidth + cellWidth / 2;
        ctx.fillText(`${hour}h`, x, startY - 10);
      }
    });

    // Draw day labels (Y-axis)
    ctx.textAlign = "right";
    ctx.font = "11px Arial";
    [1, 2, 3, 4, 5, 6, 7].forEach((dayOfWeek, index) => {
      const y = startY + index * cellHeight + cellHeight / 2 + 4;
      ctx.fillText(dayNames[dayOfWeek % 7], startX - 10, y);
    });

    // Helper function to get color based on intensity
    const getColor = (count) => {
      if (!count || count === 0) return "#f0f0f0";
      const intensity = count / maxValue;
      
      if (intensity < 0.2) return "#C8E6C9";
      if (intensity < 0.4) return "#81C784";
      if (intensity < 0.6) return "#66BB6A";
      if (intensity < 0.8) return "#4CAF50";
      return "#2E7D32";
    };

    // Draw heatmap cells
    [1, 2, 3, 4, 5, 6, 7].forEach((dayOfWeek, dayIndex) => {
      hours.forEach((hour, hourIndex) => {
        const x = startX + hourIndex * cellWidth;
        const y = startY + dayIndex * cellHeight;
        
        const count = data[dayOfWeek]?.[hour] || 0;
        const color = getColor(count);

        // Draw cell
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);

        // Draw border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellWidth - 2, cellHeight - 2);

        // Draw count if > 0 and cell is big enough
        if (count > 0) {
          ctx.fillStyle = count / maxValue > 0.5 ? "#fff" : "#333";
          ctx.font = "9px Arial";
          ctx.textAlign = "center";
          ctx.fillText(count.toString(), x + cellWidth / 2 - 1, y + cellHeight / 2 + 3);
        }
      });
    });

    // Draw legend
    const legendX = startX;
    const legendY = startY + 7 * cellHeight + 30;
    const legendWidth = 40;
    const legendHeight = 15;

    ctx.font = "11px Arial";
    ctx.fillStyle = "#666";
    ctx.textAlign = "left";
    ctx.fillText("Thấp", legendX, legendY - 5);
    ctx.textAlign = "right";
    ctx.fillText("Cao", legendX + legendWidth * 5 + 40, legendY - 5);

    // Draw legend gradient
    const gradientSteps = ["#f0f0f0", "#C8E6C9", "#81C784", "#66BB6A", "#4CAF50", "#2E7D32"];
    gradientSteps.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(legendX + index * legendWidth, legendY, legendWidth - 2, legendHeight);
      ctx.strokeStyle = "#ddd";
      ctx.strokeRect(legendX + index * legendWidth, legendY, legendWidth - 2, legendHeight);
    });
  }, [data]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center text-muted py-4">Không có dữ liệu</div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} width={800} height={350} />
    </div>
  );
};

export default ActivityHeatmapChart;
