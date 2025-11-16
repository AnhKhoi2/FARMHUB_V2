import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { profileApi } from "../../api/shared/profileApi.js";

export default function AdminProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await profileApi.getProfile();
        const payload = res.data?.data || {};
        if (!mounted) return;
        setUser(payload.user || null);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col">
            <h1 className="h3">Hồ sơ Admin</h1>
            <p className="text-muted">Quản lý thông tin tài khoản và điều hướng nhanh</p>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            {loading ? (
              <div>Đang tải…</div>
            ) : error ? (
              <div className="text-danger">Không tải được thông tin hồ sơ.</div>
            ) : (
              <div className="row">
                <div className="col-md-4">
                  <h5 className="mb-2">Tổng quan</h5>
                  <p><strong>Username:</strong> {user?.username || '-'}</p>
                  <p><strong>Email:</strong> {user?.email || '-'}</p>
                  <p><strong>Vai trò:</strong> {user?.role || '-'}</p>
                  <p><strong>Ngày tạo:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '-'}</p>
                </div>
                <div className="col-md-8">
                  <h5 className="mb-2">Điều hướng nhanh</h5>
                  <div className="d-flex flex-wrap gap-2">
                    <a className="btn btn-sm btn-primary" href="/admin/dashboard">Dashboard</a>
                    <a className="btn btn-sm btn-outline-primary" href="/admin/users">Quản lý người dùng</a>
                    <a className="btn btn-sm btn-outline-primary" href="/admin/managerpost">Quản lý bài viết</a>
                    <a className="btn btn-sm btn-outline-primary" href="/admin/experts">Quản lý Experts</a>
                    <a className="btn btn-sm btn-outline-primary" href="/admin/expert-applications">Đơn Expert</a>
                    <a className="btn btn-sm btn-outline-secondary" href="/profile">Mở hồ sơ đầy đủ</a>
                  </div>

                  <hr />
                  <h6 className="mb-2">Ghi chú</h6>
                  <p className="text-muted">Trang này hiển thị thông tin tài khoản admin và cung cấp liên kết nhanh đến các trang quản trị. Để chỉnh sửa hồ sơ chi tiết, mở hồ sơ đầy đủ.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
