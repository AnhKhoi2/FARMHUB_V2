import React, { useMemo, useState } from "react";

/**
 * AIResponseView
 * Props:
 *   - result: { text?: string, structured?: object|null, raw?: any, provider?: string }
 * Renders a friendly view for AI diagnosis/chat results, including fallbacks
 * when backend only returns raw JSON from the provider.
 */
export default function AIResponseView({ result }) {
  const [showRaw, setShowRaw] = useState(false);

  const { text, structured, raw } = result || {};

  const parsedTextJson = useMemo(() => {
    if (!text || typeof text !== "string") return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }, [text]);

  // Keep a reference to raw metadata for debugging toggle only
  const rawForDebug = useMemo(() => parsedTextJson || raw || {}, [parsedTextJson, raw]);

  // Preferred: render minimal fields when available (only cause & treatment)
  if (structured && typeof structured === "object") {
    const cause = structured.cause
      || (Array.isArray(structured.likely_causes) ? structured.likely_causes[0] : structured.likely_causes)
      || (Array.isArray(structured.likelyCauses) ? structured.likelyCauses[0] : structured.likelyCauses)
      || "-";
    const treatment = structured.treatment
      || (Array.isArray(structured.recommendations) ? structured.recommendations[0] : structured.recommendations)
      || "-";

    return (
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Nguyên nhân</h6>
              <p className="mb-0">{String(cause)}</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Biện pháp chữa trị</h6>
              <p className="mb-0">{String(treatment)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have plain text (non-JSON), show it directly
  if (text && !parsedTextJson) {
    // Try to heuristically extract cause & treatment from plain text
  const causeMatch = text.match(/(Nguyên\s*nhân|Nguyen\s*nhan|Cause)\s*[-:]\s*(.+)/i);
  const treatmentMatch = text.match(/(Chữa\s*trị|Bien\s*phap|Khuyến\s*nghị|Xu\s*ly|Treatment)\s*[-:]\s*(.+)/i);
    const cause = causeMatch?.[2] || text.slice(0, 120);
    const treatment = treatmentMatch?.[2] || '';
    return (
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Nguyên nhân</h6>
              <p className="mb-0">{String(cause)}</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Biện pháp chữa trị</h6>
              <p className="mb-0">{treatment ? String(treatment) : '—'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, we only have raw JSON from provider (no text)
  return (
    <div>
      <div className="alert alert-warning" role="alert">
        AI phản hồi không có văn bản; không thể trích xuất nguyên nhân/biện pháp từ dữ liệu hiện có.
      </div>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Nguyên nhân</h6>
              <p className="mb-0">—</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Biện pháp chữa trị</h6>
              <p className="mb-0">—</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowRaw(v => !v)}>
          {showRaw ? 'Ẩn JSON thô' : 'Xem JSON thô'}
        </button>
        {showRaw && (
          <pre className="mt-2" style={{ maxHeight: 320, overflow: 'auto', background: '#f8f9fa', padding: 12 }}>
            {JSON.stringify(rawForDebug, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
