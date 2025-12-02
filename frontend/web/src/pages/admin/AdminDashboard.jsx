import React, { useEffect, useState } from "react";
import axiosClient from "../../api/shared/axiosClient";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import AIResponseView from "../../components/AIResponseView";
import aiApi from "../../api/farmer/aiApi";
import PlantGroupChart from "../../components/charts/PlantGroupChart";
import PlantTypeChart from "../../components/charts/PlantTypeChart";
import UserRoleChart from "../../components/charts/UserRoleChart";
import MonthlyGrowthChart from "../../components/charts/MonthlyGrowthChart";
import NotebookStatusChart from "../../components/charts/NotebookStatusChart";
import DailyActivityChart from "../../components/charts/DailyActivityChart";
import NotebookStageChart from "../../components/charts/NotebookStageChart";
import NotebookProgressChart from "../../components/charts/NotebookProgressChart";
import ActivityHeatmapChart from "../../components/charts/ActivityHeatmapChart";
import DiseaseCategoryChart from "../../components/charts/DiseaseCategoryChart";
import { Spin } from "antd";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    diseases: 0,
    categories: 0,
    guides: 0,
    notebooks: 0,
    users: 0,
  });
  const [marketCount, setMarketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const dispatch = useDispatch();
  
  // Chart data states
  const [usersByRole, setUsersByRole] = useState([]);
  const [plantTypeStats, setPlantTypeStats] = useState([]);
  const [plantGroupStats, setPlantGroupStats] = useState([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState({
    users: [],
    notebooks: [],
  });
  const [notebookByStatus, setNotebookByStatus] = useState([]);
  const [dailyActivity, setDailyActivity] = useState({});
  const [notebookByStage, setNotebookByStage] = useState([]);
  const [notebookProgress, setNotebookProgress] = useState([]);
  const [activityHeatmap, setActivityHeatmap] = useState({});
  const [diseaseCategoriesDistribution, setDiseaseCategoriesDistribution] = useState([]);
  
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
        setCounts({ diseases, categories, guides, notebooks: 0, users: 0 });
        setMarketCount(marketTotal);
      } catch (err) {
        console.error("Error fetching admin counts:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchDashboardStats = async () => {
      try {
        const [
          statsRes, 
          growthRes, 
          statusRes, 
          activityRes, 
          stageRes,
          progressRes,
          heatmapRes,
          diseaseCatRes
        ] = await Promise.all([
          axiosClient.get("/admin/dashboard/stats"),
          axiosClient.get("/admin/dashboard/monthly-growth?months=6"),
          axiosClient.get("/admin/dashboard/notebook-by-status"),
          axiosClient.get("/admin/dashboard/daily-activity?days=7"),
          axiosClient.get("/admin/dashboard/notebook-by-stage"),
          axiosClient.get("/admin/dashboard/notebook-progress"),
          axiosClient.get("/admin/dashboard/user-activity-heatmap?days=7"),
          axiosClient.get("/admin/dashboard/disease-categories-distribution"),
        ]);

        if (!mounted) return;

        if (statsRes.data?.success) {
          const { totals, usersByRole, plantTypeStats, plantGroupStats } = statsRes.data.data;
          setCounts(prev => ({
            ...prev,
            notebooks: totals.notebooks || 0,
            users: totals.users || 0,
          }));
          setUsersByRole(usersByRole || []);
          setPlantTypeStats(plantTypeStats || []);
          setPlantGroupStats(plantGroupStats || []);
        }

        if (growthRes.data?.success) {
          const { userGrowth, notebookGrowth } = growthRes.data.data;
          setMonthlyGrowth({
            users: userGrowth || [],
            notebooks: notebookGrowth || [],
          });
        }

        if (statusRes.data?.success) {
          setNotebookByStatus(statusRes.data.data || []);
        }

        if (activityRes.data?.success) {
          setDailyActivity(activityRes.data.data || {});
        }

        if (stageRes.data?.success) {
          setNotebookByStage(stageRes.data.data || []);
        }

        if (progressRes.data?.success) {
          setNotebookProgress(progressRes.data.data || []);
        }

        if (heatmapRes.data?.success) {
          setActivityHeatmap(heatmapRes.data.data || {});
        }

        if (diseaseCatRes.data?.success) {
          setDiseaseCategoriesDistribution(diseaseCatRes.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        if (mounted) setChartLoading(false);
      }
    };

    fetchCounts();
    fetchDashboardStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col">
            <h1 className="h3">📊 Bảng điều khiển - Phân tích dữ liệu</h1>
            <p className="text-muted">Tổng quan hệ thống qua biểu đồ trực quan</p>
          </div>
        </div>

        {chartLoading ? (
          <div className="text-center py-5">
            <Spin size="large" tip="Đang tải dữ liệu biểu đồ..." />
          </div>
        ) : (
          <>
            {/* Row 1: User Role Chart */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <UserRoleChart data={usersByRole} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Plant Group Chart */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <PlantGroupChart data={plantGroupStats} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Monthly Growth Chart */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <MonthlyGrowthChart 
                      userData={monthlyGrowth.users} 
                      notebookData={monthlyGrowth.notebooks} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Plant Type Chart */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <PlantTypeChart data={plantTypeStats} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Notebook Status Chart */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <NotebookStatusChart data={notebookByStatus} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 6: Daily Activity Chart */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <DailyActivityChart data={dailyActivity} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 7: Notebook by Stage */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <NotebookStageChart data={notebookByStage} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 8: Notebook Progress Distribution */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <NotebookProgressChart data={notebookProgress} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 9: Activity Heatmap */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <ActivityHeatmapChart data={activityHeatmap} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 10: Disease Categories Distribution */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <DiseaseCategoryChart data={diseaseCategoriesDistribution} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
