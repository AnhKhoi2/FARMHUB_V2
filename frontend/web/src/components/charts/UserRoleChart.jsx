import React, { useEffect, useRef } from "react";

const UserRoleChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roleLabels = {
      user: "Người dùng",
      expert: "Chuyên gia",
      moderator: "Điều phối",
      admin: "Quản trị",
    };

    const colors = [
      { fill: "rgba(75, 192, 192, 0.6)", border: "rgba(75, 192, 192, 1)" },
      { fill: "rgba(255, 159, 64, 0.6)", border: "rgba(255, 159, 64, 1)" },
      { fill: "rgba(153, 102, 255, 0.6)", border: "rgba(153, 102, 255, 1)" },
      { fill: "rgba(255, 99, 132, 0.6)", border: "rgba(255, 99, 132, 1)" },
    ];

    // Chart config
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data.map(item => item.count));
    const barWidth = chartWidth / data.length - 30;

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Người dùng theo vai trò", canvas.width / 2, 30);

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

    // Draw Y-axis grid and labels
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
      const x = padding + index * (chartWidth / data.length) + 15;
      const y = canvas.height - padding - barHeight;

      // Draw bar
      ctx.fillStyle = colors[index % colors.length].fill;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw border
      ctx.strokeStyle = colors[index % colors.length].border;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw value on top
      ctx.fillStyle = "#333";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText(item.count.toString(), x + barWidth / 2, y - 8);

      // Draw label
      ctx.fillStyle = "#666";
      ctx.font = "12px Arial";
      const label = roleLabels[item.role] || item.role;
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
      <canvas ref={canvasRef} width={500} height={320} />
    </div>
  );
};

export default UserRoleChart;
