import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import axiosClient from "../../api/shared/axiosClient";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, message, Spin, Empty } from "antd";
import { FiRotateCcw } from "react-icons/fi";

export default function TrashDiseases() {
  const navigate = useNavigate();
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchTrash = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/diseases?includeDeleted=true&limit=200');
      const items = res.data?.data?.items || [];
      const deleted = items.filter((d) => d.isDeleted === true);
      setDiseases(deleted);
      setTotal(deleted.length);
    } catch (e) {
      message.error("Không thể tải thùng rác bệnh.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTrash(page);
  }, [page, fetchTrash]);

  const onRestore = async (id) => {
    try {
      await axiosClient.patch(`/admin/diseases/${id}/restore`);
      message.success("Đã khôi phục bệnh.");
      fetchTrash(page);
    } catch (e) {
      message.error("Khôi phục thất bại");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AdminLayout>
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="h5 mb-0">Thùng rác – Bệnh đã xóa</h2>
            <small className="text-muted">Danh sách bệnh đã bị xóa mềm</small>
          </div>
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/admin/diseases")}
            >
              Quay lại danh sách
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-5">
            <Spin size="large" tip="Đang tải..." />
          </div>
        ) : diseases.length === 0 ? (
          <Empty description="Không có bệnh đã xóa" style={{ marginTop: 80 }} />
        ) : (
          <>
            {/* Table */}
            <div className="table-responsive bg-white shadow-sm rounded border">
              <table className="table table-sm table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 60 }}>STT</th>
                    <th>Tên</th>
                    <th>Danh mục</th>
                    <th>Loại cây</th>
                    <th>Mức độ</th>
                    <th style={{ width: 120 }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {diseases.map((d, idx) => (
                    <tr key={d._id}>
                      <td className="small text-muted">{idx + 1}</td>
                      <td>{d.name}</td>
                      <td className="small">{d.category || '-'}</td>
                      <td className="small">{(d.plantTypes || []).join(', ') || '-'}</td>
                      <td className="small">{d.severity || '-'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-link"
                          title="Khôi phục"
                          onClick={() => onRestore(d._id)}
                          style={{ color: '#4CAF50', padding: 4, margin: 0 }}
                        >
                          <FiRotateCcw size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">Tổng: {total} mục</div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  {(() => {
                    const pages = [];
                    let start = Math.max(1, page - 2);
                    let end = Math.min(totalPages, page + 2);
                    if (start > 1) {
                      pages.push(
                        <li key="first" className="page-item">
                          <button className="page-link" onClick={() => setPage(1)}>1</button>
                        </li>
                      );
                      if (start > 2) pages.push(<li key="dots1" className="page-item disabled"><span className="page-link">...</span></li>);
                    }
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <li key={i} className={`page-item ${i === page ? "active" : ""}`}>
                          <button className="page-link" onClick={() => setPage(i)}>{i}</button>
                        </li>
                      );
                    }
                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push(<li key="dots2" className="page-item disabled"><span className="page-link">...</span></li>);
                      pages.push(
                        <li key="last" className="page-item">
                          <button className="page-link" onClick={() => setPage(totalPages)}>{totalPages}</button>
                        </li>
                      );
                    }
                    return pages;
                  })()}
                </ul>
              </nav>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
