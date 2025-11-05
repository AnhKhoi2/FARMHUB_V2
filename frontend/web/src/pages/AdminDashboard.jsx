import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import AdminLayout from "../components/AdminLayout";
import PortalModal from "../components/PortalModal";
import aiApi from "../api/aiApi";
import { useRef } from "react";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ diseases: 0, categories: 0 });
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiDescription, setAiDescription] = useState("Cây lúa, lá xuất hiện đốm vàng, lá úa, thời tiết ẩm ướt");
  const [aiSymptoms, setAiSymptoms] = useState("Đốm vàng trên lá, rụng lá, bề mặt có lớp bột trắng nhẹ");
  const [aiExtra, setAiExtra] = useState("");
  const aiMounted = useRef(true);

  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const [dRes, cRes] = await Promise.all([
          axiosClient.get("/admin/diseases?limit=1"),
          axiosClient.get("/admin/disease-categories?limit=1"),
        ]);
        if (!mounted) return;
        setCounts({ diseases: dRes.data.data.total || 0, categories: cRes.data.data.total || 0 });
      } catch (err) {
        console.error("Error fetching admin counts:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCounts();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col">
            <h1 className="h3">Dashboard</h1>
            <p className="text-muted">Welcome to the admin panel</p>
          </div>
          <div className="col text-end">
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowAiModal(true)}>Test AI Diagnose</button>
              <button className="btn btn-outline-danger" onClick={() => dispatch(logout())}>Logout</button>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Diseases</h6>
                <h2 className="card-text">{loading ? "..." : counts.diseases}</h2>
                <p className="text-muted">Total diseases in system</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Categories</h6>
                <h2 className="card-text">{loading ? "..." : counts.categories}</h2>
                <p className="text-muted">Disease categories</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="card-title">AI Diagnose</h6>
                <p className="text-muted">Quick test for AI diagnosis endpoint</p>
                <button className="btn btn-sm btn-primary" onClick={() => setShowAiModal(true)}>Open tester</button>
              </div>
            </div>
          </div>
        </div>
        {showAiModal && (
          <PortalModal onClose={() => { setShowAiModal(false); setAiResult(null); setAiError(null); }}>
            <div className="modal-header">
              <h5 className="modal-title">AI Diagnose Tester</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => { setShowAiModal(false); setAiResult(null); setAiError(null); }}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Plant description</label>
                <textarea className="form-control" rows={2} value={aiDescription} onChange={(e) => setAiDescription(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Symptoms</label>
                <textarea className="form-control" rows={2} value={aiSymptoms} onChange={(e) => setAiSymptoms(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Extra info</label>
                <input className="form-control" value={aiExtra} onChange={(e) => setAiExtra(e.target.value)} />
              </div>

              {aiError && <div className="alert alert-danger">{aiError}</div>}

              {aiResult && (
                <div>
                  <h6>AI Response</h6>
                  <pre style={{whiteSpace: 'pre-wrap'}}>{aiResult.text}</pre>
                  {aiResult.structured && (
                    <div className="mt-2">
                      <strong>Structured</strong>
                      <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(aiResult.structured, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowAiModal(false); setAiResult(null); setAiError(null); }}>Close</button>
              <button className="btn btn-primary" onClick={async () => {
                setAiLoading(true); setAiError(null); setAiResult(null);
                try {
                  const res = await aiApi.diagnose({ description: aiDescription, symptoms: aiSymptoms, extra: aiExtra });
                  const data = res.data?.data?.result;
                  setAiResult(data);
                } catch (err) {
                  setAiError(err.response?.data?.message || err.message || 'Error calling AI');
                } finally {
                  setAiLoading(false);
                }
              }} disabled={aiLoading}>{aiLoading ? 'Processing...' : 'Send to AI'}</button>
            </div>
          </PortalModal>
        )}
      </div>
    </AdminLayout>
  );
}
