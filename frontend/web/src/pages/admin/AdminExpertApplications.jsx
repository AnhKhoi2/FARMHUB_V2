// =============================================
// AdminExpertApplications.jsx (Đã thêm View Detail)
// =============================================
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/AdminLayout";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/admin/expertApplication.css";
export default function AdminExpertApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  // VIEW DETAIL ADDED
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axiosClient.get("/api/expert-applications", {
        params: {
          status: status || undefined,
          q: q || undefined,
          limit: 50,
        },
      });

      const data = res.data;
      const itemsData =
        data?.data?.items || data?.data || data?.items || data || [];

      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error("Load applications error:", err);
      const res = err.response;

      if (!res) {
        const msg = "Không thể kết nối server.";
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg =
        res.data?.error || res.data?.message || "Lỗi tải danh sách đơn.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    const confirm = window.confirm("Bạn có chắc muốn duyệt đơn này?");
    if (!confirm) return;

    try {
      const res = await axiosClient.patch(
        `/api/expert-applications/${id}/approve`
      );
      toast.success(
        res.data?.message ||
        "Duyệt đơn thành công, người dùng đã được chuyển sang role chuyên gia."
      );
      load();
    } catch (err) {
      console.error("Approve error:", err);
      const res = err.response;

      if (!res) {
        toast.error("Không thể kết nối server.");
        return;
      }

      if (res.status === 400) {
        toast.error(res.data?.error || "Đơn không hợp lệ.");
        return;
      }

      if (res.status === 404) {
        toast.error("Không tìm thấy đơn đăng ký.");
        return;
      }

      toast.error("Lỗi server khi duyệt đơn.");
    }
  };

  const reject = async (id) => {
    const reason = window.prompt(
      "Nhập lý do từ chối (có thể để trống). Bấm Hủy để hủy thao tác:"
    );

    if (reason === null) return;

    try {
      const res = await axiosClient.patch(
        `/api/expert-applications/${id}/reject`,
        { reason: reason ?? "" }
      );

      toast.success(res.data?.message || "Đã từ chối đơn.");
      load();
    } catch (err) {
      console.error("Reject error:", err);
      const res = err.response;

      if (!res) {
        toast.error("Không thể kết nối server.");
        return;
      }

      if (res.status === 400) {
        toast.error(res.data?.error || "Đơn không hợp lệ.");
        return;
      }

      if (res.status === 404) {
        toast.error("Không tìm thấy đơn đăng ký.");
        return;
      }

      toast.error("Lỗi server khi từ chối đơn.");
    }
  };

  const resetFilter = () => {
    setStatus("pending");
    setQ("");
  };

  const renderStatusBadge = (st) => {
    let cls = "bg-secondary";
    let label = "Không xác định";

    if (st === "pending") {
      cls = "bg-warning text-dark";
      label = "Đang chờ";
    } else if (st === "approved") {
      cls = "bg-success";
      label = "Đã duyệt";
    } else if (st === "rejected") {
      cls = "bg-danger";
      label = "Đã từ chối";
    }

    return <span className={`badge ${cls}`}>{label}</span>;
  };

  // ===============================
  // VIEW DETAIL: MỞ MODAL
  // ===============================
  const openDetail = (item) => {
    setDetailData(item);
    setDetailOpen(true);
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Đơn Ứng Tuyển Chuyên Gia</h3>
        <div className="text-muted small">
          Hiển thị:{" "}
          {status === "pending"
            ? "Đang Chờ"
            : status === "approved"
              ? "Đã Duyệt"
              : status === "rejected"
                ? "Đã Từ Chối"
                : "Tất Cả"}
        </div>
      </div>

      {/* Filters */}
      <div className="row g-2 mb-3">
        <div className="col-auto">
          <select
            className="form-select form-select-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất Cả</option>
            <option value="pending">Đang Chờ</option>
            <option value="approved">Đã Duyệt</option>
            <option value="rejected">Đã Từ Chối</option>
          </select>
        </div>
        <div className="col-auto">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Tìm Kiếm Tên, Lĩnh Vực."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="col-auto">
        </div>
      </div>

      {error && <div className="alert alert-danger py-1 small">{error}</div>}

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>HỌ & TÊN</th>
                  <th>EMAIL</th>
                  <th>SỐ ĐIỆN THOẠI</th>
                  <th>LĨNH VỰC</th>
                  <th>KINH NGHIỆM</th>
                  <th>TRẠNG THÁI</th>
                  <th>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-3">
                      Đang Tải...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-3">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it._id}>
                      <td>{it.full_name}</td>
                      <td className="small">{it.email}</td>
                      <td className="small">{it.phone_number || "—"}</td>
                      <td>{it.expertise_area}</td>
                      <td>{it.experience_years ?? 0} Năm</td>
                      <td>{renderStatusBadge(it.status)}</td>
                      <td>
                        <div className="ea-action-group">

                          <button
                            className="ea-btn ea-view"
                            onClick={() => openDetail(it)}
                          >
                            XEM
                          </button>

                          <button
                            className="ea-btn ea-approve"
                            onClick={() => approve(it._id)}
                            disabled={it.status !== "pending"}
                          >
                            DUYỆT
                          </button>

                          <button
                            className="ea-btn ea-reject"
                            onClick={() => reject(it._id)}
                            disabled={it.status !== "pending"}
                          >
                            TỪ CHỐI
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

      {/* =======================================
          VIEW DETAIL MODAL
      ======================================= */}
      {detailOpen && detailData && (
        <div className="ea-overlay" onClick={() => setDetailOpen(false)}>
          <div className="ea-modal-wide" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="ea-detail-header farmhub-header">
              <h3>Thông tin ứng viên</h3>
              <button className="ea-detail-close" onClick={() => setDetailOpen(false)}>×</button>
            </div>


            {/* Body */}
            <div className="ea-detail-grid">

              <div className="ea-field">
                <label>HỌ & TÊN</label>
                <p>{detailData.full_name}</p>
              </div>

              <div className="ea-field">
                <label>EMAIL</label>
                <p>{detailData.email}</p>
              </div>

              <div className="ea-field">
                <label>SỐ ĐIỆN THOẠI</label>
                <p>{detailData.phone_number || "—"}</p>
              </div>

              <div className="ea-field">
                <label>LĨNH VỰC CHUYÊN MÔN</label>
                <p>{detailData.expertise_area}</p>
              </div>

              <div className="ea-field">
                <label>KINH NGHIỆM</label>
                <p>{detailData.experience_years ?? 0} Năm</p>
              </div>

              {/* FULL WIDTH ROW */}
              <div className="ea-field full">
                <label>GIỚI THIỆU</label>
                <p>{detailData.description || "—"}</p>
              </div>

              <div className="ea-field full">
                <label>CHỨNG CHỈ</label>
                <ul className="ea-cert-list">
                  {detailData.certificates?.length > 0 ? (
                    detailData.certificates.map((c, i) => (
                      <li key={i}>
                        <a href={c} target="_blank" rel="noreferrer">{c}</a>
                      </li>
                    ))
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="ea-detail-footer">
              <button className="ea-btn-close" onClick={() => setDetailOpen(false)}>
                ĐÓNG
              </button>
            </div>

          </div>
        </div>
      )}


    </AdminLayout>
  );
}
