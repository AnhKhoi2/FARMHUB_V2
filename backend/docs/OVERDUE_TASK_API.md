# API Overdue Task Management - Hướng dẫn sử dụng

## Tổng quan

Hệ thống tự động đánh dấu các task chưa hoàn thành của ngày hôm qua thành **overdue** khi sang ngày mới, và hiển thị popup thông báo ngay khi user mở app.

---

## 🌱 LUỒNG HOẠT ĐỘNG

### Phần 1: Backend tự động xử lý overdue (khi sang ngày mới)

**Thời điểm:**

- Khi user gọi API lần đầu trong ngày (ví dụ: `GET /api/notebooks/:id/daily/status`)
- Hoặc khi cron job chạy vào đầu ngày mới

**Quy trình:**

1. So sánh `today` với `last_checklist_generated`
2. Nếu khác ngày → Đánh dấu tất cả tasks ngày hôm qua có `status: pending` thành `status: overdue`
3. Lưu vào `overdue_summary`:
   ```json
   {
     "date": "2025-11-19",
     "overdue_count": 3,
     "ready_to_notify": true
   }
   ```
4. Tạo checklist mới cho hôm nay

### Phần 2: Frontend hiển thị popup khi mở app

**Trigger:** Khi user mở app (launch screen, hoặc vào màn hình Dashboard)

**Flow:**

1. App gọi API: `GET /api/notebooks/:id/daily/status`
2. Nếu `overdue_summary.overdue_count > 0` → Hiển thị popup ngay
3. User chọn:
   - **Xem chi tiết** → Navigate đến màn hình overdue tasks
   - **Bỏ qua** → Gọi API skip

---

## 📡 API ENDPOINTS

### 1. GET `/api/notebooks/:id/daily/status`

**Mô tả:** Lấy trạng thái hàng ngày của notebook (tasks hôm nay + overdue summary)

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "today": "2025-11-20",
    "current_day": 3,
    "tasks_today": [
      {
        "task_name": "Tưới nước",
        "description": "Tưới nước 2 lần/ngày",
        "priority": "high",
        "frequency": "daily",
        "is_completed": false,
        "status": "pending"
      }
    ],
    "overdue_summary": {
      "overdue_date": "2025-11-19",
      "overdue_count": 3
    }
  },
  "message": "Daily status fetched successfully"
}
```

**Lưu ý:**

- Nếu không có overdue, `overdue_summary` sẽ là `null`
- API này tự động trigger xử lý overdue nếu sang ngày mới

---

### 2. GET `/api/notebooks/:id/daily/overdue/detail`

**Mô tả:** Lấy chi tiết các overdue tasks

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "overdue_date": "2025-11-19",
    "overdue_count": 2,
    "overdue_tasks": [
      {
        "task_name": "Tưới nước",
        "description": "Tưới nước 2 lần/ngày",
        "priority": "high",
        "frequency": "daily",
        "is_completed": false,
        "status": "overdue",
        "overdue_at": "2025-11-20T00:00:00.000Z"
      },
      {
        "task_name": "Kiểm tra sâu bệnh",
        "description": "Kiểm tra lá và thân cây",
        "priority": "medium",
        "frequency": "daily",
        "is_completed": false,
        "status": "overdue",
        "overdue_at": "2025-11-20T00:00:00.000Z"
      }
    ]
  },
  "message": "Overdue tasks detail fetched successfully"
}
```

---

### 3. POST `/api/notebooks/:id/daily/overdue/skip`

