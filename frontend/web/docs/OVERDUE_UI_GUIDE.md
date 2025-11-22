# 🎨 Giao diện Overdue Tasks - Hướng dẫn sử dụng

## 📋 Tổng quan

Đã triển khai đầy đủ giao diện để hiển thị và quản lý các công việc quá hạn (overdue tasks) cho notebook.

---

## 🎯 Các Component đã tạo

### 1. **OverduePopup** (`src/components/farmer/OverduePopup.jsx`)

- **Mô tả**: Popup hiển thị khi user mở notebook và có công việc quá hạn
- **Props**:
  - `overdueSummary`: Object chứa thông tin tóm tắt overdue
  - `notebookId`: ID của notebook
  - `onSkip`: Function xử lý khi user bỏ qua
  - `onClose`: Function đóng popup
- **Features**:
  - Hiển thị số lượng công việc quá hạn
  - Hiển thị ngày có công việc quá hạn
  - 2 nút action: "Xem chi tiết" và "Bỏ qua"
  - Animation fade in/slide up
  - Responsive design

### 2. **OverdueDetail** (`src/pages/farmer/OverdueDetail.jsx`)

- **Mô tả**: Trang chi tiết danh sách công việc quá hạn
- **Route**: `/farmer/notebooks/:id/overdue`
- **Features**:
  - Hiển thị danh sách đầy đủ overdue tasks
  - Thông tin chi tiết từng task (tên, mô tả, độ ưu tiên, tần suất)
  - Cho phép hoàn thành bù từng task
  - Nút "Bỏ qua tất cả"
  - Loading & error states
  - Empty state khi không có overdue
  - Responsive design

---

## 🔌 API Integration

### APIs đã thêm vào `notebookApi.js`:

```javascript
// Lấy trạng thái hàng ngày (tasks + overdue summary)
getDailyStatus: (notebookId) =>
  api.get(`/notebooks/${notebookId}/daily/status`);

// Lấy chi tiết overdue tasks
getOverdueDetail: (notebookId) =>
  api.get(`/notebooks/${notebookId}/daily/overdue/detail`);

// Bỏ qua tất cả overdue tasks
skipOverdueTasks: (notebookId) =>
  api.post(`/notebooks/${notebookId}/daily/overdue/skip`);
```

---

## 📱 Luồng hoạt động

### Luồng 1: Hiển thị popup khi mở notebook

1. User mở `NotebookDetail` (route: `/farmer/notebooks/:id`)
2. Component gọi `checkDailyStatus()` trong `useEffect`
3. API trả về `overdue_summary` nếu có overdue
4. Nếu `overdue_count > 0` → Hiển thị `OverduePopup`
5. User chọn:
   - **"Xem chi tiết"** → Navigate đến `/farmer/notebooks/:id/overdue`
   - **"Bỏ qua"** → Gọi `skipOverdueTasks()` → Đóng popup

### Luồng 2: Xem chi tiết overdue tasks

1. User click "Xem chi tiết" hoặc truy cập trực tiếp route `/farmer/notebooks/:id/overdue`
2. Component `OverdueDetail` gọi `getOverdueDetail()`
3. Hiển thị danh sách tasks với trạng thái overdue
4. User có thể:
   - Hoàn thành bù từng task → gọi `completeTask()`
   - Bỏ qua tất cả → gọi `skipOverdueTasks()` → Navigate về notebook

---

## 🎨 CSS Styling

### OverduePopup.css

