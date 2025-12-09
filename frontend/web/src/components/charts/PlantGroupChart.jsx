import React, { useEffect, useRef } from "react";

const PlantGroupChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 30;
    const radius = Math.min(centerX, centerY) - 20;

    const groupLabels = {
      leaf_vegetable: "Rau ăn lá",
      root_vegetable: "Rau củ",
      fruit_short_term: "Trái ngắn hạn",
      fruit_long_term: "Trái dài hạn",
      bean_family: "Họ đậu",
      herb: "Rau thơm",
      flower_vegetable: "Rau hoa",
      other: "Khác",
    };

    const colors = [
      "#4BC0C0",
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#9966FF",
      "#FF9F40",
      "#C7C7C7",
      "#5366FF",
    ];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.count, 0);

    // Draw pie chart
    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((item, index) => {
      const sliceAngle = (item.count / total) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw legend
    const legendX = 20;
    let legendY = canvas.height - 80;
    const legendItemHeight = 25;
    const itemsPerColumn = 4;

    data.forEach((item, index) => {
      const columnOffset = Math.floor(index / itemsPerColumn) * 150;
      const yOffset = (index % itemsPerColumn) * legendItemHeight;

      // Draw color box
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX + columnOffset, legendY + yOffset, 15, 15);

      // Draw label
      ctx.fillStyle = "#333";
      ctx.font = "12px Arial";
      const label = groupLabels[item.group] || item.group;
      const percentage = ((item.count / total) * 100).toFixed(1);
      ctx.fillText(`${label} (${percentage}%)`, legendX + columnOffset + 20, legendY + yOffset + 12);
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted py-4">Không có dữ liệu</div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h6 className="mb-3 fw-bold">Nhóm cây được trồng nhiều nhất</h6>
      <canvas ref={canvasRef} width={500} height={380} />
    </div>
  );
};

export default PlantGroupChart;