**Mô tả:** Bỏ qua tất cả overdue tasks (đánh dấu = `skipped`)

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "skipped_count": 2
  },
  "message": "2 overdue tasks skipped successfully"
}
```

**Lưu ý:**

- Sau khi skip, `overdue_summary.ready_to_notify` sẽ được set = `false`
- Popup sẽ không hiển thị nữa cho đến khi có overdue mới

---

## 🎨 FRONTEND IMPLEMENTATION

### 1. App Launch / Dashboard Screen

```javascript
// Khi user mở app hoặc vào Dashboard
useEffect(() => {
  const checkDailyStatus = async () => {
    try {
      const response = await fetch(
        `/api/notebooks/${notebookId}/daily/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      // Hiển thị popup nếu có overdue
      if (
        data.data.overdue_summary &&
        data.data.overdue_summary.overdue_count > 0
      ) {
        showOverduePopup(data.data.overdue_summary);
      }

      // Set tasks hôm nay
      setTodayTasks(data.data.tasks_today);
    } catch (error) {
      console.error("Error fetching daily status:", error);
    }
  };

  checkDailyStatus();
}, []);
```

### 2. Overdue Popup Component

```jsx
const OverduePopup = ({ overdueSummary, onViewDetail, onSkip }) => {
  return (
    <Modal visible={true} transparent>
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>⚠️ Công việc chưa hoàn thành</Text>
          <Text style={styles.message}>
            Bạn có {overdueSummary.overdue_count} công việc chưa hoàn thành của
            ngày {formatDate(overdueSummary.overdue_date)}.
          </Text>
          <Text style={styles.question}>Bạn muốn xử lý ngay không?</Text>

          <View style={styles.buttons}>
            <Button title="Xem chi tiết" onPress={onViewDetail} />
            <Button title="Bỏ qua" onPress={onSkip} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Usage
const [showPopup, setShowPopup] = useState(false);
const [overdueSummary, setOverdueSummary] = useState(null);

const showOverduePopup = (summary) => {
  setOverdueSummary(summary);
  setShowPopup(true);
};

const handleViewDetail = async () => {
  setShowPopup(false);
  // Navigate to overdue detail screen
  navigation.navigate("OverdueDetail", { notebookId });
};

const handleSkip = async () => {
  try {
    await fetch(`/api/notebooks/${notebookId}/daily/overdue/skip`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setShowPopup(false);
  } catch (error) {
    console.error("Error skipping overdue tasks:", error);
  }
};
```

### 3. Overdue Detail Screen

```jsx
const OverdueDetailScreen = ({ route }) => {
  const { notebookId } = route.params;
  const [overdueData, setOverdueData] = useState(null);

  useEffect(() => {
    const fetchOverdueDetail = async () => {
      try {
        const response = await fetch(
          `/api/notebooks/${notebookId}/daily/overdue/detail`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        setOverdueData(data.data);
      } catch (error) {
        console.error("Error fetching overdue detail:", error);
      }
    };

    fetchOverdueDetail();
  }, [notebookId]);

  return (
    <View>
      <Text>
        Công việc chưa hoàn thành - {formatDate(overdueData?.overdue_date)}
      </Text>
      <FlatList
        data={overdueData?.overdue_tasks}
        renderItem={({ item }) => <OverdueTaskItem task={item} />}
      />
    </View>
  );
};
```

---

## 📊 DATA STRUCTURE

### Task Status Enum

```javascript
const TaskStatus = {
  PENDING: "pending", // Chưa làm (mặc định)
  COMPLETED: "completed", // Đã hoàn thành
  OVERDUE: "overdue", // Quá hạn (không làm khi sang ngày mới)
  SKIPPED: "skipped", // User chọn bỏ qua
};
```

### Overdue Summary Schema

```javascript
{
  date: Date,              // Ngày có tasks overdue
  overdue_count: Number,   // Số lượng tasks overdue
  ready_to_notify: Boolean, // Đã sẵn sàng hiển thị popup chưa
  notified_at: Date        // Thời điểm đã thông báo (sau khi skip)
}
```

---

## 🎯 BEST PRACTICES

1. **Chỉ hiển thị popup 1 lần mỗi ngày**

   - Sau khi user chọn "Skip" hoặc "View Detail", set flag để không hiển thị lại
   - Backend đã xử lý qua `ready_to_notify` và `notified_at`

2. **Cache daily status**

   - Có thể cache response của `/daily/status` trong 5-10 phút
   - Chỉ refetch khi user pull-to-refresh hoặc complete task

3. **Xử lý offline**

   - Lưu overdue summary vào local storage
   - Sync lại khi có internet

4. **UX suggestions**
   - Hiển thị badge số overdue tasks trên icon Dashboard
   - Highlight overdue tasks bằng màu đỏ trong list
   - Cho phép user complete overdue tasks (nếu muốn bù)

---

## 🧪 TESTING SCENARIOS

### Test 1: Kiểm tra overdue marking

1. Tạo notebook với template
2. Tạo checklist hôm nay, không hoàn thành
3. Đợi sang ngày mới (hoặc fake `last_checklist_generated`)
4. Gọi `/daily/status`
5. Verify: tasks ngày hôm qua có `status: overdue`

### Test 2: Kiểm tra popup

1. Mở app sau khi có overdue
2. Verify: popup hiển thị với số lượng overdue đúng
3. Click "Skip"
4. Verify: popup không hiển thị lại

### Test 3: Kiểm tra overdue detail

1. Click "View Detail" từ popup
2. Verify: hiển thị đúng danh sách overdue tasks
3. Complete một task overdue
4. Verify: task status = completed

---

## 📝 NOTES

- Overdue tasks vẫn có thể hoàn thành (complete) sau đó nếu user muốn
- Khi complete overdue task, status sẽ chuyển từ `overdue` → `completed`
- Hệ thống không tự động delete overdue tasks, cần user action (skip hoặc complete)
- `overdue_summary` chỉ lưu thông tin tổng quan, chi tiết tasks lưu trong `daily_checklist`

---

## ✅ IMPLEMENTATION CHECKLIST

Backend:

- [x] Thêm `status` và `overdue_at` vào `DailyChecklistItemSchema`
- [x] Thêm `overdue_summary` vào `StageTrackingSchema`
- [x] Cập nhật `generateDailyChecklist` xử lý overdue
- [x] API `GET /api/notebooks/:id/daily/status`
- [x] API `GET /api/notebooks/:id/daily/overdue/detail`
- [x] API `POST /api/notebooks/:id/daily/overdue/skip`
- [x] Test script `testOverdueFlow.js`

Frontend:

- [ ] Integrate `/daily/status` API on app launch
- [ ] Create `OverduePopup` component
- [ ] Create `OverdueDetailScreen`
- [ ] Handle skip overdue action
- [ ] Add overdue badge on Dashboard icon
- [ ] Style overdue tasks (red highlight)
- [ ] Test on real device

---

**Tác giả:** Backend Team  
**Ngày cập nhật:** 2025-11-20  
**Version:** 1.0
