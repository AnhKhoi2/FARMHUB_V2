import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function PortalModal({ children, onClose, maxWidth = 640, dialogClass = "", backdropClose = true }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const modal = (
    <div
      className="portal-modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        pointerEvents: "auto",
      }}
    >
      <div
        className={`portal-backdrop`}
        onClick={() => backdropClose && onClose && onClose()}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1990 }}
      ></div>

      {/* Use Bootstrap's modal-dialog class so .modal-content styling (background, border-radius) applies correctly */}
      <div
        className={`modal-dialog ${dialogClass}`}
        role="document"
        style={{ zIndex: 2001, maxWidth: maxWidth, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content"
          style={{
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
