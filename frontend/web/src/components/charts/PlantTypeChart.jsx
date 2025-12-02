import React, { useEffect, useRef } from "react";

const PlantTypeChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart config
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data.map(item => item.count));
    const barWidth = chartWidth / data.length - 10;

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Top 10 loại cây được trồng nhiều nhất", canvas.width / 2, 30);

    // Draw Y-axis
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // Draw X-axis
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw Y-axis labels and grid
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = canvas.height - padding - (chartHeight / ySteps) * i;
      const value = Math.round((maxValue / ySteps) * i);

      // Grid line
      ctx.strokeStyle = "#f0f0f0";
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = "#666";
      ctx.font = "11px Arial";
      ctx.textAlign = "right";
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.count / maxValue) * chartHeight;
      const x = padding + index * (chartWidth / data.length) + 5;
      const y = canvas.height - padding - barHeight;

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(0, y, 0, canvas.height - padding);
      gradient.addColorStop(0, "rgba(54, 162, 235, 0.8)");
      gradient.addColorStop(1, "rgba(54, 162, 235, 0.4)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw bar border
      ctx.strokeStyle = "rgba(54, 162, 235, 1)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = "#333";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(item.count.toString(), x + barWidth / 2, y - 5);

      // Draw label (rotated)
      ctx.save();
      ctx.translate(x + barWidth / 2, canvas.height - padding + 10);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#666";
      ctx.font = "10px Arial";
      ctx.textAlign = "left";
      ctx.fillText(item.plantType, 0, 0);
      ctx.restore();
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted py-4">Không có dữ liệu</div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} width={900} height={400} />
    </div>
  );
};

export default PlantTypeChart;
