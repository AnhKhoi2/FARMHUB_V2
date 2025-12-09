import React, { useEffect, useRef } from "react";

const NotebookStageChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const groupLabels = {
      leaf_vegetable: "Rau lá",
      root_vegetable: "Rau củ",
      fruit_short_term: "Trái ngắn hạn",
      fruit_long_term: "Trái dài hạn",
      bean_family: "Họ đậu",
      herb: "Rau thơm",
      flower_vegetable: "Rau hoa",
      other: "Khác",
    };

    const groupColors = {
      leaf_vegetable: "#4CAF50",
      root_vegetable: "#FF9800",
      fruit_short_term: "#2196F3",
      fruit_long_term: "#9C27B0",
      bean_family: "#FFEB3B",
      herb: "#00BCD4",
      flower_vegetable: "#E91E63",
      other: "#9E9E9E",
    };

    // Chart config
    const padding = 70;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data.map((d) => d.total), 10);

    const stageNames = ["Giai đoạn 1", "Giai đoạn 2", "Giai đoạn 3", "Giai đoạn 4", "Giai đoạn 5"];

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Notebook theo giai đoạn trồng cây", canvas.width / 2, 30);

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

    // Draw stacked bars
    const barWidth = chartWidth / data.length - 30;

    data.forEach((item, index) => {
      const x = padding + (index / data.length) * chartWidth + 15;
      let yOffset = canvas.height - padding;

      // Get all groups in this stage
      const groups = Object.keys(item.groups || {});
      
      groups.forEach((group) => {
        const count = item.groups[group];
        const barHeight = (count / maxValue) * chartHeight;
        const y = yOffset - barHeight;

        // Draw segment
        ctx.fillStyle = groupColors[group] || "#999";
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Draw count if height is sufficient
        if (barHeight > 15) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 11px Arial";
          ctx.textAlign = "center";
          ctx.fillText(count.toString(), x + barWidth / 2, y + barHeight / 2 + 4);
        }

        yOffset = y;
      });

      // Draw total on top
      ctx.fillStyle = "#333";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(item.total.toString(), x + barWidth / 2, yOffset - 8);

      // Draw stage label
      ctx.fillStyle = "#666";
      ctx.font = "11px Arial";
      const label = stageNames[item.stage - 1] || `Stage ${item.stage}`;
      ctx.fillText(label, x + barWidth / 2, canvas.height - padding + 20);
    });

    // Draw legend
    const legendX = canvas.width - 150;
    let legendY = padding + 30;
    const legendSpacing = 22;

    ctx.font = "11px Arial";
    Object.keys(groupLabels).forEach((group, index) => {
      const y = legendY + index * legendSpacing;

      // Color box
      ctx.fillStyle = groupColors[group];
      ctx.fillRect(legendX, y, 15, 15);
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX, y, 15, 15);

      // Label
      ctx.fillStyle = "#333";
      ctx.textAlign = "left";
      ctx.fillText(groupLabels[group], legendX + 20, y + 11);
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

export default NotebookStageChart;
