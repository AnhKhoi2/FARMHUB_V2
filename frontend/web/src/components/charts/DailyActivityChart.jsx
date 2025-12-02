import React, { useEffect, useRef } from "react";

const DailyActivityChart = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    const { notebooksCreated = [], usersJoined = [] } = data;
    
    if (notebooksCreated.length === 0 && usersJoined.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get all dates
    const allDates = new Set();
    [...notebooksCreated, ...usersJoined].forEach((item) => {
      allDates.add(item.date);
    });
    const sortedDates = Array.from(allDates).sort();

    // Create data maps
    const notebookMap = {};
    const userMap = {};
    
    notebooksCreated.forEach((item) => {
      notebookMap[item.date] = item.count;
    });
    
    usersJoined.forEach((item) => {
      userMap[item.date] = item.count;
    });

    const notebookValues = sortedDates.map((date) => notebookMap[date] || 0);
    const userValues = sortedDates.map((date) => userMap[date] || 0);

    // Chart config
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...notebookValues, ...userValues, 5);

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Hoạt động hệ thống 7 ngày gần đây", canvas.width / 2, 30);

    // Draw legend
    ctx.font = "12px Arial";
    
    ctx.fillStyle = "rgba(54, 162, 235, 0.8)";
    ctx.fillRect(canvas.width / 2 - 180, 45, 15, 15);
    ctx.fillStyle = "#333";
    ctx.textAlign = "left";
    ctx.fillText("Notebook mới", canvas.width / 2 - 160, 57);

    ctx.fillStyle = "rgba(75, 192, 192, 0.8)";
    ctx.fillRect(canvas.width / 2 - 40, 45, 15, 15);
    ctx.fillStyle = "#333";
    ctx.fillText("Người dùng mới", canvas.width / 2 - 20, 57);

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

    // Function to draw bars
    const drawBars = (values, color, offset) => {
      const barWidth = (chartWidth / sortedDates.length) * 0.35;
      const groupWidth = chartWidth / sortedDates.length;

      values.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const centerX = padding + (index + 0.5) * groupWidth;
        const x = centerX + offset - barWidth / 2;
        const y = canvas.height - padding - barHeight;

        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw border
        ctx.strokeStyle = color.replace("0.8", "1");
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Draw value on top if > 0
        if (value > 0) {
          ctx.fillStyle = "#333";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        }
      });
    };

    // Draw bars with offset for grouping
    const groupWidth = chartWidth / sortedDates.length;
    const groupOffset = groupWidth * 0.15;
    drawBars(notebookValues, "rgba(54, 162, 235, 0.8)", -groupOffset);
    drawBars(userValues, "rgba(75, 192, 192, 0.8)", groupOffset);

    // Draw X-axis labels
    sortedDates.forEach((date, index) => {
      const groupWidth = chartWidth / sortedDates.length;
      const x = padding + (index + 0.5) * groupWidth;
      const dateObj = new Date(date);
      const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      
      ctx.fillStyle = "#666";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, x, canvas.height - padding + 20);
    });
  }, [data]);

  if (!data || (!data.notebooksCreated?.length && !data.usersJoined?.length)) {
    return (
      <div className="text-center text-muted py-4">Không có dữ liệu</div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} width={850} height={380} />
    </div>
  );
};

export default DailyActivityChart;
