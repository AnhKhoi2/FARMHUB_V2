import React, { useEffect, useRef } from "react";

const NotebookStatusChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;
    const outerRadius = Math.min(centerX, centerY) - 30;
    const innerRadius = outerRadius * 0.5; // For doughnut

    const statusLabels = {
      active: "Đang hoạt động",
      archived: "Đã lưu trữ",
      deleted: "Đã xóa",
    };

    const colors = [
      { fill: "#4CAF50", border: "#45a049" },
      { fill: "#FFC107", border: "#e0a800" },
      { fill: "#F44336", border: "#da190b" },
    ];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.count, 0);

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Notebook theo trạng thái", canvas.width / 2, 25);

    // Draw doughnut chart
    let currentAngle = -Math.PI / 2;

    data.forEach((item, index) => {
      const sliceAngle = (item.count / total) * 2 * Math.PI;
      const color = colors[index % colors.length];

      // Draw outer arc
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color.fill;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw label with percentage at middle of slice
      const middleAngle = currentAngle + sliceAngle / 2;
      const labelRadius = outerRadius * 0.75;
      const labelX = centerX + Math.cos(middleAngle) * labelRadius;
      const labelY = centerY + Math.sin(middleAngle) * labelRadius;
      
      const percentage = ((item.count / total) * 100).toFixed(1);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${percentage}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Draw inner circle for doughnut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // Draw total in center
    ctx.fillStyle = "#333";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(total, centerX, centerY - 5);
    ctx.font = "12px Arial";
    ctx.fillStyle = "#666";
    ctx.fillText("Tổng notebook", centerX, centerY + 15);

    // Draw legend
    const legendX = 30;
    const legendY = canvas.height - 80;
    const legendSpacing = 25;

    data.forEach((item, index) => {
      const y = legendY + index * legendSpacing;
      const color = colors[index % colors.length];

      // Color box
      ctx.fillStyle = color.fill;
      ctx.fillRect(legendX, y, 18, 18);
      ctx.strokeStyle = color.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(legendX, y, 18, 18);

      // Label
      ctx.fillStyle = "#333";
      ctx.font = "13px Arial";
      ctx.textAlign = "left";
      const label = statusLabels[item.status] || item.status;
      ctx.fillText(`${label}: ${item.count}`, legendX + 25, y + 13);
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted py-4">Không có dữ liệu</div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} width={450} height={350} />
    </div>
  );
};

export default NotebookStatusChart;
