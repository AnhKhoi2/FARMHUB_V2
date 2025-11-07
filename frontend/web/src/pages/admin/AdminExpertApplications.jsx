import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import axiosClient from '../../api/shared/axiosClient';

export default function AdminExpertApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosClient.get('/api/expert-applications', {
        params: { status: status || undefined, q: q || undefined, limit: 50 }
      });
      const data = res.data?.data;
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }, [status, q]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    if (!window.confirm('Approve this application?')) return;
    try {
      await axiosClient.patch(`/api/expert-applications/${id}/approve`, { activate_expert: true });
      load();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const reject = async (id) => {
    const reason = window.prompt('Reject reason:');
    if (reason === null) return;
    try {
      await axiosClient.patch(`/api/expert-applications/${id}/reject`, { reason });
      load();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Expert Applications</h3>
        <div className="text-muted small">Showing: {status || 'all'}</div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-auto">
          <select className="form-select form-select-sm" value={status} onChange={e => setStatus(e.target.value)}>
            <option value=''>all</option>
            <option value='pending'>pending</option>
            <option value='approved'>approved</option>
            <option value='rejected'>rejected</option>
          </select>
        </div>
        <div className="col-auto">
          <input className="form-control form-control-sm" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="col-auto">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setStatus('pending'); setQ(''); }}>Reset</button>
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
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Expertise</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-3">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-3">No data</td></tr>
                ) : items.map(it => (
                  <tr key={it._id}>
                    <td>{it.full_name}</td>
                    <td className="small">{it.email}</td>
                    <td className="small">{it.phone_number || '—'}</td>
                    <td>{it.expertise_area}</td>
                    <td>{it.experience_years ?? 0} yrs</td>
                    <td><span className={`badge ${it.status === 'pending' ? 'bg-warning' : it.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>{it.status}</span></td>
                    <td>
                      {it.status === 'pending' ? (
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-success" onClick={() => approve(it._id)}>Approve</button>
                          <button className="btn btn-outline-danger" onClick={() => reject(it._id)}>Reject</button>
                        </div>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
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