- **Màu chính**: Gradient đỏ cam (#ff6b6b → #ff8e53)
- **Animation**: Fade in, slide up, bounce icon
- **Responsive**: Điều chỉnh layout cho mobile
- **Z-index**: 9999 (đảm bảo hiển thị trên cùng)

### OverdueDetail.css

- **Layout**: Flexbox, card-based design
- **Màu sắc**:
  - Priority High: #ff4444 (đỏ)
  - Priority Medium: #ff9800 (cam)
  - Priority Low: #2196f3 (xanh dương)
  - Overdue badge: #ff6b6b (đỏ nhạt)
- **Hover effects**: Transform, shadow
- **Responsive**: Stack layout cho mobile

---

## 📂 File Structure

```
frontend/web/src/
├── api/farmer/
│   └── notebookApi.js          (✅ Đã cập nhật - thêm 3 APIs mới)
├── components/farmer/
│   └── OverduePopup.jsx        (✅ Mới tạo)
├── pages/farmer/
│   ├── NotebookDetail.jsx      (✅ Đã cập nhật - tích hợp popup)
│   └── OverdueDetail.jsx       (✅ Mới tạo)
├── css/farmer/
│   ├── OverduePopup.css        (✅ Mới tạo)
│   └── OverdueDetail.css       (✅ Mới tạo)
└── routes/
    └── index.jsx               (✅ Đã cập nhật - thêm route /overdue)
```

---

## 🧪 Testing Checklist

### Test 1: Popup hiển thị đúng

- [ ] Mở notebook có overdue tasks
- [ ] Verify: Popup hiển thị với số lượng đúng
- [ ] Verify: Ngày hiển thị đúng format (dd/mm/yyyy)
- [ ] Click nút X → Popup đóng
- [ ] Click overlay → Popup đóng

### Test 2: Xem chi tiết overdue

- [ ] Click "Xem chi tiết" từ popup
- [ ] Verify: Navigate đến `/farmer/notebooks/:id/overdue`
- [ ] Verify: Danh sách tasks hiển thị đầy đủ
- [ ] Verify: Priority badge hiển thị đúng màu
- [ ] Verify: Thông tin task đầy đủ (tên, mô tả, frequency, overdue_at)

### Test 3: Hoàn thành bù task

- [ ] Click "Hoàn thành bù" trên một task
- [ ] Verify: Task status cập nhật
- [ ] Verify: Button disabled sau khi complete
- [ ] Verify: Danh sách refresh

### Test 4: Bỏ qua overdue

- [ ] Click "Bỏ qua" từ popup → Verify: Popup đóng
- [ ] Hoặc click "Bỏ qua tất cả" từ detail page
- [ ] Verify: Confirm dialog hiển thị
- [ ] Confirm → Navigate về notebook
- [ ] Verify: Popup không hiển thị lại

### Test 5: Empty states

- [ ] Truy cập overdue detail khi không có overdue
- [ ] Verify: Empty state hiển thị
- [ ] Click "Quay lại" → Navigate về notebook

### Test 6: Responsive

- [ ] Test trên mobile (< 600px)
- [ ] Verify: Popup full width, buttons stack vertical
- [ ] Test trên tablet (600-768px)
- [ ] Verify: Layout điều chỉnh hợp lý
- [ ] Test card hover effects

---

## 🎯 User Stories

### Story 1: User bỏ lỡ công việc hôm qua

**Given** user không làm công việc ngày 19/11  
**When** user mở app ngày 20/11 và vào notebook  
**Then** popup hiển thị "Bạn có 2 công việc chưa hoàn thành của ngày 19/11"

### Story 2: User muốn xem chi tiết công việc quá hạn

**Given** user thấy popup overdue  
**When** user click "Xem chi tiết"  
**Then** navigate đến trang overdue detail với danh sách đầy đủ

### Story 3: User muốn hoàn thành bù công việc

**Given** user ở trang overdue detail  
**When** user click "Hoàn thành bù" trên task "Tưới nước"  
**Then** task được đánh dấu completed và button disabled

### Story 4: User không muốn làm overdue tasks

**Given** user thấy popup hoặc ở trang detail  
**When** user click "Bỏ qua" hoặc "Bỏ qua tất cả"  
**Then** tất cả overdue tasks bị skip và popup không hiển thị lại

---

## 💡 Tips & Best Practices

### 1. Caching

```javascript
// Cache overdue summary trong localStorage để tránh hiển thị lại popup
const cacheKey = `overdue_dismissed_${notebookId}_${today}`;
if (localStorage.getItem(cacheKey)) {
  return; // Đã dismiss hôm nay rồi
}
```

### 2. Badge counter

```javascript
// Hiển thị badge số overdue trên icon notebook trong list
<div className="notebook-card">
  {overdue_count > 0 && <span className="overdue-badge">{overdue_count}</span>}
</div>
```

### 3. Sound notification (optional)

```javascript
// Phát âm thanh nhẹ khi popup hiển thị
const playNotificationSound = () => {
  const audio = new Audio("/sounds/notification.mp3");
  audio.volume = 0.3;
  audio.play();
};
```

### 4. Animation timing

```css
/* Popup xuất hiện sau 500ms để user có thời gian thấy trang */
.overdue-popup-overlay {
  animation: fadeIn 0.3s ease-in-out 0.5s both;
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Popup hiển thị nhiều lần

**Nguyên nhân**: `useEffect` chạy nhiều lần  
**Giải pháp**: Thêm dependency array `[id]` và check flag

### Issue 2: API trả về 404

**Nguyên nhân**: Backend chưa chạy hoặc route sai  
**Giải pháp**: Verify backend đang chạy port 5000, check route trong `notebookApi.js`

### Issue 3: CSS không load

**Nguyên nhân**: Import path sai  
**Giải pháp**: Check đường dẫn import CSS trong component

### Issue 4: Navigate không hoạt động

**Nguyên nhân**: Route chưa được define  
**Giải pháp**: Verify route `/farmer/notebooks/:id/overdue` đã thêm vào `routes/index.jsx`

---

## 📸 Screenshots Preview

### Popup

```
┌─────────────────────────────────┐
│ ⚠️ Công việc chưa hoàn thành   │
├─────────────────────────────────┤
│ Bạn có 3 công việc chưa hoàn    │
│ thành của ngày 19/11/2025.      │
│                                  │
│ Bạn muốn xử lý ngay không?      │
├─────────────────────────────────┤
│ [📋 Xem chi tiết] [✓ Bỏ qua]  │
└─────────────────────────────────┘
```

### Detail Page

```
┌─────────────────────────────────────────┐
│ ← Quay lại  Công việc quá hạn    [3]  │
│             Ngày: 19/11/2025            │
├─────────────────────────────────────────┤
│                      [✓ Bỏ qua tất cả] │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Tưới nước             [CAO] [Quá hạn]│ │
│ │ Tưới nước 2 lần/ngày                │ │
│ │ 📅 Hàng ngày  ⏰ Quá hạn từ: 20/11 │ │
│ │                  [✓ Hoàn thành bù]  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🚀 Deployment Notes

1. **Build**: `npm run build` - verify không có error
2. **Environment**: Đảm bảo `REACT_APP_API_URL` trỏ đúng backend
3. **Assets**: CSS files được bundle tự động
4. **Route**: Server cần config để handle client-side routing

---

**Tác giả**: Frontend Team  
**Ngày cập nhật**: 2025-11-20  
**Version**: 1.0  
**Status**: ✅ Ready for integration
