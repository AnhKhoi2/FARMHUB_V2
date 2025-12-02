import Notebook from "../models/Notebook.js";
import User from "../models/User.js";
import Disease from "../models/Disease.js";
import DiseaseCategory from "../models/DiseaseCategory.js";
import Guide from "../models/Guide.js";

/**
 * @route GET /admin/dashboard/stats
 * @desc Lấy thống kê tổng quan cho dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalNotebooks,
      totalUsers,
      totalDiseases,
      totalCategories,
      totalGuides,
      usersByRole,
      plantTypeStats,
      plantGroupStats,
      notebooksByStatus,
    ] = await Promise.all([
      // Tổng số notebook
      Notebook.countDocuments({ status: { $ne: "deleted" } }),

      // Tổng số người dùng
      User.countDocuments({ isDeleted: { $ne: true } }),

      // Tổng số bệnh
      Disease.countDocuments({ isDeleted: { $ne: true } }),

      // Tổng số danh mục bệnh
      DiseaseCategory.countDocuments({ isDeleted: { $ne: true } }),

      // Tổng số hướng dẫn
      Guide.countDocuments(),

      // Thống kê người dùng theo vai trò
      User.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Thống kê các loại cây được trồng nhiều nhất (top 10)
      Notebook.aggregate([
        { $match: { status: { $ne: "deleted" } } },
        { $group: { _id: "$plant_type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Thống kê nhóm cây được trồng nhiều nhất
      Notebook.aggregate([
        { $match: { status: { $ne: "deleted" } } },
        { $group: { _id: "$plant_group", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Thống kê notebook theo trạng thái
      Notebook.aggregate([
        { $match: { status: { $ne: "deleted" } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          notebooks: totalNotebooks,
          users: totalUsers,
          diseases: totalDiseases,
          categories: totalCategories,
          guides: totalGuides,
        },
        usersByRole: usersByRole.map((item) => ({
          role: item._id,
          count: item.count,
        })),
        plantTypeStats: plantTypeStats.map((item) => ({
          plantType: item._id,
          count: item.count,
        })),
        plantGroupStats: plantGroupStats.map((item) => ({
          group: item._id,
          count: item.count,
        })),
        notebooksByStatus: notebooksByStatus.map((item) => ({
          status: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê dashboard",
      error: error.message,
    });
  }
};

/**
 * @route GET /admin/dashboard/monthly-growth
 * @desc Lấy thống kê tăng trưởng theo tháng (người dùng mới, notebook mới)
 */
export const getMonthlyGrowth = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

    const [userGrowth, notebookGrowth] = await Promise.all([
      // Người dùng mới theo tháng
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: monthsAgo },
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Notebook mới theo tháng
      Notebook.aggregate([
        {
          $match: {
            createdAt: { $gte: monthsAgo },
            status: { $ne: "deleted" },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        userGrowth: userGrowth.map((item) => ({
          year: item._id.year,
          month: item._id.month,
          count: item.count,
        })),
        notebookGrowth: notebookGrowth.map((item) => ({
          year: item._id.year,
          month: item._id.month,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getMonthlyGrowth:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê tăng trưởng",
      error: error.message,
    });
  }
};

/**
 * @route GET /admin/dashboard/notebook-by-status
 * @desc Thống kê notebook theo trạng thái
 */
export const getNotebookByStatus = async (req, res) => {
  try {
    const statusStats = await Notebook.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: statusStats.map((item) => ({
        status: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Error in getNotebookByStatus:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê notebook theo trạng thái",
      error: error.message,
    });
  }
};

/**
 * @route GET /admin/dashboard/notebook-by-stage
 * @desc Thống kê notebook theo giai đoạn (stage)
 */
export const getNotebookByStage = async (req, res) => {
  try {
    const stageStats = await Notebook.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: {
            stage: "$current_stage",
            group: "$plant_group",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.stage": 1 } },
    ]);

    // Tổ chức dữ liệu theo stage
    const result = {};
    stageStats.forEach((item) => {
      const stage = item._id.stage || 1;
      const group = item._id.group || "other";
      
      if (!result[stage]) {
        result[stage] = { stage, total: 0, groups: {} };
      }
      
      result[stage].groups[group] = item.count;
      result[stage].total += item.count;
    });

    res.json({
      success: true,
      data: Object.values(result),
    });
  } catch (error) {
    console.error("Error in getNotebookByStage:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê notebook theo giai đoạn",
      error: error.message,
    });
  }
};

/**
 * @route GET /admin/dashboard/daily-activity
 * @desc Thống kê hoạt động hệ thống theo ngày (7 ngày gần nhất)
 */
export const getDailyActivity = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const [notebooksCreated, postsCreated, usersJoined] = await Promise.all([
      // Notebook mới theo ngày
      Notebook.aggregate([
        {
          $match: {
            createdAt: { $gte: daysAgo },
            status: { $ne: "deleted" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Posts mới theo ngày (nếu có model Post)
      // Tạm thời return empty array nếu không có
      Promise.resolve([]),

      // Người dùng mới theo ngày
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: daysAgo },
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        notebooksCreated: notebooksCreated.map((item) => ({
          date: item._id,
          count: item.count,
        })),
        postsCreated: postsCreated.map((item) => ({
          date: item._id,
          count: item.count,
        })),
        usersJoined: usersJoined.map((item) => ({
          date: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getDailyActivity:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê hoạt động hàng ngày",
      error: error.message,
    });
  }
};

/**
 * @route GET /admin/dashboard/notebook-progress
 * @desc Phân bổ notebook theo % tiến độ hoàn thành
 */
export const getNotebookProgress = async (req, res) => {
  try {
    const progressRanges = await Notebook.aggregate([
      { $match: { status: "active" } },
      {
        $bucket: {
          groupBy: "$progress",
          boundaries: [0, 20, 40, 60, 80, 100],
          default: "100+",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: progressRanges.map((item) => ({
        range: item._id === "100+" ? "100" : item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Error in getNotebookProgress:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê tiến độ notebook",
      error: error.message,
    });
  }
};

/**
 * @route GET /admin/dashboard/user-activity-heatmap
 * @desc Thống kê giờ hoạt động của người dùng (heatmap data)
 */
export const getUserActivityHeatmap = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Lấy hoạt động dựa trên createdAt của notebook
    const activities = await Notebook.aggregate([
      {
        $match: {
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$createdAt" }, // 1=Sunday, 7=Saturday
            hour: { $hour: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Tổ chức dữ liệu theo dayOfWeek và hour
    const heatmapData = {};
    activities.forEach((item) => {
      const day = item._id.dayOfWeek;
      const hour = item._id.hour;
      if (!heatmapData[day]) {
        heatmapData[day] = {};
      }
      heatmapData[day][hour] = item.count;
    });

    res.json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    console.error("Error in getUserActivityHeatmap:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy heatmap hoạt động",
      error: error.message,
    });
  }
};

/**
 * @route GET /admin/dashboard/disease-categories-distribution
 * @desc Phân bổ bệnh theo danh mục
 */
export const getDiseaseCategoriesDistribution = async (req, res) => {
  try {
    const distribution = await Disease.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "diseasecategories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$categoryInfo.name",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    res.json({
      success: true,
      data: distribution.map((item) => ({
        category: item._id || "Chưa phân loại",
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Error in getDiseaseCategoriesDistribution:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy phân bổ bệnh theo danh mục",
      error: error.message,
    });
  }
};
