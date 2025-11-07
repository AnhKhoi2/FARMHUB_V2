import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import streakApi from "../../api/shared/streakApi";

export default function AdminLeaderboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await streakApi.getTop(50);
      const fetched = res?.data?.data?.items || res?.data?.items || res?.data || [];
      setItems(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Streak Leaderboard</h5>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Current Streak</th>
                  <th>Max Streak</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}>Loading...</td></tr>
                ) : items.length ? (
                  items.map((it, idx) => (
                    <tr key={it._id || idx}>
                      <td>{idx + 1}</td>
                      <td>{it.user?.username || it.user?.email || it.user?._id}</td>
                      <td>{it.current_streak}</td>
                      <td>{it.max_streak}</td>
                      <td>{it.total_points}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
