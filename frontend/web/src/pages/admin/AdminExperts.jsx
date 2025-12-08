import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import axiosClient from '../../api/shared/axiosClient';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { Button } from 'antd';
import "../../css/admin/AdminExperts.css";

export default function AdminExperts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [expRange, setExpRange] = useState('');

  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  // ⭐ Map trạng thái duyệt sang tiếng Việt
  const mapStatusToVietnamese = (status) => {
    switch (status) {
      case "pending":
        return "Đang Chờ";
      case "approved":
        return "Đã Duyệt";
      case "rejected":
        return "Đã Từ Chối";
      default:
        return "Không Xác Định";
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axiosClient.get('/api/experts', {
        params: { q: q || undefined, page, limit },
      });

      const data = res.data?.data || res.data || {};
      const docs =
        Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.docs)
          ? data.docs
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      const tot = data.total || data.meta?.total || docs.length;
      setItems(docs);
      setTotal(Number(tot || 0));
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [q, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = items.filter((it) => {
    const exp = Number(it.experience_years ?? 0);
    if (!expRange) return true;
    if (expRange === '1-3') return exp >= 1 && exp <= 3;
    if (expRange === '4-6') return exp >= 4 && exp <= 6;
    if (expRange === '7-10') return exp >= 7 && exp <= 10;
    if (expRange === '>10') return exp > 10;
    return true;
  });

  const handleDelete = async (expertId) => {
    if (!window.confirm('Bạn có chắc muốn XÓA chuyên gia này?')) return;

    try {
      const res = await axiosClient.delete(`/api/experts/${expertId}`);
      toast.success(res.data?.message || 'Xóa thành công.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa chuyên gia.');
    }
  };

  const handleView = async (expertId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);

    try {
      const res = await axiosClient.get(`/api/experts/${expertId}`);
      const data = res.data?.data || res.data || null;
      setDetail(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi tải chi tiết.');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Danh sách Chuyên gia</h3>
        <div className="text-muted small">Tổng: {filteredItems.length}</div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-auto">
          <input
            className="form-control form-control-sm"
            placeholder="Tìm Kiếm Tên, Lĩnh Vực."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="col-auto">
          <select
            className="form-select form-select-sm"
            value={expRange}
            onChange={(e) => setExpRange(e.target.value)}
          >
            <option value="">Tất Cả Số Năm KN</option>
            <option value="1-3">1 - 3 Năm</option>
            <option value="4-6">4 - 6 Năm</option>
            <option value="7-10">7 - 10 Năm</option>
            <option value=">10">Trên 10 Năm</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger py-1 small">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>STT</th>
                  <th>HỌ & TÊN</th>
                  <th>LĨNH VỰC</th>
                  <th>KINH NGHIỆM</th>
                  <th>TRẠNG THÁI</th>
                  <th>CÔNG KHAI</th>
                  <th>ĐIỂM TB</th>
                  <th>ĐÁNH GIÁ</th>
                  <th>HÀNH ĐỘNG</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-3">Đang Tải...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-3">Không có dữ liệu</td>
                  </tr>
                ) : (
                  filteredItems.map((it, idx) => (
                    <tr key={it._id}>
                      <td>{(page - 1) * limit + idx + 1}</td>
                      <td>{it.full_name}</td>
                      <td>{it.expertise_area}</td>
                      <td>{it.experience_years}</td>

                      {/* ⭐ Dùng tiếng Việt cho trạng thái */}
                      <td>{mapStatusToVietnamese(it.review_status)}</td>

                      <td>{it.is_public ? "Có" : "Không"}</td>
                      <td>{it.avg_score ?? 0}</td>
                      <td>{it.total_reviews ?? 0}</td>

                      <td>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-link"
                            title="Xem"
                            onClick={() => handleView(it._id)}
                            style={{ color: '#2E7D32', padding: 4 }}
                          >
                            <FiEye size={16} />
                          </button>

                          <button
                            className="btn btn-sm btn-link"
                            title="Xóa"
                            onClick={() => handleDelete(it._id)}
                            style={{ color: '#FF4D4F', padding: 4 }}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAILS PANEL */}
      {detailOpen && (
        <div className="expert-detail-overlay" onClick={() => setDetailOpen(false)}>
          <div className="expert-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="expert-detail-header">
              <h3>Chi tiết chuyên gia</h3>
              <button className="expert-detail-close" onClick={() => setDetailOpen(false)}>×</button>
            </div>

            <div className="expert-detail-body">
              {!detailLoading && detail && (
                <div className="detail-grid">

                  <div className="field">
                    <label>HỌ & TÊN</label>
                    <p>{detail?.full_name}</p>
                  </div>

                  <div className="field">
                    <label>EMAIL</label>
                    <p>{detail?.user?.email}</p>
                  </div>

                  <div className="field">
                    <label>LĨNH VỰC CHUYÊN MÔN</label>
                    <p>{detail?.expertise_area}</p>
                  </div>

                  <div className="field">
                    <label>KINH NGHIỆM</label>
                    <p>{detail?.experience_years} Năm</p>
                  </div>

                  <div className="field">
                    <label>TRẠNG THÁI DUYỆT</label>
                    {/* ⭐ Dùng map để hiển thị tiếng Việt */}
                    <p>{mapStatusToVietnamese(detail?.review_status)}</p>
                  </div>

                  <div className="field">
  <label>SỐ ĐIỆN THOẠI</label>
  <p>{detail?.phone_number || detail?.user?.phone_number || "—"}</p>
</div>

                  <div className="field full">
                    <label>GIỚI THIỆU</label>
                    <p>{detail?.description || "—"}</p>
                  </div>

                  <div className="field full">
                    <label>CHỨNG CHỈ</label>
                    <ul className="cert-list">
                      {detail?.certificates?.length > 0 ? (
                        detail.certificates.map((c, i) => {
                          let url = "";

                          if (typeof c === "string") {
                            url = c.trim();
                          } else if (typeof c === "object" && c?.url) {
                            url = c.url.trim();
                          } else {
                            url = "";
                          }

                          if (!url || url === "" || url === "null" || url === "undefined") {
                            return <li key={i}>—</li>;
                          }

                          return (
                            <li key={i}>
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                {url.length > 60 ? url.substring(0, 60) + "..." : url}
                              </a>
                            </li>
                          );
                        })
                      ) : (
                        <li>—</li>
                      )}
                    </ul>
                  </div>

                </div>
              )}
            </div>

            <div className="expert-detail-footer">
              <button className="btn-close-detail" onClick={() => setDetailOpen(false)}>
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
