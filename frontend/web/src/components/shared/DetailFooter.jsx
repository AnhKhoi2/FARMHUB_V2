import React from "react";
import "./DetailFooter.css";

const DetailFooter = ({ hotline = "0763 479 964", year = new Date().getFullYear() }) => {
  return (
    <footer className="detail-footer">
      <div className="detail-footer-inner">
        <div className="df-left">
          <a href="/" className="df-brand-link">
          <p className="mb-0 text-white">
            © 2025 <span className="text-warning fw-bold">FarmHub</span>. All
            rights reserved.
          </p>
          
          </a>
        </div>

        <div className="df-center">
          
          
        </div>

        <div className="df-right">
          <div className="df-hotline">(HOTLINE) <strong>{hotline}</strong></div>
        </div>
      </div>
    </footer>
  );
};

export default DetailFooter;
