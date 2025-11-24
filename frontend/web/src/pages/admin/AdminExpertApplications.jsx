import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/AdminLayout";
import axiosClient from "../../api/shared/axiosClient";
import { Button } from "antd";

export default function AdminExpertApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

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
      console.error("Lỗi tải danh sách đơn:", err);
      const res = err.response;

      if (!res) {
        const msg = "Không thể kết nối đến máy chủ.";
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
    const confirm = window.confirm("Bạn có chắc muốn *duyệt* đơn này?");
    if (!confirm) return;

    try {
      const res = await axiosClient.patch(
        `/api/expert-applications/${id}/approve`
      );

      toast.success(
        res.data?.message ||
          "Duyệt đơn thành công. Người dùng đã được chuyển sang vai trò Chuyên gia."
      );
      load();
    } catch (err) {
      console.error("Lỗi duyệt đơn:", err);
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

      toast.error("Lỗi máy chủ khi duyệt đơn.");
    }
  };

  const reject = async (id) => {
    const reason =
      window.prompt("Nhập lý do từ chối (có thể để trống):") ?? "";

    try {
      const res = await axiosClient.patch(
        `/api/expert-applications/${id}/reject`,
        { reason }
      );

      toast.success(res.data?.message || "Đã từ chối đơn.");
      load();
    } catch (err) {
      console.error("Lỗi từ chối:", err);
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
    if (st === "pending") cls = "bg-warning text-dark";
    else if (st === "approved") cls = "bg-success";
    else if (st === "rejected") cls = "bg-danger";

    const label =
      st === "pending"
        ? "Chờ duyệt"
        : st === "approved"
        ? "Đã duyệt"
        : st === "rejected"
        ? "Đã từ chối"
        : st;

    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const currentStatusLabel =
    !status
      ? "tất cả"
      : status === "pending"
      ? "chờ duyệt"
      : status === "approved"
      ? "đã duyệt"
      : status === "rejected"
      ? "đã từ chối"
      : status;

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h5 mb-0">Danh sách đơn đăng ký Chuyên gia</h3>
        <div className="text-muted small">
          Đang hiển thị: {currentStatusLabel}
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="row g-2 mb-3">
        <div className="col-auto">
          <select
            className="form-select form-select-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>
        <div className="col-auto">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Tìm theo họ tên / email / lĩnh vực chuyên môn..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <Button
            size="small"
            style={{ borderColor: '#E0E0E0', background: '#fff', color: '#2E7D32', textTransform: 'uppercase', padding: '4px 10px' }}
            onClick={resetFilter}
          >
            Đặt lại
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-1 small">{error}</div>
      )}

      {/* Bảng */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Lĩnh vực</th>
                  <th>Kinh nghiệm</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-3">
                      Đang tải...
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
                      <td className="small">
                        {it.phone_number || "—"}
                      </td>
                      <td>{it.expertise_area}</td>
                      <td>{it.experience_years ?? 0} năm</td>
                      <td>{renderStatusBadge(it.status)}</td>
                      <td>
                        {it.status === "pending" ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-success"
                              onClick={() => approve(it._id)}
                            >
                              Duyệt
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => reject(it._id)}
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
