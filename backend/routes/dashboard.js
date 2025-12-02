import express from "express";
import { 
  getDashboardStats, 
  getMonthlyGrowth,
  getNotebookByStatus,
  getNotebookByStage,
  getDailyActivity,
  getNotebookProgress,
  getUserActivityHeatmap,
  getDiseaseCategoriesDistribution
} from "../controllers/dashboardController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu admin
router.use(verifyToken, requireAdmin);

// GET /admin/dashboard/stats - Lấy thống kê tổng quan
router.get("/stats", getDashboardStats);

// GET /admin/dashboard/monthly-growth - Lấy thống kê tăng trưởng theo tháng
router.get("/monthly-growth", getMonthlyGrowth);

// GET /admin/dashboard/notebook-by-status - Notebook theo trạng thái
router.get("/notebook-by-status", getNotebookByStatus);

// GET /admin/dashboard/notebook-by-stage - Notebook theo giai đoạn
router.get("/notebook-by-stage", getNotebookByStage);

// GET /admin/dashboard/daily-activity - Hoạt động theo ngày
router.get("/daily-activity", getDailyActivity);

// GET /admin/dashboard/notebook-progress - Phân bổ theo tiến độ
router.get("/notebook-progress", getNotebookProgress);

// GET /admin/dashboard/user-activity-heatmap - Heatmap hoạt động
router.get("/user-activity-heatmap", getUserActivityHeatmap);

// GET /admin/dashboard/disease-categories-distribution - Bệnh theo danh mục
router.get("/disease-categories-distribution", getDiseaseCategoriesDistribution);

export default router;
