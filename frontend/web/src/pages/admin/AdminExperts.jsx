import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import axiosClient from '../../api/shared/axiosClient';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { Button } from 'antd';

export default function AdminExperts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ GIỮ NGUYÊN SEARCH
  const [q, setQ] = useState('');

  // ✅ THÊM FILTER THEO KHOẢNG NĂM KINH NGHIỆM
  const [expRange, setExpRange] = useState('');

  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // state cho panel chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axiosClient.get('/api/experts', {
        params: {
          q: q || undefined,
          // ❌ bỏ review_status, chỉ search theo q
          page,
          limit,
        },
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

  // ✅ Lọc theo khoảng kinh nghiệm trên FE
  const filteredItems = items.filter((it) => {
    const exp = Number(it.experience_years ?? 0);
    if (!expRange) return true;

    if (expRange === '1-3') return exp >= 1 && exp <= 3;
    if (expRange === '4-6') return exp >= 4 && exp <= 6;
    if (expRange === '7-10') return exp >= 7 && exp <= 10;
    if (expRange === '>10') return exp > 10;

    return true;
  });

  // ----------------- Actions -----------------

  // XÓA chuyên gia theo expert_id (phù hợp BE: DELETE /api/experts/:id)
  const handleDelete = async (expertId) => {
    if (!window.confirm('Bạn có chắc muốn XÓA chuyên gia này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      const res = await axiosClient.delete(`/api/experts/${expertId}`);
      toast.success(res.data?.message || 'Xóa chuyên gia thành công.');
      load();
    } catch (err) {
      console.error('Delete expert error:', err);
      const res = err.response;
      if (!res) {
        toast.error('Không thể kết nối tới máy chủ.');
        return;
      }
      toast.error(res.data?.error || 'Lỗi khi xóa chuyên gia.');
    }
  };

  // XEM chi tiết chuyên gia: GET /api/experts/:id (accepts expert_id or _id)
  const handleView = async (expertId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);

    try {
      const res = await axiosClient.get(`/api/experts/${expertId}`);
      const data = res.data?.data || res.data || null;
      setDetail(data);
    } catch (err) {
      console.error('Get expert detail error:', err);
      const res = err.response;
      toast.error(res?.data?.error || 'Lỗi khi tải chi tiết chuyên gia.');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Danh sách Chuyên gia</h3>
        {/* tổng theo items đang hiển thị sau khi filter */}
        <div className="text-muted small">Tổng: {filteredItems.length}</div>
      </div>

      {/* Bộ lọc */}
      <div className="row g-2 mb-3">
        {/* Search (GIỮ NGUYÊN) */}
        <div className="col-auto">
          <input
            className="form-control form-control-sm"
            placeholder="Tìm kiếm tên "
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Filter theo năm kinh nghiệm (MỚI) */}
        <div className="col-auto">
          <select
            className="form-select form-select-sm"
            value={expRange}
            onChange={(e) => setExpRange(e.target.value)}
          >
            <option value="">Tất cả số năm KN</option>
            <option value="1-3">1 - 3 năm</option>
            <option value="4-6">4 - 6 năm</option>
            <option value="7-10">7 - 10 năm</option>
            <option value=">10">Trên 10 năm</option>
          </select>
        </div>


      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger py-1 small">{error}</div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 60 }}>STT</th>
                  <th>Họ & Tên</th>
                  <th>Lĩnh vực</th>
                  <th>Kinh nghiệm (năm)</th>
                  <th>Trạng thái duyệt</th>
                  <th>Công khai</th>
                  <th>Điểm TB</th>
                  <th>Tổng đánh giá</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-3">
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-3">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it, idx) => (
                    <tr key={it._id}>
                      <td className="small text-muted">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td>{it.full_name || '—'}</td>
                      <td>{it.expertise_area || '—'}</td>
                      <td>{it.experience_years ?? '—'}</td>

                      <td>
                        {(() => {
                          let label = '';
                          let cls = 'badge ';

                          switch (it.review_status) {
                            case 'pending':
                              label = 'Chờ duyệt';
                              cls += 'bg-warning text-dark';
                              break;
                            case 'approved':
                              label = 'Đã duyệt';
                              cls += 'bg-success';
                              break;
                            case 'rejected':
                              label = 'Từ chối';
                              cls += 'bg-danger';
                              break;
                            default:
                              label = it.review_status;
                              cls += 'bg-secondary';
                          }

                          return <span className={cls}>{label}</span>;
                        })()}
                      </td>

                      <td>{it.is_public ? 'Có' : 'Không'}</td>
                      <td>{it.avg_score ?? 0}</td>
                      <td>{it.total_reviews ?? 0}</td>

                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-link"
                            title="Xem"
                            onClick={() => handleView(it.expert_id)}
                            aria-label={`view-${it.expert_id}`}
                            style={{ color: '#2E7D32', padding: 4, margin: 0, lineHeight: 1 }}
                          >
                            <FiEye size={16} />
                          </button>

                          <button
                            className="btn btn-sm btn-link"
                            title="Xóa"
                            onClick={() => handleDelete(it.expert_id)}
                            aria-label={`delete-${it.expert_id}`}
                            style={{ color: '#FF4D4F', padding: 4, margin: 0, lineHeight: 1 }}
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

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-2">
        <div className="text-muted small">Tổng: {total} mục</div>

        <nav>
          <ul className="pagination pagination-sm mb-0">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(total / limit));
              const pages = [];
              let start = Math.max(1, page - 2);
              let end = Math.min(totalPages, page + 2);

              if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
              }

              for (let p = start; p <= end; p++) pages.push(p);

              if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
              }

              return [
                <li
                  key="prev"
                  className={`page-item ${page <= 1 ? 'disabled' : ''}`}
                >
                  <button
                    className="page-link"
                    onClick={() => page > 1 && setPage(page - 1)}
                  >
                    Trước
                  </button>
                </li>,

                pages.map((p, i) =>
                  typeof p === 'number' ? (
                    <li
                      key={p}
                      className={`page-item ${p === page ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ) : (
                    <li key={`dot-${i}`} className="page-item disabled">
                      <span className="page-link">{p}</span>
                    </li>
                  )
                ),

                <li
                  key="next"
                  className={`page-item ${
                    page >= totalPages ? 'disabled' : ''
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      page < totalPages && setPage(page + 1)
                    }
                  >
                    Sau
                  </button>
                </li>,
              ];
            })()}
          </ul>
        </nav>
      </div>

      {/* PANEL CHI TIẾT CHUYÊN GIA */}
      {detailOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.35)',
            zIndex: 1050,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card shadow"
            style={{
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Chi tiết chuyên gia</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setDetailOpen(false)}
              />
            </div>

            <div className="card-body">
              {detailLoading ? (
                <div className="text-center py-3">Đang tải chi tiết...</div>
              ) : !detail ? (
                <div className="text-center py-3 text-muted">
                  Không tìm thấy dữ liệu chuyên gia.
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <strong>Họ & tên:</strong>{' '}
                    {detail.full_name || '—'}
                  </div>
                  <div className="mb-3">
                    <strong>Email:</strong>{' '}
                    {detail.user?.email || '—'}
                  </div>
                  <div className="mb-3">
                    <strong>Lĩnh vực:</strong>{' '}
                    {detail.expertise_area || '—'}
                  </div>
                  <div className="mb-3">
                    <strong>Kinh nghiệm:</strong>{' '}
                    {detail.experience_years ?? '—'} năm
                  </div>
                  <div className="mb-3">
                    <strong>Trạng thái duyệt:</strong>{' '}
                    {detail.review_status || '—'}
                  </div>
                  <div className="mb-3">
                    <strong>Công khai:</strong>{' '}
                    {detail.is_public ? 'Có' : 'Không'}
                  </div>
                  <div className="mb-3">
                    <strong>Điểm trung bình:</strong>{' '}
                    {detail.avg_score ?? 0} ({detail.total_reviews ?? 0} đánh giá)
                  </div>
                  <div className="mb-3">
                    <strong>Số điện thoại:</strong>{' '}
                    {detail.phone_number || '—'}
                  </div>
                  <div className="mb-3">
                    <strong>Mô tả:</strong>
                    <p className="mb-0">
                      {detail.description || '—'}
                    </p>
                  </div>
                  <div className="mb-2 text-muted small">
                    <div>
                      <strong>Ngày tạo:</strong>{' '}
                      {detail.created_at
                        ? new Date(detail.created_at).toLocaleString('vi-VN')
                        : '—'}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="card-footer text-end">
              <button
                className="btn btn-sm btn-secondary"
                type="button"
                onClick={() => setDetailOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
