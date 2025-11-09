# NOTEBOOK FRONTEND - QUICK START GUIDE

## 🚀 Setup & Installation

### Prerequisites

- Node.js 16+ installed
- Backend server running on http://localhost:5000
- Database seeded with PlantTemplates

### Installation Steps

1. **Navigate to frontend directory:**

```powershell
cd "d:\Thư mục cho đồ án\Project_v3\FARMHUB_V2\frontend\web"
```

2. **Install dependencies (if not already done):**

```powershell
npm install
```

3. **Start development server:**

```powershell
npm run dev
```

4. **Access the application:**

```
http://localhost:5174
```

---

## 📍 Routes

### Notebook Routes (for Farmers)

```
http://localhost:5174/farmer/notebooks              → List all notebooks
http://localhost:5174/farmer/notebooks/create       → Create new notebook
http://localhost:5174/farmer/notebooks/:id          → View notebook details (4 tabs)
http://localhost:5174/farmer/notebooks/:id/edit     → Edit notebook
```

### Testing URLs (replace :id with actual notebook ID)

```
http://localhost:5174/farmer/notebooks/123abc       → Example detail page
http://localhost:5174/farmer/notebooks/123abc/edit  → Example edit page
```

---

## 🧪 Testing Guide

### Test Flow 1: Create First Notebook

1. Login as farmer user
2. Navigate to http://localhost:5174/farmer/notebooks
3. Should see empty state "Chưa có nhật ký nào"
4. Click "Tạo Nhật Ký Mới"
5. Fill form:
   - Name: "Vườn cà chua nhà tôi"
   - Plant type: "Cà chua"
   - Planted date: Select today
   - Description: "Vườn cà chua trồng trên sân thượng"
   - Cover image: (optional URL)
   - Template: Select "Cà chua" template if available
6. Click "Tạo Nhật Ký"
7. Should redirect to detail page
8. Verify:
   - ✅ Stats bar shows correct info
   - ✅ 4 tabs are visible
   - ✅ Progress tab shows timeline
   - ✅ Checklist tab shows tasks
   - ✅ Observations tab shows checkboxes
   - ✅ Journal tab has textarea and image upload

### Test Flow 2: Complete Tasks & Stage Progression

1. Open notebook detail page
2. Go to Tab 2 "Công Việc Hàng Ngày"
3. Check first task → should see alert "Đã hoàn thành nhiệm vụ!"
4. Page refreshes → progress bar increases
5. Complete all tasks one by one
6. After last task:
   - ✅ Progress should reach next milestone
   - ✅ Stage should auto-advance (if conditions met)
   - ✅ New checklist should appear for new stage
7. Go back to Tab 1 "Tiến Độ"
8. Verify current stage has changed

### Test Flow 3: Add Observations

