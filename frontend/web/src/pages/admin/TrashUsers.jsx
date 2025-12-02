import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import usersApi from "../../api/usersApi";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, message, Spin, Empty } from "antd";
import { FiRotateCcw } from "react-icons/fi";

const ROLE_LABELS = { user: 'Người dùng', expert: 'Chuyên gia', moderator: 'Điều phối', admin: 'Quản trị' };

export default function TrashUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchTrash = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await usersApi.list({ includeDeleted: true, limit: 200 });
      const deleted = (data?.items || []).filter((u) => u.isDeleted === true);
      setUsers(deleted);
      setTotal(deleted.length);
    } catch (e) {
      message.error("Không thể tải thùng rác người dùng.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTrash(page);
  }, [page, fetchTrash]);

  const onRestore = async (id) => {
    try {
      await usersApi.restore(id);
      message.success("Đã khôi phục người dùng.");
      fetchTrash(page);
    } catch (e) {
      message.error(e.response?.data?.message || "Khôi phục thất bại");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AdminLayout>
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="h5 mb-0">Thùng rác – Người dùng đã xóa</h2>
            <small className="text-muted">Danh sách người dùng đã bị xóa mềm</small>
          </div>
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/admin/users")}
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
        ) : users.length === 0 ? (
          <Empty description="Không có người dùng đã xóa" style={{ marginTop: 80 }} />
        ) : (
          <>
            {/* Table */}
            <div className="table-responsive bg-white shadow-sm rounded border">
              <table className="table table-sm table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 60 }}>STT</th>
                    <th>Tên đăng nhập</th>
                    <th>Email</th>
                    <th style={{ width: 120 }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u._id}>
                      <td className="small text-muted">{idx + 1}</td>
                      <td>{u.username}</td>
                      <td className="small">{u.email}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-link"
                          title="Khôi phục"
                          onClick={() => onRestore(u._id)}
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
