# Tài liệu Timezone - Giờ Việt Nam (UTC+7)

## 📍 Tổng quan

Toàn bộ hệ thống FARMHUB_V2 đã được chuyển đổi để sử dụng **múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)** cho tất cả các tính năng liên quan đến:

- **Notebook** (Nhật ký trồng cây)
- **PlantTemplate** (Bộ mẫu chăm sóc cây)
- **Daily Checklist** (Công việc hàng ngày)
- **Stage Tracking** (Theo dõi giai đoạn)

## 🛠️ Cách triển khai

### Helper Functions (utils/timezone.js)

Tất cả các tính toán thời gian sử dụng các helper functions từ `backend/utils/timezone.js`:

```javascript
import {
  getVietnamTime, // Lấy thời gian hiện tại theo giờ VN
  getVietnamToday, // Lấy ngày hôm nay (00:05 VN)
  toVietnamMidnight, // Chuyển đổi date về đầu ngày VN
  getDaysDifferenceVN, // Tính khoảng cách ngày theo VN
  formatVietnamDate, // Format date thành YYYY-MM-DD (VN)
  parseVietnamDate, // Parse input thành VN date
} from "../utils/timezone.js";
```

### Day Start Offset

Hệ thống sử dụng **offset 5 phút** (00:05) thay vì 00:00 để tránh vấn đề chuyển đổi múi giờ. Có thể cấu hình qua biến môi trường:

```
VN_DAY_START_MINUTES=5
```

## 📂 Files đã chuyển đổi

### Controllers

1. **notebookController.js**

   - ✅ Sử dụng `getVietnamToday()` cho các tính toán ngày
   - ✅ Sử dụng `toVietnamMidnight()` để normalize dates
   - ✅ Sử dụng `getDaysDifferenceVN()` để tính khoảng cách
   - ✅ Sử dụng `parseVietnamDate()` khi nhận `planted_date` từ client
   - ✅ Trả về `timezone: "Asia/Ho_Chi_Minh (UTC+7)"` trong response

2. **plantTemplateController.js**
   - ✅ Trả về `timezone: "Asia/Ho_Chi_Minh (UTC+7)"` trong response

### Models

1. **Notebook.js**

   - ✅ Virtual field `current_day` sử dụng `getDaysDifferenceVN()`
   - ✅ Tất cả date comparisons sử dụng VN timezone

2. **PlantTemplate.js**
   - ✅ Date calculations dựa trên VN timezone

### Jobs (Cron Jobs)

1. **dailyTasksNotificationJob.js**

   - ✅ Chạy lúc 07:00 giờ Việt Nam
   - ✅ Sử dụng `getVietnamToday()` và `toVietnamMidnight()`
   - ✅ Timezone: `"Asia/Ho_Chi_Minh"`

2. **taskReminderJob.js**

   - ✅ Chạy lúc 09:00 giờ Việt Nam
   - ✅ Sử dụng VN timezone helpers

3. **stageMonitoringJob.js**
   - ✅ Chạy lúc 08:00 giờ Việt Nam
   - ✅ Check stage status theo VN timezone

## 🎯 Use Cases

### 1. Tạo Notebook mới

```javascript
POST /api/notebooks

{
  "notebook_name": "Cà chua bi",
  "guide_id": "...",
  "planted_date": "2025-11-25"  // Sẽ được parse theo giờ VN
}

// Backend xử lý:
const normalizedPlantedDate = planted_date
  ? parseVietnamDate(planted_date)  // Parse theo VN timezone
  : getVietnamToday();              // Hoặc lấy hôm nay VN
```

### 2. Tính số ngày đã trồng

```javascript
// Virtual field trong Notebook model
notebookSchema.virtual("current_day").get(function () {
  if (!this.planted_date) return 0;
  const diffDays = getDaysDifferenceVN(this.planted_date, new Date());
  return Math.max(0, diffDays + 1); // 1-based counting
});
```

### 3. Generate Daily Checklist

```javascript
export const generateDailyChecklist = async (notebookId) => {
  const today = getVietnamToday(); // 00:05 hôm nay theo VN

  // Kiểm tra xem đã gen checklist hôm nay chưa
  const lastGenerated = notebook.last_checklist_generated
    ? toVietnamMidnight(new Date(notebook.last_checklist_generated))
    : null;

  if (lastGenerated && lastGenerated.getTime() < today.getTime()) {
    // Xử lý overdue tasks từ hôm qua
  }
};
```

