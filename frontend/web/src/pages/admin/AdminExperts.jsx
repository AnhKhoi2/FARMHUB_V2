import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import axiosClient from '../../api/shared/axiosClient';

export default function AdminExperts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosClient.get('/api/experts', { params: { q: q || undefined, review_status: reviewStatus || undefined, page, limit } });
      const data = res.data?.data || res.data || {};
      const docs = Array.isArray(data.items) ? data.items : (Array.isArray(data.docs) ? data.docs : (Array.isArray(res.data?.data) ? res.data.data : []));
      const tot = data.total || data.meta?.total || docs.length;
      setItems(docs);
      setTotal(Number(tot || 0));
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }, [q, reviewStatus, page, limit]);

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
                  <th style={{width:60}}>STT</th>
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
                  <tr><td colSpan={8} className="text-center py-3">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-3">No data</td></tr>
                ) : items.map((it, idx) => (
                  <tr key={it._id}>
                    <td className="small text-muted">{(page - 1) * limit + idx + 1}</td>
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
      <div className="d-flex justify-content-between align-items-center mt-2">
        <div className="text-muted small">Tổng: {total} mục</div>
        <nav>
          <ul className="pagination pagination-sm mb-0">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(total / limit));
              const pages = [];
              let start = Math.max(1, page - 2);
              let end = Math.min(totalPages, page + 2);
              if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
              for (let p = start; p <= end; p++) pages.push(p);
              if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
              return [
                <li key="prev" className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => page > 1 && setPage(page - 1)}>Prev</button>
                </li>,
                pages.map((p, i) => (
                  typeof p === 'number' ? (
                    <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                    </li>
                  ) : (
                    <li key={`dot-${i}`} className="page-item disabled"><span className="page-link">{p}</span></li>
                  )
                )),
                <li key="next" className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => page < totalPages && setPage(page + 1)}>Next</button>
                </li>
              ];
            })()}
          </ul>
        </nav>
      </div>
    </AdminLayout>
  );
}
