import React, { useEffect, useState } from "react";
import axiosClient from "../../api/shared/axiosClient";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import AIResponseView from "../../components/AIResponseView";
import aiApi from "../../api/farmer/aiApi";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    diseases: 0,
    categories: 0,
    guides: 0,
  });
  const [marketCount, setMarketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiDescription, setAiDescription] = useState(
    "Cây lúa, lá xuất hiện đốm vàng, lá úa, thời tiết ẩm ướt"
  );
  const [aiSymptoms, setAiSymptoms] = useState(
    "Đốm vàng trên lá, rụng lá, bề mặt có lớp bột trắng nhẹ"
  );
  const [aiExtra, setAiExtra] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const [dRes, cRes, gRes, mRes] = await Promise.all([
          axiosClient.get("/admin/diseases?limit=1"),
          axiosClient.get("/admin/disease-categories?limit=1"),
          axiosClient.get("/guides", { params: { limit: 1 } }),
          axiosClient.get("/admin/managerpost?limit=1"),
        ]);
        if (!mounted) return;
        const diseases = dRes.data?.data?.total || 0;
        const categories = cRes.data?.data?.total || 0;
        const gMeta = gRes.data?.meta || {};
        const guides = gMeta.pages
          ? gMeta.total
          : Array.isArray(gRes.data?.data)
          ? gRes.data.data.length
          : 0;
        const marketTotal =
          mRes.data?.data?.meta?.total ||
          mRes.data?.meta?.total ||
          mRes.data?.data?.total ||
          mRes.data?.total ||
          0;
        setCounts({ diseases, categories, guides });
        setMarketCount(marketTotal);
      } catch (err) {
        console.error("Error fetching admin counts:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCounts();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col">
            <h1 className="h3">Bảng điều khiển</h1>
            <p className="text-muted">Chào mừng đến trang quản trị</p>
          </div>
          <div className="col text-end">
            <div className="d-flex justify-content-end gap-2"></div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Bệnh</h6>
                <h2 className="card-text">
                  {loading ? "..." : counts.diseases}
                </h2>
                <p className="text-muted">Tổng số bệnh</p>
                <a className="btn btn-sm btn-primary" href="/admin/diseases">
                  Quản lý
                </a>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Danh mục</h6>
                <h2 className="card-text">
                  {loading ? "..." : counts.categories}
                </h2>
                <p className="text-muted">Danh mục bệnh</p>
                <a
                  className="btn btn-sm btn-primary"
                  href="/admin/disease-categories"
                >
                  Quản lý
                </a>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Hướng dẫn</h6>
                <h2 className="card-text">{loading ? "..." : counts.guides}</h2>
                <p className="text-muted">Hướng dẫn sử dụng</p>
                <a
                  className="btn btn-sm btn-primary"
                  href="/admin/managerguides"
                >
                  Quản lý
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mt-3">
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="card-title">Bài viết</h6>
                <h2 className="card-text">{loading ? "..." : marketCount}</h2>
                <p className="text-muted">Bài viết của người dùng</p>
                <a className="btn btn-sm btn-primary" href="/admin/managerpost">
                  Quản lý bài viết
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={async () => {
              setAiLoading(true);
              setAiError(null);
              setAiResult(null);
              try {
                const res = await aiApi.diagnose({
                  description: aiDescription,
                  symptoms: aiSymptoms,
                  extra: aiExtra,
                });
                const data = res.data?.data?.result;
                setAiResult(data);
              } catch (err) {
                setAiError(
                  err.response?.data?.message ||
                    err.message ||
                    "Error calling AI"
                );
              } finally {
                setAiLoading(false);
              }
            }}
            disabled={aiLoading}
          >
            {aiLoading ? "Đang xử lý..." : "Gửi tới AI"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
