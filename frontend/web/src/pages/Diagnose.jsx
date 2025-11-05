import React, { useState } from "react";
import PrivateRoute from "../routes/PrivateRoute";
import aiApi from "../api/aiApi";

export default function Diagnose() {
  const [description, setDescription] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiApi.diagnose({ description, symptoms, extra });
      const data = res.data?.data?.result;
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Lỗi khi gọi AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="container mt-4">
        <h3>Chẩn đoán cây trồng (AI)</h3>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Mô tả cây</label>
            <textarea className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Triệu chứng</label>
            <textarea className="form-control" rows={3} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Thông tin thêm (ví dụ: ảnh URL, thời tiết)</label>
            <input className="form-control" value={extra} onChange={(e) => setExtra(e.target.value)} />
          </div>

          <div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Gửi cho AI'}</button>
          </div>
        </form>

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {result && (
          <div className="card mt-3">
            <div className="card-body">
              <h5>Phân tích (Text)</h5>
              <pre style={{whiteSpace: 'pre-wrap'}}>{result.text}</pre>

              {result.structured && (
                <div className="mt-3">
                  <h6>Structured</h6>
                  <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(result.structured, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
