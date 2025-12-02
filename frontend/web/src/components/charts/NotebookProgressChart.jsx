import React, { useEffect, useRef } from "react";

const NotebookProgressChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rangeLabels = {
      0: "0-20%",
      20: "20-40%",
      40: "40-60%",
      60: "60-80%",
      80: "80-100%",
      100: "Hoàn thành",
    };

    const colors = [
      "#F44336", // Đỏ - 0-20%
      "#FF9800", // Cam - 20-40%
      "#FFC107", // Vàng - 40-60%
      "#8BC34A", // Xanh nhạt - 60-80%
      "#4CAF50", // Xanh lá - 80-100%
      "#2196F3", // Xanh dương - Hoàn thành
    ];

    // Chart config
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data.map((d) => d.count), 10);

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Phân bổ Notebook theo % tiến độ", canvas.width / 2, 30);

    // Draw axes
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding + 20);
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

    // Draw bars with gradient
    const barWidth = chartWidth / data.length - 20;

    data.forEach((item, index) => {
      const barHeight = (item.count / maxValue) * chartHeight;
      const x = padding + (index / data.length) * chartWidth + 10;
      const y = canvas.height - padding - barHeight;

      // Create vertical gradient
      const gradient = ctx.createLinearGradient(x, y, x, canvas.height - padding);
      gradient.addColorStop(0, colors[index % colors.length]);
      gradient.addColorStop(1, colors[index % colors.length] + "99"); // Add transparency

      // Draw bar
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw border
      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw count on top
      ctx.fillStyle = "#333";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText(item.count.toString(), x + barWidth / 2, y - 8);

      // Draw percentage in bar if height is sufficient
      if (barHeight > 30) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        const percentage = ((item.count / data.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1);
        ctx.fillText(`${percentage}%`, x + barWidth / 2, y + barHeight / 2 + 4);
      }

      // Draw label
      ctx.fillStyle = "#666";
      ctx.font = "11px Arial";
      ctx.textAlign = "center";
      const label = rangeLabels[item.range] || `${item.range}%`;
      ctx.fillText(label, x + barWidth / 2, canvas.height - padding + 20);
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted py-4">Không có dữ liệu</div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} width={600} height={350} />
    </div>
  );
};

export default NotebookProgressChart;
