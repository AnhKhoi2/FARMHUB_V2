import React from "react";
import NotebookStats from "../../components/NotebookStats";

const NotebookStatsPage = () => {
  return (
    <div className="container" style={{ marginTop: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Thống kê nhật ký làm vườn</h2>
      <NotebookStats />
    </div>
  );
};

export default NotebookStatsPage;
