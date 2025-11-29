import React from "react";
import NotebookStats from "../../components/NotebookStats";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import "../../css/farmer/NotebookStatsPage.css";

const NotebookStatsPage = () => {
  return (
    <>
      <Header />
      <div className="notebook-stats-page">
        <div className="container">
          <button
            type="button"
            className="stats-back-button"
            onClick={() => window.history.back()}
            aria-label="Quay lại"
          >
            ← Quay lại
          </button>

          <h2 className="stats-heading">Thống kê nhật ký làm vườn</h2>
          <NotebookStats />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotebookStatsPage;
