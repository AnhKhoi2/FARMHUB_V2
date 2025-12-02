import React, { useEffect, useRef } from "react";

const DiseaseCategoryChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart config
    const padding = 60;
    const chartWidth = canvas.width - padding * 2 - 150; // Space for labels
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data.map((d) => d.count), 10);
    const barHeight = chartHeight / data.length - 15;

    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ];

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Phân bổ bệnh theo danh mục", canvas.width / 2, 30);

    // Draw subtitle
    ctx.font = "11px Arial";
    ctx.fillStyle = "#666";
    ctx.fillText("Top 8 danh mục có nhiều bệnh nhất", canvas.width / 2, 48);

    // Draw axes
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding + 150, padding + 30);
    ctx.lineTo(padding + 150, canvas.height - padding);
    ctx.moveTo(padding + 150, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw X-axis grid and labels
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const x = padding + 150 + (chartWidth / xSteps) * i;
      const value = Math.round((maxValue / xSteps) * i);

      ctx.strokeStyle = "#f0f0f0";
      ctx.beginPath();
      ctx.moveTo(x, padding + 30);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();

      ctx.fillStyle = "#666";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(value.toString(), x, canvas.height - padding + 15);
    }

    // Draw horizontal bars
    data.forEach((item, index) => {
      const barWidth = (item.count / maxValue) * chartWidth;
      const x = padding + 150;
      const y = padding + 35 + index * (barHeight + 15);

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
      gradient.addColorStop(0, colors[index % colors.length] + "CC");
      gradient.addColorStop(1, colors[index % colors.length]);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw border
      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw category label on left
      ctx.fillStyle = "#333";
      ctx.font = "12px Arial";
      ctx.textAlign = "right";
      const categoryText = item.category.length > 20 
        ? item.category.substring(0, 20) + "..."
        : item.category;
      ctx.fillText(categoryText, padding + 145, y + barHeight / 2 + 4);

      // Draw count on bar or at end
      ctx.font = "bold 12px Arial";
      if (barWidth > 50) {
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(item.count.toString(), x + barWidth / 2, y + barHeight / 2 + 4);
      } else {
        ctx.fillStyle = "#333";
        ctx.textAlign = "left";
        ctx.fillText(item.count.toString(), x + barWidth + 5, y + barHeight / 2 + 4);
      }

      // Draw rank number
      ctx.fillStyle = colors[index % colors.length];
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`#${index + 1}`, padding + 20, y + barHeight / 2 + 5);
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted py-4">Không có dữ liệu</div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} width={850} height={400} />
    </div>
  );
};

export default DiseaseCategoryChart;
