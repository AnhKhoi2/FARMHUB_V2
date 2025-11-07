import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import axiosClient from '../../api/shared/axiosClient';

export default function AdminExperts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosClient.get('/api/experts', { params: { q: q || undefined, review_status: reviewStatus || undefined } });
      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }, [q, reviewStatus]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Experts</h3>
        <div className="text-muted small">Total: {items.length}</div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-auto">
          <input className="form-control form-control-sm" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="col-auto">
          <select className="form-select form-select-sm" value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}>
            <option value=''>-- review status --</option>
            <option value='pending'>pending</option>
            <option value='approved'>approved</option>
            <option value='rejected'>rejected</option>
            <option value='banned'>banned</option>
            <option value='inactive'>inactive</option>
          </select>
        </div>
        <div className="col-auto">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setQ(''); setReviewStatus(''); }}>Reset</button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-1 small">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Full name</th>
                  <th>Expertise</th>
                  <th>Experience (yrs)</th>
                  <th>Review status</th>
                  <th>Public</th>
                  <th>Avg score</th>
                  <th>Total reviews</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-3">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-3">No data</td></tr>
                ) : items.map(it => (
                  <tr key={it._id}>
                    <td>{it.full_name || '—'}</td>
                    <td>{it.expertise_area || '—'}</td>
                    <td>{it.experience_years ?? '—'}</td>
                    <td><span className="badge bg-secondary text-uppercase">{it.review_status}</span></td>
                    <td>{it.is_public ? 'Yes' : 'No'}</td>
                    <td>{it.avg_score ?? 0}</td>
                    <td>{it.total_reviews ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