1. Open notebook detail page
2. Go to Tab 3 "Quan Sát"
3. Toggle some observations to YES
4. Should see alert "Đã cập nhật quan sát!"
5. Verify progress % does NOT change (observations don't affect progress)
6. Refresh page → observations should persist

### Test Flow 4: Add Images & Journal

1. Open notebook detail page
2. Go to Tab 4 "Nhật Ký & Hình Ảnh"
3. **Add image:**
   - Enter URL: https://picsum.photos/400/300
   - Click "Thêm Hình Ảnh"
   - Should see image in gallery
4. **Write journal:**
   - Type some notes in textarea
   - Click "Lưu Ghi Chú"
   - Should see success alert
5. **Delete image:**
   - Click 🗑️ on image
   - Confirm deletion
   - Image removed from gallery

### Test Flow 5: Edit Notebook

1. From detail page, click "Chỉnh sửa"
2. Should navigate to edit page
3. Verify form pre-fills with current data
4. Change:
   - Name to something else
   - Description
   - Status to "Đã lưu trữ"
5. Click "Lưu Thay Đổi"
6. Should redirect back to detail
7. Verify changes are saved
8. Verify plant_type, planted_date, template are read-only

### Test Flow 6: Search & Filter

1. Go back to list page
2. Create 2-3 more notebooks with different plant types
3. **Test search:**
   - Enter keyword in search box
   - Click "Tìm kiếm" or press Enter
   - Should filter results
4. **Test filter:**
   - Select "Đang trồng" from dropdown
   - Should show only active notebooks
   - Select "Đã lưu trữ"
   - Should show only archived notebooks
5. Clear filters → should show all

### Test Flow 7: Delete Notebook

1. From list page
2. Click 🗑️ on a notebook card
3. Confirm deletion
4. Notebook should disappear from list
5. **Backend check:** Notebook status set to "deleted" (soft delete)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot GET /farmer/notebooks"

**Cause:** Frontend not running or wrong port
**Solution:**

```powershell
cd frontend/web
npm run dev
```

### Issue 2: "Network Error" or API calls fail

**Cause:** Backend not running
**Solution:**

```powershell
cd backend
npm start
# or
node server.js
```

### Issue 3: No templates in dropdown

**Cause:** Database not seeded with PlantTemplates
**Solution:**

```powershell
cd backend
node scripts/seedGuides.js
# or create PlantTemplates via Expert UI
```

### Issue 4: Images don't display

**Cause:** Invalid URL or CORS issues
**Solution:**

- Use valid image URLs (https://picsum.photos/400/300 for testing)
- Check backend CORS configuration

### Issue 5: Progress not updating

**Cause:** Template not assigned to notebook
**Solution:**

- Delete notebook and recreate with template selected
- Or manually assign template via backend API

### Issue 6: Stage doesn't auto-advance

**Cause:**

- Not all tasks completed
- Backend auto-transition rules not met
  **Solution:**
- Complete ALL tasks in checklist
- Check backend logs for transition logic
- Verify template has correct stage rules

---

## 📊 Data Structure Reference

### Notebook Object (from API)

```javascript
{
  _id: "123abc",
  user_id: "user123",
  notebook_name: "Vườn cà chua nhà tôi",
  plant_type: "Cà chua",
  description: "Vườn trồng trên sân thượng",
  planted_date: "2025-01-01T00:00:00.000Z",
  cover_image: "https://example.com/image.jpg",
  status: "active", // or "archived", "deleted"
  current_stage: 2,
  progress: 45,
  images: ["url1", "url2"],
  template_id: {
    _id: "template123",
    template_name: "Cà chua mùa hè",
    plant_group: "Cà chua",
    stages: [
      {
        stage_number: 1,
        stage_name: "Nảy mầm",
        day_start: 0,
        day_end: 7,
        stage_description: "Giai đoạn hạt nảy mầm",
        reference_image: "url"
      }
    ]
  },
  stages_tracking: [...],
  daily_checklist: [
    {
      task_name: "Tưới nước",
      is_completed: false,
      completed_at: null
    }
  ]
}
```

### Template Object (from API)

```javascript
{
  _id: "template123",
  template_name: "Cà chua mùa hè",
  plant_group: "Cà chua",
  status: "published",
  stages: [
    {
      stage_number: 1,
      stage_name: "Nảy mầm",
      day_start: 0,
      day_end: 7,
      stage_description: "Giai đoạn hạt nảy mầm",
      reference_image: "https://example.com/stage1.jpg",
      core_tasks: [
        {
          task_name: "Tưới nước",
          frequency: "daily"
        }
      ],
      environment_tasks: [...],
      observations: [
        {
          key: "leaves_yellow",
          label: "Lá có vàng không?",
          type: "boolean"
        }
      ]
    }
  ],
  usage_count: 5
}
```

---

## 🔍 Debugging Tips

### Check Backend Logs

```powershell
cd backend
# Watch logs
npm start
# or with nodemon for auto-restart
npx nodemon server.js
```

### Check Frontend Console

Press `F12` in browser → Console tab
Look for:

- API errors (404, 500, etc.)
- Console.log() statements
- React warnings

### Check Network Tab

Press `F12` → Network tab
Monitor:

- API requests (200 OK = success)
- Request/Response payload
- Loading times

### Check React DevTools

Install React DevTools extension
Inspect:

- Component props
- State values
- Component hierarchy

---

## 📝 Testing Checklist

### Before Declaring Complete

- [ ] All 4 pages load without errors
- [ ] Can create notebook with template
- [ ] Progress bar updates when completing tasks
- [ ] Stage auto-advances after all tasks complete
- [ ] Observations save correctly
- [ ] Images add/remove works
- [ ] Journal saves
- [ ] Edit form works
- [ ] Search works
- [ ] Filter works
- [ ] Delete works (soft delete)
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] All animations work
- [ ] Loading states show during API calls

---

## 🎯 Performance Testing

### Load Testing

1. Create 20+ notebooks
2. Check list page loads fast
3. Search/filter should be instant
4. Detail page should load quickly

### Network Testing

1. Throttle network to "Slow 3G"
2. Verify loading spinners appear
3. Check error handling for timeouts
4. Test with backend down

---

## 🚢 Production Deployment

### Environment Variables

Create `.env` file in `frontend/web/`:

```env
VITE_API_URL=https://your-backend-api.com/api
```

### Build for Production

```powershell
cd frontend/web
npm run build
```

### Deploy

Upload `dist/` folder to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Your hosting provider

---

## 📞 Need Help?

### Common Commands

```powershell
# Start backend
cd backend
npm start

# Start frontend
cd frontend/web
npm run dev

# Install dependencies
npm install

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check for updates
npm outdated

# Update packages
npm update
```

### File Locations

```
Pages:          frontend/web/src/pages/farmer/Notebook*.jsx
CSS:            frontend/web/src/css/farmer/Notebook*.css
API Client:     frontend/web/src/api/farmer/notebookApi.js
Routes:         frontend/web/src/routes/index.jsx
Components:     frontend/web/src/components/shared/
Backend:        backend/controllers/notebookController.js
Service:        backend/services/notebookTemplateService.js
```

---

## ✨ Next Steps After Testing

1. **If bugs found:** Fix and re-test
2. **If all working:** Deploy to production
3. **Collect user feedback:** Ask farmers to test
4. **Monitor usage:** Check analytics
5. **Plan enhancements:** Refer to NOTEBOOK_FRONTEND_COMPLETE.md "Future Enhancements" section

---

_Quick Start Guide - Last Updated: January 2025_
_Ready for Testing: ✅ YES_