### 4. Stage Monitoring

```javascript
export const checkNotebookStageStatus = async (notebook) => {
  const today = getVietnamToday();
  const stageEndDate = getStageEndDate(
    notebook.planted_date,
    templateStage.day_end
  );

  // Tính số ngày trễ theo VN timezone
  const daysAfterEnd = getDaysDifferenceVN(stageEndDate, today);
};
```

## 📊 Response Format

Tất cả API responses có liên quan đến date/time sẽ bao gồm thông tin timezone:

```json
{
  "success": true,
  "data": {
    "notebook_name": "Cà chua bi",
    "planted_date": "2025-11-25T00:05:00.000Z",
    "current_day": 1
  },
  "meta": {
    "timezone": "Asia/Ho_Chi_Minh (UTC+7)"
  },
  "message": "Fetched notebook successfully"
}
```

## 🔧 Configuration

### Environment Variables

```env
# Số phút offset từ 00:00 để bắt đầu ngày mới
VN_DAY_START_MINUTES=5

# Timezone cho cron jobs
TZ=Asia/Ho_Chi_Minh
```

### Cron Schedule

```javascript
// dailyTasksNotificationJob.js
cron.schedule(
  "0 7 * * *",
  async () => {
    // Chạy lúc 07:00 VN
  },
  {
    timezone: "Asia/Ho_Chi_Minh",
  }
);
```

## ⚠️ Lưu ý quan trọng

### 1. Database Storage

MongoDB lưu dates dưới dạng UTC, nhưng tất cả calculations đều convert sang VN timezone:

```javascript
// Saved in DB as UTC
planted_date: ISODate("2025-11-24T17:05:00.000Z");

// But interpreted and calculated as:
// 2025-11-25 00:05 (Vietnam time)
```

### 2. Frontend Integration

Frontend nên:

- Gửi dates dưới dạng `YYYY-MM-DD` (date-only string)
- Backend sẽ tự động parse theo VN timezone
- Hoặc gửi ISO string, backend sẽ normalize về VN midnight

```javascript
// ✅ Recommended
planted_date: "2025-11-25";

// ✅ Also works
planted_date: "2025-11-25T10:30:00+07:00";

// Backend normalizes both to: 2025-11-25 00:05 VN
```

### 3. Date Comparisons

Luôn sử dụng `.getTime()` để so sánh dates sau khi đã normalize:

```javascript
// ✅ Correct
const date1 = toVietnamMidnight(new Date(dateString1));
const date2 = toVietnamMidnight(new Date(dateString2));
if (date1.getTime() === date2.getTime()) {
  // Same day in VN timezone
}

// ❌ Wrong
if (dateString1 === dateString2) {
  // May fail due to timezone differences
}
```

## 🧪 Testing

### Manual Test Endpoints

```bash
# Test timezone info in responses
GET /api/notebooks/:id
# Response includes: "timezone": "Asia/Ho_Chi_Minh (UTC+7)"

# Test daily checklist generation
GET /api/notebooks/:id/daily-checklist
# Uses getVietnamToday()

# Test timeline
GET /api/notebooks/:id/timeline
# All dates formatted with formatVietnamDate()
```

### Cron Job Testing

```bash
# Manual trigger daily tasks notification
POST /api/notifications/trigger-daily-tasks

# Manual trigger stage monitoring
POST /api/notebooks/monitor-all
```

## 📚 Related Documentation

- [OVERDUE_TASK_API.md](./OVERDUE_TASK_API.md) - Quản lý overdue tasks
- [PLANT_TEMPLATE_GUIDE.md](./PLANT_TEMPLATE_GUIDE.md) - Hướng dẫn Plant Template
- [timezone.js](../utils/timezone.js) - Helper functions source code

## 🎓 Best Practices

1. **Luôn sử dụng helper functions** thay vì `new Date()` trực tiếp
2. **Normalize dates ngay khi nhận** từ client hoặc database
3. **Log timezone info** trong development để debug dễ dàng
4. **Test với multiple timezones** để đảm bảo hoạt động đúng
5. **Document timezone assumptions** trong code comments

---

**Last Updated:** 2025-11-25  
**Author:** FARMHUB Development Team  
**Timezone:** Asia/Ho_Chi_Minh (UTC+7)
