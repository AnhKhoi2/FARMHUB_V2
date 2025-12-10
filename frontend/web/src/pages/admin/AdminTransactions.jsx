import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { DatePicker } from "antd";
import axiosClient from "../../api/shared/axiosClient";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // show 10 transactions per page
  const [total, setTotal] = useState(0);

  // Filters
  const [date, setDate] = useState("");
  const [type, setType] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const buildParams = (p = page) => {
    const params = { page: p, limit };
    if (date) params.date = date;
    if (type && type !== "all") params.itemType = type;
    if (currency && currency !== "all") params.currency = currency;
    if (status && status !== "all") params.paymentStatus = status;
    if (q) params.q = q;
    return params;
  };

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/admin/transactions`, {
        params: buildParams(p),
      });
      if (res.data && res.data.orders) {
        setTransactions(res.data.orders);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (e) {
      console.error("Load transactions error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // run search/filters
  const applyFilters = () => {
    setPage(1);
    load(1);
  };

  // Export CSV
  const exportCSV = async () => {
    try {
      // Request all rows for the current filters. Use `total` as limit if available
      const params = { ...buildParams(1), limit: total || 1000000, page: 1 };
      const res = await axiosClient.get(`/admin/transactions`, { params });
      const rows = res.data.orders || [];
      if (rows.length === 0) return alert("Không có dữ liệu để xuất");

      const header = [
        "Mã đơn",
        "Số giao dịch",
        "Thời gian",
        "Loại giao dịch",
        "Tên tài khoản",
        "Số tiền",
        "Trạng thái",
      ];

      const csv = [header.join(",")];
      const escapeCSV = (val) => {
        const s = val === null || val === undefined ? "" : String(val);
        return `"${s.replace(/"/g, '""')}"`;
      };

      rows.forEach((r) => {
        const items = (r.items || []).map((it) => it.name || "").join(" | ");
        const line = [
          escapeCSV(r.orderRef || ""),
          escapeCSV(r._id || ""),
          escapeCSV(new Date(r.createdAt).toLocaleString()),
          escapeCSV(items),
          escapeCSV(r.userId?.username || r.userId?.email || ""),
          escapeCSV(`${r.totalAmount || 0} ${r.currency || ""}`),
          escapeCSV(r.paymentStatus || ""),
        ];
        csv.push(line.join(","));
      });

      // Add BOM so Excel (Windows) recognizes UTF-8 properly
      const csvContent = "\uFEFF" + csv.join("\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error", e);
      alert("Lỗi khi xuất báo cáo");
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid transactions-page">
        <style>{`
        .transactions-page { --primary: #00FF4C; --dark: #23622B; --muted: #6c757d; }
        .transactions-page .card { border: 0; border-radius: 12px; box-shadow: 0 6px 18px rgba(32,45,60,0.06); }
        .transactions-page .card .card-body { padding: 14px; background: #ffffff; min-height: unset; }
        .transactions-page .form-label { font-size: 13px; color: #42515a; }
        .transactions-page .form-control, .transactions-page .form-select { border-radius: 8px; border: 1px solid #e6eef0; }
        .transactions-page .input-group .form-control { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
        .transactions-page .btn-primary { background: var(--primary); border: 0; box-shadow: 0 6px 18px rgba(0,200,83,0.12); }
        .transactions-page .btn-outline-secondary { border-radius: 8px; min-width: 110px; max-width: 160px; padding: 6px 12px; white-space: nowrap; }

        /* Themed buttons: outline emerald for "Làm mới", solid emerald for "Tải xuống các báo cáo" */
        .transactions-page .btn-outline-secondary {
          border: 1px solid var(--primary);
          color: var(--dark);
          background: transparent;
          font-weight: 700;
        }

        .transactions-page .btn-outline.border-black {
          background: var(--primary);
          color: #ffffff;
          border: 1px solid var(--primary);
          box-shadow: 0 6px 18px rgba(16,185,129,0.12);
          min-width: 120px;
          padding: 6px 14px;
          font-weight: 700;
        }

        .transactions-page .btn-outline-secondary:hover {
          background: rgba(16,185,129,0.06);
        }

        .transactions-page .btn-outline.border-black:hover {
          filter: brightness(0.95);
        }
        .transactions-page table thead th { background: #f3fff5; color: var(--dark); font-weight: 700; border-bottom: 0; }
        .transactions-page table tbody tr { border-bottom: 1px solid #f3f6f7; }
        .transactions-page table tbody tr:hover { background: rgba(0, 200, 83, 0.03); }
        .transactions-page .badge-paid { background: #e8f9ec; color: var(--dark); padding: 6px 8px; border-radius: 999px; font-weight:600; }
        .transactions-page .badge-failed { background: #fff0f0; color: #c62828; padding: 6px 8px; border-radius: 999px; font-weight:600; }
        .transactions-page .badge-pending { background: #fff8e6; color: #b35700; padding: 6px 8px; border-radius: 999px; font-weight:600; }
        .transactions-page .text-end { text-align: right; }
        .transactions-page .filter-row .col-auto { display:flex; flex-direction:column; }
        @media (max-width: 768px) {
          .transactions-page .row.g-2 { gap: 8px; }
        }

        /* Pagination bar */
        .transactions-page .pagination-bar {
          background: #ffffff; /* white background */
          padding: 10px 16px;
          border-radius: 10px;
          box-shadow: 0 6px 18px rgba(32,45,60,0.06);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
        }
        .transactions-page .pagination-bar .btn {
          min-width: 88px;
          border-radius: 8px;
          padding: 6px 12px;
          font-weight: 600;
        }
        .transactions-page .pagination-bar .btn-primary {
          background: var(--primary) !important;
          color: #fff !important;
          border: 0 !important;
          box-shadow: 0 6px 18px rgba(0,255,76,0.12);
        }
        .transactions-page .pagination-bar .btn-outline {
          background: transparent !important;
          color: var(--dark) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
        }
        .transactions-page .pagination-info { color: #333; font-weight: 600; }

        /* Ensure the table area doesn't show patterned background from parent layers */
        .transactions-page .card .table-responsive { 
          background: #ffffff; 
          border-radius: 8px; 
          overflow-x: auto; /* Enable horizontal scroll */
          -webkit-overflow-scrolling: touch; /* Smooth scroll on mobile */
        }

        /* Make table columns more compact to prevent overflow */
        .transactions-page table {
          min-width: 100%;
          table-layout: auto;
        }

        /* Limit width of transaction ID columns */
        .transactions-page table td:nth-child(1),
        .transactions-page table th:nth-child(1) {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .transactions-page table td:nth-child(2),
        .transactions-page table th:nth-child(2) {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Make date/time column compact */
        .transactions-page table td:nth-child(3),
        .transactions-page table th:nth-child(3) {
          white-space: nowrap;
          font-size: 13px;
        }

        /* Limit transaction type column width */
        .transactions-page table td:nth-child(4),
        .transactions-page table th:nth-child(4) {
          max-width: 180px;
        }

        /* Account name column */
        .transactions-page table td:nth-child(5),
        .transactions-page table th:nth-child(5) {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Amount column - keep compact */
        .transactions-page table td:nth-child(6),
        .transactions-page table th:nth-child(6) {
          white-space: nowrap;
          min-width: 100px;
        }

        /* Status column - keep compact */
        .transactions-page table td:nth-child(7),
        .transactions-page table th:nth-child(7) {
          white-space: nowrap;
          min-width: 110px;
        }
      `}</style>
        <div className="mb-3">
          <h2 className="mb-2">Giao dịch</h2>
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-2 align-items-center">
                <div className="col-auto" style={{ minWidth: 180 }}>
                  <label className="form-label mb-1">Ngày</label>
                  <DatePicker
                    className="form-control form-control-sm"
                    onChange={(d, dateString) => setDate(dateString)}
                    format="YYYY-MM-DD"
                    allowClear
                  />
                </div>

                <div className="col-auto" style={{ minWidth: 160 }}>
                  <label className="form-label mb-1">Phân loại</label>
                  <select
                    className="form-select form-select-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="Subscription">Gói nâng cấp</option>
                    <option value="MarketListing">Market</option>
                  </select>
                </div>

                <div className="col-auto" style={{ minWidth: 140 }}>
                  <label className="form-label mb-1">Loại tiền tệ</label>
                  <select
                    className="form-select form-select-sm"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div className="col-auto" style={{ minWidth: 160 }}>
                  <label className="form-label mb-1">Trạng thái</label>
                  <select
                    className="form-select form-select-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="paid">Đã hoàn tất</option>
                    <option value="failed">Thất bại</option>
                    <option value="pending">Đang chờ</option>
                  </select>
                </div>

                <div
                  className="col d-flex flex-column"
                  style={{ minWidth: 260 }}
                >
                  <label className="form-label mb-1">Tìm kiếm</label>
                  <div className="input-group input-group-sm">
                    <input
                      className="form-control"
                      placeholder="Tìm kiếm"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={applyFilters}
                    >
                      🔍
                    </button>
                  </div>
                </div>

                {/* Buttons moved below filters to show horizontally */}
              </div>
            </div>
          </div>

          {/* Horizontal buttons row placed under the filters */}
          <div className="d-flex justify-content-end gap-2 mb-3">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setDate("");
                setType("all");
                setCurrency("all");
                setStatus("all");
                setQ("");
                setPage(1);
                load(1);
              }}
            >
              Làm mới
            </button>

            <button
              className="btn btn-sm btn-outline border-black text-black"
              onClick={exportCSV}
            >
              Tải xuống các báo cáo
            </button>
          </div>
        </div>

        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Số giao dịch</th>
                  <th>Thời gian giao dịch</th>
                  <th>Loại giao dịch</th>
                  <th>Tên tài khoản</th>
                  <th className="text-end">Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Đang tải...
                    </td>
                  </tr>
                )}

                {!loading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Không có giao dịch
                    </td>
                  </tr>
                )}

                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td>{t.orderRef}</td>
                    <td>{t._id}</td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>
                      {t.items && t.items.length > 0
                        ? t.items.map((i) => i.name).join(", ")
                        : "—"}
                    </td>
                    <td>{t.userId?.username || t.userId?.email || "—"}</td>
                    <td className="text-end">
                      {(t.totalAmount || 0).toLocaleString()} {t.currency || ""}
                    </td>
                    <td>
                      {t.paymentStatus === "paid"
                        ? "Đã hoàn tất"
                        : t.paymentStatus || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="pagination-bar mt-3"
          role="navigation"
          aria-label="Pagination"
        >
          <div className="pagination-info">Tổng: {total} giao dịch</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Trang trước"
            >
              Trước
            </button>

            <div className="pagination-info">
              Trang {page} / {Math.max(1, Math.ceil(total / limit))}
            </div>

            <button
              className="btn btn-primary"
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Trang sau"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
